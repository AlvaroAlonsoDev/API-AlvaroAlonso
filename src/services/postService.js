// services/post.js

import FollowModel from "../models/Follow.js";
import PostModel from "../models/Post.js";

/**
 * Crea un nuevo post.
 *
 * @param {object} param0 - { author, content, replyTo, media }
 * @returns {object} - Post creado
 */
export const createPostService = async ({ author, content, replyTo, media }) => {
    // Si es respuesta, obtiene la raíz del hilo
    let threadRoot = null;
    if (replyTo) {
        const parentPost = await PostModel.findById(replyTo);
        if (!parentPost) throw new Error("El post al que respondes no existe");
        threadRoot = parentPost.threadRoot || parentPost._id;

        // Incrementa contador de respuestas en el padre
        await PostModel.findByIdAndUpdate(replyTo, { $inc: { repliesCount: 1 } });
    }

    // Crea el post
    const post = await PostModel.create({
        author,
        content,
        replyTo: replyTo || null,
        threadRoot: threadRoot || null,
        media: media || []
    });

    // Devuelve post completo (puedes hacer populate si quieres)
    return post;
};

/**
 * Lista los posts de un usuario, excluyendo borrados. Pagina los resultados.
 *
 * @param {object} param0 - { userId, page, limit }
 * @returns {array} - Lista de posts
 */
export const getPostsByUserService = async ({ userId, page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;
    const posts = await PostModel.find({
        author: userId,
        deleted: false
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return posts;
};

/**
 * Devuelve un post por ID, incluyendo info del autor y del post al que responde.
 * @param {string} id - ID del post
 * @returns {object|null}
 */
export const getPostByIdService = async (id) => {
    const post = await PostModel.findOne({ _id: id, deleted: false })
        .populate([
            {
                path: "author",
                select: "username name avatar _id"
            },
            {
                path: "replyTo",
                select: "author content _id",
                populate: {
                    path: "author",
                    select: "username name avatar _id"
                }
            }
        ])
        .lean();

    return post;
};

/**
 * Devuelve posts de los usuarios que sigue un usuario, incluyendo datos del autor.
 *
 * @param {object} param0 - { userId, page, limit }
 * @returns {array} - Feed de posts
 */
export const getFeedPostsService = async ({ userId, page = 1, limit = 10 }) => {
    // 1. Obtener a quién sigue
    const follows = await FollowModel.find({ follower: userId }).select("following");
    const followingIds = follows.map(f => f.following);

    // Si quieres incluir también los posts del propio usuario en el feed:
    followingIds.push(userId);

    if (!followingIds.length) return [];

    // 2. Buscar posts de esos usuarios y populatear autor y replyTo (si lo usas en el front)
    const skip = (page - 1) * limit;
    const posts = await PostModel.find({
        author: { $in: followingIds },
        deleted: false
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate([
            {
                path: "author",
                select: "username name avatar _id"
            },
            // Si quieres mostrar info del post al que se responde en el front:
            {
                path: "replyTo",
                select: "author content _id",
                populate: {
                    path: "author",
                    select: "username name avatar _id"
                }
            }
        ])
        .lean();

    return posts;
};

/**
 * Lista las respuestas de un post, con paginación.
 *
 * @param {object} param0 - { postId, page, limit }
 * @returns {array} - Lista de respuestas
 */
export const getRepliesService = async ({ postId, page = 1, limit = 10 }) => {
    const skip = (page - 1) * limit;

    const replies = await PostModel.find({
        replyTo: postId,
        deleted: false
    })
        .sort({ createdAt: 1 }) // cronológico ascendente (primeras respuestas primero)
        .skip(skip)
        .limit(limit)
        .populate("author", "username name avatar _id")
        .lean();

    return replies;
};

/**
 * Borra (soft delete) un post.
 *
 * @param {object} param0 - { user, postId }
 * @returns {object} - Post actualizado
 */
export const deletePostService = async ({ postId }) => {
    const post = await PostModel.findById(postId);
    if (!post) {
        const error = new Error("El post no existe");
        error.status = 404;
        error.errorCode = "NOT_FOUND";
        throw error;
    }

    // Soft delete
    post.deleted = true;
    await post.save();

    return post;
};