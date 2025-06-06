// controllers/post.js
import { createPostService, deletePostService, getAllPostsService, getFeedPostsService, getPostByIdService, getPostsByUserService, getRepliesService } from "../services/postService.js";
import { handleHttp } from "../utils/res.handle.js";
import { createLogService } from "../services/logService.js";

/**
 * Crea un nuevo post.
 */
export const createPostCtrl = async ({ user, body }, res) => {
    try {
        const { content, replyTo, media } = body;
        if (!content || typeof content !== "string" || content.length === 0) {
            await createLogService({
                level: "warn",
                message: "Intento de creación de post con contenido vacío",
                meta: { userId: user?._id, content, replyTo, media },
                user: user?._id
            });
            return handleHttp(res, {
                status: 422,
                message: "El contenido del post es requerido",
                errorCode: "VALIDATION_ERROR"
            });
        }

        const post = await createPostService({
            author: user._id,
            content,
            replyTo: replyTo || null,
            media: media || []
        });

        await createLogService({
            level: "info",
            message: "Post creado correctamente",
            meta: { userId: user._id, postId: post?._id, replyTo: replyTo || null },
            user: user._id
        });

        return handleHttp(res, {
            status: 201,
            message: "Post creado correctamente",
            data: post
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al crear el post",
            meta: { userId: user?._id, error: error?.message, stack: error?.stack },
            user: user?._id
        });
        return handleHttp(res, {
            status: 500,
            message: "Error al crear el post",
            errorCode: "SERVER_ERROR",
            errorDetails: error
        });
    }
};

/**
 * Lista todos los posts de un usuario (paginado).
 */
export const getPostsByUserCtrl = async ({ params, query, user }, res) => {
    try {
        const { userId } = params;
        const { page = 1, limit = 10 } = query; // paginación

        if (!userId) {
            await createLogService({
                level: "warn",
                message: "Consulta de posts de usuario sin userId",
                meta: { requestedBy: user?._id },
                user: user?._id
            });
            return handleHttp(res, {
                status: 400,
                message: "userId es requerido",
                errorCode: "VALIDATION_ERROR"
            });
        }

        const posts = await getPostsByUserService({
            userId,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        });

        await createLogService({
            level: "info",
            message: "Posts de usuario obtenidos correctamente",
            meta: { requestedBy: user?._id, userId, count: posts?.length ?? 0, page, limit },
            user: user?._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Posts encontrados",
            data: posts
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener los posts de usuario",
            meta: { requestedBy: user?._id, error: error?.message, stack: error?.stack },
            user: user?._id
        });
        return handleHttp(res, {
            status: 500,
            message: "Error al obtener los posts",
            errorCode: "SERVER_ERROR",
            errorDetails: error
        });
    }
};

/**
 * Obtiene el detalle de un post.
 */
export const getPostByIdCtrl = async ({ params, user }, res) => {
    try {
        const { id } = params;
        if (!id) {
            await createLogService({
                level: "warn",
                message: "Consulta de detalle de post sin id",
                meta: { requestedBy: user?._id },
                user: user?._id
            });
            return handleHttp(res, {
                status: 400,
                message: "id es requerido",
                errorCode: "VALIDATION_ERROR"
            });
        }

        const post = await getPostByIdService(id);

        if (!post) {
            await createLogService({
                level: "warn",
                message: "Post no encontrado al consultar detalle",
                meta: { requestedBy: user?._id, postId: id },
                user: user?._id
            });
            return handleHttp(res, {
                status: 404,
                message: "Post no encontrado",
                errorCode: "NOT_FOUND"
            });
        }

        await createLogService({
            level: "info",
            message: "Detalle de post obtenido correctamente",
            meta: { requestedBy: user?._id, postId: id },
            user: user?._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Post encontrado",
            data: post
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener el post por id",
            meta: { requestedBy: user?._id, error: error?.message, stack: error?.stack },
            user: user?._id
        });
        return handleHttp(res, {
            status: 500,
            message: "Error al obtener el post",
            errorCode: "SERVER_ERROR",
            errorDetails: error
        });
    }
};

