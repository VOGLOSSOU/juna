import prisma from '@/config/database';

export class ActiveSubscriptionRepository {
  /**
   * Créer un abonnement actif
   */
  async create(data: {
    userId: string;
    orderId: string;
    subscriptionId: string;
    startedAt: Date;
    endsAt: Date;
    duration: any;
  }) {
    return prisma.activeSubscription.create({ data });
  }

  /**
   * Trouver par user ID
   */
  async findByUserId(userId: string) {
    return prisma.activeSubscription.findMany({
      where: { userId },
      include: {
        subscription: {
          include: {
            provider: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Trouver un abonnement actif spécifique
   */
  async findById(id: string) {
    return prisma.activeSubscription.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            provider: true
          }
        }
      }
    });
  }

  /**
   * Supprimer les abonnements expirés
   */
  async deleteExpired() {
    return prisma.activeSubscription.deleteMany({
      where: {
        endsAt: {
          lt: new Date()
        }
      }
    });
  }

  /**
   * Vérifier si un user a un abonnement actif d'un certain type
   */
  async hasActiveSubscription(userId: string, category?: string, type?: string) {
    const where: any = {
      userId,
      endsAt: { gt: new Date() }
    };

    if (category) {
      where.subscription = { category };
    }

    if (type) {
      if (!where.subscription) where.subscription = {};
      where.subscription.type = type;
    }

    const count = await prisma.activeSubscription.count({ where });
    return count > 0;
  }

  /**
   * Compter les abonnements actifs
   */
  async countActive() {
    return prisma.activeSubscription.count({
      where: {
        endsAt: { gt: new Date() }
      }
    });
  }

  /**
   * Trouver les abonnements actifs d'un provider
   */
  async findByProviderId(providerId: string) {
    return prisma.activeSubscription.findMany({
      where: {
        subscription: {
          providerId: providerId
        },
        endsAt: { gt: new Date() }
      },
      include: {
        subscription: {
          include: {
            provider: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            scheduledFor: true,
            deliveryMethod: true,
            deliveryAddress: true,
            deliveryCity: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export default new ActiveSubscriptionRepository();