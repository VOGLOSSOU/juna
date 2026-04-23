import orderRepository from '@/repositories/order.repository';
import subscriptionRepository from '@/repositories/subscription.repository';
import providerRepository from '@/repositories/provider.repository';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { OrderStatus, DeliveryMethod, SubscriptionDuration } from '@prisma/client';

const DURATION_DAYS: Record<SubscriptionDuration, number> = {
  DAY:        1,
  THREE_DAYS: 3,
  WEEK:       7,
  TWO_WEEKS:  14,
  MONTH:      30,
  WORK_WEEK:  5,
  WORK_WEEK_2: 10,
  WORK_MONTH: 20,
  WEEKEND:    2,
};
import { randomBytes } from 'crypto';

export class OrderService {
  /**
   * Créer une commande (souscription à un abonnement)
   */
  async create(
    userId: string,
    data: {
      subscriptionId: string;
      deliveryMethod: DeliveryMethod;
      deliveryAddress?: string;
      deliveryCity?: string;
      pickupLocation?: string;
      startAsap?: boolean;
      requestedStartDate?: string;
    }
  ) {
    // Vérifier que l'abonnement existe et est actif
    const subscription = await subscriptionRepository.findById(data.subscriptionId);
    if (!subscription) {
      throw new NotFoundError('Abonnement introuvable', ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
    }

    if (!subscription.isActive || !subscription.isPublic) {
      throw new ValidationError(
        'Cet abonnement n\'est pas disponible',
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Vérifier que le fournisseur est approuvé
    const provider = await providerRepository.findById(subscription.providerId);
    if (!provider || provider.status !== 'APPROVED') {
      throw new ValidationError(
        'Ce fournisseur n\'est pas disponible',
        ERROR_CODES.PROVIDER_NOT_APPROVED
      );
    }

    // Vérifier que le mode de réception choisi est bien supporté par le provider
    if (data.deliveryMethod === DeliveryMethod.DELIVERY && !provider.acceptsDelivery) {
      throw new ValidationError(
        'Ce prestataire ne propose pas la livraison',
        ERROR_CODES.INVALID_INPUT
      );
    }

    if (data.deliveryMethod === DeliveryMethod.PICKUP && !provider.acceptsPickup) {
      throw new ValidationError(
        'Ce prestataire n\'accepte pas le retrait sur place',
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Plus de calcul automatique des frais de livraison
    // Le prix affiché est une estimation, le vrai coût sera négocié avec le provider
    const deliveryCost = 0;

    // Calculer la date de début de l'abonnement
    const now = new Date();
    const earliestStart = new Date(now.getTime() + subscription.preparationHours * 60 * 60 * 1000);

    let scheduledFor: Date;
    if (data.startAsap) {
      scheduledFor = earliestStart;
    } else {
      const requested = new Date(data.requestedStartDate!);
      if (requested < earliestStart) {
        throw new ValidationError(
          `La date de début doit être au moins ${subscription.preparationHours}h après maintenant (au plus tôt le ${earliestStart.toISOString()})`,
          ERROR_CODES.INVALID_INPUT
        );
      }
      scheduledFor = requested;
    }

    // Générer le numéro de commande et QR code
    const orderNumber = await orderRepository.getNextOrderNumber();
    const qrCode = `JUNA-${randomBytes(4).toString('hex').toUpperCase()}`;

    // Créer la commande (montant total = prix abonnement + frais de livraison)
    const order = await orderRepository.create({
      user: { connect: { id: userId } },
      subscription: { connect: { id: data.subscriptionId } },
      orderNumber,
      amount: subscription.price + deliveryCost,
      status: OrderStatus.PENDING,
      deliveryMethod: data.deliveryMethod,
      deliveryAddress: data.deliveryAddress,
      deliveryCity: data.deliveryCity,
      deliveryCost,
      pickupLocation: data.pickupLocation,
      scheduledFor,
      qrCode,
    });

    // Incrémenter le nombre d'abonnés
    await subscriptionRepository.incrementSubscriberCount(data.subscriptionId);

    return order;
  }

  /**
   * Obtenir une commande par ID
   */
  async getById(id: string) {
    const order = await orderRepository.findByIdWithRelations(id);
    if (!order) {
      throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
    }
    return order;
  }

  /**
   * Obtenir une commande par numéro
   */
  async getByOrderNumber(orderNumber: string) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
    }
    return order;
  }

  /**
   * Obtenir une commande par QR code
   */
  async getByQrCode(qrCode: string) {
    const order = await orderRepository.findByQrCode(qrCode);
    if (!order) {
      throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
    }
    return order;
  }

  /**
   * Obtenir mes commandes
   */
  async getMyOrders(userId: string) {
    return orderRepository.findByUserId(userId);
  }

  /**
   * Obtenir les commandes d'un fournisseur
   */
  async getByProviderId(providerId: string) {
    return orderRepository.findByProviderId(providerId);
  }

  /**
   * Lister toutes les commandes (admin)
   */
  async getAll(filters?: {
    userId?: string;
    subscriptionId?: string;
    providerId?: string;
    status?: OrderStatus;
    deliveryMethod?: DeliveryMethod;
  }) {
    return orderRepository.findAll(filters);
  }

  /**
   * Confirmer une commande
   */
  async confirm(id: string, providerId: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
    }

    // Vérifier que c'est le bon fournisseur
    const subscription = await subscriptionRepository.findById(order.subscriptionId);
    if (!subscription || subscription.providerId !== providerId) {
      throw new ForbiddenError(
        'Vous n\'êtes pas autorisé à modifier cette commande',
        ERROR_CODES.FORBIDDEN
      );
    }

    // Vérifier le statut actuel
    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictError(
        'Cette commande ne peut pas être confirmée',
        ERROR_CODES.ORDER_ALREADY_CANCELLED
      );
    }

    return orderRepository.updateStatus(id, OrderStatus.CONFIRMED);
  }

  /**
   * Marquer la commande comme prête
   */
  async markReady(id: string, providerId: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
    }

    const subscription = await subscriptionRepository.findById(order.subscriptionId);
    if (!subscription || subscription.providerId !== providerId) {
      throw new ForbiddenError(
        'Vous n\'êtes pas autorisé à modifier cette commande',
        ERROR_CODES.FORBIDDEN
      );
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new ValidationError(
        'La commande doit être confirmée avant d\'être marquée comme prête',
        ERROR_CODES.INVALID_INPUT
      );
    }

    return orderRepository.updateStatus(id, OrderStatus.READY);
  }

