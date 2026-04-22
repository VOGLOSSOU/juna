import { v4 as uuidv4 } from 'uuid';
import paymentRepository from '@/repositories/payment.repository';
import orderRepository from '@/repositories/order.repository';
import pawaPayService from './pawapay.service';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import prisma from '@/config/database';

function resolvePaymentMethod(provider: string): PaymentMethod {
  const p = provider.toUpperCase();
  if (p.startsWith('MTN')) return PaymentMethod.MOBILE_MONEY_MTN;
  if (p.startsWith('MOOV')) return PaymentMethod.MOBILE_MONEY_MOOV;
  if (p.startsWith('ORANGE')) return PaymentMethod.MOBILE_MONEY_ORANGE;
  if (p.startsWith('WAVE')) return PaymentMethod.MOBILE_MONEY_WAVE;
  return PaymentMethod.MOBILE_MONEY_MTN;
}

export class PaymentService {
  /**
   * Initier un dépôt PawaPay pour payer une commande
   */
  async initiateDeposit(
    userId: string,
    data: {
      orderId: string;
      phoneNumber: string;
      provider?: string;
    }
  ) {
    const order = await orderRepository.findById(data.orderId);
    if (!order) {
      throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
    }

    if (order.userId !== userId) {
      throw new ForbiddenError('Accès refusé', ERROR_CODES.FORBIDDEN);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictError(
        'Cette commande ne peut plus être payée',
        ERROR_CODES.PAYMENT_ALREADY_PROCESSED
      );
    }

    const existing = await paymentRepository.findByOrderId(data.orderId);
    if (existing && (existing.status === PaymentStatus.PROCESSING || existing.status === PaymentStatus.SUCCESS)) {
      throw new ConflictError(
        'Un paiement est déjà en cours pour cette commande',
        ERROR_CODES.PAYMENT_ALREADY_PROCESSED
      );
    }

    // Prédire l'opérateur si non fourni, et valider le numéro
    let resolvedProvider = data.provider;
    let resolvedPhone = data.phoneNumber;

    const prediction = await pawaPayService.predictProvider(data.phoneNumber);
    resolvedPhone = prediction.phoneNumber;
    if (!resolvedProvider) {
      resolvedProvider = prediction.provider;
    }

    const depositId = uuidv4();
    const method = resolvePaymentMethod(resolvedProvider);

    const payment = await paymentRepository.create({
      orderId: data.orderId,
      userId,
      amount: order.amount,
      currency: 'XOF',
      method,
      transactionId: depositId,
    });

    const pawapayResponse = await pawaPayService.initiateDeposit({
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
      statementDescription: `JUNA - Abonnement`,
    });

    if (pawapayResponse.status === 'REJECTED') {
      await paymentRepository.updateStatus(payment.id, PaymentStatus.FAILED, {
        gatewayResponse: pawapayResponse,
      });
      throw new ValidationError(
        pawapayResponse.failureReason?.failureMessage ?? 'Paiement refusé par l\'opérateur',
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

  /**
   * Traiter le callback PawaPay (webhook deposit)
   */
  async handleDepositCallback(payload: any) {
    const { depositId, status } = payload;

    if (!depositId || !status) return;

    const payment = await paymentRepository.findByTransactionId(depositId);
    if (!payment) return;

    if (payment.status === PaymentStatus.SUCCESS || payment.status === PaymentStatus.FAILED) {
      return;
    }

    if (status === 'COMPLETED') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(),
            gatewayResponse: payload,
          },
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.CONFIRMED },
        }),
      ]);
    } else if (status === 'FAILED') {
      await paymentRepository.updateStatus(payment.id, PaymentStatus.FAILED, {
        gatewayResponse: payload,
      });
    }
  }

  /**
   * Obtenir le statut d'un paiement
   */
  async getStatus(paymentId: string, userId: string) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Paiement introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (payment.userId !== userId) {
      throw new ForbiddenError('Accès refusé', ERROR_CODES.FORBIDDEN);
    }

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
}

export default new PaymentService();
