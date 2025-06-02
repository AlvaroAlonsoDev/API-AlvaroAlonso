import { verifyUser } from "../helpers/auth.helpers.js";

/**
 * Testea el endpoint de verificación de token.
 * @param {string|undefined} token - El token JWT a usar, o undefined/null si quieres simular fallo.
 * @returns {Promise<{result: boolean, message: string}>}
 */
export async function testVerifyCase(token) {
    const response = await verifyUser(token);
    const body = response.body;

    // Caso OK (token válido)
    if (
        response.statusCode === 200 &&
        body.success === true &&
        body.message === "Token verificado correctamente" &&
        typeof body.data === "object" &&
        typeof body.data.token === "string" &&
        typeof body.data.user === "object" &&
        typeof body.data.user._id === "string"
    ) {
        return { result: true, message: "✅ Verificación correcta con token válido." };
    }

    // Caso token no proporcionado
    if (
        response.statusCode === 401 &&
        body.success === false &&
        body.message === "No autorizado: token no proporcionado" &&
        (body.errorCode === "TOKEN_MISSING" || body.error?.code === "TOKEN_MISSING")
    ) {
        return { result: true, message: "✅ Verificación rechazada por token faltante: respuesta correcta." };
    }

    // Caso token inválido o expirado
    if (
        response.statusCode === 401 &&
        body.success === false &&
        (
            body.message === "Token inválido o expirado" ||
            body.errorCode === "INVALID_TOKEN" ||
            body.error?.code === "INVALID_TOKEN"
        )
    ) {
        return { result: true, message: "✅ Verificación rechazada por token inválido: respuesta correcta." };
    }

    // Caso usuario no encontrado
    if (
        response.statusCode === 401 &&
        body.success === false &&
        (
            body.message === "Usuario no encontrado" ||
            body.errorCode === "USER_NOT_FOUND" ||
            body.error?.code === "USER_NOT_FOUND"
        )
    ) {
        return { result: true, message: "✅ Verificación rechazada por usuario no encontrado: respuesta correcta." };
    }

    // Cualquier otro caso
    return { result: false, message: `❌ Respuesta inesperada: status=${response.statusCode}, body=${JSON.stringify(body)}` };
}
