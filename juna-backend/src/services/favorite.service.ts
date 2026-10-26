import favoriteRepository from '@/repositories/favorite.repository';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@/utils/errors.util';

export class FavoriteService {
  private async requireActiveUser(userId: string) {
    const user = await favoriteRepository.findUser(userId);
    if (!user) throw new UnauthorizedError('Compte introuvable');
    if (!user.isActive)
      throw new ForbiddenError('Compte suspendu ou désactivé', 'ACCOUNT_SUSPENDED');
  }

  async add(userId: string, subscriptionId: string) {
    await this.requireActiveUser(userId);
    const existing = await favoriteRepository.find(userId, subscriptionId);
    if (!existing) {
      const sub = await favoriteRepository.findSubscription(subscriptionId);
      if (
        !sub ||
        !sub.isPublic ||
        !sub.isActive ||
        sub.provider.status !== 'APPROVED' ||
        !sub.provider.user.isActive
      ) {
        throw new NotFoundError('Abonnement introuvable ou indisponible', 'SUBSCRIPTION_NOT_FOUND');
      }
      try {
        await favoriteRepository.add(userId, subscriptionId);
      } catch (error) {
        // L'abonnement peut avoir été supprimé après la lecture.
        if ((error as { code?: string }).code === 'P2003') {
          throw new NotFoundError('Abonnement introuvable', 'SUBSCRIPTION_NOT_FOUND');
        }
        throw error;
      }
    }
    return { subscriptionId, isFavorite: true };
  }

  async remove(userId: string, subscriptionId: string) {
    await this.requireActiveUser(userId);
    await favoriteRepository.remove(userId, subscriptionId);
    return { subscriptionId, isFavorite: false };
  }

  async list(userId: string, page: number, limit: number) {
    await this.requireActiveUser(userId);
    const { favorites, total } = await favoriteRepository.list(userId, page, limit);
    return {
      favorites: favorites.map(({ createdAt, subscription: sub }) => ({
        id: sub.id,
        name: sub.name,
        description: sub.description,
        instructions: sub.instructions,
        price: sub.price,
        currency: 'XOF',
        type: sub.type,
        category: sub.category,
        duration: sub.duration,
        imageUrl: sub.imageUrl,
        images: sub.imageUrl ? [sub.imageUrl] : [],
        rating: sub.rating,
        reviewCount: sub.totalReviews,
        mealCount: sub._count.mealsInSubscriptions,
        isActive: sub.isActive,
        isPublic: sub.isPublic,
        isImmediate: sub.isImmediate,
        preparationHours: sub.preparationHours,
        isAvailable:
          sub.isActive &&
          sub.isPublic &&
          sub.provider.status === 'APPROVED' &&
          sub.provider.user.isActive,
        isFavorite: true,
        addedAt: createdAt,
        provider: {
          id: sub.provider.id,
          name: sub.provider.businessName,
          logo: sub.provider.logo,
          isVerified: sub.provider.status === 'APPROVED',
        },
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async annotate<T extends { id: string }>(subscriptions: T[], userId?: string) {
    const ids = [...new Set(subscriptions.map((sub) => sub.id))];
    const favorites = userId && ids.length ? await favoriteRepository.findIds(userId, ids) : [];
    const saved = new Set(favorites.map((favorite) => favorite.subscriptionId));
    return subscriptions.map((sub) => ({ ...sub, isFavorite: saved.has(sub.id) }));
  }
}

export default new FavoriteService();
