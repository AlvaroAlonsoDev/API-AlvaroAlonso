// services/post.js
import mongoose from "mongoose";
import FollowModel from "../models/Follow.js";
import PostModel from "../models/Post.js";
import PostLikeModel from "../models/PostLike.js";

/**
 * Crea un nuevo post.
 *
 * @param {object} param0 - { author, content, replyTo, media }
 * @returns {object} - Post creado
 */
export const createPostService = async ({ author, content, replyTo, media }) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let threadRoot = null;

        if (replyTo) {
            const parentPost = await PostModel.findById(replyTo).session(session);
            if (!parentPost) throw new Error("El post al que respondes no existe");
            threadRoot = parentPost.threadRoot || parentPost._id;

            // Incrementa contador de respuestas en el padre
            await PostModel.findByIdAndUpdate(
                replyTo,
                { $inc: { repliesCount: 1 } },
                { session }
            );
        }

        // Crea el post
        const postCreated = await PostModel.create(
            [{
                author,
                content,
                replyTo: replyTo || null,
                threadRoot: threadRoot || null,
                media: media || []
            }],
            { session }
        );

        // postCreated es un array (por usar .create con session)
        const postId = postCreated[0]._id;

        // Busca y popula el post creado
        const post = await PostModel.findById(postId)
            .populate([
                {
                    path: "author",
                    select: "handle displayName avatar _id"
                },
                {
                    path: "replyTo",
                    select: "author content _id",
                    populate: {
                        path: "author",
                        select: "handle displayName avatar _id"
                    }
                }
            ])
            .session(session);

        // Si todo fue bien, confirma la transacción
        await session.commitTransaction();
        session.endSession();
        return post;

    } catch (err) {
        // Si cualquier paso falla, revierte TODO
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
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
                select: "handle displayName avatar _id"
            },
            {
                path: "replyTo",
                select: "author content _id",
                populate: {
                    path: "author",
                    select: "handle displayName avatar _id"
                }
            }
        ])
        .lean();

    return post;
};

/**
 * Devuelve posts de los usuarios que sigue un usuario, incluyendo datos del autor,
 * y añade likedByMe: boolean a cada post.
 *
 * @param {object} param0 - { userId, page, limit }
 * @returns {array} - Feed de posts con likedByMe
 */
export const getFeedPostsService = async ({ userId, page = 1, limit = 10 }) => {
    // 1. Obtener a quién sigue
    const follows = await FollowModel.find({ follower: userId }).select("following");
    const followingIds = follows.map(f => f.following);

    // Incluir los posts del propio usuario
    followingIds.push(userId);

    if (!followingIds.length) return [];

    // 2. Buscar posts de esos usuarios y populatear autor y replyTo
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
                select: "handle displayName avatar _id"
            },
            {
                path: "replyTo",
                select: "author content _id",
                populate: {
                    path: "author",
                    select: "handle displayName avatar _id"
                }
            }
        ])
        .lean();

    // 3. Sacar todos los IDs de los posts para consultar los likes de golpe
    const postIds = posts.map(post => post._id);

    // 4. Buscar todos los likes del usuario actual a esos posts (un solo query)
    const likes = await PostLikeModel.find({
        user: userId,
        post: { $in: postIds }
    }).select("post").lean();

    // 5. Crear un Set con los postId a los que el usuario ha dado like
    const likedPostIds = new Set(likes.map(like => String(like.post)));

    // 6. Añadir likedByMe a cada post
    const postsWithLikedByMe = posts.map(post => ({
        ...post,
        likedByMe: likedPostIds.has(String(post._id))
    }));

    return postsWithLikedByMe;
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
        .populate("author", "handle displayName avatar _id")
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