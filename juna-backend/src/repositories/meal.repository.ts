import prisma from '@/config/database';
import { Meal, MealType, Prisma } from '@prisma/client';

export class MealRepository {
  /**
   * Créer un repas
   */
  async create(data: Prisma.MealCreateInput): Promise<Meal> {
    return prisma.meal.create({
      data,
    });
  }

  /**
   * Trouver un repas par ID
   */
  async findById(id: string): Promise<Meal | null> {
    return prisma.meal.findUnique({
      where: { id },
    });
  }

  /**
   * Trouver un repas par ID avec provider
   */
  async findByIdWithProvider(id: string): Promise<(Meal & { provider: { id: string; businessName: string } }) | null> {
    return prisma.meal.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });
  }

  /**
   * Trouver tous les repas d'un fournisseur
   */
  async findByProviderId(providerId: string): Promise<Meal[]> {
    return prisma.meal.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Trouver tous les repas actifs d'un fournisseur
   */
  async findActiveByProviderId(providerId: string): Promise<Meal[]> {
    return prisma.meal.findMany({
      where: { 
        providerId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Trouver un repas par provider et nom
   */
  async findByProviderAndName(providerId: string, name: string): Promise<Meal | null> {
    return prisma.meal.findFirst({
      where: { 
        providerId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
  }

  /**
   * Mettre à jour un repas
   */
  async update(id: string, data: Prisma.MealUpdateInput): Promise<Meal> {
    return prisma.meal.update({
      where: { id },
      data,
    });
  }

  /**
   * Activer/Désactiver un repas
   */
  async toggleActive(id: string): Promise<Meal> {
    const meal = await prisma.meal.findUnique({
      where: { id },
      select: { isActive: true },
    });
    
    return prisma.meal.update({
      where: { id },
      data: { isActive: !meal?.isActive },
    });
  }

  /**
   * Lister les repas avec filtres
   */
  async findAll(filters?: {
    providerId?: string;
    mealType?: MealType;
    isActive?: boolean;
    search?: string;
  }): Promise<Meal[]> {
    const where: Prisma.MealWhereInput = {};

    if (filters?.providerId) {
      where.providerId = filters.providerId;
    }

    if (filters?.mealType) {
      where.mealType = filters.mealType;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.meal.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Compter les repas d'un fournisseur
   */
  async countByProvider(providerId: string): Promise<number> {
    return prisma.meal.count({
      where: { providerId },
    });
  }

  /**
   * Compter les repas actifs d'un fournisseur
   */
  async countActiveByProvider(providerId: string): Promise<number> {
    return prisma.meal.count({
      where: { 
        providerId,
        isActive: true,
      },
    });
  }

  /**
   * Supprimer un repas
   */
  async delete(id: string): Promise<Meal> {
    return prisma.meal.delete({
      where: { id },
    });
  }

  /**
   * Vérifier si un repas est utilisé dans des abonnements
   */
  async isUsedInSubscriptions(id: string): Promise<boolean> {
    const count = await prisma.subscriptionMeal.count({
      where: { mealId: id },
    });
    return count > 0;
  }
}

export default new MealRepository();
