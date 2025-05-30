import 'dotenv/config';
import mongoose from 'mongoose';
import db from '../../config/mongo.js';
import { testUser, targetUserId } from "../../config/constants.js";
import {
    registerUser,
    loginUser,
    deleteUser
} from '../auth/helpers/auth.helpers.js';
import {
    followUser,
    getFollowStatus
} from '../helpers/follow.helpers.js';

describe("Follow API - estado de follow", () => {
    let token;

    beforeAll(async () => {
        await db();
        await mongoose.connection.collection("users").deleteMany({ email: testUser.email });
        await registerUser(testUser);
        const loginRes = await loginUser({ email: testUser.email, password: testUser.password });
        token = loginRes.body.data.token;
        await followUser(token, targetUserId);
    });

    afterAll(async () => {
        await deleteUser(token);
        await mongoose.connection.close();
    });

    test("debería mostrar isFollowing como true", async () => {
        const res = await getFollowStatus(token, targetUserId);
        expect(res.statusCode).toBe(200);
        expect(res.body.data.isFollowing).toBe(true);
    });
});
