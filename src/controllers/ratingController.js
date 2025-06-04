import { createRating, deleteRatingById, getRatingsGivenByUser, getRatingsHistory, getUserRatingsStats } from "../services/ratingService.js";
import { handleHttp } from "../utils/res.handle.js";

/**
 * Devuelve el promedio de valoraciones por aspecto de un usuario.
 *
 * @route   GET /ratings/:userId
 * @access  Público
 */
export const getUserRatingsCtrl = async ({ params }, res) => {
    try {
        const { userId } = params;

        if (!userId) {
            return handleHttp(res, {
                status: 422,
                message: "userId es requerido",
                errorCode: "VALIDATION_ERROR",
                errorDetails: { userId }
            });
        }

        const data = await getUserRatingsStats(userId);

        return handleHttp(res, {
            status: 200,
            message: "Valoraciones promedio obtenidas",
            data
        });

    } catch (error) {
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
            return handleHttp(res, {
                status: 422,
                message: "Datos de entrada inválidos",
                errorCode: "VALIDATION_ERROR",
            });
        }

        if (fromUserId.toString() === toUserId) {
            return handleHttp(res, {
                status: 403,
                message: "No puedes valorarte a ti mismo",
                errorCode: "SELF_RATING_NOT_ALLOWED",
            });
        }

        const result = await createRating({ fromUserId, toUserId, ratings, comment });

        return handleHttp(res, {
            status: 201,
            message: "Valoración creada exitosamente",
            data: result,
        });

    } catch (error) {
        const isRateLimited = error.code === "RATE_LIMITED";

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
export const deleteRatingByIdCtrl = async ({ params }, res) => {
    try {
        const { ratingId } = params;

        if (!ratingId) {
            return handleHttp(res, {
                status: 422,
                message: "ID de valoración requerido",
                errorCode: "VALIDATION_ERROR"
            });
        }

        const deleted = await deleteRatingById(ratingId);

        return handleHttp(res, {
            status: 200,
            message: deleted
                ? "Valoración eliminada correctamente"
                : "No se encontró ninguna valoración con ese ID",
        });

    } catch (error) {
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
export const getRatingsHistoryCtrl = async ({ params }, res) => {
    try {
        const { userId } = params;

        if (!userId) {
            return handleHttp(res, {
                status: 422,
                message: "userId es requerido",
                errorCode: "VALIDATION_ERROR",
                errorDetails: { userId },
            });
        }

        const data = await getRatingsHistory(userId);

        return handleHttp(res, {
            status: 200,
            message: "Historial de valoraciones obtenido correctamente",
            data,
        });
    } catch (error) {
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
export const getRatingsGivenByUserCtrl = async ({ params }, res) => {
    try {
        const { userId } = params;

        if (!userId) {
            return handleHttp(res, {
                status: 422,
                message: "userId es requerido",
                errorCode: "VALIDATION_ERROR",
                errorDetails: { userId },
            });
        }

        const data = await getRatingsGivenByUser(userId);

        return handleHttp(res, {
            status: 200,
            message: "Valoraciones emitidas obtenidas correctamente",
            data,
        });
    } catch (error) {
        return handleHttp(res, {
            status: 500,
            message: "Error al obtener valoraciones emitidas",
            errorCode: "SERVER_ERROR",
            errorDetails: error,
        });
    }
};