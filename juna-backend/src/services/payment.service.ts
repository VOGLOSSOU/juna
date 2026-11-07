import paymentRepository from '@/repositories/payment.repository';
import orderRepository from '@/repositories/order.repository';
import feexPayService, { resolveNetwork } from './feexpay.service';
import { NotFoundError, ForbiddenError, ConflictError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import prisma from '@/config/database';
import { sendOrderConfirmedEmail, sendProviderNewOrderEmail } from '@/services/email.service';
import { createNotification } from '@/services/notification.service';

export function resolvePaymentMethod(provider: string): PaymentMethod {
  const p = provider.toUpperCase();
  if (p.startsWith('MTN')) return PaymentMethod.MOBILE_MONEY_MTN;
  if (p.startsWith('MOOV')) return PaymentMethod.MOBILE_MONEY_MOOV;
  if (p.startsWith('ORANGE')) return PaymentMethod.MOBILE_MONEY_ORANGE;
  if (p.startsWith('WAVE')) return PaymentMethod.MOBILE_MONEY_WAVE;
  return PaymentMethod.MOBILE_MONEY_MTN;
}

async function applyFinalStatus(paymentId: string, orderId: string, gatewayStatus: string, raw: any) {
  if (gatewayStatus === 'SUCCESSFUL') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.SUCCESS, paidAt: new Date(), gatewayResponse: raw },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED },
      }),
    ]);

    // Emails de notification — non-bloquants
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        subscription: {
          include: {
            provider: { include: { user: true } },
          },
        },
      },
    });

    if (order) {
      sendOrderConfirmedEmail(order.user.email, order.user.name, {
        orderNumber: order.orderNumber,
        subscriptionName: order.subscription.name,
        amount: order.amount,
        currency: 'FCFA',
      }).catch(() => {});

      createNotification(
        order.user.id,
        'ORDER_CONFIRMATION',
        'Commande confirmée ✅',
        `Votre paiement pour "${order.subscription.name}" a bien été reçu. Activez votre commande depuis l'application.`,
        { orderNumber: order.orderNumber, orderId: order.id }
      );

      const providerUser = order.subscription.provider.user;
      sendProviderNewOrderEmail(providerUser.email, providerUser.name, {
        orderNumber: order.orderNumber,
        subscriptionName: order.subscription.name,
        customerName: order.user.name,
      }).catch(() => {});

      createNotification(
        providerUser.id,
        'ORDER_CONFIRMATION',
        'Nouvelle commande reçue 🍽️',
        `${order.user.name} vient de confirmer une commande pour "${order.subscription.name}".`,
        { orderNumber: order.orderNumber, orderId: order.id }
      );
    }
  } else if (gatewayStatus === 'FAILED') {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED, gatewayResponse: raw },
    });
  }
}

export class PaymentService {
  async initiateDeposit(
    userId: string,
    data: { orderId: string; phoneNumber: string; provider?: string }
  ) {
    const order = await orderRepository.findById(data.orderId);
    if (!order) throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);

    if (order.userId !== userId) throw new ForbiddenError('Accès refusé', ERROR_CODES.FORBIDDEN);

    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictError('Cette commande ne peut plus être payée', ERROR_CODES.PAYMENT_ALREADY_PROCESSED);
    }

    const existing = await paymentRepository.findByOrderId(data.orderId);
    if (existing && (existing.status === PaymentStatus.PROCESSING || existing.status === PaymentStatus.SUCCESS)) {
      throw new ConflictError('Un paiement est déjà en cours pour cette commande', ERROR_CODES.PAYMENT_ALREADY_PROCESSED);
    }

    const network = resolveNetwork(data.provider);
    const method = resolvePaymentMethod(data.provider ?? 'MTN');

    // FeexPay génère lui-même la référence de transaction (contrairement à PawaPay où
    // on la choisissait nous-mêmes) — on appelle donc la passerelle avant de créer
    // le Payment en base, pour l'enregistrer directement avec la vraie référence.
    const feexpayResponse = await feexPayService.requestToPay(network, {
      phoneNumber: data.phoneNumber,
      amount: Math.round(order.amount),
      description: `Commande ${order.orderNumber}`,
      callback_info: order.id,
    });

    const payment = await paymentRepository.create({
      orderId: data.orderId,
      userId,
      amount: order.amount,
      currency: 'XOF',
      method,
      transactionId: feexpayResponse.reference,
      gatewayResponse: feexpayResponse,
    });

    return {
      paymentId: payment.id,
      reference: feexpayResponse.reference,
      status: 'PROCESSING',
      message: 'Paiement initié. Veuillez valider sur votre téléphone.',
    };
  }

  async getStatus(paymentId: string, userId: string) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw new NotFoundError('Paiement introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    if (payment.userId !== userId) throw new ForbiddenError('Accès refusé', ERROR_CODES.FORBIDDEN);

    // Pas de webhook de confirmation temps réel documenté côté FeexPay pour l'instant —
    // on s'appuie entièrement sur ce polling direct pour résoudre le statut final.
    if (payment.status === PaymentStatus.PROCESSING && payment.transactionId) {
      try {
        const remote = await feexPayService.getDepositStatus(payment.transactionId);

        if (remote.status === 'SUCCESSFUL' || remote.status === 'FAILED') {
          console.log('[Sync] Updating payment %s from PROCESSING to %s via direct poll', payment.id, remote.status);
          await applyFinalStatus(payment.id, payment.orderId, remote.status, remote);
          const updated = await paymentRepository.findById(paymentId);
          return formatPayment(updated!);
        }
      } catch (err) {
        // Erreur du poll direct — on retourne simplement le statut en base sans bloquer
        console.warn('[Sync] Could not fetch deposit status from FeexPay:', (err as any)?.message);
      }
    }

    return formatPayment(payment);
  }
}

function formatPayment(payment: any) {
  return {
    id: payment.id,
    orderId: payment.orderId,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  };
}

export default new PaymentService();
