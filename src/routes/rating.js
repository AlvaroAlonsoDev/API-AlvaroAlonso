import { Router } from "express";
import { createRatingCtrl, deleteRatingByIdCtrl, getRatingsGivenByUserCtrl, getRatingsHistoryCtrl, getUserRatingsCtrl } from "../controllers/ratingController.js";
import { checkJwt } from "../middleware/checkJwt.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

/**
 * @route   GET /ratings/:userId
 * @desc    Obtiene el promedio de valoraciones por aspecto para un usuario
 * @access  Público
 */
router.get("/:userId", checkJwt, getUserRatingsCtrl);

/**
 * @route   POST /ratings
 * @desc    Crea una valoración de un usuario hacia otro
 * @access  Requiere autenticación
 */
// TODO: middleware para comprobar que el usuario ha verificado su email y telefono
router.post("", checkJwt, createRatingCtrl);

/**
 * @route   DELETE /ratings/id/:ratingId
 * @desc    Elimina una valoración específica por _id
 * @access  Solo admin o superior
 */
router.delete(
    "/:ratingId",
    checkJwt,
    requireRole("admin"),
    deleteRatingByIdCtrl
);

/**
 * @route   GET /ratings/:userId/history
 * @desc    Lista todas las valoraciones que ha recibido un usuario
 * @access  Público (o limitado por privacidad)
 */
router.get("/:userId/history", getRatingsHistoryCtrl);

/**
 * @route   GET /ratings/from/:userId
 * @desc    Lista todas las valoraciones emitidas por un usuario
 * @access  Requiere autenticación
 */
router.get("/from/:userId", checkJwt, getRatingsGivenByUserCtrl);

export default router;