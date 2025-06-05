import { VALID_RATING_ASPECTS } from "../config/constants.js";
import RatingModel from "../models/Rating.js";

/**
 * Calcula el promedio de puntuaciones por aspecto para un usuario usando JS plano.
 *
 * @param {string} toUserId
 * @returns {object} - { sincerity: 4.2, kindness: null, ... }
 */
export const getUserRatingsStats = async (toUserId) => {
    const ratings = await RatingModel.find({ toUser: toUserId });

    // Inicializa estructura
    const totals = {};
    const counts = {};
    VALID_RATING_ASPECTS.forEach((aspect) => {
        totals[aspect] = 0;
        counts[aspect] = 0;
    });

    // Suma y cuenta cada aspecto
    for (const r of ratings) {
        for (const [aspect, value] of Object.entries(r.ratings || {})) {
            if (VALID_RATING_ASPECTS.includes(aspect)) {
                totals[aspect] += value;
                counts[aspect] += 1;
            }
        }
    }

    // Calcula promedios
    // TODO: utiliza weight para ponderar las puntuaciones
    const averages = {};
    for (const aspect of VALID_RATING_ASPECTS) {
        averages[aspect] = counts[aspect] > 0
            ? parseFloat((totals[aspect] / counts[aspect]).toFixed(2))
            : null;
    }

    return averages;
};

const MILLISECONDS_IN_7_DAYS = 1000 * 60 * 60 * 24 * 7;

/**
 * Crea una valoración si el usuario no ha valorado al mismo destinatario en los últimos 7 días.
 * @param {Object} input
 * @param {string} input.fromUserId
 * @param {string} input.toUserId
 * @param {Object} input.ratings
 * @param {string} input.comment
 */
export const createRating = async ({ fromUserId, toUserId, ratings, comment }) => {
    const ratingKeys = Object.keys(ratings);

    // Validar aspectos
    const isValid =
        ratingKeys.length >= 1 &&
        ratingKeys.length <= VALID_RATING_ASPECTS.length &&
        ratingKeys.every((key) => VALID_RATING_ASPECTS.includes(key)) &&
        Object.values(ratings).every((val) => Number(val) >= 1 && Number(val) <= 5);

    if (!isValid) {
        const error = new Error("Aspectos o puntuaciones inválidas");
        error.code = "INVALID_ASPECTS";
        throw error;
    }

    // Buscar si ya ha valorado a este usuario antes
    const previous = await RatingModel.findOne({
        fromUser: fromUserId,
        toUser: toUserId,
    });
    // TODO: Ia para verificar que el comentario es valido. (sin insultos, spam, etc.)

    if (previous) {
        const lastTime = new Date(previous.createdAt).getTime();
        const now = Date.now();
        const elapsed = now - lastTime;

        if (elapsed < MILLISECONDS_IN_7_DAYS) {
            const error = new Error("Ya has valorado a esta persona recientemente. Debes esperar 7 días.");
            error.code = "RATE_LIMITED";
            throw error;
        }

        // ¿Si ya pasó el tiempo, eliminamos la anterior antes de crear la nueva?

        // Si pasaron los 7 días, eliminamos la anterior antes de crear la nueva
        // await RatingModel.deleteOne({ _id: previous._id });
    }

    const newRating = await RatingModel.create({
        fromUser: fromUserId,
        toUser: toUserId,
        ratings,
        comment,
        weight: 1,
    });

    // Hacemos populate sobre el documento recién creado
    const populatedRating = await RatingModel.findById(newRating._id)
        .populate({
            path: "toUser",
            select: "handle displayName avatar",
        })
        .populate({
            path: "fromUser",
            select: "handle displayName avatar",
        });

    return populatedRating;
};

/**
 * Elimina una valoración por su ID.
 * @param {string} ratingId
 * @returns {boolean} true si se eliminó, false si no existía
 */
export const deleteRatingById = async (ratingId) => {
    const result = await RatingModel.deleteOne({ _id: ratingId });
    return result.deletedCount > 0;
};

/**
 * Devuelve el historial de valoraciones recibidas por un usuario.
 *
 * @param {string} toUserId - ID del usuario que recibe las valoraciones
 * @returns {Array} Lista de valoraciones
 */
export const getRatingsHistory = async (toUserId) => {
    const ratings = await RatingModel.find({ toUser: toUserId })
        .populate({
            path: "fromUser",
            select: "handle displayName avatar trustScore",
        })
        .sort({ createdAt: -1 }); // más recientes primero

    return ratings.map((ratingDoc) => {
        const rating = ratingDoc.toObject();
        return {
            _id: rating._id,
            from: rating.fromUser,
            ratings: rating.ratings,
            comment: rating.comment || null,
            createdAt: rating.createdAt,
            weight: rating.weight,
        };
    });
};

/**
 * Devuelve todas las valoraciones emitidas por un usuario.
 *
 * @param {string} fromUserId - ID del usuario emisor
 * @returns {Array} Lista de valoraciones emitidas
 */
export const getRatingsGivenByUser = async (fromUserId) => {
    const ratings = await RatingModel.find({ fromUser: fromUserId })
        .populate({
            path: "toUser",
            select: "handle displayName avatar",
        })
        .sort({ createdAt: -1 });

    return ratings.map((ratingDoc) => {
        const rating = ratingDoc.toObject();
        return {
            _id: rating._id,
            toUser: rating.toUser,
            ratings: rating.ratings,
            comment: rating.comment || null,
            createdAt: rating.createdAt,
        };
    });
};