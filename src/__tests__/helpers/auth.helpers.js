import request from "supertest";
import app from "../../app.js";

export const registerUser = async (user) => {
    return await request(app)
        .post("/api/auth/register")
        .send(user);
};

export const loginUser = async (credentials) => {
    return await request(app)
        .post("/api/auth/login")
        .send(credentials);
};

export const verifyUser = async (token) => {
    return await request(app)
        .get("/api/auth/verify")
        .set("Authorization", `Bearer ${token}`);
};

export const logoutUser = async (token, email) => {
    return await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .send({ email });
};

export const deleteUser = async (token) => {
    return await request(app)
        .delete("/api/auth/delete")
        .set("Authorization", `Bearer ${token}`);
};

export const updateProfile = async (token, data) => {
    return await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .send(data);
};

export const changePassword = async (token, passwords) => {
    return await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${token}`)
        .send(passwords);
};

export const getProfile = async (token) => {
    return await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
};