import { Router } from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import { getLikesOfPostCtrl, likePostCtrl, unlikePostCtrl } from "../controllers/postLikeController.js";

const router = Router();

/**
 * @route   POST /posts/:postId/like
 * @desc    Dar like a un post
 * @access  Privado
 */
router.post("/:postId/like", checkJwt, likePostCtrl);

/**
 * @route   DELETE /posts/:postId/like
 * @desc    Quitar like a un post
 * @access  Privado
 */
router.delete("/:postId/like", checkJwt, unlikePostCtrl);

/**
 * @route   GET /posts/:postId/likes
 * @desc    Lista los usuarios que han dado like a un post (paginado)
 * @access  Público
 */
router.get("/:postId/likes", getLikesOfPostCtrl);

export default router;
