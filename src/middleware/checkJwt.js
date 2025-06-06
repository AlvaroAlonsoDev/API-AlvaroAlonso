import { getToken, verifyToken, generateToken } from "../utils/jwt.handle.js";
import UserModel from "../models/User.js";
import { handleHttp } from "../utils/res.handle.js";

/**
 * Middleware que valida JWT y renueva el token automáticamente si es válido.
 * El nuevo token se inyecta en `res.locals.newToken` para que pueda usarse en la respuesta.
 */
export const checkJwt = async (req, res, next) => {
    try {
        const rawAuth = req.headers.authorization || "";
        const token = getToken(rawAuth);

        if (!token || token === "null") {
            return handleHttp(res, {
                status: 401,
                message: "No autorizado: token no proporcionado",
                errorCode: "TOKEN_MISSING"
            });
        }

        const decodedToken = verifyToken(token);

        if (!decodedToken) {
            return handleHttp(res, {
                status: 401,
                message: "Token inválido o expirado",
                errorCode: "INVALID_TOKEN"
            });
        }

        const user = await UserModel.findById(decodedToken._id).select("role");
        if (!user) {
            return handleHttp(res, {
                status: 401,
                message: "Usuario no encontrado",
                errorCode: "USER_NOT_FOUND"
            });
        }

        // Renovar el token
        const newToken = generateToken(user._id);

        // Inyectamos info en req/res.locals
        req.user = {
            _id: user._id,
            role: user.role,
            handle: user.handle,
            displayName: user.displayName,
            avatar: user.avatar
        };

        res.locals.newToken = newToken;

        next();

    } catch (error) {
        return handleHttp(res, {
            status: 401,
            message: "Error al verificar el token",
            errorCode: "AUTH_MIDDLEWARE_ERROR",
            errorDetails: error
        });
    }
};
