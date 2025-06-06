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
  changeUserPassword,
  deleteUserService,
  getCloseToMeService,
  getPublicProfileByHandle,
  getUserProfile,
  getUserSessionData,
  loginUser,
  logoutUser,
  registerNewUser,
  simulateAvatarUpload,
  updateUserProfile,
} from "../services/authService.js";
import { getRatingsGivenByUser, getRatingsHistory, getUserRatingsStats } from "../services/ratingService.js";
import { getPostsByUserService } from "../services/postService.js";
import { getMyFollowers, getMyFollowing } from "../services/followUserService.js";
import { createLogService } from "../services/logService.js";
// import sharp from "sharp";
// import { uploadToS3 } from "../utils/s3.js";

/**
 * Devuelve los datos del usuario autenticado y el token renovado.
 * Requiere que `checkJwt` haya validado el token y generado uno nuevo.
 */
export const verifyTokenCtrl = async (req, res) => {
  try {
    const { user } = req;
    const token = res.locals.newToken;
    const sessionData = await getUserSessionData(user._id, token);

    return handleHttp(res, {
      status: 200,
      message: "Token verificado correctamente",
      data: sessionData,
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
      await createLogService({
        level: "warn",
        message: "Intento de registro con campos faltantes",
        meta: { email, password },
        user: req?.user?._id
      });
      return handleHttp(res, {
        status: 422,
        message: "Faltan campos requeridos",
        errorCode: "MISSING_DATA",
        errorDetails: { email, password }
      });
    }

    const responseUser = await registerNewUser({ email, password, handle, displayName });

    if (responseUser === "ALREADY_USER") {
      await createLogService({
        level: "info",
        message: "Intento de registro con email ya existente",
        meta: { email },
        user: req?.user?._id
      });
      return handleHttp(res, {
        status: 409,
        message: "El usuario ya está registrado",
        errorCode: "ALREADY_USER"
      });
    }

    if (responseUser === "INTERNAL_ERROR") {
      await createLogService({
        level: "error",
        message: "Error interno al registrar usuario",
        meta: { email },
        user: req?.user?._id
      });
      return handleHttp(res, {
        status: 500,
        message: "Error interno al registrar el usuario",
        errorCode: "REGISTER_ERROR"
      });
    }

    await createLogService({
      level: "info",
      message: "Usuario registrado exitosamente",
      meta: { email, handle, displayName, userId: responseUser._id },
      user: req?.user?._id
    });

    return handleHttp(res, {
      status: 201,
      message: "Usuario registrado exitosamente",
      data: responseUser
    });

  } catch (error) {
    await createLogService({
      level: "error",
      message: "Error inesperado al registrar usuario",
      meta: { error: error?.message, stack: error?.stack },
      user: req?.user?._id
    });
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
export const loginCtrl = async ({ body, user }, res) => {
  try {
    const { email, password } = body;

    if (!email || !password) {
      await createLogService({
        level: "warn",
        message: "Intento de login con campos faltantes",
        meta: { email, password },
        user: user?._id
      });
      return handleHttp(res, {
        status: 422,
        message: "Email y contraseña son requeridos",
        errorCode: "VALIDATION_ERROR",
        errorDetails: { email, password }
      });
    }

    const responseUser = await loginUser({ email, password });

    await createLogService({
      level: "info",
      message: "Login exitoso",
      meta: { email, userId: responseUser?._id },
      user: user?._id ?? responseUser?._id
    });

    return handleHttp(res, {
      status: 200,
      message: "Login exitoso",
      data: responseUser
    });

  } catch (error) {
    const isAuthError = error.message === "ERROR";

    await createLogService({
      level: isAuthError ? "warn" : "error",
      message: isAuthError
        ? "Login fallido: credenciales incorrectas"
        : "Error interno al iniciar sesión",
      meta: { email: body?.email, error: error?.message, stack: error?.stack },
      user: null // aún no tenemos user._id
    });

    return handleHttp(res, {
      status: isAuthError ? 401 : 500,
      message: isAuthError ? "Email o contraseña incorrectos" : "Error interno al iniciar sesión",
      errorCode: isAuthError ? "INVALID_CREDENTIALS" : "SERVER_ERROR",
      errorDetails: !isAuthError ? error : null
    });
  }
};

/**
 * Cierra la sesión de un usuario cambiando el estado de cuenta.
 * No invalida el token (eso requeriría lista negra o token rotation).
 */
export const logOutCtrl = async ({ body, user }, res) => {
  try {
    const { email } = body;

    if (!email) {
      await createLogService({
        level: "warn",
        message: "Intento de logout sin email",
        meta: {},
        user: user?._id
      });
      return handleHttp(res, {
        status: 422,
        message: "Email requerido para cerrar sesión",
        errorCode: "MISSING_EMAIL"
      });
    }

    const responseUser = await logoutUser({ email });

    if (responseUser === "NOT_FOUND_USER") {
      await createLogService({
        level: "warn",
        message: "Intento de logout de usuario no encontrado",
        meta: { email },
        user: user?._id
      });
      return handleHttp(res, {
        status: 404,
        message: "Usuario no encontrado",
        errorCode: "NOT_FOUND_USER"
      });
    }

    await createLogService({
      level: "info",
      message: "Logout exitoso",
      meta: { email, userId: responseUser?._id },
      user: user?._id ?? responseUser?._id
    });

    return handleHttp(res, {
      status: 200,
      message: "Logout exitoso",
      data: { email: responseUser.email }
    });

  } catch (error) {
    await createLogService({
      level: "error",
      message: "Error interno al cerrar sesión",
      meta: { error: error?.message, stack: error?.stack },
      user: user?._id
    });
    return handleHttp(res, {
      status: 500,
      message: "Error interno al cerrar sesión",
      errorCode: "LOGOUT_ERROR",
      errorDetails: error
    });
  }
};

/**
 * Actualiza el perfil del usuario autenticado.
 */
export const updateProfileCtrl = async (req, res) => {
  try {
    const userId = req.user._id;
    const { displayName, description, gender } = req.body;

    const validGenders = ["male", "female", "custom", "N/A"];
    if (gender && !validGenders.includes(gender)) {
      await createLogService({
        level: "warn",
        message: "Intento de actualizar perfil con género no válido",
        meta: { userId, gender },
        user: userId
      });
      return handleHttp(res, {
        status: 400,
        message: "Género no válido",
        errorCode: "INVALID_GENDER"
      });
    }

    const updatedUser = await updateUserProfile(userId, { displayName, description, gender });

    await createLogService({
      level: "info",
      message: "Perfil actualizado exitosamente",
      meta: { userId, displayName, description, gender },
      user: userId
    });

    return handleHttp(res, {
      status: 200,
      message: "Perfil actualizado",
      data: updatedUser
    });

  } catch (error) {
    const isNotFound = error.message === "USER_NOT_FOUND";

    await createLogService({
      level: isNotFound ? "warn" : "error",
      message: isNotFound
        ? "Intento de actualizar perfil de usuario no encontrado"
        : "Error al actualizar perfil",
      meta: { userId: req.user._id, error: error?.message, stack: error?.stack },
      user: req.user._id
    });

    return handleHttp(res, {
      status: isNotFound ? 404 : 500,
      message: isNotFound ? "Usuario no encontrado" : "Error al actualizar perfil",
      errorCode: isNotFound ? "NOT_FOUND" : "SERVER_ERROR",
      errorDetails: !isNotFound ? error : null
    });
  }
};

/**
 * Devuelve los datos del usuario autenticado.
 */
export const getProfileCtrl = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Perfil público
    const user = await getUserProfile(userId);

    // 2. Posts
    const posts = await getPostsByUserService({ userId, page: 1, limit: 20 });

    // 3. Valoraciones recibidas: historial y promedios
    const ratingsHistory = await getRatingsHistory(userId);
    const ratingsStats = await getUserRatingsStats(userId);

    // 4. Seguidores y seguidos
    const [followers, following] = await Promise.all([
      getMyFollowers(userId),
      getMyFollowing(userId)
    ]);

    // 5. Valoraciones emitidas
    const ratingsGiven = await getRatingsGivenByUser(userId);

    await createLogService({
      level: "info",
      message: "Perfil obtenido correctamente",
      meta: {
        userId,
        postsCount: posts?.length ?? 0,
        ratingsGivenCount: ratingsGiven?.length ?? 0,
        followersCount: followers,
        followingCount: following
      },
      user: userId
    });

    return handleHttp(res, {
      status: 200,
      message: "Perfil obtenido correctamente",
      data: {
        user,
        posts,
        ratingsHistory,
        ratingsStats,
        ratingsGiven,
        followersCount: followers,
        followingCount: following
      }
    });

  } catch (error) {
    const isNotFound = error.message === "USER_NOT_FOUND";

    await createLogService({
      level: isNotFound ? "warn" : "error",
      message: isNotFound
        ? "Intento de obtener perfil de usuario no encontrado"
        : "Error al obtener perfil de usuario",
      meta: { userId: req.user._id, error: error?.message, stack: error?.stack },
      user: req.user._id
    });

    return handleHttp(res, {
      status: isNotFound ? 404 : 500,
      message: isNotFound ? "Usuario no encontrado" : "Error al obtener perfil",
      errorCode: isNotFound ? "NOT_FOUND" : "SERVER_ERROR",
      errorDetails: !isNotFound ? error : null
    });
  }
};

/**
 * Devuelve el perfil público de un usuario por su handle.
 */
export const getPublicProfileCtrl = async (req, res) => {
  try {
    const { handle } = req.params;

    if (!handle) {
      return handleHttp(res, {
        status: 400,
        message: "El handle es requerido",
        errorCode: "VALIDATION_ERROR",
      });
    }

    const user = await getPublicProfileByHandle(handle.toLowerCase());

    return handleHttp(res, {
      status: 200,
      message: "Perfil público obtenido",
      data: user,
    });

  } catch (error) {
    const isNotFound = error.message === "USER_NOT_FOUND";

    return handleHttp(res, {
      status: isNotFound ? 404 : 500,
      message: isNotFound ? "Usuario no encontrado" : "Error al obtener perfil",
      errorCode: isNotFound ? "NOT_FOUND" : "SERVER_ERROR",
      errorDetails: !isNotFound ? error : null,
    });
  }
};

/**
 * Procesa y sube un avatar nuevo para el usuario.
 */
// export const uploadAvatarCtrl = async (req, res) => {
//   try {
//     const userId = req.user._id;

//     if (!req.file) {
//       return handleHttp(res, {
//         status: 400,
//         message: "No se recibió ninguna imagen",
//         errorCode: "NO_IMAGE"
//       });
//     }

//     // Procesar imagen con sharp (resize y conversión a webp)
//     const processedImage = await sharp(req.file.buffer)
//       .resize(256, 256)
//       .webp({ quality: 80 })
//       .toBuffer();

//     // Subir a S3
//     const imageUrl = await uploadToS3(processedImage, "image/webp");

//     // Guardar URL en el usuario
//     const user = await UserModel.findById(userId);
//     if (!user) throw new Error("USER_NOT_FOUND");

//     user.avatar = imageUrl;
//     await user.save();

//     return handleHttp(res, {
//       status: 200,
//       message: "Avatar actualizado",
//       data: { avatar: imageUrl }
//     });

//   } catch (error) {
//     return handleHttp(res, {
//       status: 500,
//       message: "Error al subir avatar",
//       errorCode: "SERVER_ERROR",
//       errorDetails: error
//     });
//   }
// };

/**
 * Controlador: simula la subida de un avatar para el usuario autenticado.
 */
export const uploadAvatarCtrl = async (req, res) => {
  try {
    const userId = req.user._id;

    const avatarUrl = await simulateAvatarUpload(userId);

    await createLogService({
      level: "info",
      message: "Avatar actualizado correctamente",
      meta: { userId, avatarUrl },
      user: userId
    });

    return handleHttp(res, {
      status: 200,
      message: "Avatar simulado actualizado",
      data: { avatar: avatarUrl }
    });

  } catch (error) {
    const isNotFound = error.message === "USER_NOT_FOUND";

    await createLogService({
      level: isNotFound ? "warn" : "error",
      message: isNotFound
        ? "Intento de actualizar avatar de usuario no encontrado"
        : "Error al procesar avatar",
      meta: { userId: req.user?._id, error: error?.message, stack: error?.stack },
      user: req.user?._id
    });

    return handleHttp(res, {
      status: isNotFound ? 404 : 500,
      message: isNotFound ? "Usuario no encontrado" : "Error al procesar avatar",
      errorCode: isNotFound ? "NOT_FOUND" : "SERVER_ERROR",
      errorDetails: !isNotFound ? error : null
    });
  }
};

/**
 * Cambia la contraseña del usuario autenticado.
 */
export const changePasswordCtrl = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      await createLogService({
        level: "warn",
        message: "Intento de cambio de contraseña con datos incompletos",
        meta: { userId },
        user: userId
      });
      return handleHttp(res, {
        status: 422,
        message: "Contraseña actual y nueva son requeridas",
        errorCode: "VALIDATION_ERROR"
      });
    }

    await changeUserPassword(userId, currentPassword, newPassword);

    await createLogService({
      level: "info",
      message: "Contraseña cambiada correctamente",
      meta: { userId },
      user: userId
    });

    return handleHttp(res, {
      status: 200,
      message: "Contraseña cambiada correctamente"
    });

  } catch (error) {
    const messages = {
      USER_NOT_FOUND: [404, "Usuario no encontrado", "NOT_FOUND"],
      INVALID_CURRENT_PASSWORD: [401, "Contraseña actual incorrecta", "INVALID_PASSWORD"],
      WEAK_PASSWORD: [400, "La nueva contraseña es demasiado débil", "WEAK_PASSWORD"]
    };

    const [status, message, code] = messages[error.message] || [500, "Error al cambiar contraseña", "SERVER_ERROR"];

    await createLogService({
      level: status === 500 ? "error" : "warn",
      message:
        error.message === "USER_NOT_FOUND"
          ? "Intento de cambio de contraseña de usuario no encontrado"
          : error.message === "INVALID_CURRENT_PASSWORD"
            ? "Intento de cambio de contraseña con contraseña actual incorrecta"
            : error.message === "WEAK_PASSWORD"
              ? "Intento de cambio de contraseña con contraseña débil"
              : "Error inesperado al cambiar contraseña",
      meta: { userId, error: error?.message, stack: error?.stack },
      user: userId
    });

    return handleHttp(res, {
      status,
      message,
      errorCode: code,
      errorDetails: status === 500 ? error : null
    });
  }
};

