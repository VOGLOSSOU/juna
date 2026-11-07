import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import paymentController from '@/controllers/payment.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { authenticateFeexPayWebhook } from '@/middlewares/feexpay-webhook.middleware';
import { validate, validateBody, validateParams } from '@/middlewares/validation.middleware';
import {
  initiateDepositSchema,
  paymentIdSchema,
  feexPayWebhookSchema,
} from '@/validators/payment.validator';

const router = Router();
// Express 4 does not await middleware promises.
const handled =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    void handler(req, res, next).catch(next);
  };

// FeexPay has no user JWT. The service authenticates the transaction through
// FeexPay's server API; no status from the incoming body is trusted.
router.post(
  '/webhook/feexpay',
  authenticateFeexPayWebhook,
  handled(validateBody(feexPayWebhookSchema)),
  handled(paymentController.webhook.bind(paymentController))
);

// Initier un paiement (user authentifié)
router.post(
  '/initiate',
  handled(authenticate),
  handled(validate(initiateDepositSchema)),
  handled(paymentController.initiateDeposit.bind(paymentController))
);

// Vérifier le statut d'un paiement
router.get(
  '/:id/status',
  handled(authenticate),
  handled(validateParams(paymentIdSchema)),
  handled(paymentController.getStatus.bind(paymentController))
);

export default router;
