import { Router } from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import { createLogCtrl, getLogsCtrl } from "../controllers/logController.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

/**
 * @route   POST /logs
 * @desc    Crea un nuevo log (opcional: proteger solo para admins)
 * @access  Privado
 */
router.post("/", checkJwt, requireRole("admin"), createLogCtrl);

/**
 * @route   GET /logs
 * @desc    Obtiene logs (filtrable por nivel, usuario, fecha)
 * @access  Privado (o admin solo)
 */
router.get("/", checkJwt, requireRole("admin"), getLogsCtrl);

export default router;
