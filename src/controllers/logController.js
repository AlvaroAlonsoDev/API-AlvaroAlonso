import { createLogService, getLogsService } from "../services/logService.js";
import { handleHttp } from "../utils/res.handle.js";

/**
 * Crea un nuevo log.
 */
export const createLogCtrl = async ({ body, user }, res) => {
    try {
        const { level, message, meta } = body;
        await createLogService({ level, message, meta, user: user?._id });
        return handleHttp(res, { status: 201, message: "Log creado" });
    } catch (error) {
        return handleHttp(res, { status: 500, message: "Error al crear log", errorDetails: error });
    }
};

/**
 * Obtiene los logs.
 */
export const getLogsCtrl = async ({ query }, res) => {
    try {
        const { page = 1, limit = 50, level, userId, date } = query;
        const data = await getLogsService({ page, limit, level, userId, date });
        return handleHttp(res, { status: 200, message: "Logs obtenidos", data });
    } catch (error) {
        return handleHttp(res, { status: 500, message: "Error al obtener logs", errorDetails: error });
    }
};
