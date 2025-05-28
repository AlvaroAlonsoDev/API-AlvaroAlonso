import FollowModel from "../models/Follow.js";

/**
 * Sigue a un usuario.
 *
 * @param {Object} param0
 * @param {ObjectId} param0.follower - ID del usuario que sigue
 * @param {ObjectId} param0.following - ID del usuario que va a ser seguido
 * @returns {Object} - Datos de la relación creada
 * @throws {Error} - Si ya existe la relación o si hay error de sistema
 */
export const followUser = async ({ follower, following }) => {
    if (follower.equals(following)) {
        const error = new Error("NO_SELF_FOLLOW");
        error.code = "NO_SELF_FOLLOW";
        throw error;
    }

    try {
        const follow = await FollowModel.create({ follower, following });
        return follow;
    } catch (error) {
        if (error.code === 11000) {
            const dupError = new Error("ALREADY_FOLLOWING");
            dupError.code = "ALREADY_FOLLOWING";
            throw dupError;
        }
        throw error;
    }
};

/**
 * Deja de seguir a un usuario.
 *
 * @param {Object} param0
 * @param {ObjectId} param0.follower - ID del usuario que deja de seguir
 * @param {ObjectId} param0.following - ID del usuario a dejar de seguir
 * @returns {Object} - Resultado de la operación
 * @throws {Error} - Si no existe la relación o si ocurre un error
 */
export const unfollowUser = async ({ follower, following }) => {
    if (follower.equals(following)) {
        const error = new Error("NO_SELF_UNFOLLOW");
        error.code = "NO_SELF_UNFOLLOW";
        throw error;
    }

    const result = await FollowModel.findOneAndDelete({ follower, following });

    if (!result) {
        const error = new Error("NOT_FOLLOWING");
        error.code = "NOT_FOLLOWING";
        throw error;
    }

    return result;
};

/**
 * Comprueba si un usuario sigue a otro.
 *
 * @param {Object} param0
 * @param {ObjectId} param0.follower - ID del usuario autenticado
 * @param {ObjectId} param0.following - ID del usuario objetivo
 * @returns {boolean} - true si sigue, false si no
 */
export const getFollowStatus = async ({ follower, following }) => {
    if (follower.equals(following)) return false; // no te sigues a ti mismo

    const follow = await FollowModel.findOne({ follower, following });
    return !!follow;
};

/**
 * Devuelve la lista de usuarios que el usuario autenticado sigue.
 *
 * @param {ObjectId} userId - ID del usuario autenticado
 * @returns {Array} - Lista de usuarios seguidos
 */
export const getMyFollowing = async (userId) => {
    const follows = await FollowModel.find({ follower: userId })
        .populate("following", "handle displayName avatar _id");
    return follows.map(f => f.following);
};

/**
 * Devuelve la lista de usuarios que siguen al usuario autenticado.
 *
 * @param {ObjectId} userId - ID del usuario autenticado
 * @returns {Array} - Lista de seguidores
 */
export const getMyFollowers = async (userId) => {
    const followers = await FollowModel.find({ following: userId })
        .populate("follower", "handle displayName avatar _id");
    return followers.map(f => f.follower);
};

/**
 * Devuelve los usuarios que sigue un usuario público.
 *
 * @param {ObjectId} userId - ID del usuario
 * @returns {Array} - Lista de usuarios seguidos
 */
export const getPublicFollowing = async (userId) => {
    const follows = await FollowModel.find({ follower: userId })
        .populate("following", "handle displayName avatar _id")
        .exec();
    return follows.map(f => f.following);
};

/**
 * Devuelve los seguidores de un usuario público.
 *
 * @param {ObjectId} userId - ID del usuario
 * @returns {Array} - Lista de seguidores
 */
export const getPublicFollowers = async (userId) => {
    const followers = await FollowModel.find({ following: userId })
        .populate("follower", "handle displayName avatar _id")
        .exec();
    return followers.map(f => f.follower);
};