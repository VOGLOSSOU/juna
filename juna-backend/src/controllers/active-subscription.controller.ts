import { Request, Response, NextFunction } from 'express';
import activeSubscriptionService from '@/services/active-subscription.service';
import { sendSuccess } from '@/utils/response.util';
import { SUCCESS_MESSAGES } from '@/constants/messages';

export class ActiveSubscriptionController {
  /**
   * Obtenir mes abonnements actifs
   * GET /api/v1/active-subscriptions/me
   */
  async getMyActiveSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const subscriptions = await activeSubscriptionService.getUserActiveSubscriptions(userId);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTIONS_FETCHED, subscriptions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifier si j'ai un abonnement actif d'un certain type
   * GET /api/v1/active-subscriptions/check?category=AFRICAN&type=LUNCH
   */
  async checkActiveSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { category, type } = req.query;

      const hasActive = await activeSubscriptionService.hasActiveSubscription(
        userId,
        category as string,
        type as string
      );

      sendSuccess(res, 'Vérification abonnement actif', { hasActive });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Statistiques des abonnements actifs (admin)
   * GET /api/v1/active-subscriptions/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await activeSubscriptionService.getActiveSubscriptionsStats();
      sendSuccess(res, 'Statistiques récupérées', stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les abonnements actifs de mes clients (provider)
   * GET /api/v1/active-subscriptions/provider/me
   */
  async getProviderActiveSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const subscriptions = await activeSubscriptionService.getProviderActiveSubscriptions(providerId);
      sendSuccess(res, 'Abonnements actifs récupérés', subscriptions);
    } catch (error) {
      next(error);
    }
  }
}

export default new ActiveSubscriptionController();