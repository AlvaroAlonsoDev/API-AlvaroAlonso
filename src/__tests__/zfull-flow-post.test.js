import 'dotenv/config';
import mongoose from "mongoose";
import db from '../config/mongo.js';
import { testUser } from "../config/constants.js";
import {
    registerUser,
    loginUser,
    deleteUser
} from "./helpers/auth.helpers.js";
import {
    createPost,
    getPostById,
    getPostsByUser,
    getFeedPosts,
    getReplies,
    deletePost
} from "./helpers/post.helpers.js";
import {
    likePost,
    unlikePost,
    getPostLikes
} from "./helpers/postLike.helpers.js";

/**
 * Test de integración avanzado: Posts
 * Cubre registro, login, creación de post, consulta,
 * replies, like/unlike, borrado y cleanup.
 * Todo autosuficiente y aislado.
 */
describe("Post API - flujo completo robusto", () => {
    // Contexto global único por test suite
    const context = {
        user: { ...testUser },
        userId: "", token: "",
        postId: "", replyId: ""
    };

    // Prueba real con datos dinámicos
    const postContent = "Hola comunidad! Este es mi primer post 🚀";
    const replyContent = "Soy una respuesta de test";

    beforeAll(async () => {
        await db();
        // Cleanup inicial de usuario por si la prueba anterior falló
        await mongoose.connection.collection("users").deleteMany({ email: context.user.email });
    });

    afterAll(async () => {
        const userObjectId = new mongoose.Types.ObjectId(context.userId);

        // Borra todos los posts (incluidos replies) donde el usuario sea autor
        await mongoose.connection.collection("posts").deleteMany({
            author: userObjectId
        });

        // Borra usuario tras la prueba
        await mongoose.connection.collection("users").deleteMany({ email: context.user.email });

        // Cierra conexión
        await mongoose.connection.close();
    });

    test("flujo completo: registro, post, feed, reply, like, unlike, borrado y cleanup", async () => {
        // --- 1. Registro de usuario ---
        const registerRes = await registerUser(context.user);
        expect([200, 201]).toContain(registerRes.statusCode);
        context.userId = registerRes.body.data._id;

        // --- 2. Login ---
        const loginRes = await loginUser({ email: context.user.email, password: context.user.password });
        expect(loginRes.statusCode).toBe(200);
        context.token = loginRes.body.data.token;

        // --- 3. Crear post ---
        const createRes = await createPost(context.token, { content: postContent });
        expect(createRes.statusCode).toBe(201);
        expect(createRes.body.success).toBe(true);
        expect(createRes.body.data).toHaveProperty("_id");
        expect(createRes.body.data.content).toBe(postContent);
        expect(createRes.body.data.deleted).toBe(false);
        context.postId = createRes.body.data._id;

        // --- 4. Obtener detalle del post ---
        const getRes = await getPostById(context.postId);
        expect(getRes.statusCode).toBe(200);
        expect(getRes.body.success).toBe(true);
        expect(getRes.body.data._id).toBe(context.postId);
        expect(getRes.body.data.content).toBe(postContent);
        expect(getRes.body.data.author).toHaveProperty("_id", context.userId);

        // --- 5. Obtener posts del usuario ---
        const getByUserRes = await getPostsByUser(context.userId);
        expect(getByUserRes.statusCode).toBe(200);
        expect(getByUserRes.body.success).toBe(true);
        expect(Array.isArray(getByUserRes.body.data)).toBe(true);
        expect(getByUserRes.body.data.some(p => p._id === context.postId)).toBe(true);
        const userPost = getByUserRes.body.data.find(p => p._id === context.postId);
        expect(userPost.content).toBe(postContent);
        expect(userPost.author).toBe(context.userId); // Aquí es string

        // --- 6. Obtener feed ---
        const feedRes = await getFeedPosts(context.token, context.userId);
        expect(feedRes.statusCode).toBe(200);
        expect(feedRes.body.success).toBe(true);
        expect(Array.isArray(feedRes.body.data)).toBe(true);
        expect(feedRes.body.data.some(p => p._id === context.postId)).toBe(true);
        const feedPost = feedRes.body.data.find(p => p._id === context.postId);
        expect(feedPost.author).toHaveProperty("_id", context.userId); // Aquí es objeto

        // --- 7. Obtener replies (debe estar vacío) ---
        const repliesResBefore = await getReplies(context.token, context.postId);
        expect(repliesResBefore.statusCode).toBe(200);
        expect(repliesResBefore.body.success).toBe(true);
        expect(Array.isArray(repliesResBefore.body.data)).toBe(true);
        expect(repliesResBefore.body.data.length).toBe(0);

        // --- 8. Crear respuesta al post ---
        const replyRes = await createPost(context.token, {
            content: replyContent,
            replyTo: context.postId,
            media: []
        });
        expect(replyRes.statusCode).toBe(201);
        expect(replyRes.body.success).toBe(true);
        expect(replyRes.body.data.replyTo).toBe(context.postId);
        expect(replyRes.body.data.content).toBe(replyContent);
        context.replyId = replyRes.body.data._id;

        // --- 9. Obtener replies (debe haber una) ---
        const repliesRes = await getReplies(context.token, context.postId);
        expect(repliesRes.statusCode).toBe(200);
        expect(repliesRes.body.success).toBe(true);
        expect(Array.isArray(repliesRes.body.data)).toBe(true);
        expect(repliesRes.body.data.length).toBe(1);
        expect(repliesRes.body.data[0]._id).toBe(context.replyId);
        expect(repliesRes.body.data[0].content).toBe(replyContent);

        // --- 10. LIKE al post ---
        const likeRes = await likePost(context.token, context.postId);
        expect(likeRes.statusCode).toBe(200);
        expect(likeRes.body.success).toBe(true);
        expect(likeRes.body.message).toBe("Like añadido");

        // --- 11. Comprobar que el like está ---
        const likesCheck = await getPostLikes(context.postId);
        expect(likesCheck.statusCode).toBe(200);
        expect(likesCheck.body.success).toBe(true);
        expect(Array.isArray(likesCheck.body.data.users)).toBe(true);
        expect(likesCheck.body.data.total).toBe(1);
        const likeUser = likesCheck.body.data.users[0];
        expect(likeUser._id).toBe(context.userId);
        expect(likeUser.handle).toBe(context.user.handle);
        expect(likeUser.displayName).toBe(context.user.displayName);

        // --- 12. UNLIKE al post ---
        const unlikeRes = await unlikePost(context.token, context.postId);
        expect(unlikeRes.statusCode).toBe(200);
        expect(unlikeRes.body.success).toBe(true);
        expect(unlikeRes.body.message).toBe("Like eliminado");

        // --- 13. Comprobar que el like ya no está ---
        const likesCheckAfter = await getPostLikes(context.postId);
        expect(likesCheckAfter.statusCode).toBe(200);
        expect(likesCheckAfter.body.success).toBe(true);
        expect(Array.isArray(likesCheckAfter.body.data.users)).toBe(true);
        expect(likesCheckAfter.body.data.total).toBe(0);
        expect(likesCheckAfter.body.data.users.length).toBe(0);

        // --- 14. Borrar el post original ---
        const deletePostRes = await deletePost(context.token, context.postId);
        expect(deletePostRes.statusCode).toBe(200);
        expect(deletePostRes.body.success).toBe(true);
        expect(deletePostRes.body.data._id).toBe(context.postId);
        expect(deletePostRes.body.data.deleted).toBe(true);

        // --- 15. Eliminar usuario ---
        const userDeleteRes = await deleteUser(context.token);
        expect(userDeleteRes.statusCode).toBe(200);

        // --- 16. Comprobar que el post está borrado (si endpoint da 404 o 200 con deleted=true) ---
        const getDeleted = await getPostById(context.postId);
        expect([404, 200]).toContain(getDeleted.statusCode);
        if (getDeleted.statusCode === 200) {
            expect(getDeleted.body.data.deleted).toBe(true);
        }
    }, 20000);
});
