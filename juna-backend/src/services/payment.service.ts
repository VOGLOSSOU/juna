import { randomUUID } from 'crypto';
import paymentRepository from '@/repositories/payment.repository';
import orderRepository from '@/repositories/order.repository';
import pawaPayService from './pawapay.service';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import prisma from '@/config/database';
import { sendOrderConfirmedEmail, sendProviderNewOrderEmail } from '@/services/email.service';

function resolvePaymentMethod(provider: string): PaymentMethod {
  const p = provider.toUpperCase();
  if (p.startsWith('MTN')) return PaymentMethod.MOBILE_MONEY_MTN;
  if (p.startsWith('MOOV')) return PaymentMethod.MOBILE_MONEY_MOOV;
  if (p.startsWith('ORANGE')) return PaymentMethod.MOBILE_MONEY_ORANGE;
  if (p.startsWith('WAVE')) return PaymentMethod.MOBILE_MONEY_WAVE;
  return PaymentMethod.MOBILE_MONEY_MTN;
}

async function applyFinalStatus(paymentId: string, orderId: string, pawapayStatus: string, raw: any) {
  if (pawapayStatus === 'COMPLETED') {
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

      const providerUser = order.subscription.provider.user;
      sendProviderNewOrderEmail(providerUser.email, providerUser.name, {
        orderNumber: order.orderNumber,
        subscriptionName: order.subscription.name,
        customerName: order.user.name,
      }).catch(() => {});
    }
  } else if (pawapayStatus === 'FAILED') {
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

    const prediction = await pawaPayService.predictProvider(data.phoneNumber);
    const resolvedPhone = prediction.phoneNumber;
    const resolvedProvider = data.provider ?? prediction.provider;

    const depositId = randomUUID();
    const method = resolvePaymentMethod(resolvedProvider);

    const payment = await paymentRepository.create({
      orderId: data.orderId,
      userId,
      amount: order.amount,
      currency: 'XOF',
      method,
      transactionId: depositId,
    });

    let pawapayResponse: any;
    try {
      pawapayResponse = await pawaPayService.initiateDeposit({
        depositId,
        amount: String(Math.round(order.amount)),
        currency: 'XOF',
        payer: {
          type: 'MMO',
          accountDetails: {
            phoneNumber: resolvedPhone,
            provider: resolvedProvider,
          },
        },
      });
    } catch (err) {
      // L'appel PawaPay a échoué — marquer le payment FAILED pour ne pas laisser un PROCESSING orphelin
      await paymentRepository.updateStatus(payment.id, PaymentStatus.FAILED, {
        gatewayResponse: { error: (err as any)?.message ?? 'PawaPay unreachable' },
      });
      throw err;
    }

    if (pawapayResponse.status === 'REJECTED') {
      await paymentRepository.updateStatus(payment.id, PaymentStatus.FAILED, {
        gatewayResponse: pawapayResponse,
      });
      throw new ValidationError(
        pawapayResponse.failureReason?.failureMessage ?? "Paiement refusé par l'opérateur",
        ERROR_CODES.PAYMENT_FAILED
      );
    }

    await paymentRepository.updateStatus(payment.id, PaymentStatus.PROCESSING, {
      gatewayResponse: pawapayResponse,
    });

    return {
      paymentId: payment.id,
      depositId,
      status: 'PROCESSING',
      message: 'Paiement initié. Veuillez valider sur votre téléphone.',
    };
  }

  async handleDepositCallback(payload: any) {
    const { depositId, status } = payload;
    if (!depositId || !status) return;

    const payment = await paymentRepository.findByTransactionId(depositId);
    if (!payment) {
      console.warn('[Webhook] Payment not found for depositId:', depositId);
      return;
    }

    if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED) return;

    console.log('[Webhook] Received status=%s for depositId=%s paymentId=%s', status, depositId, payment.id);
    await applyFinalStatus(payment.id, payment.orderId, status, payload);
  }

  async getStatus(paymentId: string, userId: string) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw new NotFoundError('Paiement introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    if (payment.userId !== userId) throw new ForbiddenError('Accès refusé', ERROR_CODES.FORBIDDEN);

    // Fallback : si toujours PROCESSING, on interroge PawaPay directement
    // Couvre le cas où le webhook n'est pas encore configuré ou n'est pas arrivé
    if (payment.status === PaymentStatus.PROCESSING && payment.transactionId) {
      try {
        const remote = await pawaPayService.getDepositStatus(payment.transactionId);
        const remoteStatus: string = Array.isArray(remote) ? remote[0]?.status : remote?.status;

        if (remoteStatus === 'COMPLETED' || remoteStatus === 'FAILED') {
          console.log('[Sync] Updating payment %s from PROCESSING to %s via direct poll', payment.id, remoteStatus);
          await applyFinalStatus(payment.id, payment.orderId, remoteStatus, remote);
          const updated = await paymentRepository.findById(paymentId);
          return formatPayment(updated!);
        }
      } catch (err) {
        // Erreur du poll direct — on retourne simplement le statut en base sans bloquer
        console.warn('[Sync] Could not fetch deposit status from PawaPay:', (err as any)?.message);
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
