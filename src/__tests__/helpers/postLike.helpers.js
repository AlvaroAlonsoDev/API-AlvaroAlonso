import request from "supertest";
import app from "../../app.js"; // Importa tu app de Express

export const likePost = (token, postId) =>
    request(app)
        .post(`/api/like/${postId}`)
        .set("Authorization", `Bearer ${token}`);

export const unlikePost = (token, postId) =>
    request(app)
        .delete(`/api/like/${postId}`)
        .set("Authorization", `Bearer ${token}`);

export const getPostLikes = (postId) =>
    request(app)
        .get(`/api/like/${postId}`);
