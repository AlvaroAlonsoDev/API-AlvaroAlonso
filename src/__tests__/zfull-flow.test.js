import 'dotenv/config';
import mongoose from "mongoose";
import db from '../config/mongo.js';
import {
    registerUser, loginUser, logoutUser, deleteUser, updateProfile, changePassword, getProfile, verifyUser
} from "./helpers/auth.helpers.js";
import {
    followUser, unfollowUser, getFollowStatus, getMyFollowing, getMyFollowers,
    getPublicFollowers, getPublicFollowing
} from './helpers/follow.helpers.js';
import {
    createPost, getPostById, getPostsByUser, getFeedPosts, getReplies, deletePost
} from "./helpers/post.helpers.js";
import {
    likePost, unlikePost, getPostLikes
} from "./helpers/postLike.helpers.js";
import {
    createRating, getRatingsByUser, getRatingsGivenByUser, getAverageRatings, deleteRating, getRatingByIdRaw
} from './helpers/rating.helpers.js';

import { testUserStatic } from "../config/constants.js";

describe("E2E API: Autenticación + Social + Valoraciones (flujo completo)", () => {
    const context = {
        token: "", userId: "",
        postId: "", replyId: "",
        targetUserId: "", targetUserToken: "",
        ratingId: ""
    };
    const postContent = "Hola comunidad! Este es mi primer post 🚀";
    const replyContent = "Soy una respuesta de test";
    const newPassword = "NewTestPassword123!";

    beforeAll(async () => {
        await db();
        // Limpia usuarios de pruebas (ambos)
        await mongoose.connection.collection("users").deleteMany({ email: { $in: [testUserStatic.email, "targetuser@example.com"] } });
        // Crea un usuario target si no existe para follow/rating (con login para obtener token si se requiere)
        const auxRes = await registerUser({ ...testUserStatic, email: "targetuser@example.com", handle: "targetuser", displayName: "Target" });
        context.targetUserId = auxRes.body.data._id;
        const targetLogin = await loginUser({ email: "targetuser@example.com", password: testUserStatic.password });
        context.targetUserToken = targetLogin.body.data.token;
    });

    afterAll(async () => {
        // Convierte los IDs a ObjectId
        const userObjectId = new mongoose.Types.ObjectId(context.userId);
        const targetUserObjectId = new mongoose.Types.ObjectId(context.targetUserId);

        // 1. Borra todos los posts del usuario principal (incluyendo replies)
        await mongoose.connection.collection("posts").deleteMany({
            author: userObjectId
        });

        // 2. Borra todas las valoraciones relacionadas (como from o to)
        await mongoose.connection.collection("ratings").deleteMany({
            $or: [
                { fromUser: userObjectId }, { toUser: userObjectId },
                { fromUser: targetUserObjectId }, { toUser: targetUserObjectId }
            ]
        });

        // 3. Borra usuarios de pruebas
        await mongoose.connection.collection("users").deleteMany({ email: { $in: [testUserStatic.email, "targetuser@example.com"] } });

        // 4. Cierra conexión
        await mongoose.connection.close();
    });

    test("flujo total de usuario: auth, perfil, follow, post, like, reply, rating, limpieza", async () => {
        // 1. REGISTRO Y LOGIN
        const registerRes = await registerUser(testUserStatic);
        expect([200, 201]).toContain(registerRes.statusCode);
        context.userId = registerRes.body.data._id;

        const loginRes = await loginUser({ email: testUserStatic.email, password: testUserStatic.password });
        expect(loginRes.statusCode).toBe(200);
        context.token = loginRes.body.data.token;

        // 2. VERIFICACIÓN TOKEN
        const verifyRes = await verifyUser(context.token);
        expect(verifyRes.statusCode).toBe(200);

        // 3. UPDATE PERFIL
        const updateRes = await updateProfile(context.token, {
            displayName: "Test displayname",
            description: "Test description",
            gender: "male"
        });
        expect(updateRes.statusCode).toBe(200);
        expect(updateRes.body.data.displayName).toBe("Test displayname");
        expect(updateRes.body.data.description).toBe("Test description");
        expect(updateRes.body.data.gender).toBe("male");

        // 4. CAMBIO DE CONTRASEÑA
        const changePasswordRes = await changePassword(context.token, {
            currentPassword: testUserStatic.password,
            newPassword: newPassword
        });
        expect(changePasswordRes.statusCode).toBe(200);
        expect(changePasswordRes.body.success).toBe(true);

        // 5. LOGOUT
        const logoutRes = await logoutUser(context.token, testUserStatic.email);
        expect(logoutRes.statusCode).toBe(200);

        // 6. RE-LOGIN CON NUEVA CONTRASEÑA
        const reloginRes = await loginUser({ email: testUserStatic.email, password: newPassword });
        expect(reloginRes.statusCode).toBe(200);
        context.token = reloginRes.body.data.token;

        // 7. OBTENER PERFIL
        const getProfileRes = await getProfile(context.token);
        expect(getProfileRes.statusCode).toBe(200);
        expect(getProfileRes.body.data.displayName).toBe("Test displayname");
        expect(getProfileRes.body.data.description).toBe("Test description");
        expect(getProfileRes.body.data.gender).toBe("male");
        expect(getProfileRes.body.data.email).toBe(testUserStatic.email);

        // 8. FOLLOW AL TARGET USER
        const followRes = await followUser(context.token, context.targetUserId);
        expect(followRes.statusCode).toBe(201);

        // 9. ESTADO DE FOLLOW
        const statusAfterFollow = await getFollowStatus(context.token, context.targetUserId);
        expect(statusAfterFollow.body.data.isFollowing).toBe(true);

        // 10. CHECK SEGUIDOS PÚBLICOS
        const publicFollowing = await getPublicFollowing(context.userId);
        expect(publicFollowing.body.data.map(u => u._id)).toContain(context.targetUserId);

        // 11. POSTEO
        const createRes = await createPost(context.token, { content: postContent });
        expect(createRes.statusCode).toBe(201);
        context.postId = createRes.body.data._id;

        // 12. GET POST POR ID
        const getRes = await getPostById(context.postId);
        expect(getRes.body.data._id).toBe(context.postId);
        expect(getRes.body.data.author._id).toBe(context.userId);

        // 13. POSTS DEL USUARIO
        const getByUserRes = await getPostsByUser(context.userId);
        expect(getByUserRes.body.data.some(p => p._id === context.postId)).toBe(true);

        // 14. FEED
        const feedRes = await getFeedPosts(context.token, context.userId);
        expect(feedRes.body.data.some(p => p._id === context.postId)).toBe(true);

        // 15. REPLIES VACÍO
        const repliesResBefore = await getReplies(context.token, context.postId);
        expect(repliesResBefore.body.data.length).toBe(0);

        // 16. REPLY AL POST
        const replyRes = await createPost(context.token, {
            content: replyContent, replyTo: context.postId, media: []
        });
        expect(replyRes.statusCode).toBe(201);
        context.replyId = replyRes.body.data._id;

        // 17. REPLIES (YA DEBE HABER UNO)
        const repliesRes = await getReplies(context.token, context.postId);
        expect(repliesRes.body.data.length).toBe(1);
        expect(repliesRes.body.data[0]._id).toBe(context.replyId);

        // 18. LIKE/UNLIKE
        const likeRes = await likePost(context.token, context.postId);
        expect(likeRes.body.message).toBe("Like añadido");
        let likesCheck = await getPostLikes(context.postId);
        expect(likesCheck.body.data.total).toBe(1);
        const unlikeRes = await unlikePost(context.token, context.postId);
        expect(unlikeRes.body.message).toBe("Like eliminado");
        likesCheck = await getPostLikes(context.postId);
        expect(likesCheck.body.data.total).toBe(0);

        // 19. RATING AL TARGET
        const createRatingRes = await createRating(context.token, {
            toUserId: context.targetUserId,
            ratings: { sincerity: 4, kindness: 5 },
            comment: "Soy un comentario de test."
        });
        expect(createRatingRes.statusCode).toBe(201);
        context.ratingId = createRatingRes.body.data._id;

        // 20. RATING HISTORIAL RECIBIDO POR TARGET
        const historyRes = await getRatingsByUser(context.targetUserId);
        expect(historyRes.body.data.some(r => r.from._id === context.userId)).toBe(true);

        // 21. RATING EMITIDOS POR ESTE USUARIO
        const givenRes = await getRatingsGivenByUser(context.token, context.userId);
        expect(givenRes.body.data.some(r => r.to._id === context.targetUserId)).toBe(true);

        // 22. MEDIA DE RATING
        const averageRes = await getAverageRatings(context.token, context.targetUserId);
        expect(averageRes.body.data).toHaveProperty("sincerity", 4);
        expect(averageRes.body.data).toHaveProperty("kindness", 5);

        // 23. ELIMINAR RATING (no debe dejarte, no eres admin)
        const deleteRes = await deleteRating(context.token, context.ratingId);
        expect(deleteRes.statusCode).toBe(403);

        // 24. UNFOLLOW
        const unfollowRes = await unfollowUser(context.token, context.targetUserId);
        expect(unfollowRes.statusCode).toBe(200);

        // 25. ELIMINAR POST PRINCIPAL
        const deletePostRes = await deletePost(context.token, context.postId);
        expect(deletePostRes.statusCode).toBe(200);

        // 26. ELIMINAR USUARIO PRINCIPAL
        const userDeleteRes = await deleteUser(context.token);
        expect(userDeleteRes.statusCode).toBe(200);

        // 27. RATING INVISIBLE DESPUÉS DE ELIMINACIÓN DE USUARIO
        const ratingInDb = await getRatingByIdRaw(context.ratingId);
        expect(ratingInDb).toBeTruthy();
        expect(ratingInDb.visibility).toBe(false);

        // 28. CHECK FOLLOWERS DEL TARGET (debe estar vacío)
        const publicFollowers = await getPublicFollowers(context.targetUserId);
        expect(publicFollowers.body.data.map(u => u._id)).not.toContain(context.userId);
    }, 25000);
});
