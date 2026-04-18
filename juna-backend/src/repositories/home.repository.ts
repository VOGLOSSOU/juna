import prisma from '@/config/database';

const SUBSCRIPTION_SELECT = {
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
  isActive: true,
  createdAt: true,
  _count: { select: { orders: true } },
  provider: {
    select: {
      id: true,
      businessName: true,
      logo: true,
      status: true,
    },
  },
} as const;

export class HomeRepository {
  async findSubscriptionsByCity(cityId: string, limit: number, orderBy: 'recent' | 'popular') {
    const fetchLimit = orderBy === 'popular' ? limit * 4 : limit;

    return prisma.subscription.findMany({
      where: {
        isPublic: true,
        isActive: true,
        provider: { cityId, status: 'APPROVED' },
      },
      select: SUBSCRIPTION_SELECT,
      orderBy: orderBy === 'recent' ? { createdAt: 'desc' } : { rating: 'desc' },
      take: fetchLimit,
    });
  }

  async findProvidersByCity(cityId: string, limit: number) {
    return prisma.provider.findMany({
      where: {
        status: 'APPROVED',
        landmarks: {
          some: {
            landmark: { cityId },
          },
        },
      },
      select: {
        id: true,
        businessName: true,
        logo: true,
        status: true,
        rating: true,
        city: { select: { name: true } },
        _count: {
          select: {
            subscriptions: {
              where: { isActive: true, isPublic: true },
            },
          },
        },
      },
      take: limit,
      orderBy: { rating: 'desc' },
    });
  }
}

export default new HomeRepository();
