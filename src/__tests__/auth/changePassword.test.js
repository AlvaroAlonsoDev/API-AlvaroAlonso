import 'dotenv/config';
import mongoose from 'mongoose';
import db from '../../config/mongo.js';
import {
    registerUser,
    loginUser,
    changePassword
} from '../helpers/auth.helpers.js';
import { testUser } from '../../config/constants.js';

describe('Auth API - Cambio de contraseña', () => {
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

    test('debería cambiar la contraseña correctamente', async () => {
        const newPassword = "NuevoPass123!";
        const res = await changePassword(token, {
            currentPassword: testUser.password,
            newPassword
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
