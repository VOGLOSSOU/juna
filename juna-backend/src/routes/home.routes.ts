import { Router } from 'express';
import homeController from '@/controllers/home.controller';

const router = Router();

router.get('/home', homeController.getFeed.bind(homeController));

export default router;
