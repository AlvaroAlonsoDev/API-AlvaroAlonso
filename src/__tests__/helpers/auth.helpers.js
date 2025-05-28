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
