import subscriptionRepository from '@/repositories/subscription.repository';
import providerRepository from '@/repositories/provider.repository';
import mealService from './meal.service';
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { CreateSubscriptionInput, UpdateSubscriptionInput, SubscriptionFiltersInput } from '@/validators/subscription.validator';
import { Subscription } from '@prisma/client';

export class SubscriptionService {
  /**
   * Créer un abonnement
   */
  async create(providerId: string, data: CreateSubscriptionInput): Promise<Subscription> {
    // Vérifier que le fournisseur existe et est approuvé
    const provider = await providerRepository.findById(providerId);
    if (!provider) {
      throw new NotFoundError('Fournisseur introuvable', ERROR_CODES.PROVIDER_NOT_FOUND);
    }

    if (provider.status !== 'APPROVED') {
      throw new ForbiddenError(
        'Votre compte fournisseur doit être approuvé avant de créer des abonnements',
        ERROR_CODES.PROVIDER_NOT_APPROVED
      );
    }

    // Vérifier si un abonnement avec le même nom existe déjà pour ce fournisseur
    const existingSubscription = await subscriptionRepository.findByProviderAndName(
      providerId,
      data.name
    );

    if (existingSubscription) {
      throw new ConflictError(
        'Un abonnement avec ce nom existe déjà',
        ERROR_CODES.SUBSCRIPTION_ALREADY_EXISTS
      );
    }

    // Valider les repas si fournis
    if (data.mealIds && data.mealIds.length > 0) {
      const validation = await mealService.validateMealsForSubscription(providerId, data.mealIds);
      if (!validation.valid) {
        throw new ConflictError(
          `Erreurs de validation: ${validation.errors.join(', ')}`,
          ERROR_CODES.INVALID_INPUT
        );
      }
    }

    return subscriptionRepository.create({
      providerId,
      name: data.name,
      description: data.description,
      price: data.price,
      junaCommissionPercent: data.junaCommissionPercent ?? 10,
      type: data.type,
      category: data.category,
      duration: data.duration,
      imageUrl: data.imageUrl,
      isActive: true,
      isPublic: data.isPublic ?? false,
      isImmediate: data.isImmediate ?? true,
      preparationHours: data.isImmediate === false ? (data.preparationHours ?? 0) : 0,
      mealIds: data.mealIds,
    });
  }

  /**
   * Obtenir un abonnement par ID
   */
  async getById(id: string): Promise<Subscription> {
    const subscription = await subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundError('Abonnement introuvable', ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
    }
    return subscription;
  }

  /**
   * Obtenir un abonnement par ID avec détails (meals)
   */
  async getByIdWithDetails(id: string) {
    const subscription = await subscriptionRepository.findByIdWithDetails(id);
    if (!subscription) {
      throw new NotFoundError('Abonnement introuvable', ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
    }

    const raw = subscription as any;
    const provider = raw.provider;

    const meals = (raw.mealsInSubscriptions ?? []).map((m: any) => ({
      id: m.meal.id,
      name: m.meal.name,
      description: m.meal.description,
      imageUrl: m.meal.imageUrl ?? null,
    }));

    const deliveryZones: string[] = Array.isArray(provider.deliveryZones)
      ? provider.deliveryZones
      : provider.deliveryZones
        ? Object.values(provider.deliveryZones as Record<string, string>)
        : [];

    const pickupPoints: string[] = (provider.landmarks ?? []).map(
      (pl: any) => pl.landmark.name
    );

    const otherSubs = await subscriptionRepository.findOthersByProviderId(
      provider.id,
      raw.id,
      6
    );

    const providerSubscriptions = otherSubs.map((s: any) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      currency: 'XOF',
      type: s.type,
      category: s.category,
      duration: s.duration,
      images: s.imageUrl ? [s.imageUrl] : [],
      rating: s.rating,
      reviewCount: s.totalReviews,
      isActive: s.isActive,
    }));

