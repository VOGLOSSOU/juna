import prisma from '@/config/database';
import userRepository from '@/repositories/user.repository';
import providerRepository from '@/repositories/provider.repository';
import { UserRole, ProviderStatus, OrderStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';

export class AdminService {
  /**
   * Lister tous les utilisateurs avec filtres
   */
  async listUsers(filters?: { role?: UserRole; isActive?: boolean; search?: string }) {
    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  /**
   * Obtenir les statistiques du dashboard
   */
  async getDashboardStats() {
    const [
      totalUsers,
      totalProviders,
      pendingProviders,
      totalOrders,
      completedOrders,
      pendingOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PROVIDER' } }),
      prisma.provider.count({ where: { status: 'PENDING' } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: { equals: 'SUCCESS' } as any },
      }),
    ]);

    // Statistiques par jour pour les 7 derniers jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const ordersByDay = await prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "orders"
      WHERE "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    ` as { date: Date; count: bigint }[];

    // Statistiques par type de subscription
    const subscriptionsByCategory = await prisma.subscription.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    return {
      overview: {
        totalUsers,
        totalProviders,
        pendingProviders,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue: totalRevenue._sum.amount ?? 0,
      },
      charts: {
        ordersByDay: ordersByDay.map(d => ({
          date: d.date.toISOString().split('T')[0],
          count: Number(d.count),
        })),
        subscriptionsByCategory: subscriptionsByCategory.map(s => ({
          category: s.category,
          count: s._count.id,
        })),
      },
    };
  }

  /**
   * Obtenir un utilisateur par ID
   */
  async getUserById(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Suspendre un utilisateur
   */
  async suspendUser(userId: string, adminId: string, reason?: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      throw new ForbiddenError('Impossible de suspendre un administrateur', ERROR_CODES.FORBIDDEN);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Utilisateur suspendu avec succès',
      userId,
      reason,
    };
  }

  /**
   * Réactiver un utilisateur
   */
  async activateUser(userId: string, adminId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    return {
      success: true,
      message: 'Utilisateur réactivé avec succès',
      userId,
    };
  }

  /**
   * Bannir un utilisateur (suppression soft)
   */
  async banUser(userId: string, adminId: string, reason: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      throw new ForbiddenError('Impossible de bannir un administrateur', ERROR_CODES.FORBIDDEN);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `banned_${user.id}@deleted.com`,
        phone: null,
      },
    });

    return {
      success: true,
      message: 'Utilisateur banni avec succès',
      userId,
      reason,
    };
  }

  /**
   * Obtenir les statistiques détaillées
   */
  async getDetailedStats(period?: 'day' | 'week' | 'month') {
    const startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const [newUsers, newProviders, newOrders, revenue] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.provider.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { createdAt: { gte: startDate } } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: { equals: 'COMPLETED' } as any,
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return {
      period,
      newUsers,
      newProviders,
      newOrders,
      revenue: revenue._sum.amount ?? 0,
    };
  }
}

export default new AdminService();
