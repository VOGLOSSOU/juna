import prisma from '@/config/database';

export class FavoriteRepository {
  findUser(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  }

  findSubscription(subscriptionId: string) {
    return prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        isActive: true,
        isPublic: true,
        provider: {
          select: { status: true, user: { select: { isActive: true } } },
        },
      },
    });
  }

  find(userId: string, subscriptionId: string) {
    return prisma.favorite.findUnique({
      where: { userId_subscriptionId: { userId, subscriptionId } },
    });
  }

  add(userId: string, subscriptionId: string) {
    // ON CONFLICT DO NOTHING : deux requêtes simultanées restent idempotentes.
    return prisma.favorite.createMany({ data: [{ userId, subscriptionId }], skipDuplicates: true });
  }

  remove(userId: string, subscriptionId: string) {
    return prisma.favorite.deleteMany({ where: { userId, subscriptionId } });
  }

  findIds(userId: string, subscriptionIds: string[]) {
    return prisma.favorite.findMany({
      where: { userId, subscriptionId: { in: subscriptionIds } },
      select: { subscriptionId: true },
    });
  }

  async list(userId: string, page: number, limit: number) {
    // Le compte et la page sont lus dans un même instantané de la base.
    const [favorites, total] = await prisma.$transaction(
      [
        prisma.favorite.findMany({
          where: { userId },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: [{ createdAt: 'desc' }, { subscriptionId: 'asc' }],
          select: {
            createdAt: true,
            subscription: {
              select: {
                id: true,
                name: true,
                description: true,
                instructions: true,
                price: true,
                type: true,
                category: true,
                duration: true,
                imageUrl: true,
                isActive: true,
                isPublic: true,
                isImmediate: true,
                preparationHours: true,
                rating: true,
                totalReviews: true,
                _count: { select: { mealsInSubscriptions: true } },
                provider: {
                  select: {
                    id: true,
                    businessName: true,
                    logo: true,
                    status: true,
                    user: { select: { isActive: true } },
                  },
                },
              },
            },
          },
        }),
        prisma.favorite.count({ where: { userId } }),
      ],
      { isolationLevel: 'RepeatableRead' }
    );
    return { favorites, total };
  }
}

export default new FavoriteRepository();
