import prisma from '@/config/database';
import { Review, ReviewStatus, Prisma } from '@prisma/client';

export class ReviewRepository {
  /**
   * Créer un avis
   */
  async create(data: Prisma.ReviewCreateInput): Promise<Review> {
    return prisma.review.create({
      data,
    });
  }

  /**
   * Trouver un avis par ID
   */
  async findById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { id },
    });
  }

  /**
   * Trouver un avis par ID avec relations
   */
  async findByIdWithRelations(id: string): Promise<
    | (Review & {
        user: { id: string; name: string };
        subscription: { id: string; name: string; provider: { id: string; businessName: string } };
        order: { id: string; orderNumber: string };
      })
    | null
  > {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        subscription: {
          select: {
            id: true,
            name: true,
            provider: {
              select: {
                id: true,
                businessName: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });
  }

  /**
   * Trouver un avis par ID de commande
   */
  async findByOrderId(orderId: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { orderId },
    });
  }

  /**
   * Trouver les avis d'un abonnement
   */
  async findBySubscriptionId(subscriptionId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: { 
        subscriptionId,
        status: ReviewStatus.APPROVED,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Trouver les avis d'un utilisateur
   */
  async findByUserId(userId: string): Promise<Review[]> {
    return prisma.review.findMany({
      where: { userId },
      include: {
        subscription: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lister les avis avec filtres
   */
  async findAll(filters?: {
    status?: ReviewStatus;
    subscriptionId?: string;
    userId?: string;
    rating?: number;
  }): Promise<Review[]> {
    const where: Prisma.ReviewWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.rating) {
      where.rating = filters.rating;
    }

    return prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        subscription: {
          select: {
            id: true,
            name: true,
            provider: {
              select: {
                id: true,
                businessName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mettre à jour un avis
   */
  async update(id: string, data: Prisma.ReviewUpdateInput): Promise<Review> {
    return prisma.review.update({
      where: { id },
      data,
    });
  }

  /**
   * Modérer un avis (approuver/rejeter)
   */
  async moderate(
    id: string,
    status: ReviewStatus,
    moderatedBy: string
  ): Promise<Review> {
    return prisma.review.update({
      where: { id },
      data: {
        status,
        moderatedAt: new Date(),
        moderatedBy,
      },
    });
  }

  /**
   * Supprimer un avis
   */
  async delete(id: string): Promise<Review> {
    return prisma.review.delete({
      where: { id },
    });
  }

  /**
   * Calculer les statistiques d'un abonnement
   */
  async getSubscriptionStats(subscriptionId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  }> {
    const reviews = await prisma.review.findMany({
      where: {
        subscriptionId,
        status: ReviewStatus.APPROVED,
      },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution: distribution as { 1: number; 2: number; 3: number; 4: number; 5: number },
    };
  }

  /**
   * Compter les avis par statut
   */
  async countByStatus(status: ReviewStatus): Promise<number> {
    return prisma.review.count({
      where: { status },
    });
  }
}

export default new ReviewRepository();
