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
import { restrictedFields } from "../config/constants.js";
import { handleHttp } from "../utils/res.handle.js";
import 'dotenv/config';

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
        const role = "user";

        const newUserArr = await UserModel.create([{
            email,
            passwordHash: passHash,
            role,
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
 * Elimina un usuario por ID.
 * Verifica existencia previa y elimina de la base de datos.
 *
 * @param {object} req - Request con el usuario autenticado
 * @param {object} res - Response para enviar resultados
 * @returns {object} - Respuesta estandarizada con estado y mensaje
 */
export const deleteUser = async (req, res) => {
    try {
        if (process.env.NODE_ENV !== 'test') {
            return handleHttp(res, {
                status: 403,
                message: "No se puede eliminar el usuario en este momento",
                errorCode: "FORBIDDEN_ENVIRONMENT"
            });
        }

        const { user } = req;

        if (!user) {
            return handleHttp(res, {
                status: 404,
                message: "Usuario no encontrado",
                errorCode: "USER_NOT_FOUND"
            });
        }

        await UserModel.findByIdAndDelete(user._id);

        return handleHttp(res, {
            status: 200,
            message: "Usuario eliminado correctamente",
            data: { email: user.email }
        });

    } catch (error) {
        console.log("Error al eliminar usuario:", error);

        return handleHttp(res, {
            status: 500,
            message: "Error interno al eliminar el usuario",
            errorCode: "DELETE_USER_ERROR",
            errorDetails: error
        });
    }
};