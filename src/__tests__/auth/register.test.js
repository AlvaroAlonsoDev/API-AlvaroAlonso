import 'dotenv/config';
import mongoose from 'mongoose';
import db from '../../config/mongo.js';
import { registerUser } from '../helpers/auth.helpers.js';
import { testUser } from '../../config/constants.js';

describe('Auth API - Registro', () => {
    beforeAll(async () => {
        await db();
        await mongoose.connection.collection('users').deleteMany({ email: testUser.email });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('debería registrar un usuario correctamente', async () => {
        const res = await registerUser(testUser);
        expect([200, 201]).toContain(res.statusCode);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe(testUser.email);
    });
});
