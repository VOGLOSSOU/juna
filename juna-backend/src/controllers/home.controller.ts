import { Request, Response, NextFunction } from 'express';
import favoriteService from '@/services/favorite.service';
import { z } from 'zod';
import homeService from '@/services/home.service';
import { sendSuccess } from '@/utils/response.util';
import { ValidationError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';

const homeQuerySchema = z.object({
  cityId: z.string().uuid('cityId doit être un UUID valide'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export class HomeController {
  async getFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = homeQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const messages = parsed.error.errors.map((e) => e.message);
        throw new ValidationError(messages, ERROR_CODES.INVALID_INPUT);
      }
      const { cityId, limit } = parsed.data;
      const data = await homeService.getHomeFeed(cityId, limit);
      const items = await favoriteService.annotate([...data.popular, ...data.recent], req.user?.id);
      sendSuccess(res, 'Feed de la page d\'accueil', {
        ...data, popular: items.slice(0, data.popular.length), recent: items.slice(data.popular.length),
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new HomeController();
