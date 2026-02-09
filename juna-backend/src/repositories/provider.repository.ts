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
    });
  }

  /**
   * Trouver un fournisseur par userId
   */
  async findByUserId(userId: string): Promise<Provider | null> {
    return prisma.provider.findUnique({
      where: { userId },
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
   * Supprimer un fournisseur
   */
  async delete(id: string): Promise<Provider> {
    return prisma.provider.delete({
      where: { id },
    });
  }
}

export default new ProviderRepository();
