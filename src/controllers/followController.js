import { followUser, getFollowStatus, getMyFollowers, getMyFollowing, getPublicFollowers, getPublicFollowing, unfollowUser } from "../services/followUserService.js";
import { handleHttp } from "../utils/res.handle.js";

/**
 * Sigue a un usuario (POST /api/follow/:userId)
 */
export const followUserCtrl = async (req, res) => {
    try {
        const follower = req.user._id;
        const following = req.params.userId;

        const follow = await followUser({ follower, following });

        await createLogService({
            level: "info",
            message: "Usuario comenzó a seguir a otro usuario",
            meta: { follower, following, followId: follow?._id },
            user: follower
        });

        return handleHttp(res, {
            status: 201,
            message: "Has comenzado a seguir al usuario",
            data: follow,
        });
    } catch (error) {
        let status = 500;
        let message = "Error interno al seguir al usuario";
        let errorCode = "SERVER_ERROR";
        let logLevel = "error";
        let logMessage = "Error interno al seguir al usuario";

        if (error.code === "NO_SELF_FOLLOW") {
            status = 400;
            message = "No puedes seguirte a ti mismo";
            errorCode = "INVALID_ACTION";
            logLevel = "warn";
            logMessage = "Intento de autoseguimiento";
        }

        if (error.code === "ALREADY_FOLLOWING") {
            status = 400;
            message = "Ya estás siguiendo a este usuario";
            errorCode = "DUPLICATE_FOLLOW";
            logLevel = "warn";
            logMessage = "Intento de seguir a un usuario ya seguido";
        }

        await createLogService({
            level: logLevel,
            message: logMessage,
            meta: { follower: req.user._id, following: req.params.userId, error: error?.message, code: error?.code, stack: error?.stack },
            user: req.user._id
        });

        return handleHttp(res, {
            status,
            message,
            errorCode,
            errorDetails: error,
        });
    }
};


/**
 * Deja de seguir a un usuario (DELETE /api/follow/:userId)
 */
export const unfollowUserCtrl = async (req, res) => {
    try {
        const follower = req.user._id;
        const following = req.params.userId;

        const result = await unfollowUser({ follower, following });

        await createLogService({
            level: "info",
            message: "Usuario dejó de seguir a otro usuario",
            meta: { follower, following, resultId: result?._id },
            user: follower
        });

        return handleHttp(res, {
            status: 200,
            message: "Has dejado de seguir al usuario",
            data: result,
        });
    } catch (error) {
        let status = 500;
        let message = "Error interno al dejar de seguir";
        let errorCode = "SERVER_ERROR";
        let logLevel = "error";
        let logMessage = "Error interno al dejar de seguir";

        if (error.code === "NO_SELF_UNFOLLOW") {
            status = 400;
            message = "No puedes dejar de seguirte a ti mismo";
            errorCode = "INVALID_ACTION";
            logLevel = "warn";
            logMessage = "Intento de auto-dejar de seguir";
        }

        if (error.code === "NOT_FOLLOWING") {
            status = 400;
            message = "No estás siguiendo a este usuario";
            errorCode = "NOT_FOLLOWING";
            logLevel = "warn";
            logMessage = "Intento de dejar de seguir a un usuario no seguido";
        }

        await createLogService({
            level: logLevel,
            message: logMessage,
            meta: { follower: req.user._id, following: req.params.userId, error: error?.message, code: error?.code, stack: error?.stack },
            user: req.user._id
        });

        return handleHttp(res, {
            status,
            message,
            errorCode,
            errorDetails: error,
        });
    }
};

/**
 * Verifica si el usuario autenticado sigue a :userId
 */
export const getFollowStatusCtrl = async (req, res) => {
    try {
        const follower = req.user._id;
        const following = req.params.userId;

        const isFollowing = await getFollowStatus({ follower, following });

        return handleHttp(res, {
            status: 200,
            message: "Estado de seguimiento obtenido",
            data: { isFollowing },
        });
    } catch (error) {
        return handleHttp(res, {
            status: 500,
            message: "Error al verificar estado de seguimiento",
            errorCode: "SERVER_ERROR",
            errorDetails: error,
        });
    }
};

/**
 * Obtiene los usuarios que el usuario autenticado sigue (GET /api/follow/following/me)
 */
export const getMyFollowingCtrl = async (req, res) => {
    try {
        const userId = req.user._id;
        const following = await getMyFollowing(userId);

        await createLogService({
            level: "info",
            message: "Usuarios seguidos obtenidos correctamente",
            meta: { userId, count: following?.length ?? 0 },
            user: userId
        });

        return handleHttp(res, {
            status: 200,
            message: "Usuarios seguidos obtenidos correctamente",
            data: following,
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener usuarios seguidos",
            meta: { userId: req?.user?._id, error: error?.message, stack: error?.stack },
            user: req?.user?._id
        });

        return handleHttp(res, {
            status: 500,
            message: "Error al obtener usuarios seguidos",
            errorCode: "SERVER_ERROR",
            errorDetails: error,
        });
    }
};

/**
 * Obtiene los seguidores del usuario autenticado (GET /api/follow/followers/me)
 */
export const getMyFollowersCtrl = async (req, res) => {
    try {
        const userId = req.user._id;
        const followers = await getMyFollowers(userId);

        await createLogService({
            level: "info",
            message: "Seguidores obtenidos correctamente",
            meta: { userId, count: followers?.length ?? 0 },
            user: userId
        });

        return handleHttp(res, {
            status: 200,
            message: "Seguidores obtenidos correctamente",
            data: followers,
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener seguidores",
            meta: { userId: req?.user?._id, error: error?.message, stack: error?.stack },
            user: req?.user?._id
        });

        return handleHttp(res, {
            status: 500,
            message: "Error al obtener seguidores",
            errorCode: "SERVER_ERROR",
            errorDetails: error,
        });
    }
};

/**
 * Obtiene los usuarios que sigue un usuario público GET /api/follow/following/:userId
 */
export const getPublicFollowingCtrl = async (req, res) => {
    try {
        const userId = req.params.userId;
        const following = await getPublicFollowing(userId);

        await createLogService({
            level: "info",
            message: "Usuarios seguidos públicos obtenidos correctamente",
            meta: { publicUserId: userId, count: following?.length ?? 0, requestedBy: req?.user?._id },
            user: req?.user?._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Usuarios seguidos obtenidos correctamente",
            data: following,
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener usuarios seguidos públicos",
            meta: { publicUserId: req.params.userId, requestedBy: req?.user?._id, error: error?.message, stack: error?.stack },
            user: req?.user?._id
        });

        return handleHttp(res, {
            status: 500,
            message: "Error al obtener usuarios seguidos",
            errorCode: "SERVER_ERROR",
            errorDetails: error,
        });
    }
};

/**
 * Obtiene los seguidores de un usuario público GET /api/follow/followers/:userId
 */
export const getPublicFollowersCtrl = async (req, res) => {
    try {
        const userId = req.params.userId;
        const followers = await getPublicFollowers(userId);

        await createLogService({
            level: "info",
            message: "Seguidores públicos obtenidos correctamente",
            meta: { publicUserId: userId, count: followers?.length ?? 0, requestedBy: req?.user?._id },
            user: req?.user?._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Seguidores obtenidos correctamente",
            data: followers,
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener seguidores públicos",
            meta: { publicUserId: req.params.userId, requestedBy: req?.user?._id, error: error?.message, stack: error?.stack },
            user: req?.user?._id
        });

        return handleHttp(res, {
            status: 500,
            message: "Error al obtener seguidores",
            errorCode: "SERVER_ERROR",
            errorDetails: error,
        });
    }
};