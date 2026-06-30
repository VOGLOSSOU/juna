import { Router } from 'express';
import subscriptionProposalController from '@/controllers/subscription-proposal.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate, validateParams, validateQuery } from '@/middlewares/validation.middleware';
import {
  createSubscriptionProposalSchema,
  approveSubscriptionProposalSchema,
  rejectSubscriptionProposalSchema,
  subscriptionProposalFiltersSchema,
  subscriptionProposalIdSchema,
} from '@/validators/subscription-proposal.validator';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * POST /api/v1/subscription-proposals
 * Créer une proposition d'abonnement (consumer)
 */
router.post(
  '/',
  validate(createSubscriptionProposalSchema),
  subscriptionProposalController.create.bind(subscriptionProposalController)
);

/**
 * GET /api/v1/subscription-proposals/me
 * Mes propositions envoyées (consumer)
 */
router.get(
  '/me',
  validateQuery(subscriptionProposalFiltersSchema),
  subscriptionProposalController.getMine.bind(subscriptionProposalController)
);

/**
 * GET /api/v1/subscription-proposals/received
 * Propositions reçues (provider)
 */
router.get(
  '/received',
  validateQuery(subscriptionProposalFiltersSchema),
  subscriptionProposalController.getReceived.bind(subscriptionProposalController)
);

/**
 * POST /api/v1/subscription-proposals/:id/approve
 * Approuver une proposition (provider)
 */
router.post(
  '/:id/approve',
  validateParams(subscriptionProposalIdSchema),
  validate(approveSubscriptionProposalSchema),
  subscriptionProposalController.approve.bind(subscriptionProposalController)
);

/**
 * POST /api/v1/subscription-proposals/:id/reject
 * Rejeter une proposition (provider)
 */
router.post(
  '/:id/reject',
  validateParams(subscriptionProposalIdSchema),
  validate(rejectSubscriptionProposalSchema),
  subscriptionProposalController.reject.bind(subscriptionProposalController)
);

/**
 * GET /api/v1/subscription-proposals/:id
 * Détail d'une proposition (auteur ou provider ciblé)
 */
router.get(
  '/:id',
  validateParams(subscriptionProposalIdSchema),
  subscriptionProposalController.getById.bind(subscriptionProposalController)
);

export default router;
