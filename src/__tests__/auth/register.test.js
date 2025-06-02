import { registerUser } from "../helpers/auth.helpers.js";
import { assertTestResult } from "../utils/utils.js";
import { testRegisterCase } from "./testRegisterCase.js";

// Caso 1: Registro correcto
test("Register correcto", async () => {
    const unique = Date.now();
    const res = await testRegisterCase(registerUser, {
        email: `testuser${unique}@gmail.com`,
        password: "TestPassword123!",
        handle: `user${unique}`,
        displayName: "User Test"
    });
    assertTestResult(res);
});

// Caso 2: Usuario ya existe
test("Register usuario existente", async () => {
    const unique = Date.now();
    // Primero lo registramos para que exista
    await registerUser({
        email: `testuser${unique}@gmail.com`,
        password: "TestPassword123!",
        handle: `user${unique}`,
        displayName: "User Test"
    });
    // Intentamos de nuevo con los mismos datos
    const res = await testRegisterCase(registerUser, {
        email: `testuser${unique}@gmail.com`,
        password: "TestPassword123!",
        handle: `user${unique}`,
        displayName: "User Test"
    });
    assertTestResult(res);
});

// Caso 3: Faltan campos
test("Register con campos faltantes", async () => {
    const res = await testRegisterCase(registerUser, {
        email: "faltan@campos.com",
        password: "TestPassword123!",
        // Faltan handle y displayName
    });
    assertTestResult(res);
});

// Caso 4: Registro sin ningún dato
test("Register vacío", async () => {
    const res = await testRegisterCase(registerUser, {});
    assertTestResult(res);
});