/**
 * Controlador para eliminar al usuario autenticado (solo en entorno de test).
 */
export const deleteUserCtrl = async (req, res) => {
  try {
    const { user } = req;

    if (!user) {
      await createLogService({
        level: "warn",
        message: "Intento de eliminación de usuario no encontrado",
        meta: {},
        user: null
      });
      return handleHttp(res, {
        status: 404,
        message: "Usuario no encontrado",
        errorCode: "USER_NOT_FOUND"
      });
    }

    const data = await deleteUserService(user);

    await createLogService({
      level: "info",
      message: "Usuario eliminado correctamente",
      meta: { userId: user._id },
      user: user._id
    });

    return handleHttp(res, {
      status: 200,
      message: "Usuario eliminado correctamente",
      data
    });

  } catch (error) {
    await createLogService({
      level: "error",
      message: "Error al eliminar el usuario",
      meta: { userId: req?.user?._id, error: error?.message, stack: error?.stack },
      user: req?.user?._id
    });
    return handleHttp(res, {
      status: 500,
      message: "Error al eliminar el usuario",
      errorCode: "DELETE_USER_ERROR",
      errorDetails: error
    });
  }
};

/**
 * Controlador para obtener usuarios cercanos al usuario autenticado.
 * Esta funcionalidad aún no está implementada.
 */
export const getCloseToMeCtrl = async (req, res) => {
  try {
    const userId = req.user._id;
    // Simular el servicio de usuarios cercanos
    // En un futuro, este servicio debería buscar usuarios cercanos basándose en la ubicación del usuario autenticado.
    const users = await getCloseToMeService(userId);

    await createLogService({
      level: "info",
      message: "Usuarios cercanos consultados",
      meta: { userId, resultCount: users?.length ?? 0 },
      user: userId
    });

    return handleHttp(res, {
      status: 200,
      message: "Simulación de usuarios cercanos",
      data: users
    });
  } catch (error) {
    await createLogService({
      level: "error",
      message: "Error al obtener usuarios cercanos",
      meta: { userId: req?.user?._id, error: error?.message, stack: error?.stack },
      user: req?.user?._id
    });
    return handleHttp(res, {
      status: 500,
      message: "Error al obtener usuarios cercanos",
      errorCode: "SERVER_ERROR",
      errorDetails: error
    });
  }
};