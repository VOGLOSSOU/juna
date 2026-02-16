import mealRepository from '@/repositories/meal.repository';
import providerRepository from '@/repositories/provider.repository';
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { CreateMealInput, UpdateMealInput, MealFiltersInput } from '@/validators/meal.validator';
import { Meal, MealType } from '@prisma/client';

export class MealService {
  /**
   * Créer un repas
   */
  async create(providerId: string, data: CreateMealInput): Promise<Meal> {
    // Vérifier que le fournisseur existe et est approuvé
    const provider = await providerRepository.findById(providerId);
    if (!provider) {
      throw new NotFoundError('Fournisseur introuvable', ERROR_CODES.PROVIDER_NOT_FOUND);
    }

    if (provider.status !== 'APPROVED') {
      throw new ForbiddenError(
        'Votre compte fournisseur doit être approuvé avant de créer des repas',
        ERROR_CODES.PROVIDER_NOT_APPROVED
      );
    }

    // Vérifier si un repas avec le même nom existe déjà pour ce fournisseur
    const existingMeal = await mealRepository.findByProviderAndName(providerId, data.name);
    if (existingMeal) {
      throw new ConflictError(
        'Un repas avec ce nom existe déjà',
        ERROR_CODES.MEAL_ALREADY_EXISTS
      );
    }

    return mealRepository.create({
      provider: { connect: { id: providerId } },
      name: data.name,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      mealType: data.mealType,
      isActive: true,
    });
  }

  /**
   * Obtenir un repas par ID
   */
  async getById(id: string): Promise<Meal> {
    const meal = await mealRepository.findById(id);
    if (!meal) {
      throw new NotFoundError('Repas introuvable', ERROR_CODES.MEAL_NOT_FOUND);
    }
    return meal;
  }

  /**
   * Obtenir un repas par ID avec provider
   */
  async getByIdWithProvider(id: string) {
    const meal = await mealRepository.findByIdWithProvider(id);
    if (!meal) {
      throw new NotFoundError('Repas introuvable', ERROR_CODES.MEAL_NOT_FOUND);
    }
    return meal;
  }

  /**
   * Obtenir tous les repas d'un fournisseur
   */
  async getByProviderId(providerId: string): Promise<Meal[]> {
    return mealRepository.findByProviderId(providerId);
  }

  /**
   * Obtenir tous les repas actifs d'un fournisseur
   */
  async getActiveByProviderId(providerId: string): Promise<Meal[]> {
    return mealRepository.findActiveByProviderId(providerId);
  }

  /**
   * Lister les repas avec filtres
   */
  async getAll(filters?: MealFiltersInput): Promise<Meal[]> {
    return mealRepository.findAll(filters);
  }

  /**
   * Mettre à jour un repas
   */
  async update(id: string, providerId: string, data: UpdateMealInput): Promise<Meal> {
    // Vérifier que le repas existe
    const meal = await mealRepository.findById(id);
    if (!meal) {
      throw new NotFoundError('Repas introuvable', ERROR_CODES.MEAL_NOT_FOUND);
    }

    // Vérifier que le repas appartient au fournisseur
    if (meal.providerId !== providerId) {
      throw new ForbiddenError(
        'Vous n\'êtes pas autorisé à modifier ce repas',
        ERROR_CODES.FORBIDDEN
      );
    }

    // Vérifier si le nouveau nom n'est pas déjà utilisé par un autre repas
    if (data.name && data.name !== meal.name) {
      const existingMeal = await mealRepository.findByProviderAndName(providerId, data.name);
      if (existingMeal && existingMeal.id !== id) {
        throw new ConflictError(
          'Un repas avec ce nom existe déjà',
          ERROR_CODES.MEAL_ALREADY_EXISTS
        );
      }
    }

    return mealRepository.update(id, {
      name: data.name,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      mealType: data.mealType,
      isActive: data.isActive,
    });
  }

  /**
   * Activer/Désactiver un repas
   */
  async toggleActive(id: string, providerId: string): Promise<Meal> {
    const meal = await mealRepository.findById(id);
    if (!meal) {
      throw new NotFoundError('Repas introuvable', ERROR_CODES.MEAL_NOT_FOUND);
    }

    if (meal.providerId !== providerId) {
      throw new ForbiddenError(
        'Vous n\'êtes pas autorisé à modifier ce repas',
        ERROR_CODES.FORBIDDEN
      );
    }

    return mealRepository.toggleActive(id);
  }

  /**
   * Supprimer un repas
   */
  async delete(id: string, providerId: string): Promise<void> {
    const meal = await mealRepository.findById(id);
    if (!meal) {
      throw new NotFoundError('Repas introuvable', ERROR_CODES.MEAL_NOT_FOUND);
    }

    if (meal.providerId !== providerId) {
      throw new ForbiddenError(
        'Vous n\'êtes pas autorisé à supprimer ce repas',
        ERROR_CODES.FORBIDDEN
      );
    }

    // Vérifier si le repas est utilisé dans des abonnements
    const isUsed = await mealRepository.isUsedInSubscriptions(id);
    if (isUsed) {
      throw new ConflictError(
        'Ce repas est utilisé dans des abonnements et ne peut pas être supprimé',
        ERROR_CODES.MEAL_IN_USE
      );
    }

    await mealRepository.delete(id);
  }

  /**
   * Compter les repas d'un fournisseur
   */
  async countByProvider(providerId: string): Promise<number> {
    return mealRepository.countByProvider(providerId);
  }

  /**
   * Valider les repas pour un abonnement
   */
  async validateMealsForSubscription(
    providerId: string,
    mealIds: string[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const mealId of mealIds) {
      const meal = await mealRepository.findById(mealId);
      
      if (!meal) {
        errors.push(`Repas avec l'ID ${mealId} introuvable`);
        continue;
      }

      if (meal.providerId !== providerId) {
        errors.push(`Le repas "${meal.name}" n'appartient pas à ce fournisseur`);
      }

      if (!meal.isActive) {
        errors.push(`Le repas "${meal.name}" n'est pas actif`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default new MealService();
