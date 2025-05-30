import 'dotenv/config';
import mongoose from 'mongoose';
import db from '../../config/mongo.js';
import { testUser, targetUserId } from '../../config/constants.js';
import {
    registerUser,
    loginUser,
    deleteUser
} from '../helpers/auth.helpers.js';
import {
    followUser,
    unfollowUser
} from '../helpers/follow.helpers.js';

describe("Follow API - seguir y dejar de seguir", () => {
    let token;

    beforeAll(async () => {
        await db();
        await mongoose.connection.collection("users").deleteMany({ email: testUser.email });
        await registerUser(testUser);
        const loginRes = await loginUser({ email: testUser.email, password: testUser.password });
        token = loginRes.body.data.token;
    });

    afterAll(async () => {
        await deleteUser(token);
        await mongoose.connection.close();
    });

    test("debería seguir y dejar de seguir correctamente", async () => {
        const followRes = await followUser(token, targetUserId);
        expect(followRes.statusCode).toBe(201);
        expect(followRes.body.success).toBe(true);

        const unfollowRes = await unfollowUser(token, targetUserId);
        expect(unfollowRes.statusCode).toBe(200);
        expect(unfollowRes.body.success).toBe(true);
    });
});
