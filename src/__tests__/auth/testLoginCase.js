import { loginUser } from "../helpers/auth.helpers.js";

/**
 * Prueba el endpoint de login.
 * Recibe credenciales, realiza la petición y verifica el resultado según la respuesta del servidor.
 * Devuelve un objeto { result, message }.
 * 
 * @param {Object} credentials - Objeto con email y/o password.
 * @returns {Promise<{result: boolean, message: string}>}
 */
export async function testLoginCase(credentials) {
    const response = await loginUser(credentials);
    const body = response.body;

    // Caso éxito
    if (
        body.success === true &&
        body.message === "Login exitoso" &&
        body.data &&
        typeof body.data.token === "string" &&
        typeof body.data.user === "object" &&
        typeof body.data.user.email === "string"
    ) {
        return { result: true, message: "✅ Login exitoso: respuesta y datos correctos." };
    }

    // Caso error de credenciales
    if (
        body.success === false &&
        body.message === "Email o contraseña incorrectos" &&
        body.error &&
        body.error.code === "INVALID_CREDENTIALS"
    ) {
        return { result: true, message: "✅ Login fallido por credenciales incorrectas: respuesta correcta." };
    }

    // Caso error de campos requeridos
    if (
        body.success === false &&
        body.message === "Email y contraseña son requeridos" &&
        body.error &&
        body.error.code === "VALIDATION_ERROR"
    ) {
        return { result: true, message: "✅ Login fallido por campos faltantes: respuesta correcta." };
    }

    // Otros errores (no esperado)
    return {
        result: false,
        message: `❌ Respuesta inesperada del login: ${JSON.stringify(body)}`
    };
}
