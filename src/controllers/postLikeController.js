import {
    likePostService,
    unlikePostService,
    getLikesOfPostService,
    // ...otros servicios
} from "../services/postLikeService.js";
import { handleHttp } from "../utils/res.handle.js";
import { createLogService } from "../services/logService.js";

/**
 * Da like a un post.
 */
export const likePostCtrl = async ({ user, params }, res) => {
    try {
        const { postId } = params;
        await likePostService({ userId: user._id, postId });

        await createLogService({
            level: "info",
            message: "Like añadido a post",
            meta: { userId: user._id, postId },
            user: user._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Like añadido"
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al dar like a post",
            meta: { userId: user?._id, postId: params?.postId, error: error?.message, stack: error?.stack },
            user: user?._id
        });

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

        await createLogService({
            level: "info",
            message: "Like eliminado de post",
            meta: { userId: user._id, postId },
            user: user._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Like eliminado"
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al quitar like a post",
            meta: { userId: user?._id, postId: params?.postId, error: error?.message, stack: error?.stack },
            user: user?._id
        });

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
export const getLikesOfPostCtrl = async ({ params, query, user }, res) => {
    try {
        const { postId } = params;
        const { page = 1, limit = 20 } = query;
        const data = await getLikesOfPostService({ postId, page: parseInt(page), limit: parseInt(limit) });

        await createLogService({
            level: "info",
            message: "Likes de post obtenidos",
            meta: { requestedBy: user?._id, postId, count: data?.users?.length ?? 0, page, limit },
            user: user?._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Likes obtenidos",
            data
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener likes de post",
            meta: { requestedBy: user?._id, postId: params?.postId, error: error?.message, stack: error?.stack },
            user: user?._id
        });

        return handleHttp(res, {
            status: 500,
            message: "Error al obtener likes",
            errorCode: "SERVER_ERROR",
            errorDetails: error
        });
    }
};
