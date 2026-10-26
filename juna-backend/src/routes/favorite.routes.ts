import { Router, RequestHandler, Request, Response, NextFunction } from 'express';
import { personalizeResponse } from '@/middlewares/personalization.middleware';
import favoriteController from '@/controllers/favorite.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validateBody, validateParams, validateQuery } from '@/middlewares/validation.middleware';
import {
  addFavoriteSchema,
  favoriteParamsSchema,
  favoriteQuerySchema,
} from '@/validators/favorite.validator';

// Express 4 ne propage pas automatiquement les rejets de fonctions async.
const handle =
  (handler: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler =>
  (req, res, next) => {
    void Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
  };

const router = Router();
router.use(handle(authenticate), personalizeResponse);
router.post(
  '/',
  handle(validateBody(addFavoriteSchema)),
  handle(favoriteController.add.bind(favoriteController))
);
router.delete(
  '/:subscriptionId',
  handle(validateParams(favoriteParamsSchema)),
  handle(favoriteController.remove.bind(favoriteController))
);
router.get(
  '/',
  handle(validateQuery(favoriteQuerySchema)),
  handle(favoriteController.list.bind(favoriteController))
);
export default router;
