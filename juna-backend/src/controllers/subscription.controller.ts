import { Request, Response, NextFunction } from 'express';
import subscriptionService from '@/services/subscription.service';
import { sendSuccess } from '@/utils/response.util';
import { SUCCESS_MESSAGES } from '@/constants/messages';

export class SubscriptionController {
  /**
   * Créer un abonnement
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const data = req.body;

      const subscription = await subscriptionService.create(providerId, data);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_CREATED, subscription, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un abonnement par ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const subscription = await subscriptionService.getByIdWithDetails(id);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_FETCHED, subscription);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir mes abonnements (fournisseur)
   */
  async getMySubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const subscriptions = await subscriptionService.getByProviderId(providerId);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTIONS_FETCHED, subscriptions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les abonnements publics
   */
  async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        type: req.query.type as any,
        category: req.query.category as any,
        duration: req.query.duration as any,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        providerId: req.query.providerId as string,
        search: req.query.search as string,
        isActive: true,
        isPublic: true,
      };
      const subscriptions = await subscriptionService.getPublic(filters);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTIONS_FETCHED, subscriptions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister tous les abonnements (admin)
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        type: req.query.type as any,
        category: req.query.category as any,
        duration: req.query.duration as any,
        providerId: req.query.providerId as string,
        search: req.query.search as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        isPublic: req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined,
      };
      const subscriptions = await subscriptionService.getAll(filters);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTIONS_FETCHED, subscriptions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour un abonnement
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;
      const data = req.body;

      const subscription = await subscriptionService.update(id, providerId, data);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_UPDATED, subscription);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activer/Désactiver un abonnement
   */
  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;

      const subscription = await subscriptionService.toggleActive(id, providerId);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_TOGGLED, subscription);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publier/Dé-publier un abonnement
   */
  async togglePublic(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;

      const subscription = await subscriptionService.togglePublic(id, providerId);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_TOGGLED, subscription);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un abonnement
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;

      await subscriptionService.delete(id, providerId);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_DELETED);
    } catch (error) {
      next(error);
    }
  }
}

export default new SubscriptionController();
