import mongoose from "mongoose";
import request from "supertest";
import app from "../../app.js";

/**
 * Crea una valoración de un usuario hacia otro.
 * @param {string} token - Token del usuario autenticado
 * @param {object} payload - { toUserId, ratings: { sincerity, ... }, comment }
 */
export const createRating = async (token, payload) => {
    return await request(app)
        .post("/api/rating")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);
};

/**
 * Obtiene el historial de valoraciones recibidas por un usuario.
 * @param {string} userId - ID del usuario que ha recibido valoraciones
 */
export const getRatingsByUser = async (userId) => {
    return await request(app).get(`/api/rating/${userId}/history`);
};

/**
 * Obtiene todas las valoraciones que ha hecho un usuario.
 * @param {string} token - Token del usuario autenticado
 * @param {string} userId - ID del usuario que hizo las valoraciones
 */
export const getRatingsGivenByUser = async (token, userId) => {
    return await request(app)
        .get(`/api/rating/from/${userId}`)
        .set("Authorization", `Bearer ${token}`);
};

/**
 * Obtiene el promedio de valoraciones por aspecto para un usuario.
 * @param {string} token - Token del usuario autenticado
 * @param {string} userId - ID del usuario a consultar
 */
export const getAverageRatings = async (token, userId) => {
    return await request(app)
        .get(`/api/rating/${userId}`)
        .set("Authorization", `Bearer ${token}`);
};

/**
 * Elimina una valoración por su ID.
 * @param {string} token - Token del usuario (debe ser admin si el endpoint lo requiere)
 * @param {string} ratingId - ID de la valoración a eliminar
 */
export const deleteRating = async (token, ratingId) => {
    return await request(app)
        .delete(`/api/rating/${ratingId}`)
        .set("Authorization", `Bearer ${token}`);
};

/**
 * Obtiene una valoración por su ID sin autenticación.
 * @param {string} ratingId - ID de la valoración a consultar
 * @returns {object} Valoración encontrada o null si no existe
 */
export const getRatingByIdRaw = async (ratingId) => {
    return await mongoose.connection.collection("ratings").findOne({ _id: new mongoose.Types.ObjectId(ratingId) });
};