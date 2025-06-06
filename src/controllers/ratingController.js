import { createRating, deleteRatingById, getRatingsGivenByUser, getRatingsHistory, getUserRatingsStats } from "../services/ratingService.js";
import { handleHttp } from "../utils/res.handle.js";
import { createLogService } from "../services/logService.js";

/**
 * Devuelve el promedio de valoraciones por aspecto de un usuario.
 *
 * @route   GET /ratings/:userId
 * @access  Público
 */
export const getUserRatingsCtrl = async ({ params, user }, res) => {
    try {
        const { userId } = params;

        if (!userId) {
            await createLogService({
                level: "warn",
                message: "Consulta de ratings promedio sin userId",
                meta: { requestedBy: user?._id },
                user: user?._id
            });
            return handleHttp(res, {
                status: 422,
                message: "userId es requerido",
                errorCode: "VALIDATION_ERROR",
                errorDetails: { userId }
            });
        }

        const data = await getUserRatingsStats(userId);

        await createLogService({
            level: "info",
            message: "Promedio de valoraciones obtenido correctamente",
            meta: { requestedBy: user?._id, userId },
            user: user?._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Valoraciones promedio obtenidas",
            data
        });

    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener valoraciones promedio",
            meta: { requestedBy: user?._id, error: error?.message, stack: error?.stack },
            user: user?._id
        });
        return handleHttp(res, {
            status: 500,
            message: "Error al obtener valoraciones",
            errorCode: "SERVER_ERROR",
            errorDetails: error
        });
    }
};

/**
 * Crea una valoración de un usuario hacia otro.
 */
export const createRatingCtrl = async ({ user, body }, res) => {
    try {
        const fromUserId = user._id;
        const { toUserId, ratings, comment = "" } = body;

        if (!toUserId || typeof ratings !== "object") {
            await createLogService({
                level: "warn",
                message: "Intento de creación de valoración con datos inválidos",
                meta: { fromUserId, toUserId, ratings, comment },
                user: fromUserId
            });
            return handleHttp(res, {
                status: 422,
                message: "Datos de entrada inválidos",
                errorCode: "VALIDATION_ERROR",
            });
        }

        if (fromUserId.toString() === toUserId) {
            await createLogService({
                level: "warn",
                message: "Intento de autovaloración",
                meta: { userId: fromUserId },
                user: fromUserId
            });
            return handleHttp(res, {
                status: 403,
                message: "No puedes valorarte a ti mismo",
                errorCode: "SELF_RATING_NOT_ALLOWED",
            });
        }

        const result = await createRating({ fromUserId, toUserId, ratings, comment });

        await createLogService({
            level: "info",
            message: "Valoración creada exitosamente",
            meta: { fromUserId, toUserId, ratings, comment, ratingId: result?._id },
            user: fromUserId
        });

        return handleHttp(res, {
            status: 201,
            message: "Valoración creada exitosamente",
            data: result,
        });

    } catch (error) {
        const isRateLimited = error.code === "RATE_LIMITED";

        await createLogService({
            level: isRateLimited ? "warn" : "error",
            message: isRateLimited
                ? "Intento de valoración bloqueada por rate limit"
                : "Error al crear valoración",
            meta: { fromUserId: user?._id, error: error?.message, code: error?.code, stack: error?.stack },
            user: user?._id
        });

        return handleHttp(res, {
            status: isRateLimited ? 429 : 500,
            message: isRateLimited
                ? "Ya has valorado a esta persona en los últimos 7 días"
                : "Error al crear la valoración",
            errorCode: error.code || "CREATE_RATING_ERROR",
            errorDetails: !isRateLimited ? error : null,
        });
    }
};

/**
 * Elimina una valoración específica por _id.
 * Solo para administradores o superiores.
 */
export const deleteRatingByIdCtrl = async ({ params, user }, res) => {
    try {
        const { ratingId } = params;

        if (!ratingId) {
            await createLogService({
                level: "warn",
                message: "Intento de eliminar valoración sin ratingId",
                meta: { requestedBy: user?._id },
                user: user?._id
            });
            return handleHttp(res, {
                status: 422,
                message: "ID de valoración requerido",
                errorCode: "VALIDATION_ERROR"
            });
        }

        const deleted = await deleteRatingById(ratingId);

        await createLogService({
            level: "info",
            message: deleted
                ? "Valoración eliminada correctamente"
                : "No se encontró ninguna valoración con ese ID",
            meta: { ratingId, requestedBy: user?._id },
            user: user?._id
        });

        return handleHttp(res, {
            status: 200,
            message: deleted
                ? "Valoración eliminada correctamente"
                : "No se encontró ninguna valoración con ese ID",
        });

    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al eliminar la valoración",
            meta: { requestedBy: user?._id, error: error?.message, stack: error?.stack },
            user: user?._id
        });
        return handleHttp(res, {
            status: 500,
            message: "Error al eliminar la valoración",
            errorCode: "DELETE_RATING_BY_ID_ERROR",
            errorDetails: error
        });
    }
};

/**
 * Lista todas las valoraciones que ha recibido un usuario.
 */
export const getRatingsHistoryCtrl = async ({ params, user }, res) => {
    try {
        const { userId } = params;

        if (!userId) {
            await createLogService({
                level: "warn",
                message: "Consulta de historial de valoraciones sin userId",
                meta: { requestedBy: user?._id },
                user: user?._id
            });
            return handleHttp(res, {
                status: 422,
                message: "userId es requerido",
                errorCode: "VALIDATION_ERROR",
                errorDetails: { userId },
            });
        }

        const data = await getRatingsHistory(userId);

        await createLogService({
            level: "info",
            message: "Historial de valoraciones obtenido correctamente",
            meta: { userId, requestedBy: user?._id, count: data?.length ?? 0 },
            user: user?._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Historial de valoraciones obtenido correctamente",
            data,
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener historial de valoraciones",
            meta: { requestedBy: user?._id, error: error?.message, stack: error?.stack },
            user: user?._id
        });
        return handleHttp(res, {
            status: 500,
            message: "Error al obtener historial de valoraciones",
            errorCode: "SERVER_ERROR",
            errorDetails: error,
        });
    }
};

/**
 * Devuelve todas las valoraciones emitidas por un usuario.
 */
export const getRatingsGivenByUserCtrl = async ({ params, user }, res) => {
    try {
        const { userId } = params;

        if (!userId) {
            await createLogService({
                level: "warn",
                message: "Consulta de valoraciones emitidas sin userId",
                meta: { requestedBy: user?._id },
                user: user?._id
            });
            return handleHttp(res, {
                status: 422,
                message: "userId es requerido",
                errorCode: "VALIDATION_ERROR",
                errorDetails: { userId },
            });
        }

        const data = await getRatingsGivenByUser(userId);

        await createLogService({
            level: "info",
            message: "Valoraciones emitidas obtenidas correctamente",
            meta: { userId, requestedBy: user?._id, count: data?.length ?? 0 },
            user: user?._id
        });

        return handleHttp(res, {
            status: 200,
            message: "Valoraciones emitidas obtenidas correctamente",
            data,
        });
    } catch (error) {
        await createLogService({
            level: "error",
            message: "Error al obtener valoraciones emitidas",
            meta: { requestedBy: user?._id, error: error?.message, stack: error?.stack },
            user: user?._id
        });
        return handleHttp(res, {
            status: 500,
            message: "Error al obtener valoraciones emitidas",
            errorCode: "SERVER_ERROR",
            errorDetails: error,
        });
    }
};