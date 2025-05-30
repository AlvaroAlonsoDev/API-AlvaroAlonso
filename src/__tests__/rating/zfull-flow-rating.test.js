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
    createRating,
    getRatingsByUser,
    getRatingsGivenByUser,
    getAverageRatings,
    deleteRating,
    getRatingByIdRaw
} from '../helpers/rating.helpers.js';

describe("Rating API - flujo completo de valoraciones", () => {
    const context = { token: "", userId: "", ratingId: "" };

    beforeAll(async () => {
        await db();
        await mongoose.connection.collection("users").deleteMany({ email: testUser.email });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test("crear, consultar y eliminar una valoración", async () => {
        // 1. Registro
        const registerRes = await registerUser(testUser);
        expect(registerRes.statusCode).toBeGreaterThanOrEqual(201);
        context.userId = registerRes.body.data._id;

        // 2. Login
        const loginRes = await loginUser({ email: testUser.email, password: testUser.password });
        expect(loginRes.statusCode).toBe(200);
        context.token = loginRes.body.data.token;

        // 3. Crear valoración
        const createRes = await createRating(context.token, {
            toUserId: targetUserId,
            ratings: {
                sincerity: 4,
                kindness: 5
            },
            comment: "Soy un comentario de test."
        });
        expect(createRes.statusCode).toBe(201);
        context.ratingId = createRes.body.data._id;

        // 4. Obtener historial recibido por el target
        const historyRes = await getRatingsByUser(targetUserId);
        expect(historyRes.statusCode).toBe(200);
        expect(Array.isArray(historyRes.body.data)).toBe(true);
        expect(historyRes.body.data.some(r => r.from._id === context.userId)).toBe(true);

        // 5. Valoraciones emitidas por el nuevo usuario
        const givenRes = await getRatingsGivenByUser(context.token, context.userId);
        expect(givenRes.statusCode).toBe(200);
        expect(Array.isArray(givenRes.body.data)).toBe(true);
        expect(givenRes.body.data.some(r => r.to._id === targetUserId)).toBe(true);

        // 6. Obtener promedios
        const averageRes = await getAverageRatings(context.token, targetUserId);
        expect(averageRes.statusCode).toBe(200);
        expect(averageRes.body.data).toHaveProperty("sincerity", 4);
        expect(averageRes.body.data).toHaveProperty("kindness", 5);
        expect(averageRes.body.data).toHaveProperty("trust", null);
        expect(averageRes.body.data).toHaveProperty("vibe", null);
        expect(averageRes.body.data).toHaveProperty("responsibility", null);

        // 7. Intentar eliminar valoración (no autorizado si no es admin)
        const deleteRes = await deleteRating(context.token, context.ratingId);
        expect(deleteRes.statusCode).toBe(403); // si no eres admin
        expect(deleteRes.body.errorCode).toBe("FORBIDDEN");

        // 8. Eliminar usuario
        const userDeleteRes = await deleteUser(context.token);
        expect(userDeleteRes.statusCode).toBe(200);

        // 9. Comprobar si la valoración quedó oculta (no visible)
        const ratingInDb = await getRatingByIdRaw(context.ratingId);
        expect(ratingInDb).toBeTruthy();
        expect(ratingInDb.visibility).toBe(false);
    }, 20000);
});
