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
    createRating,
    getRatingsByUser,
    getRatingsGivenByUser,
    getAverageRatings,
    deleteRating,
    getRatingByIdRaw
} from './helpers/rating.helpers.js';

describe("Rating API - flujo completo de valoraciones", () => {
    // Genera email y handle únicos para evitar choques en runs paralelos o en CI
    const context = {
        user: { ...testUser },
        target: {
            email: "target-" + Date.now() + "@test.com",
            password: "TargetUserPwd123!",
            handle: "target_" + Math.floor(Math.random() * 100000),
            displayName: "Usuario Target"
        },
        userId: "", userToken: "",
        targetId: "", targetToken: "",
        ratingId: ""
    };

    beforeAll(async () => {
        await db();
        // Limpia por si hubiera restos de runs anteriores
        await mongoose.connection.collection("users").deleteMany({ email: { $in: [context.user.email, context.target.email] } });

        // Crea usuario objetivo para las valoraciones
        const targetRegister = await registerUser(context.target);
        expect([200, 201]).toContain(targetRegister.statusCode);
        context.targetId = targetRegister.body.data._id;
        const targetLogin = await loginUser({ email: context.target.email, password: context.target.password });
        expect(targetLogin.statusCode).toBe(200);
        context.targetToken = targetLogin.body.data.token;
    });

    afterAll(async () => {
        const userObjectId = new mongoose.Types.ObjectId(context.userId);
        const targetObjectId = new mongoose.Types.ObjectId(context.targetId);

        await mongoose.connection.collection("ratings").deleteMany({
            $or: [
                { fromUser: userObjectId }, { toUser: userObjectId },
                { fromUser: targetObjectId }, { toUser: targetObjectId }
            ]
        });

        await mongoose.connection.collection("users").deleteMany({ email: { $in: [context.user.email, context.target.email] } });
        await mongoose.connection.close();
    });

    test("crear, consultar y eliminar una valoración", async () => {
        // 1. Registro usuario que valora
        const registerRes = await registerUser(context.user);
        expect(registerRes.statusCode).toBeGreaterThanOrEqual(201);
        context.userId = registerRes.body.data._id;

        // 2. Login
        const loginRes = await loginUser({ email: context.user.email, password: context.user.password });
        expect(loginRes.statusCode).toBe(200);
        context.userToken = loginRes.body.data.token;

        // 3. Crear valoración al target
        const createRes = await createRating(context.userToken, {
            toUserId: context.targetId,
            ratings: { sincerity: 4, kindness: 5 },
            comment: "Soy un comentario de test."
        });
        expect(createRes.statusCode).toBe(201);
        context.ratingId = createRes.body.data._id;

        // 4. Obtener historial recibido por el target
        const historyRes = await getRatingsByUser(context.targetId);
        expect(historyRes.statusCode).toBe(200);
        expect(Array.isArray(historyRes.body.data)).toBe(true);
        expect(historyRes.body.data.some(r => r.from._id === context.userId)).toBe(true);

        // 5. Valoraciones emitidas por el nuevo usuario
        const givenRes = await getRatingsGivenByUser(context.userToken, context.userId);
        expect(givenRes.statusCode).toBe(200);
        expect(Array.isArray(givenRes.body.data)).toBe(true);
        expect(givenRes.body.data.some(r => r.to._id === context.targetId)).toBe(true);

        // 6. Obtener promedios
        const averageRes = await getAverageRatings(context.userToken, context.targetId);
        expect(averageRes.statusCode).toBe(200);
        expect(averageRes.body.data).toHaveProperty("sincerity", 4);
        expect(averageRes.body.data).toHaveProperty("kindness", 5);
        expect(averageRes.body.data).toHaveProperty("trust", null);
        expect(averageRes.body.data).toHaveProperty("vibe", null);
        expect(averageRes.body.data).toHaveProperty("responsibility", null);

        // 7. Intentar eliminar valoración (no autorizado si no es admin)
        const deleteRes = await deleteRating(context.userToken, context.ratingId);
        expect(deleteRes.statusCode).toBe(403); // si no eres admin
        expect(deleteRes.body.errorCode).toBe("FORBIDDEN");

        // 8. Eliminar usuario que hizo la valoración
        const userDeleteRes = await deleteUser(context.userToken);
        expect(userDeleteRes.statusCode).toBe(200);

        // 9. Comprobar si la valoración quedó oculta (no visible)
        const ratingInDb = await getRatingByIdRaw(context.ratingId);
        expect(ratingInDb).toBeTruthy();
        expect(ratingInDb.visibility).toBe(false);

        // 10. Limpieza explícita: eliminar usuario target (por si acaso)
        await deleteUser(context.targetToken);
    }, 20000);
});
