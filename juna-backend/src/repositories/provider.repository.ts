import prisma from '@/config/database';
import { Provider, ProviderStatus, Prisma } from '@prisma/client';

export class ProviderRepository {
  /**
   * Créer un fournisseur
   */
  async create(data: Prisma.ProviderCreateInput): Promise<Provider> {
    return prisma.provider.create({
      data,
    });
  }

  /**
   * Trouver un fournisseur par ID
   */
  async findById(id: string): Promise<Provider | null> {
    return prisma.provider.findUnique({
      where: { id },
      include: {
        city: { include: { country: true } },
        landmarks: {
          include: {
            landmark: { select: { id: true, name: true, cityId: true } },
          },
        },
      },
    });
  }

  /**
   * Trouver un fournisseur par userId
   */
  async findByUserId(userId: string): Promise<Provider | null> {
    return prisma.provider.findUnique({
      where: { userId },
      include: {
        city: { include: { country: true } },
        landmarks: {
          include: {
            landmark: { select: { id: true, name: true, cityId: true } },
          },
        },
      },
    });
  }

  /**
   * Trouver un fournisseur par ID avec user
   */
  async findByIdWithUser(id: string): Promise<(Provider & { user: { id: string; email: string; name: string } }) | null> {
    return prisma.provider.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        city: { include: { country: true } },
        landmarks: {
          include: {
            landmark: { select: { id: true, name: true, cityId: true } },
          },
        },
      },
    });
  }

  /**
   * Trouver un fournisseur par userId avec abonnements
   */
  async findByUserIdWithSubscriptions(userId: string): Promise<(Provider & { subscriptions: any[] }) | null> {
    return prisma.provider.findUnique({
      where: { userId },
      include: {
        subscriptions: true,
        city: { include: { country: true } },
        landmarks: {
          include: {
            landmark: { select: { id: true, name: true, cityId: true } },
          },
        },
      },
    });
  }

  /**
   * Mettre à jour un fournisseur
   */
  async update(id: string, data: Prisma.ProviderUpdateInput): Promise<Provider> {
    return prisma.provider.update({
      where: { id },
      data,
    });
  }

  /**
   * Mettre à jour le statut d'un fournisseur
   */
  async updateStatus(id: string, status: ProviderStatus): Promise<Provider> {
    return prisma.provider.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Lister les fournisseurs avec filtres
   */
  async findAll(filters?: {
    status?: ProviderStatus;
    search?: string;
  }): Promise<Provider[]> {
    const where: Prisma.ProviderWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { businessAddress: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.provider.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        city: { include: { country: true } },
        landmarks: {
          include: {
            landmark: { select: { id: true, name: true, cityId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Compter les fournisseurs par statut
   */
  async countByStatus(): Promise<Record<ProviderStatus, number>> {
    const result = await prisma.provider.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    
    const counts: Record<ProviderStatus, number> = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      SUSPENDED: 0,
    };
    
    result.forEach((item) => {
      counts[item.status] = Number(item._count.id);
    });
    
    return counts;
  }

  /**
   * Page publique d'un provider — toutes les infos visibles par un user
   */
  async findPublicProfile(id: string) {
    return prisma.provider.findUnique({
      where: { id, status: 'APPROVED' },
      select: {
        id: true,
        businessName: true,
        description: true,
        logo: true,
        businessAddress: true,
        status: true,
        acceptsDelivery: true,
        acceptsPickup: true,
        deliveryZones: true,
        rating: true,
        totalReviews: true,
        createdAt: true,
        city: {
          select: {
            id: true,
            name: true,
            country: { select: { id: true, code: true, translations: true } },
          },
        },
        landmarks: {
          select: {
            landmark: { select: { id: true, name: true } },
          },
        },
        subscriptions: {
          where: { isActive: true, isPublic: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            type: true,
            category: true,
            duration: true,
            imageUrl: true,
            rating: true,
            totalReviews: true,
            preparationHours: true,
            mealsInSubscriptions: {
              select: {
                meal: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    imageUrl: true,
                    mealType: true,
                    priceType: true,
                    price: true,
                    priceMin: true,
                    priceMax: true,
                    priceGuideline: true,
                    pricings: {
                      select: { id: true, label: true, price: true },
                      orderBy: { price: 'asc' },
                    },
                  },
                },
              },
            },
          },
          orderBy: { rating: 'desc' },
        },
        meals: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            mealType: true,
            priceType: true,
            price: true,
            priceMin: true,
            priceMax: true,
            priceGuideline: true,
            pricings: {
              select: { id: true, label: true, price: true },
              orderBy: { price: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Supprimer un fournisseur
   */
  async delete(id: string): Promise<Provider> {
    return prisma.provider.delete({
      where: { id },
    });
  }
}

export default new ProviderRepository();
