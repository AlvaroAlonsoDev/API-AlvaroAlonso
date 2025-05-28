/**
 * Devuelve una respuesta HTTP estandarizada
 * 
 * @param {Response} res - Objeto de respuesta de Express
 * @param {object} options - Opciones de la respuesta
 * @param {number} options.status - Código de estado HTTP (ej: 200, 404, 500)
 * @param {string} options.message - Mensaje principal de respuesta
 * @param {object} [options.data] - Datos útiles en caso de éxito
 * @param {string} [options.errorCode] - Código interno de error (ej: 'INVALID_CREDENTIALS')
 * @param {any} [options.errorDetails] - Detalles extra del error
 * @param {boolean} [options.success] - Forzar éxito o error (por defecto se infiere)
 */
export const handleHttp = (
    res,
    {
        status = 500,
        message = 'Error interno del servidor',
        data = null,
        errorCode = null,
        errorDetails = null,
        success = null
    }
) => {
    const isSuccess = success !== null
        ? success
        : status >= 200 && status < 300;

    const baseResponse = {
        success: isSuccess,
        message
    };

    if (isSuccess) {
        return res.status(status).json({
            ...baseResponse,
            data
        });
    } else {
        return res.status(status).json({
            ...baseResponse,
            error: {
                code: errorCode || 'UNEXPECTED_ERROR',
                details: errorDetails || null
            }
        });
    }
};
