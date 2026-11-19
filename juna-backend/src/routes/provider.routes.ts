import { Router } from 'express';
import { personalizeResponse } from '@/middlewares/personalization.middleware';
import providerController from '@/controllers/provider.controller';
import { validate, validateParams, validateQuery } from '@/middlewares/validation.middleware';
import { authenticate, optionalAuth } from '@/middlewares/auth.middleware';
import {
  registerProviderSchema,
  updateProviderSchema,
  setPayoutInfoSchema,
  listPayoutsQuerySchema,
} from '@/validators/provider.validator';
import { z } from 'zod';

const router = Router();

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
 * GET /api/v1/providers/:id
 * Page publique d'un prestataire — route publique, pas d'auth
 */
router.get(
  '/:id',
  optionalAuth,
  personalizeResponse,
  validateParams(z.object({ id: z.string().uuid('ID prestataire invalide') })),
  providerController.getPublicProfile.bind(providerController)
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

/**
 * PUT /api/v1/providers/me/payout
 * Définir le numéro Mobile Money de réception des versements
 */
router.put(
  '/me/payout',
  authenticate,
  validate(setPayoutInfoSchema),
  providerController.setPayoutInfo.bind(providerController)
);

/**
 * GET /api/v1/providers/me/payouts
 * Paiements clients reçus et suivi du versement automatique
 */
router.get(
  '/me/payouts',
  authenticate,
  validateQuery(listPayoutsQuerySchema),
  providerController.listPayouts.bind(providerController)
);

export default router;
