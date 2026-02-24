import reviewRepository from '@/repositories/review.repository';
import subscriptionRepository from '@/repositories/subscription.repository';
import orderRepository from '@/repositories/order.repository';
import providerRepository from '@/repositories/provider.repository';
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { Review, ReviewStatus } from '@prisma/client';

export class ReviewService {
  /**
   * Créer un avis sur un abonnement
   */
  async create(
    userId: string,
    data: {
      orderId: string;
      subscriptionId: string;
      rating: number;
      comment?: string;
    }
  ): Promise<Review> {
    // Vérifier que la commande existe et appartient à l'utilisateur
    const order = await orderRepository.findById(data.orderId);
    if (!order) {
      throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
    }

    if (order.userId !== userId) {
      throw new ForbiddenError(
        'Vous ne pouvez pas donner un avis sur cette commande',
        ERROR_CODES.FORBIDDEN
      );
    }

    // Vérifier que la commande est livrée/complétée
    if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') {
      throw new ValidationError(
        'Vous ne pouvez donner un avis que sur une commande livrée',
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Vérifier que l'abonnement existe
    const subscription = await subscriptionRepository.findById(data.subscriptionId);
    if (!subscription) {
      throw new NotFoundError('Abonnement introuvable', ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
    }

    // Vérifier que l'abonnement correspond à la commande
    if (order.subscriptionId !== data.subscriptionId) {
      throw new ValidationError(
        'L\'abonnement ne correspond pas à la commande',
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Vérifier qu'un avis n'existe pas déjà pour cette commande
    const existingReview = await reviewRepository.findByOrderId(data.orderId);
    if (existingReview) {
      throw new ConflictError(
        'Un avis existe déjà pour cette commande',
        ERROR_CODES.REVIEW_ALREADY_EXISTS
      );
    }

    // Créer l'avis (status PENDING par défaut pour modération)
    const review = await reviewRepository.create({
      user: { connect: { id: userId } },
      subscription: { connect: { id: data.subscriptionId } },
      order: { connect: { id: data.orderId } },
      rating: data.rating,
      comment: data.comment,
      status: ReviewStatus.PENDING,
    });

    return review;
  }

  /**
   * Obtenir un avis par ID
   */
  async getById(id: string): Promise<Review> {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundError('Avis introuvable', ERROR_CODES.REVIEW_NOT_FOUND);
    }
    return review;
  }

  /**
   * Obtenir un avis par ID avec relations
   */
  async getByIdWithRelations(id: string) {
    const review = await reviewRepository.findByIdWithRelations(id);
    if (!review) {
      throw new NotFoundError('Avis introuvable', ERROR_CODES.REVIEW_NOT_FOUND);
    }
    return review;
  }

  /**
   * Obtenir un avis par ID de commande
   */
  async getByOrderId(orderId: string): Promise<Review | null> {
    return reviewRepository.findByOrderId(orderId);
  }

  /**
   * Obtenir les avis d'un abonnement (approuvés)
   */
  async getBySubscriptionId(subscriptionId: string): Promise<Review[]> {
    return reviewRepository.findBySubscriptionId(subscriptionId);
  }

  /**
   * Obtenir les avis d'un utilisateur
   */
  async getByUserId(userId: string): Promise<Review[]> {
    return reviewRepository.findByUserId(userId);
  }

  /**
   * Lister les avis avec filtres (admin)
   */
  async getAll(filters?: {
    status?: ReviewStatus;
    subscriptionId?: string;
    userId?: string;
    rating?: number;
  }): Promise<Review[]> {
    return reviewRepository.findAll(filters);
  }

  /**
   * Mettre à jour son propre avis (avant modération)
   */
  async update(
    id: string,
    userId: string,
    data: { rating?: number; comment?: string }
  ): Promise<Review> {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundError('Avis introuvable', ERROR_CODES.REVIEW_NOT_FOUND);
    }

    // Vérifier que l'utilisateur est l'auteur de l'avis
    if (review.userId !== userId) {
      throw new ForbiddenError(
        'Vous ne pouvez pas modifier cet avis',
        ERROR_CODES.FORBIDDEN
      );
    }

    // Vérifier que l'avis n'a pas encore été modéré
    if (review.status !== ReviewStatus.PENDING) {
      throw new ValidationError(
        'Impossible de modifier un avis déjà modéré',
        ERROR_CODES.INVALID_INPUT
      );
    }

    return reviewRepository.update(id, {
      rating: data.rating,
      comment: data.comment,
    });
  }

  /**
   * Supprimer son propre avis (avant modération)
   */
  async delete(id: string, userId: string): Promise<void> {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundError('Avis introuvable', ERROR_CODES.REVIEW_NOT_FOUND);
    }

    // Vérifier que l'utilisateur est l'auteur de l'avis
    if (review.userId !== userId) {
      throw new ForbiddenError(
        'Vous ne pouvez pas supprimer cet avis',
        ERROR_CODES.FORBIDDEN
      );
    }

    // Vérifier que l'avis n'a pas encore été modéré
    if (review.status !== ReviewStatus.PENDING) {
      throw new ValidationError(
        'Impossible de supprimer un avis déjà modéré',
        ERROR_CODES.INVALID_INPUT
      );
    }

    await reviewRepository.delete(id);
  }

  /**
   * Modérer un avis (approuver/rejeter) - Admin
   */
  async moderate(
    id: string,
    adminId: string,
    status: ReviewStatus,
    reason?: string
  ): Promise<Review> {
    const review = await reviewRepository.findById(id);
    if (!review) {
      throw new NotFoundError('Avis introuvable', ERROR_CODES.REVIEW_NOT_FOUND);
    }

    // Approuver ou rejeter l'avis
    const moderatedReview = await reviewRepository.moderate(id, status, adminId);

    // Si approuvé, mettre à jour les statistiques de l'abonnement
    if (status === ReviewStatus.APPROVED) {
      await this.updateSubscriptionRating(review.subscriptionId);
    }

    return moderatedReview;
  }

  /**
   * Obtenir les statistiques d'un abonnement
   */
  async getSubscriptionStats(subscriptionId: string) {
    return reviewRepository.getSubscriptionStats(subscriptionId);
  }

  /**
   * Mettre à jour la note d'un abonnement
   */
  private async updateSubscriptionRating(subscriptionId: string): Promise<void> {
    const stats = await reviewRepository.getSubscriptionStats(subscriptionId);

    // Mettre à jour la note de l'abonnement
    await subscriptionRepository.update(subscriptionId, {
      rating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });

    // Mettre à jour la note du fournisseur
    const subscription = await subscriptionRepository.findById(subscriptionId);
    if (subscription) {
      const providerStats = await this.getProviderRatingStats(subscription.providerId);
      await providerRepository.update(subscription.providerId, {
        rating: providerStats.averageRating,
        totalReviews: providerStats.totalReviews,
      });
    }
  }

  /**
   * Obtenir les statistiques de notation d'un fournisseur
   */
  async getProviderRatingStats(providerId: string) {
    const subscriptions = await subscriptionRepository.findByProviderId(providerId);
    
    let totalRating = 0;
    let totalReviews = 0;

    for (const sub of subscriptions) {
      const stats = await reviewRepository.getSubscriptionStats(sub.id);
      totalRating += stats.averageRating * stats.totalReviews;
      totalReviews += stats.totalReviews;
    }

    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
    };
  }

  /**
   * Compter les avis en attente de modération
   */
  async countPending(): Promise<number> {
    return reviewRepository.countByStatus(ReviewStatus.PENDING);
  }
}

export default new ReviewService();