    return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      price: raw.price,
      currency: 'XOF',
      type: raw.type,
      category: raw.category,
      duration: raw.duration,
      mealCount: meals.length,
      images: raw.imageUrl ? [raw.imageUrl] : [],
      rating: raw.rating,
      reviewCount: raw.totalReviews,
      isActive: raw.isActive,
      provider: {
        id: provider.id,
        name: provider.businessName,
        logo: provider.logo,
        isVerified: provider.status === 'APPROVED',
        description: provider.description ?? null,
        rating: provider.rating,
        reviewCount: provider.totalReviews,
        acceptsDelivery: provider.acceptsDelivery,
        acceptsPickup: provider.acceptsPickup,
        businessAddress: provider.businessAddress,
        city: provider.city
          ? { id: provider.city.id, name: provider.city.name }
          : null,
      },
      meals,
      deliveryZones,
      pickupPoints,
      providerSubscriptions,
    };
  }

  /**
   * Obtenir tous les abonnements d'un fournisseur
   */
  async getByProviderId(providerId: string): Promise<Subscription[]> {
    return subscriptionRepository.findByProviderId(providerId);
  }

  /**
   * Obtenir tous les abonnements actifs d'un fournisseur
   */
  async getActiveByProviderId(providerId: string): Promise<Subscription[]> {
    return subscriptionRepository.findActiveByProviderId(providerId);
  }

  /**
   * Lister les abonnements publics avec tri et pagination
   */
  async getPublic(filters?: SubscriptionFiltersInput) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const sort = filters?.sort ?? 'popular';

    const { data, total } = await subscriptionRepository.findPublic(filters);

    let sorted: typeof data;

    if (sort === 'popular') {
      sorted = data
        .sort((a: any, b: any) => {
          const score = (item: any) =>
            item.rating * 0.3 +
            Math.log(item.totalReviews + 1) * 0.2 +
            Math.log(item._count.orders + 1) * 0.4 +
            (item.provider.status === 'APPROVED' ? 0.1 : 0);
          return score(b) - score(a);
        })
        .slice((page - 1) * limit, page * limit);
    } else if (sort === 'rating') {
      sorted = data.sort((a: any, b: any) => b.totalReviews - a.totalReviews || b.rating - a.rating);
    } else {
      sorted = data;
    }

    const subscriptions = sorted.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      currency: 'XOF',
      type: s.type,
      category: s.category,
      duration: s.duration,
      mealCount: s._count.mealsInSubscriptions,
      images: s.imageUrl ? [s.imageUrl] : [],
      rating: s.rating,
      reviewCount: s.totalReviews,
      isActive: s.isActive,
      provider: {
        id: s.provider.id,
        name: s.provider.businessName,
        logo: s.provider.logo,
        isVerified: s.provider.status === 'APPROVED',
      },
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      subscriptions,
      pagination: { page, limit, total, totalPages },
    };
  }

  /**
   * Lister tous les abonnements (admin)
   */
  async getAll(filters?: SubscriptionFiltersInput) {
    return subscriptionRepository.findAll(filters);
  }

  /**
   * Mettre à jour un abonnement
   */
  async update(
    id: string,
    providerId: string,
    data: UpdateSubscriptionInput
  ): Promise<Subscription> {
    // Vérifier que l'abonnement existe
    const subscription = await subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundError('Abonnement introuvable', ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
    }

    // Vérifier que l'abonnement appartient au fournisseur
    if (subscription.providerId !== providerId) {
      throw new ForbiddenError(
        'Vous n\'êtes pas autorisé à modifier cet abonnement',
        ERROR_CODES.FORBIDDEN
      );
    }

    // Valider les repas si fournis
    if (data.mealIds) {
      const validation = await mealService.validateMealsForSubscription(providerId, data.mealIds);
      if (!validation.valid) {
        throw new ConflictError(
          `Erreurs de validation: ${validation.errors.join(', ')}`,
          ERROR_CODES.INVALID_INPUT
        );
      }
    }

    return subscriptionRepository.updateWithMeals(id, {
      name: data.name,
      description: data.description,
      price: data.price,
      junaCommissionPercent: data.junaCommissionPercent,
      type: data.type,
      category: data.category,
      duration: data.duration,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      isPublic: data.isPublic,
      isImmediate: data.isImmediate,
      preparationHours: data.isImmediate === false ? data.preparationHours : data.isImmediate === true ? 0 : undefined,
      mealIds: data.mealIds,
    });
  }

  /**
   * Activer/Désactiver un abonnement
   */
  async toggleActive(id: string, providerId: string): Promise<Subscription> {
    const subscription = await subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundError('Abonnement introuvable', ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
    }

    if (subscription.providerId !== providerId) {
      throw new ForbiddenError(
        'Vous n\'êtes pas autorisé à modifier cet abonnement',
        ERROR_CODES.FORBIDDEN
      );
    }

    return subscriptionRepository.toggleActive(id);
  }

  /**
   * Publier/Dé-publier un abonnement
   */
  async togglePublic(id: string, providerId: string): Promise<Subscription> {
    const subscription = await subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundError('Abonnement introuvable', ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
    }

    if (subscription.providerId !== providerId) {
      throw new ForbiddenError(
        'Vous n\'êtes pas autorisé à modifier cet abonnement',
        ERROR_CODES.FORBIDDEN
      );
    }

    return subscriptionRepository.togglePublic(id);
  }

  /**
   * Supprimer un abonnement
   */
  async delete(id: string, providerId: string): Promise<void> {
    const subscription = await subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundError('Abonnement introuvable', ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
    }

    if (subscription.providerId !== providerId) {
      throw new ForbiddenError(
        'Vous n\'êtes pas autorisé à supprimer cet abonnement',
        ERROR_CODES.FORBIDDEN
      );
    }

    // Vérifier si des utilisateurs sont abonnés
    if (subscription.subscriberCount > 0) {
      throw new ConflictError(
        'Impossible de supprimer un abonnement avec des abonnés',
        ERROR_CODES.SUBSCRIPTION_IN_USE
      );
    }

    await subscriptionRepository.delete(id);
  }

  /**
   * Compter les abonnements d'un fournisseur
   */
  async countByProvider(providerId: string): Promise<number> {
    return subscriptionRepository.countByProvider(providerId);
  }

  /**
   * Incrémenter le nombre d'abonnés
   */
  async incrementSubscriberCount(id: string): Promise<Subscription> {
    return subscriptionRepository.incrementSubscriberCount(id);
  }

  /**
   * Décrémenter le nombre d'abonnés
   */
  async decrementSubscriberCount(id: string): Promise<Subscription> {
    return subscriptionRepository.decrementSubscriberCount(id);
  }
}

export default new SubscriptionService();
