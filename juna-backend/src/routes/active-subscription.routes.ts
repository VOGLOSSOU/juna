import { Router } from 'express';
import activeSubscriptionController from '@/controllers/active-subscription.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

/**
 * GET /api/v1/active-subscriptions/me
 * Obtenir mes abonnements actifs
 */
router.get(
  '/me',
  authenticate,
  activeSubscriptionController.getMyActiveSubscriptions.bind(activeSubscriptionController)
);

/**
 * GET /api/v1/active-subscriptions/check
 * Vérifier si j'ai un abonnement actif d'un certain type
 */
router.get(
  '/check',
  authenticate,
  activeSubscriptionController.checkActiveSubscription.bind(activeSubscriptionController)
);

/**
 * GET /api/v1/active-subscriptions/stats
 * Statistiques des abonnements actifs (admin)
 */
router.get(
  '/stats',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  activeSubscriptionController.getStats.bind(activeSubscriptionController)
);

/**
 * GET /api/v1/active-subscriptions/provider/me
 * Obtenir les abonnements actifs de mes clients (provider)
 */
router.get(
  '/provider/me',
  authenticate,
  authorize([UserRole.PROVIDER]),
  activeSubscriptionController.getProviderActiveSubscriptions.bind(activeSubscriptionController)
);

export default router;