/**
 * Devuelve el feed de un usuario (posts de los usuarios que sigue)
 */
export const getFeedPostsCtrl = async ({ query, user }, res) => {
    try {
        const userId = user._id;
        const { page = 1, limit = 10 } = query;

        if (!userId) {
            await createLogService({
                level: "warn",
                message: "Consulta de feed sin userId",
                meta: {},
                user: null
            });
            return handleHttp(res, {
                status: 400,
                message: "userId es requerido",
                errorCode: "VALIDATION_ERROR"
            });
        }

        const posts = await getFeedPostsService({
            userId,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        });

        await createLogService({
            level: "info",
            message: "Feed generado correctamente",
            meta: { userId, count: posts?.length ?? 0, page, limit },
            user: userId
        });

        return handleHttp(res, {
            status: 200,
            message: "Feed generado correctamente",
            data: posts
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener el feed",
            meta: { userId: user?._id, error: error?.message, stack: error?.stack },
            user: user?._id
        });
        return handleHttp(res, {
            status: 500,
            message: "Error al obtener el feed",
            errorCode: "SERVER_ERROR",
            errorDetails: error
        });
    }
};

/**
 * Lista las respuestas a un post.
 */
export const getRepliesCtrl = async ({ params, query, user }, res) => {
    try {
        const { postId } = params;
        const { page = 1, limit = 10 } = query;

        if (!postId) {
            await createLogService({
                level: "warn",
                message: "Consulta de replies sin postId",
                meta: { requestedBy: user?._id },
                user: user?._id
            });
            return handleHttp(res, {
                status: 400,
                message: "postId es requerido",
                errorCode: "VALIDATION_ERROR"
            });
        }

        const replies = await getRepliesService({
            postId,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        });

        await createLogService({
            level: "info",
            message: "Respuestas a post obtenidas correctamente",
            meta: { postId, requestedBy: user?._id, count: replies?.length ?? 0, page, limit },
            user: user?._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Respuestas encontradas",
            data: replies
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener respuestas de post",
            meta: { requestedBy: user?._id, error: error?.message, stack: error?.stack },
            user: user?._id
        });
        return handleHttp(res, {
            status: 500,
            message: "Error al obtener respuestas",
            errorCode: "SERVER_ERROR",
            errorDetails: error
        });
    }
};

/**
 * Borra (soft delete) un post.
 */
export const deletePostCtrl = async ({ params, user }, res) => {
    try {
        const { id } = params;
        if (!id) {
            await createLogService({
                level: "warn",
                message: "Intento de borrar post sin id",
                meta: { requestedBy: user?._id },
                user: user?._id
            });
            return handleHttp(res, {
                status: 400,
                message: "El id del post es requerido",
                errorCode: "VALIDATION_ERROR"
            });
        }

        const post = await deletePostService({ postId: id });

        await createLogService({
            level: "info",
            message: "Post borrado correctamente",
            meta: { postId: id, requestedBy: user?._id },
            user: user?._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Post borrado correctamente",
            data: post
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al borrar el post",
            meta: { postId: params?.id, requestedBy: user?._id, error: error?.message, stack: error?.stack },
            user: user?._id
        });
        return handleHttp(res, {
            status: error.status || 500,
            message: error.message || "Error al borrar el post",
            errorCode: error.errorCode || "SERVER_ERROR",
            errorDetails: error.errorDetails || null
        });
    }
};

/**
 * Devuelve todos los posts, paginados
 */
export const getAllPostsCtrl = async ({ user }, res) => {
    try {
        const userId = user._id;
        const posts = await getAllPostsService({ userId });

        await createLogService({
            level: "info",
            message: "Todos los posts paginados obtenidos",
            meta: { userId, count: posts?.length ?? 0 },
            user: userId
        });

        return handleHttp(res, {
            status: 200,
            message: "Posts obtenidos correctamente",
            data: posts
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener todos los posts paginados",
            meta: { userId: user?._id, error: error?.message, stack: error?.stack },
            user: user?._id
        });
        return handleHttp(res, {
            status: 500,
            message: "Error al obtener los posts",
            errorCode: "SERVER_ERROR",
            errorDetails: error
        });
    }
};