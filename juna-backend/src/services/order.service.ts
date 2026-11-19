import orderRepository from '@/repositories/order.repository';
import subscriptionRepository from '@/repositories/subscription.repository';
import providerRepository from '@/repositories/provider.repository';
import userRepository from '@/repositories/user.repository';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { OrderStatus, DeliveryMethod, SubscriptionDuration } from '@prisma/client';
import prisma from '@/config/database';
import { lockPaymentOrder } from '@/utils/payment-lock.util';
import payoutService from '@/services/payout.service';
import adminEventEmailService from '@/services/admin-event-email.service';

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
    // Vérifier que l'email de l'user est vérifié
    const currentUser = await userRepository.findById(userId);
    if (!currentUser?.isVerified) {
      throw new ForbiddenError('Vous devez vérifier votre email avant de passer une commande', ERROR_CODES.EMAIL_NOT_VERIFIED);
    }

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
      // Figé ici, définitivement — c'est ce montant précis que le prestataire
      // recevra à l'activation, quel que soit le prix de l'abonnement plus tard.
      providerAmount: subscription.providerPrice,
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

    const { user, ...providerRest } = order.subscription.provider;
    return {
      ...order,
      subscription: {
        ...order.subscription,
        provider: {
          ...providerRest,
          phone: user.phone,
        },
      },
    };
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
    const orders = await orderRepository.findByUserId(userId);
    return orders.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      amount: o.amount,
      currency: 'XOF',
      deliveryMethod: o.deliveryMethod,
      deliveryAddress: o.deliveryAddress ?? null,
      pickupLocation: o.pickupLocation ?? null,
      scheduledFor: o.scheduledFor ?? null,
      completedAt: o.completedAt ?? null,
      createdAt: o.createdAt ?? null,
      updatedAt: o.updatedAt ?? null,
      subscription: o.subscription ?? null,
      payment: o.payment ?? null,
    }));
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
    page?: number;
    limit?: number;
  }) {
    return orderRepository.findAll(filters);
  }

  /**
   * Activer la commande (user)
   */
  async activate(id: string, userId: string) {
    const payout = await prisma.$transaction(async (tx) => {
      await lockPaymentOrder(tx, id);

      const order = await tx.order.findUnique({ where: { id } });
      if (!order) {
        throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
      }

      if (order.userId !== userId) {
        throw new ForbiddenError(
          'Vous n\'êtes pas autorisé à activer cette commande',
          ERROR_CODES.FORBIDDEN
        );
      }

      if (order.status !== OrderStatus.CONFIRMED) {
        throw new ValidationError(
          'La commande doit être confirmée avant d\'être activée',
          ERROR_CODES.INVALID_INPUT
        );
      }

      // Récupérer la subscription complète pour avoir la duration
      const subscription = await tx.subscription.findUnique({ where: { id: order.subscriptionId } });
      if (!subscription) {
        throw new NotFoundError('Abonnement introuvable', ERROR_CODES.SUBSCRIPTION_NOT_FOUND);
      }

      // La durée part du moment de l'activation, pas de scheduledFor
      // scheduledFor reste utile pour le provider (info de préparation)
      const activatedAt = new Date();
      const durationDays = DURATION_DAYS[subscription.duration];
      const endsAt = new Date(activatedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Activer la commande ET créer l'abonnement actif
      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.ACTIVE, activatedAt }
      });
      await tx.activeSubscription.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          subscriptionId: subscription.id,
          startedAt: activatedAt,
          endsAt: endsAt,
          duration: subscription.duration,
        }
      });

      // L'intention de versement est créée DANS cette même transaction : même si
      // le process s'arrête juste après le commit, la ligne existe déjà et la
      // réconciliation la reprendra — rien n'est perdu.
      const intent = await payoutService.createIntent(tx, order.id, subscription.providerId, order.providerAmount);
      await adminEventEmailService.enqueue(tx, 'ORDER_ACTIVATED', order.id);
      return intent;
    });

    void adminEventEmailService.deliverForOrder('ORDER_ACTIVATED', id).catch(() => {
      console.error('[Admin email] Activation alert deferred for order %s', id);
    });
    if (payout.status === 'PENDING') {
      // Hors transaction : un appel FeexPay lent ou en échec ne doit jamais
      // remettre en cause l'activation déjà actée.
      payoutService.attemptPayout(payout.id).catch((error) => {
        console.error(
          '[Order] Payout attempt failed for order %s: %s',
          id,
          error instanceof Error ? error.message : 'unknown error'
        );
      });
    }

    return { message: 'Commande activée avec succès' };
  }

  /**
   * Valider le retrait/livraison (scan QR)
   */
  async complete(id: string, qrCode: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
    }

    if (order.qrCode !== qrCode) {
      throw new ValidationError('QR code invalide', ERROR_CODES.INVALID_INPUT);
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new ConflictError(
        'Cette commande est déjà terminée',
        ERROR_CODES.QR_CODE_ALREADY_USED
      );
    }

    if (order.status !== OrderStatus.ACTIVE) {
      throw new ValidationError(
        'La commande doit être active pour être validée',
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Marquer comme terminée avec timestamp
    return prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.COMPLETED,
        completedAt: new Date()
      }
    });
  }

  /**
   * Annuler une commande
   */
  async cancel(id: string, userId: string, userRole: string) {
    return prisma.$transaction(async tx => {
      await lockPaymentOrder(tx, id);
      const order = await tx.order.findUnique({where: {id}});
      if (!order) throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
      if (order.userId !== userId && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError("Vous n'êtes pas autorisé à annuler cette commande", ERROR_CODES.FORBIDDEN);
      }
      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
        throw new ConflictError('Cette commande ne peut plus être annulée', ERROR_CODES.ORDER_CANNOT_BE_CANCELLED);
      }
      const payment = await tx.payment.findUnique({where: {orderId: id}});
      if (payment && ['PENDING', 'PROCESSING', 'SUCCESS'].includes(payment.status)) {
        throw new ConflictError(
          "Un paiement est en cours ou a été reçu. Contactez l'assistance pour annuler cette commande.",
          'PAYMENT_CANCELLATION_REQUIRES_SUPPORT'
        );
      }
      const cancelled = await tx.order.update({where: {id}, data: {status: OrderStatus.CANCELLED}});
      await tx.subscription.update({where: {id: order.subscriptionId}, data: {subscriberCount: {decrement: 1}}});
      return cancelled;
    });
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
