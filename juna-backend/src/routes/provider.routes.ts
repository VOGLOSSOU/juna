import { Router } from 'express';
import providerController from '@/controllers/provider.controller';
import { validate, validateParams } from '@/middlewares/validation.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import {
  registerProviderSchema,
  updateProviderSchema,
} from '@/validators/provider.validator';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/v1/providers/:id
 * Page publique d'un prestataire — route publique, pas d'auth
 */
router.get(
  '/:id',
  validateParams(z.object({ id: z.string().uuid('ID prestataire invalide') })),
  providerController.getPublicProfile.bind(providerController)
);

/**
 * GET /api/v1/providers/me
 * Obtenir mon profil fournisseur
 */
router.get(
  '/me',
  authenticate,
  providerController.getMyProfile.bind(providerController)
);

/**
 * POST /api/v1/providers/register
 * S'enregistrer comme fournisseur
 */
router.post(
  '/register',
  authenticate,
  validate(registerProviderSchema),
  providerController.register.bind(providerController)
);

/**
 * PUT /api/v1/providers/me
 * Mettre a jour mon profil fournisseur
 */
router.put(
  '/me',
  authenticate,
  validate(updateProviderSchema),
  providerController.updateProfile.bind(providerController)
);

export default router;
