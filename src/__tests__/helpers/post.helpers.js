import request from "supertest";
import app from "../../app.js"; // Asegúrate de importar tu app de Express

export const createPost = (token, body) =>
    request(app)
        .post("/api/post")
        .set("Authorization", `Bearer ${token}`)
        .send(body);

export const getPostById = (postId) =>
    request(app)
        .get(`/api/post/${postId}`);

export const getPostsByUser = (userId) =>
    request(app)
        .get(`/api/post/user/${userId}`);

export const getFeedPosts = (token, userId) =>
    request(app)
        .get(`/api/post/feed/me`)
        .set("Authorization", `Bearer ${token}`);

export const getReplies = (token, postId) =>
    request(app)
        .get(`/api/post/${postId}/replies`)
        .set("Authorization", `Bearer ${token}`);

export const deletePost = (token, postId) =>
    request(app)
        .delete(`/api/post/${postId}`)
        .set("Authorization", `Bearer ${token}`);
