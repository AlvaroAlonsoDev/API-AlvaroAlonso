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
  getPublicProfileByHandle,
  getUserProfile,
  loginUser,
  logoutUser,
  registerNewUser,
  simulateAvatarUpload,
  updateUserProfile,
} from "../services/authService.js";
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

/**
 * Actualiza el perfil del usuario autenticado.
 */
export const updateProfileCtrl = async (req, res) => {
  try {
    const userId = req.user._id; // viene del middleware `checkJwt`
    const { displayName, description, gender } = req.body;

    const validGenders = ["male", "female", "custom", "N/A"];
    if (gender && !validGenders.includes(gender)) {
      return handleHttp(res, {
        status: 400,
        message: "Género no válido",
        errorCode: "INVALID_GENDER"
      });
    }

    const updatedUser = await updateUserProfile(userId, { displayName, description, gender });

    return handleHttp(res, {
      status: 200,
      message: "Perfil actualizado",
      data: updatedUser
    });

  } catch (error) {
    const isNotFound = error.message === "USER_NOT_FOUND";

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

    const user = await getUserProfile(userId);

    return handleHttp(res, {
      status: 200,
      message: "Perfil obtenido correctamente",
      data: user
    });

  } catch (error) {
    const isNotFound = error.message === "USER_NOT_FOUND";

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

    return handleHttp(res, {
      status: 200,
      message: "Avatar simulado actualizado",
      data: { avatar: avatarUrl }
    });

  } catch (error) {
    const isNotFound = error.message === "USER_NOT_FOUND";

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
      return handleHttp(res, {
        status: 422,
        message: "Contraseña actual y nueva son requeridas",
        errorCode: "VALIDATION_ERROR"
      });
    }

    await changeUserPassword(userId, currentPassword, newPassword);

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

    return handleHttp(res, {
      status,
      message,
      errorCode: code,
      errorDetails: status === 500 ? error : null
    });
  }
};