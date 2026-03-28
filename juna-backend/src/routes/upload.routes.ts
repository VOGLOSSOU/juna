import { Router } from 'express';
import uploadController from '@/controllers/upload.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { uploadMiddleware } from '@/middlewares/upload.middleware';

const router = Router();

/**
 * POST /api/v1/upload/:folder
 * Uploader une image vers Cloudinary
 * folder : avatars | meals | subscriptions | providers | documents
 * Accès : utilisateur connecté
 */
router.post(
  '/:folder',
  authenticate,
  uploadMiddleware.single('image'),
  uploadController.upload.bind(uploadController)
);

export default router;
