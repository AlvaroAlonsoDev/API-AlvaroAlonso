import { Router } from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
    followUserCtrl,
    unfollowUserCtrl,
    getFollowStatusCtrl,
    getMyFollowingCtrl,
    getMyFollowersCtrl,
    getPublicFollowingCtrl,
    getPublicFollowersCtrl
} from "../controllers/followController.js";

const router = Router();

/**
 * @route   POST /:userId
 * @desc    Sigue a un usuario específico por su ID
 * @access  Privado
 */
router.post("/:userId", checkJwt, followUserCtrl);

/**
 * @route   DELETE /:userId
 * @desc    Deja de seguir a un usuario por su ID
 * @access  Privado
 */
router.delete("/:userId", checkJwt, unfollowUserCtrl);

/**
 * @route   GET /status/:userId
 * @desc    Devuelve si el usuario autenticado sigue o no al usuario indicado
 * @access  Privado
 */
router.get("/status/:userId", checkJwt, getFollowStatusCtrl);

/**
 * @route   GET /following/me
 * @desc    Devuelve la lista de usuarios que el usuario autenticado está siguiendo
 * @access  Privado
 */
router.get("/following/me", checkJwt, getMyFollowingCtrl);

/**
 * @route   GET /followers/me
 * @desc    Devuelve la lista de usuarios que siguen al usuario autenticado
 * @access  Privado
 */
router.get("/followers/me", checkJwt, getMyFollowersCtrl);

/**
 * @route   GET /following/:userId
 * @desc    Devuelve la lista pública de usuarios que sigue el usuario indicado
 * @access  Público
 */
router.get("/following/:userId", getPublicFollowingCtrl);

/**
 * @route   GET /followers/:userId
 * @desc    Devuelve la lista pública de seguidores del usuario indicado
 * @access  Público
 */
router.get("/followers/:userId", getPublicFollowersCtrl);

export default router;
