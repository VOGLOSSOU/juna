import { createHash, timingSafeEqual } from 'crypto';
import { RequestHandler } from 'express';
import { ServiceUnavailableError, UnauthorizedError } from '@/utils/errors.util';

// Configure the same dedicated token in FeexPay (Bearer / Header value) and
// FEEXPAY_WEBHOOK_SECRET. This is not a user JWT or the merchant API key.
export const authenticateFeexPayWebhook: RequestHandler = (req, _res, next) => {
  const secret = process.env.FEEXPAY_WEBHOOK_SECRET;
  if (!secret || secret.trim() !== secret) {
    next(
      new ServiceUnavailableError(
        'Authentification webhook non configurée.',
        'FEEXPAY_WEBHOOK_MISCONFIGURED'
      )
    );
    return;
  }
  const match = /^Bearer ([^\s]+)$/i.exec(req.get('authorization') ?? '');
  if (!match) {
    next(new UnauthorizedError('Authentification webhook invalide.', 'INVALID_WEBHOOK_AUTH'));
    return;
  }
  // Fixed-size digests avoid comparing arbitrary secret lengths.
  const received = createHash('sha256').update(match[1]).digest();
  const expected = createHash('sha256').update(secret).digest();
  if (!timingSafeEqual(received, expected)) {
    next(new UnauthorizedError('Authentification webhook invalide.', 'INVALID_WEBHOOK_AUTH'));
    return;
  }
  next();
};
