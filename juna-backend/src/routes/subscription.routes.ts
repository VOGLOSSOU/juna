import { Router } from 'express';
import subscriptionController from '@/controllers/subscription.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate, validateQuery, validateParams } from '@/middlewares/validation.middleware';
import { createSubscriptionSchema, updateSubscriptionSchema, subscriptionIdSchema, subscriptionFiltersSchema } from '@/validators/subscription.validator';

const router = Router();

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
  validate(subscriptionIdSchema),
  validate(updateSubscriptionSchema),
  subscriptionController.update.bind(subscriptionController)
);

router.put(
  '/:id/toggle',
  authenticate,
  validate(subscriptionIdSchema),
  subscriptionController.toggleActive.bind(subscriptionController)
);

router.put(
  '/:id/public',
  authenticate,
  validate(subscriptionIdSchema),
  subscriptionController.togglePublic.bind(subscriptionController)
);

router.delete(
  '/:id',
  authenticate,
  validate(subscriptionIdSchema),
  subscriptionController.delete.bind(subscriptionController)
);

// Routes publiques
router.get(
  '/',
  validateQuery(subscriptionFiltersSchema),
  subscriptionController.getPublic.bind(subscriptionController)
);

router.get(
  '/:id',
  validate(subscriptionIdSchema),
  subscriptionController.getById.bind(subscriptionController)
);

export default router;
