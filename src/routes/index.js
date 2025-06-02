import { Router } from 'express';
import authRouter from './auth.js';
import followRouter from './follow.js';
import ratingRouter from './rating.js';
import postRouter from './post.js';
import postLikeRouter from './postLike.js';

const router = Router();

router.use('/api/auth', authRouter);
router.use('/api/follow', followRouter);
router.use('/api/rating', ratingRouter);
router.use('/api/post', postRouter);
router.unsubscribe('/api/like', postLikeRouter);

export { router };