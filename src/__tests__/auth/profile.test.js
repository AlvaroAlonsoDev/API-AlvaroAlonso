import 'dotenv/config';
import mongoose from 'mongoose';
import db from '../../config/mongo.js';
import {
    registerUser,
    loginUser,
    updateProfile,
    getProfile
} from '../helpers/auth.helpers.js';
import { testUser } from '../../config/constants.js';

describe('Auth API - Perfil', () => {
    let token;

    beforeAll(async () => {
        await db();
        await mongoose.connection.collection('users').deleteMany({ email: testUser.email });
        await registerUser(testUser);
        const loginRes = await loginUser({ email: testUser.email, password: testUser.password });
        token = loginRes.body.data.token;
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('debería actualizar el perfil del usuario', async () => {
        const res = await updateProfile(token, {
            displayName: "Nuevo nombre",
            description: "Descripción de prueba",
            gender: "male"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.data.displayName).toBe("Nuevo nombre");
    });

    test('debería obtener el perfil actualizado', async () => {
        const res = await getProfile(token);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.displayName).toBe("Nuevo nombre");
    });
});
