import 'dotenv/config';
import mongoose from "mongoose";
import db from '../config/mongo.js';
import { testUser } from "../config/constants.js";
import {
    registerUser,
    loginUser,
    deleteUser
} from "./helpers/auth.helpers.js";
import {
    followUser,
    unfollowUser,
    getFollowStatus,
    getMyFollowing,
    getMyFollowers,
    getPublicFollowers,
    getPublicFollowing
} from './helpers/follow.helpers.js';

/**
 * Test de integración completo del flujo de "follow" y "unfollow".
 * Se crean dos usuarios de test de forma aislada y se asegura
 * la limpieza de la base de datos al finalizar.
 */
describe("Follow API - flujo básico de follow/unfollow", () => {
    // Contexto global para usuarios y tokens
    const context = {
        user: { ...testUser },
        target: {
            email: "target" + Date.now() + "@test.com",
            password: "TargetUserPwd123!",
            handle: "target_" + Math.floor(Math.random() * 100000),
            displayName: "Usuario Target"
        },
        userId: "", userToken: "",
        targetId: "", targetToken: ""
    };

    beforeAll(async () => {
        await db();
        // Limpia los usuarios si ya existían por cualquier motivo
        await mongoose.connection.collection("users").deleteMany({ email: { $in: [context.user.email, context.target.email] } });
    });

    afterAll(async () => {
        // Limpia ambos usuarios tras finalizar las pruebas
        await mongoose.connection.collection("users").deleteMany({ email: { $in: [context.user.email, context.target.email] } });
        await mongoose.connection.close();
    });

    test("registrar dos usuarios, follow/unfollow, validar relaciones y limpieza", async () => {
        // Registro usuario principal
        const registerRes = await registerUser(context.user);
        expect([200, 201]).toContain(registerRes.statusCode);
        context.userId = registerRes.body.data._id;

        // Registro usuario objetivo (target)
        const registerTarget = await registerUser(context.target);
        expect([200, 201]).toContain(registerTarget.statusCode);
        context.targetId = registerTarget.body.data._id;

        // Login usuario principal
        const loginRes = await loginUser({ email: context.user.email, password: context.user.password });
        expect(loginRes.statusCode).toBe(200);
        context.userToken = loginRes.body.data.token;

        // Login usuario target (no imprescindible, pero útil para tests avanzados)
        const loginTarget = await loginUser({ email: context.target.email, password: context.target.password });
        expect(loginTarget.statusCode).toBe(200);
        context.targetToken = loginTarget.body.data.token;

        // Acción: seguir al usuario objetivo
        const followRes = await followUser(context.userToken, context.targetId);
        expect(followRes.statusCode).toBe(201);
        expect(followRes.body.success).toBe(true);

        // Validación pública: el usuario aparece como siguiendo al target
        const publicFollowing = await getPublicFollowing(context.userId);
        expect(publicFollowing.statusCode).toBe(200);
        expect(Array.isArray(publicFollowing.body.data)).toBe(true);
        const followingIds = publicFollowing.body.data.map(u => u._id);
        expect(followingIds).toContain(context.targetId);

        // Validación privada: el estado de follow es true
        const statusAfterFollow = await getFollowStatus(context.userToken, context.targetId);
        expect(statusAfterFollow.statusCode).toBe(200);
        expect(statusAfterFollow.body.data.isFollowing).toBe(true);

        // Acción: dejar de seguir
        const unfollowRes = await unfollowUser(context.userToken, context.targetId);
        expect(unfollowRes.statusCode).toBe(200);
        expect(unfollowRes.body.success).toBe(true);

        // Validación privada: el estado de follow es false
        const statusAfterUnfollow = await getFollowStatus(context.userToken, context.targetId);
        expect(statusAfterUnfollow.statusCode).toBe(200);
        expect(statusAfterUnfollow.body.data.isFollowing).toBe(false);

        // Segunda acción: volver a seguir al usuario
        const followResSecond = await followUser(context.userToken, context.targetId);
        expect(followResSecond.statusCode).toBe(201);
        expect(followResSecond.body.success).toBe(true);

        // Validación privada: aparece en el listado de seguidos
        const myFollowing = await getMyFollowing(context.userToken);
        expect(myFollowing.statusCode).toBe(200);
        expect(Array.isArray(myFollowing.body.data)).toBe(true);
        expect(myFollowing.body.data.some(u => u._id === context.targetId)).toBe(true);

        // Validación privada: el usuario objetivo no tiene seguidores (el usuario logueado no se ve a sí mismo)
        const myFollowers = await getMyFollowers(context.userToken);
        expect(myFollowers.statusCode).toBe(200);
        expect(myFollowers.body.message).toBe("Seguidores obtenidos correctamente");
        expect(Array.isArray(myFollowers.body.data)).toBe(true);
        expect(myFollowers.body.data.length).toBe(0);

        // Acción: eliminar al usuario principal (trigger de cascada)
        const deleteRes = await deleteUser(context.userToken);
        expect(deleteRes.statusCode).toBe(200);

        // Validación pública: el usuario ya no aparece como follower del target
        const publicFollowers = await getPublicFollowers(context.targetId);
        expect(publicFollowers.statusCode).toBe(200);
        expect(Array.isArray(publicFollowers.body.data)).toBe(true);
        const ids = publicFollowers.body.data.map(u => u._id);
        expect(ids).not.toContain(context.userId);

        // Limpieza extra: eliminar usuario target explícitamente
        await deleteUser(context.targetToken);
    }, 20000);
});
