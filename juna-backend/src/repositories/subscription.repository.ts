import prisma from '@/config/database';
import { Subscription, SubscriptionType, SubscriptionCategory, SubscriptionDuration, Prisma } from '@prisma/client';

export class SubscriptionRepository {
  /**
   * Créer un abonnement avec ses repas
   */
  async create(data: {
    providerId: string;
    name: string;
    description: string;
    price: number;
    type: SubscriptionType;
    category: SubscriptionCategory;
    duration: SubscriptionDuration;
    isActive?: boolean;
    isPublic?: boolean;
    deliveryZones?: any;
    pickupLocations?: any;
    imageUrl: string;
    mealIds?: string[];
  }): Promise<Subscription> {
    const { mealIds, ...subscriptionData } = data;
    
    return prisma.subscription.create({
      data: {
        ...subscriptionData,
        mealsInSubscriptions: mealIds && mealIds.length > 0
          ? {
              create: mealIds.map((mealId) => ({
                mealId,
                quantity: 1,
              })),
            }
          : undefined,
      },
    });
  }

  /**
   * Trouver un abonnement par ID
   */
  async findById(id: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { id },
    });
  }

  /**
   * Trouver un abonnement par ID avec provider et repas
   */
  async findByIdWithDetails(id: string): Promise<(Subscription & {
    provider: { id: string; businessName: string };
    mealsInSubscriptions: Array<{
      id: string;
      quantity: number;
      meal: {
        id: string;
        name: string;
        description: string;
        price: number;
        imageUrl: string | null;
        mealType: string;
      };
    }>;
  }) | null> {
    return prisma.subscription.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
          },
        },
        mealsInSubscriptions: {
          include: {
            meal: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                imageUrl: true,
                mealType: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Trouver tous les abonnements d'un fournisseur
   */
  async findByProviderId(providerId: string): Promise<Subscription[]> {
    return prisma.subscription.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Trouver tous les abonnements actifs d'un fournisseur
   */
  async findActiveByProviderId(providerId: string): Promise<Subscription[]> {
    return prisma.subscription.findMany({
      where: { 
        providerId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mettre à jour un abonnement
   */
  async update(id: string, data: Prisma.SubscriptionUpdateInput): Promise<Subscription> {
    return prisma.subscription.update({
      where: { id },
      data,
    });
  }

  /**
   * Mettre à jour un abonnement avec ses repas
   */
  async updateWithMeals(id: string, data: {
    name?: string;
    description?: string;
    price?: number;
    type?: SubscriptionType;
    category?: SubscriptionCategory;
    duration?: SubscriptionDuration;
    isActive?: boolean;
    isPublic?: boolean;
    deliveryZones?: any;
    pickupLocations?: any;
    imageUrl?: string;
    mealIds?: string[];
  }): Promise<Subscription> {
    const { mealIds, ...subscriptionData } = data;
    
    return prisma.subscription.update({
      where: { id },
      data: {
        ...subscriptionData,
        ...(mealIds !== undefined && {
          mealsInSubscriptions: {
            deleteMany: {},
            create: mealIds.map((mealId) => ({
              mealId,
              quantity: 1,
            })),
          },
        }),
      },
    });
  }

  /**
   * Activer/Désactiver un abonnement
   */
  async toggleActive(id: string): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      select: { isActive: true },
    });
    
    return prisma.subscription.update({
      where: { id },
      data: { isActive: !subscription?.isActive },
    });
  }

  /**
   * Publier/Dé-publier un abonnement
   */
  async togglePublic(id: string): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      select: { isPublic: true },
    });
    
    return prisma.subscription.update({
      where: { id },
      data: { isPublic: !subscription?.isPublic },
    });
  }

  /**
   * Lister les abonnements publics avec filtres
   */
  async findPublic(filters?: {
    type?: SubscriptionType;
    category?: SubscriptionCategory;
    duration?: SubscriptionDuration;
    minPrice?: number;
    maxPrice?: number;
    providerId?: string;
    search?: string;
  }): Promise<Subscription[]> {
    const where: Prisma.SubscriptionWhereInput = {
      isPublic: true,
      isActive: true,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.duration) {
      where.duration = filters.duration;
    }

    if (filters?.providerId) {
      where.providerId = filters.providerId;
    }

    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.subscription.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            rating: true,
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { subscriberCount: 'desc' },
      ],
    });
  }

  /**
   * Lister tous les abonnements (admin)
   */
  async findAll(filters?: {
    providerId?: string;
    type?: SubscriptionType;
    category?: SubscriptionCategory;
    duration?: SubscriptionDuration;
    isActive?: boolean;
    isPublic?: boolean;
    search?: string;
  }): Promise<Subscription[]> {
    const where: Prisma.SubscriptionWhereInput = {};

    if (filters?.providerId) {
      where.providerId = filters.providerId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.duration) {
      where.duration = filters.duration;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.subscription.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Incrémenter le nombre d'abonnés
   */
  async incrementSubscriberCount(id: string): Promise<Subscription> {
    return prisma.subscription.update({
      where: { id },
      data: {
        subscriberCount: { increment: 1 },
      },
    });
  }

  /**
   * Décrémenter le nombre d'abonnés
   */
  async decrementSubscriberCount(id: string): Promise<Subscription> {
    return prisma.subscription.update({
      where: { id },
      data: {
        subscriberCount: { decrement: 1 },
      },
    });
  }

  /**
   * Mettre à jour la note
   */
  async updateRating(id: string, newRating: number): Promise<Subscription> {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      select: { rating: true, totalReviews: true },
    });
    
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const totalReviews = subscription.totalReviews + 1;
    const avgRating = ((subscription.rating * subscription.totalReviews) + newRating) / totalReviews;

    return prisma.subscription.update({
      where: { id },
      data: {
        rating: avgRating,
        totalReviews,
      },
    });
  }

  /**
   * Compter les abonnements d'un fournisseur
   */
  async countByProvider(providerId: string): Promise<number> {
    return prisma.subscription.count({
      where: { providerId },
    });
  }

  /**
   * Compter les abonnements actifs d'un fournisseur
   */
  async countActiveByProvider(providerId: string): Promise<number> {
    return prisma.subscription.count({
      where: { 
        providerId,
        isActive: true,
      },
    });
  }

  /**
   * Supprimer un abonnement
   */
  async delete(id: string): Promise<Subscription> {
    return prisma.subscription.delete({
      where: { id },
    });
  }

  // ======= Méthodes pour SubscriptionMeal =======

  /**
   * Ajouter des repas à un abonnement
   */
  async addMeals(subscriptionId: string, mealIds: string[]): Promise<void> {
    await prisma.subscriptionMeal.createMany({
      data: mealIds.map((mealId) => ({
        subscriptionId,
        mealId,
        quantity: 1,
      })),
    });
  }

  /**
   * Retirer un repas d'un abonnement
   */
  async removeMeal(subscriptionId: string, mealId: string): Promise<void> {
    await prisma.subscriptionMeal.deleteMany({
      where: {
        subscriptionId,
        mealId,
      },
    });
  }

  /**
   * Retirer tous les repas d'un abonnement
   */
  async removeAllMeals(subscriptionId: string): Promise<void> {
    await prisma.subscriptionMeal.deleteMany({
      where: { subscriptionId },
    });
  }

  /**
   * Mettre à jour la quantité d'un repas dans un abonnement
   */
  async updateMealQuantity(subscriptionId: string, mealId: string, quantity: number): Promise<void> {
    await prisma.subscriptionMeal.update({
      where: {
        subscriptionId_mealId: {
          subscriptionId,
          mealId,
        },
      },
      data: { quantity },
    });
  }

  /**
   * Obtenir les repas d'un abonnement
   */
  async getMeals(subscriptionId: string): Promise<Array<{
    id: string;
    quantity: number;
    meal: {
      id: string;
      name: string;
      description: string;
      price: number;
      imageUrl: string | null;
      mealType: string;
    };
  }>> {
    return prisma.subscriptionMeal.findMany({
      where: { subscriptionId },
      include: {
        meal: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            imageUrl: true,
            mealType: true,
          },
        },
      },
    });
  }
}

export default new SubscriptionRepository();
