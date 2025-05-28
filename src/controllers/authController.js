/**
 * Controladores de autenticación
 * 
 * Este módulo incluye los controladores encargados de gestionar el inicio de sesión, registro,
 * cierre de sesión y verificación de token. Cada controlador utiliza el sistema de respuestas 
 * estandarizadas `handleHttp`, y sigue buenas prácticas en el uso de HTTP status codes, manejo de errores
 * y validación de entrada.
 * 
 * Dependencias:
 * - `handleHttp`: utilitario para respuestas estandarizadas.
 * - `generateToken`: generación de JWTs.
 * - Servicios: `loginUser`, `logoutUser`, `registerNewUser`, `verifyTokenService`.
 * 
 * Todos los controladores están preparados para producción y cumplen los principios:
 * - Validación de datos mínima.
 * - Códigos de error internos (`errorCode`) para trazabilidad y documentación frontend.
 * - Separación de responsabilidades con los servicios.
 */

import { handleHttp } from "../utils/res.handle.js";
import {
  loginUser,
  logoutUser,
  registerNewUser,
} from "../services/authService.js";

/**
 * Devuelve los datos del usuario autenticado y el token renovado.
 * Requiere que `checkJwt` haya validado el token y generado uno nuevo.
 */
export const verifyTokenCtrl = async (req, res) => {
  try {
    const { user } = req;
    const token = res.locals.newToken;

    return handleHttp(res, {
      status: 200,
      message: "Token verificado correctamente",
      data: {
        user,
        token
      }
    });

  } catch (error) {
    return handleHttp(res, {
      status: 500,
      message: "Error inesperado al verificar el token",
      errorCode: "VERIFY_TOKEN_ERROR",
      errorDetails: error
    });
  }
};

/**
 * Registra un nuevo usuario.
 * Requiere: email, password (y opcional username).
 * Valida si el usuario ya existe o si el código es inválido.
 */
export const registerCtrl = async (req, res) => {
  try {
    const { email, password, handle, displayName } = req.body;

    if (!email || !password) {
      return handleHttp(res, {
        status: 422,
        message: "Faltan campos requeridos",
        errorCode: "MISSING_DATA",
        errorDetails: { email, password }
      });
    }

    const responseUser = await registerNewUser({ email, password, handle, displayName });

    if (responseUser === "ALREADY_USER") {
      return handleHttp(res, {
        status: 409,
        message: "El usuario ya está registrado",
        errorCode: "ALREADY_USER"
      });
    }

    if (responseUser === "INTERNAL_ERROR") {
      return handleHttp(res, {
        status: 500,
        message: "Error interno al registrar el usuario",
        errorCode: "REGISTER_ERROR"
      });
    }

    return handleHttp(res, {
      status: 201,
      message: "Usuario registrado exitosamente",
      data: responseUser
    });

  } catch (error) {
    return handleHttp(res, {
      status: 500,
      message: "Error inesperado al registrar",
      errorCode: "UNEXPECTED_ERROR",
      errorDetails: error
    });
  }
};

/**
 * Inicia sesión de usuario con email y contraseña.
 * Si las credenciales son correctas, devuelve token y datos públicos del usuario.
 */
export const loginCtrl = async ({ body }, res) => {
  try {
    const { email, password } = body;

    if (!email || !password) {
      return handleHttp(res, {
        status: 422,
        message: "Email y contraseña son requeridos",
        errorCode: "VALIDATION_ERROR",
        errorDetails: { email, password }
      });
    }

    const responseUser = await loginUser({ email, password });

    return handleHttp(res, {
      status: 200,
      message: "Login exitoso",
      data: responseUser
    });

  } catch (error) {
    const isAuthError = error.message === "ERROR";

    return handleHttp(res, {
      status: isAuthError ? 401 : 500,
      message: isAuthError ? "Email o contraseña incorrectos" : "Error interno al iniciar sesión",
      errorCode: isAuthError ? "INVALID_CREDENTIALS" : "SERVER_ERROR",
      errorDetails: !isAuthError ? error : null
    });
  }
}

/**
 * Cierra la sesión de un usuario cambiando el estado de cuenta.
 * No invalida el token (eso requeriría lista negra o token rotation).
 */
export const logOutCtrl = async ({ body }, res) => {
  try {
    const { email } = body;

    if (!email) {
      return handleHttp(res, {
        status: 422,
        message: "Email requerido para cerrar sesión",
        errorCode: "MISSING_EMAIL"
      });
    }

    const responseUser = await logoutUser({ email });

    if (responseUser === "NOT_FOUND_USER") {
      return handleHttp(res, {
        status: 404,
        message: "Usuario no encontrado",
        errorCode: "NOT_FOUND_USER"
      });
    }

    return handleHttp(res, {
      status: 200,
      message: "Logout exitoso",
      data: { email: responseUser.email }
    });

  } catch (error) {
    return handleHttp(res, {
      status: 500,
      message: "Error interno al cerrar sesión",
      errorCode: "LOGOUT_ERROR",
      errorDetails: error
    });
  }
};