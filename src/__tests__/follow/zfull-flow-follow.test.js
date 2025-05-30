import 'dotenv/config';
import mongoose from "mongoose";
import db from '../../config/mongo.js';
import { testUser, targetUserId } from "../../config/constants.js";
import {
    registerUser,
    loginUser,
    deleteUser
} from "../helpers/auth.helpers.js";

import {
    followUser,
    unfollowUser,
    getFollowStatus,
    getMyFollowing,
    getMyFollowers,
    getPublicFollowers,
    getPublicFollowing
} from '../helpers/follow.helpers.js';

/**
 * Test de integración completo del flujo de "follow" y "unfollow".
 * Este test cubre los siguientes pasos:
 * - Registro y login de un nuevo usuario de test.
 * - Acción de seguir a otro usuario (target).
 * - Comprobaciones privadas y públicas del estado de follow.
 * - Acción de dejar de seguir.
 * - Nueva acción de seguir y validaciones relacionadas.
 * - Eliminación del usuario y validación de limpieza de relaciones públicas.
 */
describe("Follow API - flujo básico de follow/unfollow", () => {
    const context = { token: "" };

    beforeAll(async () => {
        // Conexión a la base de datos de test y limpieza de usuario si ya existía
        await db();
        await mongoose.connection.collection("users").deleteMany({ email: testUser.email });
    });

    afterAll(async () => {
        // Cierre limpio de la conexión a la base de datos
        await mongoose.connection.close();
    });

    test("registrarse, seguir, comprobar el estado, dejar de seguir y borrar el usuario", async () => {
        // Registro del nuevo usuario de test
        const registerRes = await registerUser(testUser);
        expect(registerRes.statusCode).toBeGreaterThanOrEqual(201);
        expect(registerRes.body.success).toBe(true);

        // Login para obtener el token de autenticación
        const loginRes = await loginUser({ email: testUser.email, password: testUser.password });
        expect(loginRes.statusCode).toBe(200);
        context.token = loginRes.body.data.token;

        // Acción: seguir al usuario objetivo
        const followRes = await followUser(context.token, targetUserId);
        expect(followRes.statusCode).toBe(201);
        expect(followRes.body.success).toBe(true);

        // Validación pública: el usuario aparece como siguiendo al target
        const publicFollowing = await getPublicFollowing(registerRes.body.data._id);
        expect(publicFollowing.statusCode).toBe(200);
        expect(Array.isArray(publicFollowing.body.data)).toBe(true);
        const followingIds = publicFollowing.body.data.map(u => u._id);
        expect(followingIds.includes(targetUserId)).toBe(true);

        // Validación privada: el estado de follow es true
        const statusAfterFollow = await getFollowStatus(context.token, targetUserId);
        expect(statusAfterFollow.statusCode).toBe(200);
        expect(statusAfterFollow.body.data.isFollowing).toBe(true);

        // Acción: dejar de seguir
        const unfollowRes = await unfollowUser(context.token, targetUserId);
        expect(unfollowRes.statusCode).toBe(200);
        expect(unfollowRes.body.success).toBe(true);

        // Validación privada: el estado de follow es false
        const statusAfterUnfollow = await getFollowStatus(context.token, targetUserId);
        expect(statusAfterUnfollow.statusCode).toBe(200);
        expect(statusAfterUnfollow.body.data.isFollowing).toBe(false);

        // Segunda acción: volver a seguir al usuario
        const followResSecond = await followUser(context.token, targetUserId);
        expect(followResSecond.statusCode).toBe(201);
        expect(followResSecond.body.success).toBe(true);

        // Validación privada: aparece en el listado de seguidos
        const myFollowing = await getMyFollowing(context.token);
        expect(myFollowing.statusCode).toBe(200);
        expect(Array.isArray(myFollowing.body.data)).toBe(true);
        expect(myFollowing.body.data.some(u => u._id === targetUserId)).toBe(true);

        // Validación privada: el usuario objetivo no tiene seguidores (el usuario logueado no puede verse a sí mismo como follower)
        const myFollowers = await getMyFollowers(context.token);
        expect(myFollowers.statusCode).toBe(200);
        expect(myFollowers.body.message).toBe("Seguidores obtenidos correctamente");
        expect(Array.isArray(myFollowers.body.data)).toBe(true);
        expect(myFollowers.body.data.length).toBe(0);

        // Acción: eliminar al usuario de test (trigger de cascada para eliminar relaciones)
        const deleteRes = await deleteUser(context.token);
        expect(deleteRes.statusCode).toBe(200);

        // Validación pública: el usuario ya no aparece como follower del target
        const publicFollowers = await getPublicFollowers(targetUserId);
        expect(publicFollowers.statusCode).toBe(200);
        expect(Array.isArray(publicFollowers.body.data)).toBe(true);
        const ids = publicFollowers.body.data.map(u => u._id);
        expect(ids.includes(registerRes.body.data._id)).toBe(false);
    }, 20000); // timeout extendido para operaciones async/mongo
});
