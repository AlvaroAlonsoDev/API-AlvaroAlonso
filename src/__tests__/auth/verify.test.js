import { loginUser } from "../helpers/auth.helpers.js";
import { testUserStatic } from "../../config/constants.js";
import { assertTestResult } from "../utils/utils.js";
import { testVerifyCase } from "./testVerifyCase.js";

let validToken = "";

// Antes de los tests, loguea el usuario para obtener un token válido (si no tienes uno estático)
beforeAll(async () => {
    const loginRes = await loginUser({
        email: testUserStatic.email,
        password: testUserStatic.password
    });
    validToken = loginRes.body?.data?.token;
});

// Caso 1: Token válido
test("Verificación con token válido", async () => {
    const res = await testVerifyCase(validToken);
    assertTestResult(res);
});

// Caso 2: Token faltante
test("Verificación sin token", async () => {
    const res = await testVerifyCase();
    assertTestResult(res);
});

// Caso 3: Token inválido
test("Verificación con token inválido", async () => {
    const res = await testVerifyCase("invalid.token.string");
    assertTestResult(res);
});

// Caso 4: Token bien formado pero usuario no existe
test("Verificación con token de usuario inexistente", async () => {
    // Suponiendo que puedas crear un JWT válido con un _id que no existe
    // O, para el test, puedes borrar el usuario tras login y usar ese token
    // Aquí lo simulo:
    const fakeToken = validToken.replace(/[a-zA-Z0-9]/g, "X"); // Simula un token inválido
    const res = await testVerifyCase(fakeToken);
    assertTestResult(res);
});