  /**
   * Valider le retrait/livraison (scan QR)
   */
  async complete(id: string, qrCode: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
    }

    // Vérifier le QR code
    if (order.qrCode !== qrCode) {
      throw new ValidationError(
        'QR code invalide',
        ERROR_CODES.QR_CODE_INVALID
      );
    }

    // Vérifier si déjà utilisé
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.COMPLETED) {
      throw new ConflictError(
        'QR code déjà utilisé',
        ERROR_CODES.QR_CODE_ALREADY_USED
      );
    }

    // Selon le type de livraison
    if (order.deliveryMethod === DeliveryMethod.PICKUP) {
      return orderRepository.updateStatus(id, OrderStatus.COMPLETED);
    } else {
      return orderRepository.updateStatus(id, OrderStatus.DELIVERED);
    }
  }

  /**
   * Annuler une commande
   */
  async cancel(id: string, userId: string, userRole: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (order.userId !== userId && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new ForbiddenError(
        'Vous n\'êtes pas autorisé à annuler cette commande',
        ERROR_CODES.FORBIDDEN
      );
    }

    // Vérifier si annulable (seulement PENDING ou CONFIRMED)
    if (order.status === OrderStatus.READY ||
        order.status === OrderStatus.IN_DELIVERY ||
        order.status === OrderStatus.DELIVERED ||
        order.status === OrderStatus.COMPLETED ||
        order.status === OrderStatus.CANCELLED) {
      throw new ConflictError(
        'Cette commande ne peut plus être annulée',
        ERROR_CODES.ORDER_CANNOT_BE_CANCELLED
      );
    }

    const cancelledOrder = await orderRepository.updateStatus(id, OrderStatus.CANCELLED);

    // Décrémenter le nombre d'abonnés
    await subscriptionRepository.decrementSubscriberCount(order.subscriptionId);

    return cancelledOrder;
  }

  /**
   * Régénérer le QR code
   */
  async regenerateQrCode(id: string, providerId: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
    }

    const subscription = await subscriptionRepository.findById(order.subscriptionId);
    if (!subscription || subscription.providerId !== providerId) {
      throw new ForbiddenError(
        'Vous n\'êtes pas autorisé à modifier cette commande',
        ERROR_CODES.FORBIDDEN
      );
    }

    // Limiter la régénération (max 3 fois)
    const qrCode = `JUNA-${randomBytes(4).toString('hex').toUpperCase()}`;

    return orderRepository.updateQrCode(id, qrCode);
  }

  /**
   * Compter les commandes en attente
   */
  async countPending(): Promise<number> {
    return orderRepository.countByStatus(OrderStatus.PENDING);
  }

  /**
   * Compter les commandes d'un fournisseur
   */
  async countByProvider(providerId: string): Promise<number> {
    return orderRepository.countByProvider(providerId);
  }
}

export default new OrderService();
