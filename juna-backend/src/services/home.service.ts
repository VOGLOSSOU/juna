import homeRepository from '@/repositories/home.repository';
import { NotFoundError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import prisma from '@/config/database';

function popularityScore(sub: {
  rating: number;
  totalReviews: number;
  _count: { orders: number };
  provider: { status: string };
}): number {
  const isVerified = sub.provider.status === 'APPROVED' ? 0.1 : 0;
  return (
    sub.rating * 0.3 +
    Math.log(sub.totalReviews + 1) * 0.2 +
    Math.log(sub._count.orders + 1) * 0.4 +
    isVerified
  );
}

function formatSubscription(sub: any) {
  return {
    id: sub.id,
    name: sub.name,
    description: sub.description,
    price: sub.price,
    currency: 'XOF',
    category: sub.category,
    type: sub.type,
    duration: sub.duration,
    images: [sub.imageUrl],
    rating: sub.rating,
    reviewCount: sub.totalReviews,
    isActive: sub.isActive,
    provider: {
      id: sub.provider.id,
      name: sub.provider.businessName,
      logo: sub.provider.logo,
      isVerified: sub.provider.status === 'APPROVED',
    },
  };
}

export class HomeService {
  async getHomeFeed(cityId: string, limit: number) {
    const city = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
    if (!city) {
      throw new NotFoundError('Ville introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const [popularRaw, recentRaw, providersRaw] = await Promise.all([
      homeRepository.findSubscriptionsByCity(cityId, limit, 'popular'),
      homeRepository.findSubscriptionsByCity(cityId, limit, 'recent'),
      homeRepository.findProvidersByCity(cityId, limit),
    ]);

    const popular = popularRaw
      .sort((a, b) => popularityScore(b) - popularityScore(a))
      .slice(0, limit)
      .map(formatSubscription);

    const recent = recentRaw.map(formatSubscription);

    const providers = providersRaw.map((p) => ({
      id: p.id,
      name: p.businessName,
      logo: p.logo,
      isVerified: p.status === 'APPROVED',
      city: p.city.name,
      subscriptionCount: p._count.subscriptions,
      rating: p.rating,
    }));

    return { popular, recent, providers };
  }
}

export default new HomeService();
