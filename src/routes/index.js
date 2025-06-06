import { Router } from 'express';
import authRouter from './auth.js';
import followRouter from './follow.js';
import ratingRouter from './rating.js';
import postRouter from './post.js';
import postLikeRouter from './postLike.js';
import logRouter from './log.js';

const router = Router();

router.use('/api/auth', authRouter);
router.use('/api/follow', followRouter);
router.use('/api/rating', ratingRouter);
router.use('/api/post', postRouter);
router.use('/api/like', postLikeRouter);
router.use('/api/log', logRouter);

export { router };