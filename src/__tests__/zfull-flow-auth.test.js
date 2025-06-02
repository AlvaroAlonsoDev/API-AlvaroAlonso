import 'dotenv/config';
import mongoose from "mongoose";
import db from '../config/mongo.js';
import {
    registerUser,
    loginUser,
    verifyUser,
    logoutUser,
    deleteUser,
    updateProfile,
    changePassword,
    getProfile
} from "./helpers/auth.helpers.js";
import { testUser } from "../config/constants.js";

// Utilidad para generar passwords únicos por ejecución (opcional, pero pro)
const genPassword = () => `PwdTest!${Date.now()}`;

/**
 * Test de integración de autenticación completo.
 * Cubre: registro, login, verificación, update perfil, cambio contraseña, logout, relogin, perfil y borrado.
 * Todo autosuficiente y sin dependencias externas.
 */
describe("Auth API - flujo completo de autenticación", () => {
    // Contexto global de la prueba
    const context = {
        email: testUser.email,
        password: testUser.password,
        token: "",
        newPassword: genPassword(),
        userId: ""
    };

    beforeAll(async () => {
        // Conexión y limpieza previa
        await db();
        await mongoose.connection.collection("users").deleteMany({ email: context.email });
    });

    afterAll(async () => {
        // Limpieza (por si el test falló antes del delete) y cierre de conexión
        await mongoose.connection.collection("users").deleteMany({ email: context.email });
        await mongoose.connection.close();
    });

    test("registro, login, verificación, update perfil, cambio password, relogin y borrado", async () => {
        // 1. Registro de usuario
        const registerRes = await registerUser({ ...testUser, password: context.password });
        expect([200, 201]).toContain(registerRes.statusCode);
        expect(registerRes.body.success).toBe(true);
        expect(registerRes.body.data.email).toBe(context.email);
        context.userId = registerRes.body.data._id;

        // 2. Login y obtener token
        const loginRes = await loginUser({ email: context.email, password: context.password });
        expect(loginRes.statusCode).toBe(200);
        context.token = loginRes.body.data.token;

        // 3. Verificación del token (endpoint protegido)
        const verifyRes = await verifyUser(context.token);
        expect(verifyRes.statusCode).toBe(200);

        // 4. Actualizar perfil
        const updateRes = await updateProfile(context.token, {
            displayName: "Test displayname",
            description: "Test description",
            gender: "male"
        });
        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body.success).toBe(true);
        expect(updateRes.body.data.displayName).toBe("Test displayname");
        expect(updateRes.body.data.description).toBe("Test description");
        expect(updateRes.body.data.gender).toBe("male");

        // 5. Cambio de contraseña
        const changePasswordRes = await changePassword(context.token, {
            currentPassword: context.password,
            newPassword: context.newPassword
        });
        expect(changePasswordRes.statusCode).toBe(200);
        expect(changePasswordRes.body.success).toBe(true);
        expect(changePasswordRes.body.message).toMatch(/contraseña cambiada/i);

        // 6. Logout
        const logoutRes = await logoutUser(context.token, context.email);
        expect(logoutRes.statusCode).toBe(200);

        // 7. Nuevo login con la contraseña nueva
        const reloginRes = await loginUser({ email: context.email, password: context.newPassword });
        expect(reloginRes.statusCode).toBe(200);
        context.token = reloginRes.body.data.token;

        // 8. Obtener perfil actualizado
        const getProfileRes = await getProfile(context.token);
        expect(getProfileRes.statusCode).toBe(200);
        expect(getProfileRes.body.success).toBe(true);
        expect(getProfileRes.body.message).toMatch(/perfil obtenido/i);

        const profile = getProfileRes.body.data;
        expect(profile.displayName).toBe("Test displayname");
        expect(profile.description).toBe("Test description");
        expect(profile.gender).toBe("male");
        expect(profile.email).toBe(context.email);
        expect(profile.role).toBe("user");
        expect(profile._id).toBeDefined();
        expect(profile.createdAt).toBeDefined();
        expect(profile.updatedAt).toBeDefined();

        // 9. Eliminación del usuario
        const deleteRes = await deleteUser(context.token);
        expect(deleteRes.statusCode).toBe(200);
    }, 20000);
});
