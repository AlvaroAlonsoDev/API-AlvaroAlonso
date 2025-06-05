// routes/post.js
import { Router } from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import { createPostCtrl, deletePostCtrl, getAllPostsCtrl, getFeedPostsCtrl, getPostByIdCtrl, getPostsByUserCtrl, getRepliesCtrl } from "../controllers/postController.js";

const router = Router();

/**
 * @route   POST /posts
 * @desc    Crea un nuevo post
 * @access  Privado (requiere login)
 */
router.post("/", checkJwt, createPostCtrl);

/**
 * @route   GET /posts/user/:userId
 * @desc    Lista todos los posts de un usuario
 * @access  Público
 */
router.get("/user/:userId", getPostsByUserCtrl);

/**
 * @route   GET /posts/:id
 * @desc    Obtener detalle de un post
 * @access  Público
 */
router.get("/:id", getPostByIdCtrl);

/**
 * @route   GET /posts/feed
 * @desc    Feed: Posts de la gente que sigue el usuario
 * @access  Privado
 */
router.get("/feed/me", checkJwt, getFeedPostsCtrl);

/**
 * @route   GET /posts/:postId/replies
 * @desc    Lista todas las respuestas a un post
 * @access  Público o privado (según tu lógica)
 */
router.get("/:postId/replies", getRepliesCtrl);

/**
 * @route   DELETE /posts/:id
 * @desc    Borra un post (soft delete)
 * @access  Privado (autor)
 */
router.delete("/:id", checkJwt, deletePostCtrl);

/**
 * @route   GET /posts/all
 * @desc    Devuelve todos los posts (públicos)
 * @access  Público (o Privado, según lo que decidas)
 */
// TODO: Que hacemos con este endpoint? ¿Lo dejamos para admins?
router.get("/admin/all", checkJwt, getAllPostsCtrl);

export default router;
