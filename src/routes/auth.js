import { Router } from "express";
import {
    getProfileCtrl,
    getPublicProfileCtrl,
    loginCtrl,
    logOutCtrl,
    registerCtrl,
    updateProfileCtrl,
    uploadAvatarCtrl,
    verifyTokenCtrl,
    changePasswordCtrl,
    deleteUserCtrl,
    getCloseToMeCtrl
} from "../controllers/authController.js";
import { checkJwt } from "../middleware/checkJwt.js";
// import { uploadAvatar } from "../middleware/uploadImage.js";

const router = Router();

/**
 * @route   GET /user/:handle
 * @desc    Devuelve el perfil público de cualquier usuario por su handle
 * @access  Público
 */
router.get("/user/:handle", getPublicProfileCtrl);

/**
 * @route   POST /register
 * @desc    Registra un nuevo usuario con email, nombre y contraseña
 * @access  Público
 */
router.post("/register", registerCtrl);

/**
 * @route   POST /login
 * @desc    Inicia sesión con email y contraseña, devuelve token + datos
 * @access  Público
 */
router.post("/login", loginCtrl);

/**
 * @route   GET /verify
 * @desc    Verifica si el token JWT es válido y devuelve info básica del usuario
 * @access  Privado
 */
router.get("/verify", checkJwt, verifyTokenCtrl);

/**
 * @route   POST /logout
 * @desc    Cierra sesión del usuario actual (limpieza local, no invalida token)
 * @access  Privado
 */
router.post("/logout", checkJwt, logOutCtrl);

/**
 * @route   DELETE /delete
 * @desc    Elimina permanentemente la cuenta del usuario autenticado
 * @access  Privado
 */
router.delete("/delete", checkJwt, deleteUserCtrl);

/**
 * @route   PUT /profile
 * @desc    Actualiza campos del perfil: displayName, description, gender
 * @access  Privado
 */
router.put("/profile", checkJwt, updateProfileCtrl);

/**
 * @route   POST /avatar
 * @desc    Cambia el avatar del usuario. Procesa la imagen y la sube a S3
 * @access  Privado
 */
// router.post("/avatar", checkJwt, uploadAvatar, uploadAvatarCtrl);
router.post("/avatar", checkJwt, uploadAvatarCtrl);

/**
 * @route   PUT /change-password
 * @desc    Permite al usuario cambiar su contraseña actual por una nueva
 * @access  Privado
 */
router.put("/change-password", checkJwt, changePasswordCtrl);

/**
 * @route   GET /me
 * @desc    Devuelve el perfil completo del usuario autenticado
 * @access  Privado
 */
router.get("/me", checkJwt, getProfileCtrl);

/**
 * @route   GET /close-to-me
 * @desc    Devuelve usuarios cercanos al usuario autenticado
 * @access  Privado
 */
router.get("/close-to-me", checkJwt, getCloseToMeCtrl);

export default router;
