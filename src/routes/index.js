import { Router } from 'express';
import { router as authRouter } from './auth.js';
import { router as followRouter } from './follow.js';

const router = Router();

router.use('/api/auth', authRouter);
router.use('/api/follow', followRouter);

export { router };