import prisma from '@/config/database';
import { Meal, MealType, Prisma } from '@prisma/client';

const MEAL_WITH_PRICINGS = {
  pricings: {
    select: { id: true, label: true, price: true },
    orderBy: { price: 'asc' as const },
  },
} as const;

export class MealRepository {
  async create(data: Prisma.MealCreateInput): Promise<Meal> {
    return prisma.meal.create({ data });
  }

  async findById(id: string) {
    return prisma.meal.findUnique({
      where: { id },
      include: MEAL_WITH_PRICINGS,
    });
  }

  async findByIdWithProvider(id: string) {
    return prisma.meal.findUnique({
      where: { id },
      include: {
        ...MEAL_WITH_PRICINGS,
        provider: { select: { id: true, businessName: true } },
      },
    });
  }

  async findByProviderId(providerId: string) {
    return prisma.meal.findMany({
      where: { providerId },
      include: MEAL_WITH_PRICINGS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveByProviderId(providerId: string) {
    return prisma.meal.findMany({
      where: { providerId, isActive: true },
      include: MEAL_WITH_PRICINGS,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByProviderAndName(providerId: string, name: string): Promise<Meal | null> {
    return prisma.meal.findFirst({
      where: { providerId, name: { equals: name, mode: 'insensitive' } },
    });
  }

  async update(id: string, data: Prisma.MealUpdateInput) {
    return prisma.meal.update({
      where: { id },
      data,
      include: MEAL_WITH_PRICINGS,
    });
  }

  async toggleActive(id: string) {
    const meal = await prisma.meal.findUnique({ where: { id }, select: { isActive: true } });
    return prisma.meal.update({
      where: { id },
      data: { isActive: !meal?.isActive },
      include: MEAL_WITH_PRICINGS,
    });
  }

  async findAll(filters?: {
    providerId?: string;
    mealType?: MealType;
    isActive?: boolean;
    search?: string;
  }) {
    const where: Prisma.MealWhereInput = {};
    if (filters?.providerId) where.providerId = filters.providerId;
    if (filters?.mealType) where.mealType = filters.mealType;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.meal.findMany({
      where,
      include: {
        ...MEAL_WITH_PRICINGS,
        provider: { select: { id: true, businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async replacePricings(mealId: string, pricings: { label: string; price: number }[]) {
    await prisma.mealPricing.deleteMany({ where: { mealId } });
    if (pricings.length > 0) {
      await prisma.mealPricing.createMany({
        data: pricings.map((p) => ({ mealId, label: p.label, price: p.price })),
      });
    }
  }

  async countByProvider(providerId: string): Promise<number> {
    return prisma.meal.count({ where: { providerId } });
  }

  async countActiveByProvider(providerId: string): Promise<number> {
    return prisma.meal.count({ where: { providerId, isActive: true } });
  }

  async delete(id: string): Promise<Meal> {
    return prisma.meal.delete({ where: { id } });
  }

  async isUsedInSubscriptions(id: string): Promise<boolean> {
    const count = await prisma.subscriptionMeal.count({ where: { mealId: id } });
    return count > 0;
  }
}

export default new MealRepository();
