import 'dotenv/config';
import mongoose from "mongoose";
import db from '../../config/mongo.js';
import {
    registerUser,
    loginUser,
    verifyUser,
    logoutUser,
    deleteUser,
    updateProfile,
    changePassword,
    getProfile
} from "../helpers/auth.helpers.js";
import { testUser } from "../../config/constants.js";

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

        let { token } = context;

        // Actualización de perfil con datos válidos
        const updateRes = await updateProfile(token, {
            displayName: "Test displayname",
            description: "Test description",
            gender: "male"
        });
        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body.success).toBe(true);
        expect(updateRes.body.data.displayName).toBe("Test displayname");
        expect(updateRes.body.data.description).toBe("Test description");
        expect(updateRes.body.data.gender).toBe("male");

        // Cambio de contraseña
        const newPassword = "NewTestPassword123!";
        const changePasswordRes = await changePassword(token, {
            currentPassword: testUser.password,
            newPassword: newPassword
        });
        expect(changePasswordRes.statusCode).toBe(200);
        expect(changePasswordRes.body.success).toBe(true);
        expect(changePasswordRes.body.message).toBe("Contraseña cambiada correctamente");

        // Logout del usuario autenticado
        const logoutRes = await logoutUser(token, testUser.email);
        expect(logoutRes.statusCode).toBe(200);

        // Nuevo login con la nueva contraseña
        const reloginRes = await loginUser({ email: testUser.email, password: newPassword });
        expect(reloginRes.statusCode).toBe(200);
        token = reloginRes.body.data.token;

        // Obtener el perfil actual del usuario
        const getProfileRes = await getProfile(token);
        expect(getProfileRes.statusCode).toBe(200);
        expect(getProfileRes.body.success).toBe(true);
        expect(getProfileRes.body.message).toBe("Perfil obtenido correctamente");

        const profile = getProfileRes.body.data;
        expect(profile.displayName).toBe("Test displayname");
        expect(profile.description).toBe("Test description");
        expect(profile.gender).toBe("male");
        expect(profile.email).toBe(testUser.email);
        expect(profile.role).toBe("user");
        expect(profile._id).toBeDefined();
        expect(profile.createdAt).toBeDefined();
        expect(profile.updatedAt).toBeDefined();

        // Eliminación del usuario
        const deleteRes = await deleteUser(token);
        expect(deleteRes.statusCode).toBe(200);
    }, 20000); // Tiempo extendido por operaciones async
});
