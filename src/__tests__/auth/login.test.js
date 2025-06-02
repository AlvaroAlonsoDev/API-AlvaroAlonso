import { testUserStatic } from "../../config/constants.js";
import { assertTestResult } from "../utils/utils.js";
import { testLoginCase } from "./testLoginCase.js";

test("Login correcto", async () => {
    const res = await testLoginCase({ email: testUserStatic.email, password: testUserStatic.password });
    assertTestResult(res);
});

test("Login credenciales incorrectas", async () => {
    const res = await testLoginCase({ email: testUserStatic.email, password: "error123" });
    assertTestResult(res);
});

test("Login sin password", async () => {
    const res = await testLoginCase({ email: testUserStatic.email });
    assertTestResult(res);
});

test("Login sin email", async () => {
    const res = await testLoginCase({ password: "algo" });
    assertTestResult(res);
});

test("Login sin nada", async () => {
    const res = await testLoginCase({});
    assertTestResult(res);
});
