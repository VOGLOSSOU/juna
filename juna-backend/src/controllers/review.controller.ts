import { Request, Response, NextFunction } from 'express';
import reviewService from '@/services/review.service';
import { sendSuccess } from '@/utils/response.util';
import { SUCCESS_MESSAGES } from '@/constants/messages';
import { ReviewStatus } from '@prisma/client';

export class ReviewController {
  /**
   * Créer un avis
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = req.body;

      const review = await reviewService.create(userId, data);
      sendSuccess(res, SUCCESS_MESSAGES.REVIEW_CREATED, review, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un avis par ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const review = await reviewService.getByIdWithRelations(id);
      sendSuccess(res, SUCCESS_MESSAGES.REVIEW_FETCHED, review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un avis par ID de commande
   */
  async getByOrderId(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const review = await reviewService.getByOrderId(orderId);
      if (!review) {
        sendSuccess(res, SUCCESS_MESSAGES.REVIEW_FETCHED, null);
        return;
      }
      sendSuccess(res, SUCCESS_MESSAGES.REVIEW_FETCHED, review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les avis d'un abonnement (approuvés)
   */
  async getBySubscriptionId(req: Request, res: Response, next: NextFunction) {
    try {
      const { subscriptionId } = req.params;
      const reviews = await reviewService.getBySubscriptionId(subscriptionId);
      sendSuccess(res, SUCCESS_MESSAGES.REVIEWS_FETCHED, reviews);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir mes avis (utilisateur connecté)
   */
  async getMyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const reviews = await reviewService.getByUserId(userId);
      sendSuccess(res, SUCCESS_MESSAGES.REVIEWS_FETCHED, reviews);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les avis (admin)
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as ReviewStatus,
        subscriptionId: req.query.subscriptionId as string,
        userId: req.query.userId as string,
        rating: req.query.rating ? Number(req.query.rating) : undefined,
      };
      const reviews = await reviewService.getAll(filters);
      sendSuccess(res, SUCCESS_MESSAGES.REVIEWS_FETCHED, reviews);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les statistiques d'un abonnement
   */
  async getSubscriptionStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { subscriptionId } = req.params;
      const stats = await reviewService.getSubscriptionStats(subscriptionId);
      sendSuccess(res, SUCCESS_MESSAGES.STATS_FETCHED, stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour mon avis
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const data = req.body;

      const review = await reviewService.update(id, userId, data);
      sendSuccess(res, SUCCESS_MESSAGES.REVIEW_UPDATED, review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer mon avis
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      await reviewService.delete(id, userId);
      sendSuccess(res, SUCCESS_MESSAGES.REVIEW_DELETED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Modérer un avis (admin)
   */
  async moderate(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user.id;
      const { id } = req.params;
      const { status, reason } = req.body;

      const review = await reviewService.moderate(id, adminId, status, reason);
      sendSuccess(res, SUCCESS_MESSAGES.REVIEW_MODERATED, review);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Nombre d'avis en attente (admin)
   */
  async getPendingCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await reviewService.countPending();
      sendSuccess(res, SUCCESS_MESSAGES.COUNT_FETCHED, { pendingCount: count });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
