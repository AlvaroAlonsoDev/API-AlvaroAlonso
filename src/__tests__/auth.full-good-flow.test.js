import 'dotenv/config';
import mongoose from "mongoose";
import db from "../config/mongo.js";
import {
    registerUser,
    loginUser,
    verifyUser,
    logoutUser,
    deleteUser
} from "./helpers/auth.helpers.js";
import { testUser } from "../config/constants.js";

/**
 * Test de integración del flujo completo de autenticación de usuario.
 * Este test valida todos los pasos básicos:
 * - Registro de usuario
 * - Login y obtención del token
 * - Verificación del token autenticado
 * - Logout del usuario
 * - Eliminación del usuario
 */
describe("Auth API - flujo completo de autenticación", () => {
    const context = { token: "" };

    beforeAll(async () => {
        // Inicializa la conexión con la base de datos y limpia el usuario si ya existía
        await db();
        await mongoose.connection.collection("users").deleteMany({ email: testUser.email });
    });

    afterAll(async () => {
        // Cierra la conexión de base de datos tras finalizar los tests
        await mongoose.connection.close();
    });

    test("debe registrar, loguear, verificar, desloguear y eliminar un usuario", async () => {
        // Registro del usuario de prueba
        const registerRes = await registerUser(testUser);
        expect([200, 201]).toContain(registerRes.statusCode); // compatible con diferentes códigos válidos
        expect(registerRes.body.success).toBe(true);
        expect(registerRes.body.data.email).toBe(testUser.email);

        // Login para obtener token JWT
        const loginRes = await loginUser({ email: testUser.email, password: testUser.password });
        expect(loginRes.statusCode).toBe(200);
        context.token = loginRes.body.data.token;

        // Verificación del token (autenticación protegida)
        const verifyRes = await verifyUser(context.token);
        expect(verifyRes.statusCode).toBe(200);

        // Logout del usuario autenticado
        const logoutRes = await logoutUser(context.token, testUser.email);
        expect(logoutRes.statusCode).toBe(200);

        // Eliminación del usuario
        const deleteRes = await deleteUser(context.token);
        expect(deleteRes.statusCode).toBe(200);
    }, 20000); // Tiempo extendido por operaciones async
});
