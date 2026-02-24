import prisma from '@/config/database';
import { Order, OrderStatus, DeliveryMethod, Prisma } from '@prisma/client';

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
        user: { id: string; name: string; email: string; phone: string | null };
        subscription: { 
          id: string; 
          name: string; 
          price: number;
          provider: { id: string; businessName: string };
        };
        payment: { id: string; status: string; amount: number; method: string } | null;
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
            phone: true,
          },
        },
        subscription: {
          select: {
            id: true,
            name: true,
            price: true,
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
            method: true,
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
   * Trouver une commande par QR code
   */
  async findByQrCode(qrCode: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { qrCode },
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
        payment: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Trouver les commandes d'un fournisseur (via abonnements)
   */
  async findByProviderId(providerId: string): Promise<Order[]> {
    return prisma.order.findMany({
      where: {
        subscription: {
          providerId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
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
        payment: {
          select: {
            status: true,
            amount: true,
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
   * Lister les commandes avec filtres (admin)
   */
  async findAll(filters?: {
    userId?: string;
    subscriptionId?: string;
    providerId?: string;
    status?: OrderStatus;
    deliveryMethod?: DeliveryMethod;
  }): Promise<Order[]> {
    const where: Prisma.OrderWhereInput = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.subscriptionId) {
      where.subscriptionId = filters.subscriptionId;
    }

    if (filters?.providerId) {
      where.subscription = {
        provider: {
          id: filters.providerId,
        },
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.deliveryMethod) {
      where.deliveryMethod = filters.deliveryMethod;
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
            provider: {
              select: {
                businessName: true,
              },
            },
          },
        },
        payment: {
          select: {
            status: true,
            amount: true,
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
   * Mettre à jour le QR code
   */
  async updateQrCode(id: string, qrCode: string): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data: { qrCode },
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
   * Compter les commandes d'un fournisseur
   */
  async countByProvider(providerId: string): Promise<number> {
    return prisma.order.count({
      where: {
        subscription: {
          providerId,
        },
      },
    });
  }

  /**
   * Obtenir le prochain numéro de commande
   */
  async getNextOrderNumber(): Promise<string> {
    const count = await prisma.order.count();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    return `ORD-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
}

export default new OrderRepository();
