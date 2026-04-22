import { Router } from 'express';
import paymentController from '@/controllers/payment.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate, validateParams } from '@/middlewares/validation.middleware';
import { initiateDepositSchema, paymentIdSchema } from '@/validators/payment.validator';

const router = Router();

// Initier un paiement (user authentifié)
router.post(
  '/initiate',
  authenticate,
  validate(initiateDepositSchema),
  paymentController.initiateDeposit.bind(paymentController)
);

// Webhooks PawaPay — pas d'auth JWT, appelés par PawaPay
router.post('/webhook/deposit', paymentController.depositCallback.bind(paymentController));
router.post('/webhook/payout', paymentController.payoutCallback.bind(paymentController));
router.post('/webhook/refund', paymentController.refundCallback.bind(paymentController));

// Vérifier le statut d'un paiement
router.get(
  '/:id/status',
  authenticate,
  validateParams(paymentIdSchema),
  paymentController.getStatus.bind(paymentController)
);

export default router;
