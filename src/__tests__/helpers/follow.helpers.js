import request from "supertest";
import app from "../../app.js";

export const followUser = async (token, targetUserId) => {
    return await request(app)
        .post(`/api/follow/${targetUserId}`)
        .set("Authorization", `Bearer ${token}`);
};

export const unfollowUser = async (token, targetUserId) => {
    return await request(app)
        .delete(`/api/follow/${targetUserId}`)
        .set("Authorization", `Bearer ${token}`);
};

export const getFollowStatus = async (token, targetUserId) => {
    return await request(app)
        .get(`/api/follow/status/${targetUserId}`)
        .set("Authorization", `Bearer ${token}`);
};

export const getMyFollowing = (token) =>
    request(app)
        .get("/api/follow/following/me")
        .set("Authorization", `Bearer ${token}`);

export const getMyFollowers = (token) =>
    request(app)
        .get("/api/follow/followers/me")
        .set("Authorization", `Bearer ${token}`);

export const getPublicFollowers = async (targetUserId) => {
    return await request(app)
        .get(`/api/follow/followers/${targetUserId}`);
};

export const getPublicFollowing = async (userId) => {
    return await request(app).get(`/api/follow/following/${userId}`);
};