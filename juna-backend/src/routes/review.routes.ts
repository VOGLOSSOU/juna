import { Router } from 'express';
import reviewController from '@/controllers/review.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate, validateParams, validateQuery } from '@/middlewares/validation.middleware';
import { createReviewSchema, updateReviewSchema, reviewIdSchema, reviewFiltersSchema } from '@/validators/review.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// ============================================
// Routes USER (authentifié)
// ============================================

// Créer un avis
router.post(
  '/',
  authenticate,
  validate(createReviewSchema),
  reviewController.create.bind(reviewController)
);

// Mes avis
router.get(
  '/me',
  authenticate,
  reviewController.getMyReviews.bind(reviewController)
);

// Modifier mon avis
router.put(
  '/:id',
  authenticate,
  validateParams(reviewIdSchema),
  validate(updateReviewSchema),
  reviewController.update.bind(reviewController)
);

// Supprimer mon avis
router.delete(
  '/:id',
  authenticate,
  validateParams(reviewIdSchema),
  reviewController.delete.bind(reviewController)
);

// ============================================
// Routes PUBLIQUES
// ============================================

// Avis d'un abonnement (approuvés uniquement)
router.get(
  '/subscription/:subscriptionId',
  reviewController.getBySubscriptionId.bind(reviewController)
);

// Statistiques d'un abonnement
router.get(
  '/subscription/:subscriptionId/stats',
  reviewController.getSubscriptionStats.bind(reviewController)
);

// Avis par ID de commande
router.get(
  '/order/:orderId',
  reviewController.getByOrderId.bind(reviewController)
);

// ============================================
// Routes ADMIN
// ============================================

// Lister tous les avis (admin)
router.get(
  '/',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validateQuery(reviewFiltersSchema),
  reviewController.getAll.bind(reviewController)
);

// Nombre d'avis en attente (admin)
router.get(
  '/pending/count',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  reviewController.getPendingCount.bind(reviewController)
);

// Détails d'un avis (admin)
router.get(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validateParams(reviewIdSchema),
  reviewController.getById.bind(reviewController)
);

// Modérer un avis (admin)
router.put(
  '/:id/moderate',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validateParams(reviewIdSchema),
  reviewController.moderate.bind(reviewController)
);

export default router;
