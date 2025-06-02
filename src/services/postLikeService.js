import PostModel from "../models/Post.js";
import PostLikeModel from "../models/PostLike.js";

/**
 * Da like a un post. Si ya existe, no hace nada. Incrementa likesCount en el post.
 */
export const likePostService = async ({ userId, postId }) => {
    // Intenta crear el like (si ya existe, ignora el error por índice único)
    try {
        await PostLikeModel.create({ user: userId, post: postId });
        await PostModel.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
    } catch (err) {
        if (err.code === 11000) {
            // Like ya existe, no pasa nada
            return;
        }
        throw err;
    }
};

/**
 * Quita el like de un post (si existe). Decrementa likesCount en el post.
 */
export const unlikePostService = async ({ userId, postId }) => {
    const res = await PostLikeModel.findOneAndDelete({ user: userId, post: postId });
    // Solo decrementa si se eliminó algo
    if (res) {
        await PostModel.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
    }
};

/**
 * Devuelve los usuarios que han dado like a un post (paginado).
 */
export const getLikesOfPostService = async ({ postId, page = 1, limit = 20 }) => {
    const skip = (page - 1) * limit;
    // Busca los likes de ese post y populatea los usuarios
    const likes = await PostLikeModel.find({ post: postId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "handle displayName avatar _id")
        .lean();

    // Devuelve solo los usuarios, si quieres más info puedes devolver el like completo
    const users = likes.map(like => like.user);

    // (Opcional) Número total de likes
    const total = await PostLikeModel.countDocuments({ post: postId });

    return { users, total, page, limit };
};
