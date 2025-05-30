import { Router } from 'express';
import authRouter from './auth.js';
import followRouter from './follow.js';
import ratingRouter from './rating.js';

const router = Router();

router.use('/api/auth', authRouter);
router.use('/api/follow', followRouter);
router.use('/api/rating', ratingRouter)

export { router };