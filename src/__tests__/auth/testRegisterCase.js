import { registerUser } from "../helpers/auth.helpers";

/**
 * Prueba el endpoint de registro.
 * Hace la petición con los datos recibidos y valida éxito, usuario existente, error de campos y error interno.
 * 
 * @param {Object} data - Objeto con email, password, handle, displayName (pueden faltar campos para probar error).
 * @returns {Promise<{result: boolean, message: string}>}
 */
export async function testRegisterCase(data) {
    const response = await registerUser(data);
    const body = response.body;

    // Caso éxito
    if (
        body.success === true &&
        body.message === "Usuario registrado exitosamente" &&
        body.data &&
        typeof body.data._id === "string" &&
        typeof body.data.email === "string"
    ) {
        return { result: true, message: "✅ Registro exitoso: respuesta y datos correctos." };
    }

    // Caso usuario ya existe
    if (
        body.success === false &&
        body.message === "El usuario ya está registrado" &&
        body.error &&
        (body.error.code === "ALREADY_USER" || body.errorCode === "ALREADY_USER")
    ) {
        return { result: true, message: "✅ Registro fallido por usuario ya existente: respuesta correcta." };
    }

    // Caso faltan campos requeridos
    if (
        body.success === false &&
        (body.message === "Faltan campos requeridos" || body.errorCode === "MISSING_DATA") &&
        (body.error?.code === "MISSING_DATA" || body.errorCode === "MISSING_DATA")
    ) {
        return { result: true, message: "✅ Registro fallido por campos faltantes: respuesta correcta." };
    }

    // Caso error interno
    if (
        body.success === false &&
        (body.message === "Error interno al registrar el usuario" || body.errorCode === "REGISTER_ERROR")
    ) {
        return { result: true, message: "✅ Registro fallido por error interno: respuesta correcta." };
    }

    // Otros errores (no esperado)
    return {
        result: false,
        message: `❌ Respuesta inesperada del registro: ${JSON.stringify(body)}`
    };
}
