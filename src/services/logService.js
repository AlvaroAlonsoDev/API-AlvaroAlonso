import LogModel from "../models/Log.js";

/**
 * Guarda un log en la base de datos.
 */
export const createLogService = async ({ level, message, meta = {}, user = null }) => {
    return await LogModel.create({ level, message, meta, user });
};

/**
 * Devuelve logs (puedes filtrar por fecha, nivel, usuario, etc).
 */
export const getLogsService = async ({ page = 1, limit = 50, level, userId, date }) => {
    const query = {};
    if (level) query.level = level;
    if (userId) query.user = userId;
    if (date) {
        // Busca logs solo de ese día
        const start = new Date(date + "T00:00:00.000Z");
        const end = new Date(date + "T23:59:59.999Z");
        query.createdAt = { $gte: start, $lte: end };
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
        LogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        LogModel.countDocuments(query)
    ]);

    return { logs, total, page, limit };
};
