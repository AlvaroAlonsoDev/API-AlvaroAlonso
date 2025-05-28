import 'dotenv/config';
import request from "supertest";
import mongoose from "mongoose";
import db from "../config/mongo.js";
import app from "../app.js";

describe("Auth API - flujo completo de autenticación", () => {
    const testUser = {
        email: "testusermeetback2080@example.com",
        password: "test1234",
        handle: "testhandle",
        displayName: "Test User"
    };

    const context = { token: "" };

    beforeAll(async () => {
        await db();
        await mongoose.connection.collection("users").deleteMany({ email: testUser.email });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test("debe registrar, loguear, verificar, desloguear y eliminar un usuario", async () => {
        // 1. Registro
        const registerRes = await request(app)
            .post("/api/auth/register")
            .send(testUser);

        expect([200, 201]).toContain(registerRes.statusCode);
        expect(registerRes.body.success).toBe(true);
        expect(registerRes.body.data.email).toBe(testUser.email);

        // 2. Login
        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: testUser.email, password: testUser.password });

        expect(loginRes.statusCode).toBe(200);
        expect(loginRes.body.success).toBe(true);
        expect(loginRes.body.data).toHaveProperty("token");

        context.token = loginRes.body.data.token;

        // 3. Verificación de token
        const verifyRes = await request(app)
            .get("/api/auth/verify")
            .set("Authorization", `Bearer ${context.token}`);

        expect(verifyRes.statusCode).toBe(200);
        expect(verifyRes.body.success).toBe(true);
        expect(verifyRes.body.data.user).toHaveProperty("_id");

        // 4. Logout
        const logoutRes = await request(app)
            .post("/api/auth/logout")
            .set("Authorization", `Bearer ${context.token}`)
            .send({ email: testUser.email });

        expect(logoutRes.statusCode).toBe(200);
        expect(logoutRes.body.success).toBe(true);
        expect(logoutRes.body.data.email).toBe(testUser.email);

        // 5. Eliminación de usuario
        const deleteRes = await request(app)
            .delete("/api/auth/delete")
            .set("Authorization", `Bearer ${context.token}`);

        expect(deleteRes.statusCode).toBe(200);
        expect(deleteRes.body.success).toBe(true);
    }, 20000);
});
