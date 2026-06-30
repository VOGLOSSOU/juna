import prisma from '@/config/database';
import { Prisma, SubscriptionProposal, SubscriptionProposalStatus } from '@prisma/client';

const PROPOSAL_DETAIL_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  provider: { select: { id: true, businessName: true, logo: true } },
  resultingSubscription: { select: { id: true, name: true, isPublic: true } },
  meals: {
    select: {
      id: true,
      mealId: true,
      mealPricingLabel: true,
      quantity: true,
      meal: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          mealType: true,
          priceType: true,
          price: true,
          isActive: true,
        },
      },
    },
  },
} satisfies Prisma.SubscriptionProposalInclude;

export class SubscriptionProposalRepository {
  /**
   * Créer une proposition avec ses repas
   */
  async create(data: {
    userId: string;
    providerId: string;
    type: Prisma.SubscriptionProposalCreateInput['type'];
    category: Prisma.SubscriptionProposalCreateInput['category'];
    duration: Prisma.SubscriptionProposalCreateInput['duration'];
    message?: string | null;
    meals: { mealId: string; mealPricingLabel?: string; quantity: number }[];
  }): Promise<SubscriptionProposal> {
    return prisma.subscriptionProposal.create({
      data: {
        user: { connect: { id: data.userId } },
        provider: { connect: { id: data.providerId } },
        type: data.type,
        category: data.category,
        duration: data.duration,
        message: data.message ?? null,
        meals: {
          create: data.meals.map((m) => ({
            mealId: m.mealId,
            mealPricingLabel: m.mealPricingLabel ?? null,
            quantity: m.quantity,
          })),
        },
      },
    });
  }

  /**
   * Trouver une proposition par ID avec tous les détails
   */
  async findById(id: string) {
    return prisma.subscriptionProposal.findUnique({
      where: { id },
      include: PROPOSAL_DETAIL_INCLUDE,
    });
  }

  /**
   * Propositions envoyées par un user (paginé)
   */
  async findByUserId(
    userId: string,
    filters?: { status?: SubscriptionProposalStatus; page?: number; limit?: number }
  ): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const where: Prisma.SubscriptionProposalWhereInput = { userId };
    if (filters?.status) where.status = filters.status;

    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.subscriptionProposal.findMany({
        where,
        include: PROPOSAL_DETAIL_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.subscriptionProposal.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Propositions reçues par un provider (paginé)
   */
  async findByProviderId(
    providerId: string,
    filters?: { status?: SubscriptionProposalStatus; page?: number; limit?: number }
  ): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const where: Prisma.SubscriptionProposalWhereInput = { providerId };
    if (filters?.status) where.status = filters.status;

    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.subscriptionProposal.findMany({
        where,
        include: PROPOSAL_DETAIL_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.subscriptionProposal.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Approuver une proposition de façon atomique : crée l'abonnement et fait
   * basculer le statut dans la même transaction. Le statut PENDING est vérifié
   * dans le WHERE de l'update, donc deux requêtes concurrentes (double clic,
   * deux onglets) ne peuvent jamais produire deux abonnements pour la même
   * proposition — la seconde voit count === 0 et échoue proprement.
   */
  async approveInTransaction(
    proposalId: string,
    providerId: string,
    subscriptionData: {
      name: string;
      description: string;
      price: number;
      junaCommissionPercent: number;
      type: Prisma.SubscriptionCreateInput['type'];
      category: Prisma.SubscriptionCreateInput['category'];
      duration: Prisma.SubscriptionCreateInput['duration'];
      imageUrl: string;
      isImmediate?: boolean;
      preparationHours?: number;
    },
    meals: { mealId: string; quantity: number }[]
  ) {
    return prisma.$transaction(async (tx) => {
      const transition = await tx.subscriptionProposal.updateMany({
        where: { id: proposalId, providerId, status: 'PENDING' },
        data: { status: 'APPROVED', respondedAt: new Date() },
      });

      if (transition.count === 0) {
        return null;
      }

      const subscription = await tx.subscription.create({
        data: {
          provider: { connect: { id: providerId } },
          name: subscriptionData.name,
          description: subscriptionData.description,
          price: subscriptionData.price,
          junaCommissionPercent: subscriptionData.junaCommissionPercent,
          type: subscriptionData.type,
          category: subscriptionData.category,
          duration: subscriptionData.duration,
          imageUrl: subscriptionData.imageUrl,
          isPublic: true,
          isActive: true,
          isImmediate: subscriptionData.isImmediate ?? true,
          preparationHours: subscriptionData.preparationHours ?? 0,
          mealsInSubscriptions: {
            create: meals.map((m) => ({ mealId: m.mealId, quantity: m.quantity })),
          },
        },
      });

      await tx.subscriptionProposal.update({
        where: { id: proposalId },
        data: { resultingSubscriptionId: subscription.id },
      });

      return subscription;
    });
  }

  /**
   * Rejeter une proposition de façon atomique (même garantie anti-race que l'approbation)
   */
  async rejectAtomic(
    proposalId: string,
    providerId: string,
    rejectionReason: string
  ): Promise<boolean> {
    const result = await prisma.subscriptionProposal.updateMany({
      where: { id: proposalId, providerId, status: 'PENDING' },
      data: { status: 'REJECTED', rejectionReason, respondedAt: new Date() },
    });
    return result.count === 1;
  }
}

export default new SubscriptionProposalRepository();
