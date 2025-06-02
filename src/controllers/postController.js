// controllers/post.js
import { createPostService, deletePostService, getFeedPostsService, getPostByIdService, getPostsByUserService, getRepliesService } from "../services/postService.js";
import { handleHttp } from "../utils/res.handle.js";

/**
 * Crea un nuevo post.
 */
export const createPostCtrl = async ({ user, body }, res) => {
    try {
        const { content, replyTo, media } = body;
        if (!content || typeof content !== "string" || content.length === 0) {
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

        return handleHttp(res, {
            status: 201,
            message: "Post creado correctamente",
            data: post
        });
    } catch (error) {
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
export const getPostsByUserCtrl = async ({ params, query }, res) => {
    try {
        const { userId } = params;
        const { page = 1, limit = 10 } = query; // paginación

        if (!userId) {
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

        return handleHttp(res, {
            status: 200,
            message: "Posts encontrados",
            data: posts
        });
    } catch (error) {
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
export const getPostByIdCtrl = async ({ params }, res) => {
    try {
        const { id } = params;
        if (!id) {
            return handleHttp(res, {
                status: 400,
                message: "id es requerido",
                errorCode: "VALIDATION_ERROR"
            });
        }

        const post = await getPostByIdService(id);

        if (!post) {
            return handleHttp(res, {
                status: 404,
                message: "Post no encontrado",
                errorCode: "NOT_FOUND"
            });
        }

        return handleHttp(res, {
            status: 200,
            message: "Post encontrado",
            data: post
        });
    } catch (error) {
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
export const getFeedPostsCtrl = async ({ params, query, user }, res) => {
    try {
        const userId = user._id;
        const { page = 1, limit = 10 } = query;

        if (!userId) {
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

        return handleHttp(res, {
            status: 200,
            message: "Feed generado correctamente",
            data: posts
        });
    } catch (error) {
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
export const getRepliesCtrl = async ({ params, query }, res) => {
    try {
        const { postId } = params;
        const { page = 1, limit = 10 } = query;

        if (!postId) {
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

        return handleHttp(res, {
            status: 200,
            message: "Respuestas encontradas",
            data: replies
        });
    } catch (error) {
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
export const deletePostCtrl = async ({ params }, res) => {
    try {
        const { id } = params;
        if (!id) {
            return handleHttp(res, {
                status: 400,
                message: "El id del post es requerido",
                errorCode: "VALIDATION_ERROR"
            });
        }

        const post = await deletePostService({ postId: id });

        return handleHttp(res, {
            status: 200,
            message: "Post borrado correctamente",
            data: post
        });
    } catch (error) {
        return handleHttp(res, {
            status: error.status || 500,
            message: error.message || "Error al borrar el post",
            errorCode: error.errorCode || "SERVER_ERROR",
            errorDetails: error.errorDetails || null
        });
    }
};
