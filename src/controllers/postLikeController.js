import {
    likePostService,
    unlikePostService,
    getLikesOfPostService,
    // ...otros servicios
} from "../services/postLikeService.js";
import { handleHttp } from "../utils/res.handle.js";

/**
 * Da like a un post.
 */
export const likePostCtrl = async ({ user, params }, res) => {
    try {
        const { postId } = params;
        await likePostService({ userId: user._id, postId });
        return handleHttp(res, {
            status: 200,
            message: "Like añadido"
        });
    } catch (error) {
        return handleHttp(res, {
            status: 500,
            message: "Error al dar like",
            errorCode: "SERVER_ERROR",
            errorDetails: error
        });
    }
};

/**
 * Quita like a un post.
 */
export const unlikePostCtrl = async ({ user, params }, res) => {
    try {
        const { postId } = params;
        await unlikePostService({ userId: user._id, postId });
        return handleHttp(res, {
            status: 200,
            message: "Like eliminado"
        });
    } catch (error) {
        return handleHttp(res, {
            status: 500,
            message: "Error al quitar like",
            errorCode: "SERVER_ERROR",
            errorDetails: error
        });
    }
};

/**
 * Lista los usuarios que han dado like a un post.
 */
export const getLikesOfPostCtrl = async ({ params, query }, res) => {
    try {
        const { postId } = params;
        const { page = 1, limit = 20 } = query;
        const data = await getLikesOfPostService({ postId, page: parseInt(page), limit: parseInt(limit) });
        return handleHttp(res, {
            status: 200,
            message: "Likes obtenidos",
            data
        });
    } catch (error) {
        return handleHttp(res, {
            status: 500,
            message: "Error al obtener likes",
            errorCode: "SERVER_ERROR",
            errorDetails: error
        });
    }
};
