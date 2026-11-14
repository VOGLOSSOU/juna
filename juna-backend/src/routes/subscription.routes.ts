import { Router } from 'express';
import { personalizeResponse } from '@/middlewares/personalization.middleware';
import subscriptionController from '@/controllers/subscription.controller';
import { authenticate, optionalAuth } from '@/middlewares/auth.middleware';
import { validate, validateQuery, validateParams } from '@/middlewares/validation.middleware';
import { createSubscriptionSchema, updateSubscriptionSchema, subscriptionIdSchema, subscriptionFiltersSchema, pricePreviewSchema } from '@/validators/subscription.validator';

const router = Router();

// Route statique — doit être déclarée avant /:id pour ne pas être capturée par lui
router.get(
  '/price-preview',
  validateQuery(pricePreviewSchema),
  subscriptionController.pricePreview.bind(subscriptionController)
);

// Routes pour les abonnements (provider)
// Toutes ces routes nécessitent une authentification et un rôle PROVIDER
router.post(
  '/',
  authenticate,
  validate(createSubscriptionSchema),
  subscriptionController.create.bind(subscriptionController)
);

router.get(
  '/me',
  authenticate,
  subscriptionController.getMySubscriptions.bind(subscriptionController)
);

router.put(
  '/:id',
  authenticate,
  validateParams(subscriptionIdSchema),
  validate(updateSubscriptionSchema),
  subscriptionController.update.bind(subscriptionController)
);

router.put(
  '/:id/toggle',
  authenticate,
  validateParams(subscriptionIdSchema),
  subscriptionController.toggleActive.bind(subscriptionController)
);

router.put(
  '/:id/public',
  authenticate,
  validateParams(subscriptionIdSchema),
  subscriptionController.togglePublic.bind(subscriptionController)
);

router.delete(
  '/:id',
  authenticate,
  validateParams(subscriptionIdSchema),
  subscriptionController.delete.bind(subscriptionController)
);

// Routes publiques
router.get(
  '/',
  optionalAuth,
  personalizeResponse,
  validateQuery(subscriptionFiltersSchema),
  subscriptionController.getPublic.bind(subscriptionController)
);

router.get(
  '/:id',
  optionalAuth,
  personalizeResponse,
  validateParams(subscriptionIdSchema),
  subscriptionController.getById.bind(subscriptionController)
);

export default router;
