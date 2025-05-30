import 'dotenv/config';
import mongoose from 'mongoose';
import db from '../../config/mongo.js';
import { loginUser, registerUser } from '../helpers/auth.helpers.js';
import { testUser } from '../../config/constants.js';

describe('Auth API - Login', () => {
    beforeAll(async () => {
        await db();
        await mongoose.connection.collection('users').deleteMany({ email: testUser.email });
        await registerUser(testUser);
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('debería loguear correctamente', async () => {
        const res = await loginUser({ email: testUser.email, password: testUser.password });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
    });
});
