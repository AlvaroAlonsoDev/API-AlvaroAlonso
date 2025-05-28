import { Router } from "express";
import { loginCtrl, logOutCtrl, registerCtrl, verifyTokenCtrl } from "../controllers/authController.js";
import { checkJwt } from "../middleware/checkJwt.js";
import { deleteUser } from "../services/authService.js";

const router = Router();
router.post("/register", registerCtrl);
router.post("/login", loginCtrl);
router.get("/verify", checkJwt, verifyTokenCtrl);
router.post("/logout", checkJwt, logOutCtrl);

// borrar usuario para el test tests
router.delete("/delete", checkJwt, deleteUser);

// router.get("/", getUsersCtrl);
// router.put("/", updateCtrl);
// router.put("/update/password", updatePasswordCtrl);

export { router };