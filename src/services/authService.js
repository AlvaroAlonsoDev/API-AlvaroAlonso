/**
 * Servicios de autenticación
 *
 * Este módulo contiene la lógica de negocio relacionada con autenticación y gestión de usuarios:
 * - Registro de nuevos usuarios.
 * - Inicio de sesión (verificación de credenciales, emisión de token).
 * - Cierre de sesión (actualización de estado).
 *
 * Todos los servicios utilizan Mongoose y están preparados para integrarse con controladores
 * que usan respuestas estandarizadas (`handleHttp`).
 *
 * Notas técnicas:
 * - Se usa `startSession()` para transacciones en operaciones críticas como registro.
 * - `restrictedFields` se usa para eliminar datos sensibles antes de devolver objetos de usuario.
 */

import mongoose from "mongoose";
import { encrypt, verified } from "../utils/bcrypt.handle.js";
import { generateToken } from "../utils/jwt.handle.js";
import UserModel from "../models/User.js";
import FollowModel from "../models/Follow.js";
import { restrictedFields } from "../config/constants.js";
import { handleHttp } from "../utils/res.handle.js";
import { nanoid } from "nanoid";
import 'dotenv/config';
import { hash } from "bcryptjs";
import RatingModel from "../models/Rating.js";

/**
 * Registra un nuevo usuario.
 * Verifica existencia previa, asigna rol e inicializa datos.
 *
 * @param {object} param0 - Datos del nuevo usuario
 * @returns {object|string} - Objeto usuario limpio o string de error
 */
export const registerNewUser = async ({ email, password, handle, displayName }) => {
    if (!email || !password || !handle || !displayName) return "MISSING_DATA";

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const existingUser = await UserModel.findOne({ email }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            return "ALREADY_USER";
        }

        const passHash = await encrypt(password);

        const newUserArr = await UserModel.create([{
            email,
            passwordHash: passHash,
            displayName: displayName,
            handle: handle
        }], { session });

        const newUser = newUserArr[0];

        await session.commitTransaction();

        const userObj = newUser.toObject();
        restrictedFields.forEach(field => delete userObj[field]);

        return userObj;

    } catch (error) {
        await session.abortTransaction();
        console.error("Error al registrar nuevo usuario:", error);
        return "INTERNAL_ERROR";
    } finally {
        session.endSession();
    }
};

/**
 * Inicia sesión: valida email y contraseña, y devuelve token + datos públicos.
 *
 * @param {object} param0 - { email, password }
 * @returns {object} - { token, user }
 * @throws {Error} - Si credenciales no son válidas
 */
export const loginUser = async ({ email, password }) => {
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("ERROR");

    const isCorrect = await verified(password, user.passwordHash);
    if (!isCorrect) throw new Error("ERROR");

    user.lastLogin = new Date();
    user.accountStatus = true;
    await user.save();

    const userObject = user.toObject();
    restrictedFields.forEach(field => delete userObject[field]);

    const token = generateToken(user._id);

    return {
        token,
        user: userObject
    };
};

/**
 * Cierra sesión actualizando el campo `accountStatus`.
 *
 * @param {object} param0 - { email }
 * @returns {object|string} - Usuario actualizado o "NOT_FOUND_USER"
 */
export const logoutUser = async ({ email }) => {
    const user = await UserModel.findOne({ email });
    if (!user) return "NOT_FOUND_USER";

    user.accountStatus = false;
    await user.save();

    return user;
};

/**
 * Actualiza el perfil de un usuario autenticado.
 * 
 * @param {string} userId 
 * @param {object} updates - { displayName, description, gender }
 * @returns {object} usuario actualizado
 * @throws {Error} si el usuario no existe
 */
export const updateUserProfile = async (userId, updates) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    if (updates.displayName !== undefined) user.displayName = updates.displayName;
    if (updates.description !== undefined) user.description = updates.description;
    if (updates.gender !== undefined) user.gender = updates.gender;

    await user.save();

    const userObject = user.toObject();
    restrictedFields.forEach(field => delete userObject[field]);

    return userObject;
};

/**
 * Obtiene los datos públicos del usuario autenticado.
 * 
 * @param {string} userId 
 * @returns {object} datos públicos del usuario
 * @throws {Error} si no se encuentra el usuario
 */
export const getUserProfile = async (userId) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const userObject = user.toObject();
    restrictedFields.forEach(field => delete userObject[field]);

    return userObject;
};

/**
 * Devuelve el perfil público de un usuario dado su handle.
 * 
 * @param {string} handle 
 * @returns {object} datos públicos del usuario
 * @throws {Error} si el usuario no existe o está oculto
 */
export const getPublicProfileByHandle = async (handle) => {
    const user = await UserModel.findOne({ handle, isHidden: false });
    if (!user) throw new Error("USER_NOT_FOUND");

    const {
        _id,
        handle: userHandle,
        displayName,
        avatar,
        description,
        gender,
        trustScore,
        role,
        createdAt,
    } = user;

    return {
        _id,
        handle: userHandle,
        displayName,
        avatar,
        description,
        gender,
        trustScore,
        role,
        createdAt,
    };
};

/**
 * Simula la subida de un avatar generando una URL falsa
 * y guardándola en el perfil del usuario.
 * 
 * @param {string} userId - ID del usuario autenticado
 * @returns {string} - URL simulada del avatar
 * @throws {Error} - Si el usuario no existe
 */
export const simulateAvatarUpload = async (userId) => {
    const fakeFilename = `${nanoid()}.webp`;
    const simulatedUrl = `https://fake-storage.meetback.app/avatars/${fakeFilename}`;

    const user = await UserModel.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    user.avatar = simulatedUrl;
    await user.save();

    return simulatedUrl;
};

/**
 * Cambia la contraseña de un usuario autenticado.
 * 
 * @param {string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @throws {Error} si la contraseña actual no es correcta o el usuario no existe
 */
export const changeUserPassword = async (userId, currentPassword, newPassword) => {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("USER_NOT_FOUND");

    const isValid = await verified(currentPassword, user.passwordHash);
    if (!isValid) throw new Error("INVALID_CURRENT_PASSWORD");

    if (newPassword.length < 4) throw new Error("WEAK_PASSWORD");

    user.passwordHash = await encrypt(newPassword);

    await user.save();

    return true;
};

/**
 * Elimina un usuario de forma permanente, junto con sus relaciones de follow.
 *
 * @param {object} user - Objeto del usuario autenticado
 * @returns {object} - { email }
 * @throws {Error} - Si ocurre un error en la eliminación
 */
export const deleteUserService = async (user) => {
    // if (process.env.NODE_ENV !== "test") {
    //     const err = new Error("FORBIDDEN_ENVIRONMENT");
    //     err.status = 403;
    //     throw err;
    // }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Eliminar follows
        await FollowModel.deleteMany({
            $or: [
                { follower: user._id },
                { following: user._id }
            ]
        }).session(session);

        // 2. Ocultar valoraciones donde el usuario fue emisor o receptor
        await RatingModel.updateMany(
            {
                $or: [
                    { fromUser: user._id },
                    { toUser: user._id }
                ]
            },
            { $set: { visibility: false } }
        ).session(session);

        // 3. Eliminar el usuario
        await UserModel.findByIdAndDelete(user._id).session(session);

        // 4. Confirmar la transacción
        await session.commitTransaction();
        session.endSession();

        return { email: user.email };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};