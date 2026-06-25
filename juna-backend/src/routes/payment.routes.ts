import { Router } from 'express';
import paymentController from '@/controllers/payment.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate, validateParams } from '@/middlewares/validation.middleware';
import { initiateDepositSchema, paymentIdSchema } from '@/validators/payment.validator';
import { verifyPawaPaySignature } from '@/middlewares/pawapay-webhook.middleware';

const router = Router();

// Initier un paiement (user authentifié)
router.post(
  '/initiate',
  authenticate,
  validate(initiateDepositSchema),
  paymentController.initiateDeposit.bind(paymentController)
);

// Webhooks PawaPay — pas d'auth JWT, vérification de signature PawaPay
router.post('/webhook/deposit', verifyPawaPaySignature, paymentController.depositCallback.bind(paymentController));
router.post('/webhook/payout', verifyPawaPaySignature, paymentController.payoutCallback.bind(paymentController));
router.post('/webhook/refund', verifyPawaPaySignature, paymentController.refundCallback.bind(paymentController));

// Vérifier le statut d'un paiement
router.get(
  '/:id/status',
  authenticate,
  validateParams(paymentIdSchema),
  paymentController.getStatus.bind(paymentController)
);

export default router;
