import { Request, Response, NextFunction } from 'express';
import favoriteService from '@/services/favorite.service';
import { sendSuccess } from '@/utils/response.util';

export class FavoriteController {
  async add(req: Request, res: Response, next: NextFunction) {
    try {
      const { subscriptionId } = req.body as { subscriptionId: string };
      const data = await favoriteService.add(req.user!.id, subscriptionId);
      sendSuccess(res, 'Abonnement ajouté aux favoris', data);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await favoriteService.remove(req.user!.id, req.params.subscriptionId);
      sendSuccess(res, 'Abonnement retiré des favoris', data);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await favoriteService.list(
        req.user!.id,
        Number(req.query.page),
        Number(req.query.limit)
      );
      sendSuccess(res, 'Vos abonnements favoris', data);
    } catch (error) {
      next(error);
    }
  }
}

export default new FavoriteController();
