import { Router } from 'express';
import { personalizeResponse } from '@/middlewares/personalization.middleware';
import { optionalAuth } from '@/middlewares/auth.middleware';
import homeController from '@/controllers/home.controller';

const router = Router();

router.get('/home', optionalAuth, personalizeResponse, homeController.getFeed.bind(homeController));

export default router;
