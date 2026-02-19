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
      type: data.type,
      category: data.category,
      duration: data.duration,
      deliveryZones: data.deliveryZones,
      pickupLocations: data.pickupLocations,
      imageUrl: data.imageUrl,
      isActive: true,
      isPublic: data.isPublic ?? false,
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
    return subscription;
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
   * Lister les abonnements publics
   */
  async getPublic(filters?: SubscriptionFiltersInput) {
    return subscriptionRepository.findPublic(filters);
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
      type: data.type,
      category: data.category,
      duration: data.duration,
      deliveryZones: data.deliveryZones,
      pickupLocations: data.pickupLocations,
      imageUrl: data.imageUrl,
      isActive: data.isActive,
      isPublic: data.isPublic,
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
