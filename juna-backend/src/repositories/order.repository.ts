import prisma from '@/config/database';
import { Order, OrderStatus, Prisma } from '@prisma/client';

export class OrderRepository {
  /**
   * Créer une commande
   */
  async create(data: Prisma.OrderCreateInput): Promise<Order> {
    return prisma.order.create({
      data,
    });
  }

  /**
   * Trouver une commande par ID
   */
  async findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
    });
  }

  /**
   * Trouver une commande par ID avec relations
   */
  async findByIdWithRelations(id: string): Promise<
    | (Order & {
        user: { id: string; name: string; email: string };
        subscription: { id: string; name: string; provider: { id: string; businessName: string } };
        payment: { id: string; status: string; amount: number } | null;
      })
    | null
  > {
    return prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
    });
  }

  /**
   * Trouver une commande par numéro de commande
   */
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { orderNumber },
    });
  }

  /**
   * Trouver les commandes d'un utilisateur
   */
  async findByUserId(userId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { userId },
      include: {
        subscription: {
          select: {
            id: true,
            name: true,
            provider: {
              select: {
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
   * Trouver les commandes d'un abonnement
   */
  async findBySubscriptionId(subscriptionId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: { subscriptionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lister les commandes avec filtres
   */
  async findAll(filters?: {
    userId?: string;
    subscriptionId?: string;
    status?: OrderStatus;
  }): Promise<Order[]> {
    const where: Prisma.OrderWhereInput = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
   * Mettre à jour une commande
   */
  async update(id: string, data: Prisma.OrderUpdateInput): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data,
    });
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: { 
        status,
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
  }

  /**
   * Supprimer une commande
   */
  async delete(id: string): Promise<Order> {
    return prisma.order.delete({
      where: { id },
    });
  }

  /**
   * Compter les commandes d'un utilisateur
   */
  async countByUser(userId: string): Promise<number> {
    return prisma.order.count({
      where: { userId },
    });
  }

  /**
   * Compter les commandes par statut
   */
  async countByStatus(status: OrderStatus): Promise<number> {
    return prisma.order.count({
      where: { status },
    });
  }

  /**
   * Compter les commandes d'un abonnement
   */
  async countBySubscription(subscriptionId: string): Promise<number> {
    return prisma.order.count({
      where: { subscriptionId },
    });
  }

  /**
   * Obtenir le prochaine numéro de commande
   */
  async getNextOrderNumber(): Promise<string> {
    const count = await prisma.order.count();
    const year = new Date().getFullYear();
    return `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}

export default new OrderRepository();
