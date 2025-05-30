import 'dotenv/config';
import mongoose from 'mongoose';
import db from '../../config/mongo.js';
import { testUser, targetUserId } from '../../config/constants.js';
import {
    registerUser,
    loginUser,
    deleteUser
} from '../auth/helpers/auth.helpers.js';
import {
    followUser,
    getPublicFollowers
} from '../helpers/follow.helpers.js';

describe("Follow API - seguidores públicos", () => {
    let token, userId;

    beforeAll(async () => {
        await db();
        await mongoose.connection.collection("users").deleteMany({ email: testUser.email });
        const registerRes = await registerUser(testUser);
        userId = registerRes.body.data._id;
        const loginRes = await loginUser({ email: testUser.email, password: testUser.password });
        token = loginRes.body.data.token;
        await followUser(token, targetUserId);
    });

    afterAll(async () => {
        await deleteUser(token);
        await mongoose.connection.close();
    });

    test("el usuario debería aparecer en los seguidores públicos del objetivo", async () => {
        const res = await getPublicFollowers(targetUserId);
        const followerIds = res.body.data.map(user => user._id);
        expect(followerIds).toContain(userId);
    });
});
