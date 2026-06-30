import mealRepository from '@/repositories/meal.repository';
import providerRepository from '@/repositories/provider.repository';
import { ConflictError, NotFoundError, ForbiddenError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { CreateMealInput, UpdateMealInput, MealFiltersInput } from '@/validators/meal.validator';

function serializeMealProvider(provider: { id: string; businessName: string; logo: string; status: string }) {
  return {
    id: provider.id,
    businessName: provider.businessName,
    logo: provider.logo,
    isVerified: provider.status === 'APPROVED',
  };
}

function resolvePriceFields(data: CreateMealInput | UpdateMealInput) {
  const priceType = data.priceType ?? 'FIXED';

  if (priceType === 'FIXED') {
    return { price: data.price!, priceType, priceMin: null, priceMax: null };
  }

  if (priceType === 'MULTIPLE') {
    const minFromPricings = Math.min(...(data.pricings ?? []).map((p) => p.price));
    return { price: minFromPricings, priceType, priceMin: null, priceMax: null };
  }

  // RANGE
  return { price: data.priceMin!, priceType, priceMin: data.priceMin!, priceMax: data.priceMax! };
}

export class MealService {
  async create(providerId: string, data: CreateMealInput) {
    const provider = await providerRepository.findById(providerId);
    if (!provider) throw new NotFoundError('Fournisseur introuvable', ERROR_CODES.PROVIDER_NOT_FOUND);
    if (provider.status !== 'APPROVED') {
      throw new ForbiddenError(
        'Votre compte fournisseur doit être approuvé avant de créer des repas',
        ERROR_CODES.PROVIDER_NOT_APPROVED
      );
    }

    const existing = await mealRepository.findByProviderAndName(providerId, data.name);
    if (existing) throw new ConflictError('Un repas avec ce nom existe déjà', ERROR_CODES.MEAL_ALREADY_EXISTS);

    const { price, priceType, priceMin, priceMax } = resolvePriceFields(data);

    const meal = await mealRepository.create({
      provider: { connect: { id: providerId } },
      name: data.name,
      description: data.description,
      price,
      priceType,
      priceMin,
      priceMax,
      priceGuideline: data.priceGuideline ?? null,
      imageUrl: data.imageUrl,
      mealType: data.mealType,
      isActive: true,
    });

    if (priceType === 'MULTIPLE' && data.pricings?.length) {
      await mealRepository.replacePricings(meal.id, data.pricings);
    }

    return mealRepository.findById(meal.id);
  }

  async getById(id: string) {
    const meal = await mealRepository.findById(id);
    if (!meal) throw new NotFoundError('Repas introuvable', ERROR_CODES.MEAL_NOT_FOUND);
    return meal;
  }

  async getByIdWithProvider(id: string) {
    const meal = await mealRepository.findByIdWithProvider(id);
    if (!meal) throw new NotFoundError('Repas introuvable', ERROR_CODES.MEAL_NOT_FOUND);
    return { ...meal, provider: serializeMealProvider((meal as any).provider) };
  }

  async getByProviderId(providerId: string) {
    return mealRepository.findByProviderId(providerId);
  }

  async getActiveByProviderId(providerId: string) {
    return mealRepository.findActiveByProviderId(providerId);
  }

  async getAll(filters?: MealFiltersInput) {
    const meals = await mealRepository.findAll(filters);
    return meals.map((meal) => ({ ...meal, provider: serializeMealProvider((meal as any).provider) }));
  }

  async update(id: string, providerId: string, data: UpdateMealInput) {
    const meal = await mealRepository.findById(id);
    if (!meal) throw new NotFoundError('Repas introuvable', ERROR_CODES.MEAL_NOT_FOUND);
    if (meal.providerId !== providerId) {
      throw new ForbiddenError('Vous n\'êtes pas autorisé à modifier ce repas', ERROR_CODES.FORBIDDEN);
    }

    if (data.name && data.name !== meal.name) {
      const existing = await mealRepository.findByProviderAndName(providerId, data.name);
      if (existing && existing.id !== id) {
        throw new ConflictError('Un repas avec ce nom existe déjà', ERROR_CODES.MEAL_ALREADY_EXISTS);
      }
    }

    const effectivePriceType = data.priceType ?? meal.priceType;
    let priceUpdate: Record<string, any> = {};

    if (data.priceType) {
      const { price, priceType, priceMin, priceMax } = resolvePriceFields({
        ...data,
        priceType: data.priceType,
      } as CreateMealInput);
      priceUpdate = { price, priceType, priceMin, priceMax };
    } else if (data.price !== undefined) {
      priceUpdate.price = data.price;
    }

    await mealRepository.update(id, {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      mealType: data.mealType,
      isActive: data.isActive,
      priceGuideline: data.priceGuideline,
      ...priceUpdate,
    });

    if (effectivePriceType === 'MULTIPLE' && data.pricings?.length) {
      await mealRepository.replacePricings(id, data.pricings);
    } else if (data.priceType && data.priceType !== 'MULTIPLE') {
      await mealRepository.replacePricings(id, []);
    }

    return mealRepository.findById(id);
  }

  async toggleActive(id: string, providerId: string) {
    const meal = await mealRepository.findById(id);
    if (!meal) throw new NotFoundError('Repas introuvable', ERROR_CODES.MEAL_NOT_FOUND);
    if (meal.providerId !== providerId) {
      throw new ForbiddenError('Vous n\'êtes pas autorisé à modifier ce repas', ERROR_CODES.FORBIDDEN);
    }
    return mealRepository.toggleActive(id);
  }

  async delete(id: string, providerId: string): Promise<void> {
    const meal = await mealRepository.findById(id);
    if (!meal) throw new NotFoundError('Repas introuvable', ERROR_CODES.MEAL_NOT_FOUND);
    if (meal.providerId !== providerId) {
      throw new ForbiddenError('Vous n\'êtes pas autorisé à supprimer ce repas', ERROR_CODES.FORBIDDEN);
    }
    const isUsed = await mealRepository.isUsedInSubscriptions(id);
    if (isUsed) {
      throw new ConflictError(
        'Ce repas est utilisé dans des abonnements et ne peut pas être supprimé',
        ERROR_CODES.MEAL_IN_USE
      );
    }
    await mealRepository.delete(id);
  }

  async countByProvider(providerId: string): Promise<number> {
    return mealRepository.countByProvider(providerId);
  }

  async validateMealsForSubscription(providerId: string, mealIds: string[]) {
    const errors: string[] = [];
    for (const mealId of mealIds) {
      const meal = await mealRepository.findById(mealId);
      if (!meal) { errors.push(`Repas avec l'ID ${mealId} introuvable`); continue; }
      if (meal.providerId !== providerId) errors.push(`Le repas "${meal.name}" n'appartient pas à ce fournisseur`);
      if (!meal.isActive) errors.push(`Le repas "${meal.name}" n'est pas actif`);
    }
    return { valid: errors.length === 0, errors };
  }
}

export default new MealService();
