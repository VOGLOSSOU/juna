import mealRepository from '@/repositories/meal.repository';
import mealService from '@/services/meal.service';
import providerRepository from '@/repositories/provider.repository';
import subscriptionProposalRepository from '@/repositories/subscription-proposal.repository';
import { createNotification } from '@/services/notification.service';
import { ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import {
  CreateSubscriptionProposalInput,
  ApproveSubscriptionProposalInput,
  RejectSubscriptionProposalInput,
  SubscriptionProposalFiltersInput,
} from '@/validators/subscription-proposal.validator';

export class SubscriptionProposalService {
  /**
   * Créer une proposition d'abonnement à partir du catalogue d'un provider
   */
  async create(userId: string, data: CreateSubscriptionProposalInput) {
    const provider = await providerRepository.findById(data.providerId);
    if (!provider) {
      throw new NotFoundError('Fournisseur introuvable', ERROR_CODES.PROVIDER_NOT_FOUND);
    }
    if (provider.status !== 'APPROVED') {
      throw new ForbiddenError(
        "Ce fournisseur n'est pas encore approuvé",
        ERROR_CODES.PROVIDER_NOT_APPROVED
      );
    }

    const mealIds = data.meals.map((m) => m.mealId);
    if (new Set(mealIds).size !== mealIds.length) {
      throw new ConflictError(
        'Un même repas ne peut pas apparaître deux fois dans la proposition',
        ERROR_CODES.INVALID_INPUT
      );
    }

    const meals = await mealRepository.findManyByIds(mealIds);
    const errors: string[] = [];
    for (const item of data.meals) {
      const meal = meals.find((m) => m.id === item.mealId);
      if (!meal) {
        errors.push(`Repas introuvable: ${item.mealId}`);
        continue;
      }
      if (meal.providerId !== data.providerId) {
        errors.push(`Le repas "${meal.name}" n'appartient pas à ce fournisseur`);
      }
      if (!meal.isActive) {
        errors.push(`Le repas "${meal.name}" n'est pas actif`);
      }
      if (meal.priceType === 'MULTIPLE') {
        if (!item.mealPricingLabel) {
          errors.push(`Une variante de prix est requise pour "${meal.name}"`);
        } else if (
          !meal.pricings.some((p) => p.label.toLowerCase() === item.mealPricingLabel!.toLowerCase())
        ) {
          errors.push(`Variante de prix invalide pour "${meal.name}"`);
        }
      } else if (item.mealPricingLabel) {
        errors.push(`Le repas "${meal.name}" n'a pas de variantes de prix`);
      }
    }
    if (errors.length > 0) {
      throw new ConflictError(
        `Erreurs de validation: ${errors.join(', ')}`,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const proposal = await subscriptionProposalRepository.create({
      userId,
      providerId: data.providerId,
      type: data.type,
      category: data.category,
      duration: data.duration,
      message: data.message,
      meals: data.meals,
    });

    createNotification(
      provider.userId,
      'SUBSCRIPTION_PROPOSAL_RECEIVED',
      "Nouvelle proposition d'abonnement",
      'Un utilisateur vous propose un nouvel abonnement personnalisé à partir de vos plats.',
      { proposalId: proposal.id }
    );

    return subscriptionProposalRepository.findById(proposal.id);
  }

  /**
   * Détail d'une proposition — accessible par son auteur ou le provider ciblé
   */
  async getById(id: string, requester: { userId: string; providerId: string | null }) {
    const proposal = await subscriptionProposalRepository.findById(id);
    if (!proposal) {
      throw new NotFoundError(
        "Proposition d'abonnement introuvable",
        ERROR_CODES.SUBSCRIPTION_PROPOSAL_NOT_FOUND
      );
    }

    const isOwner = proposal.userId === requester.userId;
    const isTargetProvider =
      requester.providerId !== null && proposal.providerId === requester.providerId;
    if (!isOwner && !isTargetProvider) {
      throw new ForbiddenError(
        "Vous n'êtes pas autorisé à consulter cette proposition",
        ERROR_CODES.FORBIDDEN
      );
    }

    return proposal;
  }

  /**
   * Mes propositions envoyées (consumer)
   */
  async getMine(userId: string, filters?: SubscriptionProposalFiltersInput) {
    return subscriptionProposalRepository.findByUserId(userId, filters);
  }

  /**
   * Propositions reçues (provider)
   */
  async getReceived(providerId: string, filters?: SubscriptionProposalFiltersInput) {
    return subscriptionProposalRepository.findByProviderId(providerId, filters);
  }

  /**
   * Approuver une proposition : le provider fixe les détails finaux de
   * l'abonnement (peut ajuster la liste de repas), un abonnement public est créé.
   */
  async approve(id: string, providerId: string, data: ApproveSubscriptionProposalInput) {
    const proposal = await subscriptionProposalRepository.findById(id);
    if (!proposal) {
      throw new NotFoundError(
        "Proposition d'abonnement introuvable",
        ERROR_CODES.SUBSCRIPTION_PROPOSAL_NOT_FOUND
      );
    }
    if (proposal.providerId !== providerId) {
      throw new ForbiddenError(
        "Vous n'êtes pas autorisé à répondre à cette proposition",
        ERROR_CODES.FORBIDDEN
      );
    }
    if (proposal.status !== 'PENDING') {
      throw new ConflictError(
        'Cette proposition a déjà été traitée',
        ERROR_CODES.SUBSCRIPTION_PROPOSAL_ALREADY_PROCESSED
      );
    }

    const finalMeals =
      data.meals ?? proposal.meals.map((m) => ({ mealId: m.mealId, quantity: m.quantity }));
    const validation = await mealService.validateMealsForSubscription(
      providerId,
      finalMeals.map((m) => m.mealId)
    );
    if (!validation.valid) {
      throw new ConflictError(
        `Erreurs de validation: ${validation.errors.join(', ')}`,
        ERROR_CODES.INVALID_INPUT
      );
    }

    const subscription = await subscriptionProposalRepository.approveInTransaction(
      id,
      providerId,
      {
        name: data.name,
        description: data.description,
        price: data.price,
        junaCommissionPercent: data.junaCommissionPercent,
        type: data.type ?? proposal.type,
        category: data.category ?? proposal.category,
        duration: data.duration ?? proposal.duration,
        imageUrl: data.imageUrl,
        isImmediate: data.isImmediate,
        preparationHours: data.preparationHours,
      },
      finalMeals
    );

    // Race perdue entre la lecture ci-dessus et la transaction : un autre appel
    // a traité la proposition entre-temps (double clic, deux onglets).
    if (!subscription) {
      throw new ConflictError(
        'Cette proposition a déjà été traitée',
        ERROR_CODES.SUBSCRIPTION_PROPOSAL_ALREADY_PROCESSED
      );
    }

    createNotification(
      proposal.userId,
      'SUBSCRIPTION_PROPOSAL_APPROVED',
      'Votre proposition a été acceptée 🎉',
      `"${data.name}" est maintenant disponible chez ${proposal.provider.businessName}.`,
      { proposalId: id, subscriptionId: subscription.id }
    );

    return subscription;
  }

  /**
   * Rejeter une proposition
   */
  async reject(id: string, providerId: string, data: RejectSubscriptionProposalInput) {
    const proposal = await subscriptionProposalRepository.findById(id);
    if (!proposal) {
      throw new NotFoundError(
        "Proposition d'abonnement introuvable",
        ERROR_CODES.SUBSCRIPTION_PROPOSAL_NOT_FOUND
      );
    }
    if (proposal.providerId !== providerId) {
      throw new ForbiddenError(
        "Vous n'êtes pas autorisé à répondre à cette proposition",
        ERROR_CODES.FORBIDDEN
      );
    }
    if (proposal.status !== 'PENDING') {
      throw new ConflictError(
        'Cette proposition a déjà été traitée',
        ERROR_CODES.SUBSCRIPTION_PROPOSAL_ALREADY_PROCESSED
      );
    }

    const rejected = await subscriptionProposalRepository.rejectAtomic(
      id,
      providerId,
      data.rejectionReason
    );
    if (!rejected) {
      throw new ConflictError(
        'Cette proposition a déjà été traitée',
        ERROR_CODES.SUBSCRIPTION_PROPOSAL_ALREADY_PROCESSED
      );
    }

    createNotification(
      proposal.userId,
      'SUBSCRIPTION_PROPOSAL_REJECTED',
      'Mise à jour de votre proposition',
      `Votre proposition d'abonnement chez ${proposal.provider.businessName} n'a pas été retenue : ${data.rejectionReason}`,
      { proposalId: id }
    );

    return { id, status: 'REJECTED' as const, rejectionReason: data.rejectionReason };
  }
}

export default new SubscriptionProposalService();
