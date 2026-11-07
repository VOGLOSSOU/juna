import { randomUUID } from 'crypto';
import { Payment, PaymentMethod, PaymentStatus, OrderStatus, Prisma } from '@prisma/client';
import prisma from '@/config/database';
import paymentRepository from '@/repositories/payment.repository';
import feexPayService, {
  callbackValue,
  DepositStatusResponse,
  FeexPayRequestError,
  normalizePaymentPhone,
  resolveNetwork,
} from './feexpay.service';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { lockPaymentOrder } from '@/utils/payment-lock.util';
import { sendOrderConfirmedEmail, sendProviderNewOrderEmail } from '@/services/email.service';
import { createNotification } from '@/services/notification.service';
import type { FeexPayWebhook } from '@/validators/payment.validator';

const pendingStatuses: PaymentStatus[] = [PaymentStatus.PENDING, PaymentStatus.PROCESSING];
const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const isPending = (status: PaymentStatus) => pendingStatuses.includes(status);

export function resolvePaymentMethod(provider: string): PaymentMethod {
  return {
    mtn: PaymentMethod.MOBILE_MONEY_MTN,
    moov: PaymentMethod.MOBILE_MONEY_MOOV,
    celtiis_bj: PaymentMethod.MOBILE_MONEY_CELTIIS,
  }[resolveNetwork(provider)];
}

async function notifyConfirmed(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      subscription: { include: { provider: { include: { user: true } } } },
    },
  });
  if (!order) return;
  const provider = order.subscription.provider.user;
  await Promise.allSettled([
    sendOrderConfirmedEmail(order.user.email, order.user.name, {
      orderNumber: order.orderNumber,
      subscriptionName: order.subscription.name,
      amount: order.amount,
      currency: 'FCFA',
    }),
    sendProviderNewOrderEmail(provider.email, provider.name, {
      orderNumber: order.orderNumber,
      subscriptionName: order.subscription.name,
      customerName: order.user.name,
    }),
    createNotification(
      order.userId,
      'ORDER_CONFIRMATION',
      'Commande confirmée',
      `Votre paiement pour "${order.subscription.name}" a bien été reçu. Activez votre commande depuis l'application.`,
      { orderNumber: order.orderNumber, orderId }
    ),
    createNotification(
      provider.id,
      'ORDER_CONFIRMATION',
      'Nouvelle commande reçue',
      `${order.user.name} vient de confirmer une commande pour "${order.subscription.name}".`,
      { orderNumber: order.orderNumber, orderId }
    ),
  ]);
}

export class PaymentService {
  private reconciling = false;

  private async reserve(userId: string, orderId: string, phoneNumber: string, provider: string) {
    return prisma.$transaction(async (tx) => {
      await lockPaymentOrder(tx, orderId);
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new NotFoundError('Commande introuvable', ERROR_CODES.ORDER_NOT_FOUND);
      if (order.userId !== userId) throw new ForbiddenError('Accès refusé', ERROR_CODES.FORBIDDEN);
      if (order.status !== OrderStatus.PENDING) {
        throw new ConflictError(
          'Cette commande ne peut plus être payée',
          ERROR_CODES.PAYMENT_ALREADY_PROCESSED
        );
      }
      const existing = await tx.payment.findUnique({ where: { orderId } });
      if (existing && existing.status !== PaymentStatus.FAILED) {
        if (existing.gateway === 'FEEXPAY' && isPending(existing.status)) {
          const attempt = await tx.paymentAttempt.findFirst({
            where: { paymentId: existing.id, status: { in: pendingStatuses } },
          });
          if (attempt) return { payment: existing, attempt, order, fresh: false };
        }
        throw new ConflictError(
          'Un paiement est déjà en cours ou nécessite un contrôle.',
          'PAYMENT_ALREADY_PROCESSED'
        );
      }
      if (
        existing &&
        (await tx.paymentAttempt.count({
          where: {
            paymentId: existing.id,
            OR: [{ status: { in: pendingStatuses } }, { needsReview: true }],
          },
        }))
      ) {
        throw new ConflictError(
          'Ce paiement nécessite un contrôle avant une nouvelle tentative.',
          'PAYMENT_REVIEW_REQUIRED'
        );
      }
      const amount = Math.round(order.amount);
      if (!Number.isFinite(amount) || amount < 100 || amount > 2000000) {
        throw new ValidationError(
          'Le montant doit être compris entre 100 et 2 000 000 FCFA.',
          'INVALID_PAYMENT_AMOUNT'
        );
      }
      const method = resolvePaymentMethod(provider);
      const paymentData = {
        amount,
        method,
        currency: 'XOF',
        status: PaymentStatus.PROCESSING,
        gateway: 'FEEXPAY',
        transactionId: null,
        paidAt: null,
        gatewayResponse: Prisma.DbNull,
      };
      const payment = existing
        ? await tx.payment.update({ where: { id: existing.id }, data: paymentData })
        : await tx.payment.create({ data: { ...paymentData, orderId, userId } });
      const id = randomUUID();
      const attempt = await tx.paymentAttempt.create({
        data: {
          id,
          paymentId: payment.id,
          callbackInfo: id,
          amount,
          method,
          phoneNumber,
          network: resolveNetwork(provider),
        },
      });
      // Use the same integer amount in the order, gateway and payment ledger.
      if (order.amount !== amount)
        await tx.order.update({ where: { id: orderId }, data: { amount } });
      return { payment, attempt, order, fresh: true };
    });
  }

  private async bindReference(attemptId: string, reference: string, response?: unknown) {
    const initial = await prisma.paymentAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: { payment: true },
    });
    return prisma.$transaction(async (tx) => {
      await lockPaymentOrder(tx, initial.payment.orderId);
      const attempt = await tx.paymentAttempt.findUniqueOrThrow({ where: { id: attemptId } });
      if (attempt.reference && attempt.reference !== reference) {
        throw new ConflictError(
          'La référence de paiement ne correspond pas.',
          'PAYMENT_REFERENCE_MISMATCH'
        );
      }
      await tx.paymentAttempt.update({
        where: { id: attemptId },
        data: {
          reference,
          ...(response && isPending(attempt.status) ? { gatewayResponse: json(response) } : {}),
        },
      });
      // Do not overwrite a terminal status if an early webhook already finalized it.
      await tx.payment.updateMany({
        where: {
          id: attempt.paymentId,
          status: { in: pendingStatuses },
          OR: [{ transactionId: null }, { transactionId: reference }],
        },
        data: { transactionId: reference },
      });
    });
  }

  private async applyVerified(attemptId: string, remote: DepositStatusResponse) {
    const initial = await prisma.paymentAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: { payment: true },
    });
    const result = await prisma.$transaction(async (tx) => {
      await lockPaymentOrder(tx, initial.payment.orderId);
      const attempt = await tx.paymentAttempt.findUniqueOrThrow({ where: { id: attemptId } });
      const callback = callbackValue(remote.callback_info);
      const mismatch =
        (attempt.reference && remote.reference !== attempt.reference) ||
        remote.amount !== attempt.amount ||
        (callback !== null && callback !== attempt.callbackInfo);
      if (mismatch) {
        await tx.paymentAttempt.update({
          where: { id: attemptId },
          data: {
            needsReview: true,
            reviewReason: 'GATEWAY_DATA_MISMATCH',
            lastCheckedAt: new Date(),
          },
        });
        return { mismatch: true, confirmed: false };
      }
      // Monotonic transitions: duplicated or stale callbacks never change a final attempt.
      if (!isPending(attempt.status)) return { confirmed: false };
      const finalStatus =
        remote.status === 'SUCCESSFUL'
          ? PaymentStatus.SUCCESS
          : remote.status === 'FAILED'
            ? PaymentStatus.FAILED
            : null;
      await tx.paymentAttempt.update({
        where: { id: attemptId },
        data: {
          reference: remote.reference,
          gatewayResponse: json(remote),
          lastCheckedAt: new Date(),
          needsReview: false,
          reviewReason: null,
          ...(finalStatus ? { status: finalStatus } : {}),
        },
      });
      if (!finalStatus) return { confirmed: false };
      const changed = await tx.payment.updateMany({
        where: {
          id: attempt.paymentId,
          gateway: 'FEEXPAY',
          status: { in: pendingStatuses },
          OR: [{ transactionId: null }, { transactionId: remote.reference }],
        },
        data: {
          transactionId: remote.reference,
          status: finalStatus,
          gatewayResponse: json(remote),
          ...(finalStatus === PaymentStatus.SUCCESS ? { paidAt: new Date() } : {}),
        },
      });
      if (finalStatus !== PaymentStatus.SUCCESS || changed.count !== 1) return { confirmed: false };
      const confirmed = await tx.order.updateMany({
        where: { id: initial.payment.orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.CONFIRMED },
      });
      if (!confirmed.count) {
        const order = await tx.order.findUniqueOrThrow({ where: { id: initial.payment.orderId } });
        if (order.status === OrderStatus.CANCELLED) {
          await tx.paymentAttempt.update({
            where: { id: attemptId },
            data: {
              needsReview: true,
              reviewReason: 'PAID_CANCELLED_ORDER',
            },
          });
        }
      }
      return { confirmed: confirmed.count === 1 };
    });
    if (result.mismatch)
      throw new ConflictError('Données de paiement incohérentes.', 'PAYMENT_DATA_MISMATCH');
    if (result.confirmed) {
      // Only the transaction that changes PENDING -> CONFIRMED sends notifications.
      // Notification outages must not make a confirmed payment look failed.
      try {
        await notifyConfirmed(initial.payment.orderId);
      } catch {
        console.error(
          '[Payment] Confirmation notification failed for order %s',
          initial.payment.orderId
        );
      }
    }
  }

  async initiateDeposit(
    userId: string,
    data: { orderId: string; phoneNumber: string; provider?: string }
  ) {
    const network = resolveNetwork(data.provider);
    const phoneNumber = normalizePaymentPhone(data.phoneNumber);
    feexPayService.assertConfigured();
    const reserved = await this.reserve(userId, data.orderId, phoneNumber, data.provider!);
    if (reserved.fresh) {
      try {
        const response = await feexPayService.requestToPay(network, {
          phoneNumber,
          amount: reserved.attempt.amount,
          description: `Commande ${reserved.order.orderNumber}`
            .replace(/[^a-zA-Z0-9 ]/g, ' ')
            .trim(),
          callback_info: reserved.attempt.callbackInfo,
        });
        await this.bindReference(reserved.attempt.id, response.reference, response);
        if (response.status === 'FAILED') {
          await this.applyVerified(reserved.attempt.id, {
            ...response,
            amount: response.amount ?? reserved.attempt.amount,
          });
        } else if (response.status === 'SUCCESSFUL') {
          // A final success still requires the authenticated amount/reference checks.
          await this.synchronize(reserved.attempt.id);
        }
      } catch (error) {
        if (error instanceof FeexPayRequestError && error.definitelyRejected) {
          await prisma.$transaction(async (tx) => {
            await lockPaymentOrder(tx, data.orderId);
            const changed = await tx.paymentAttempt.updateMany({
              where: { id: reserved.attempt.id, status: { in: pendingStatuses }, reference: null },
              data: { status: PaymentStatus.FAILED, gatewayResponse: { error: error.code } },
            });
            if (changed.count)
              await tx.payment.updateMany({
                where: {
                  id: reserved.payment.id,
                  status: { in: pendingStatuses },
                  transactionId: null,
                },
                data: { status: PaymentStatus.FAILED },
              });
          });
        } else {
          // The attempt is durable even if the gateway timed out or saving its
          // response failed. Webhook/history reconciliation can recover it.
          console.warn('[Payment] Awaiting reconciliation for attempt %s', reserved.attempt.id);
        }
      }
    }
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: reserved.payment.id } });
    return {
      paymentId: payment.id,
      reference: payment.transactionId,
      // Legacy web clients type this field; keep it as a compatibility alias.
      depositId: payment.transactionId,
      status: payment.status,
      message:
        payment.status === PaymentStatus.SUCCESS
          ? 'Paiement confirmé.'
          : payment.status === PaymentStatus.FAILED
            ? 'Paiement refusé. Vous pouvez réessayer.'
            : 'Paiement en cours. Validez sur votre téléphone et ne relancez pas la demande.',
    };
  }

  private async synchronize(attemptId: string) {
    const attempt = await prisma.paymentAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    if (!isPending(attempt.status)) return;
    await prisma.paymentAttempt.update({
      where: { id: attemptId },
      data: { lastCheckedAt: new Date() },
    });
    const reference =
      attempt.reference ??
      (await feexPayService.findReference(attempt.callbackInfo, attempt.createdAt));
    if (!reference) {
      if (Date.now() - attempt.createdAt.getTime() > 10 * 60000) {
        await prisma.paymentAttempt.update({
          where: { id: attemptId },
          data: {
            needsReview: true,
            reviewReason: 'INITIATION_OUTCOME_UNKNOWN',
          },
        });
      }
      return;
    }
    const remote = await feexPayService.getDepositStatus(reference);
    if (remote.reference !== reference) {
      throw new ConflictError('Référence de paiement incohérente.', 'PAYMENT_DATA_MISMATCH');
    }
    await this.applyVerified(attemptId, remote);
  }

  async getStatus(paymentId: string, userId: string) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw new NotFoundError('Paiement introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    if (payment.userId !== userId) throw new ForbiddenError('Accès refusé', ERROR_CODES.FORBIDDEN);
    if (payment.gateway === 'FEEXPAY' && isPending(payment.status)) {
      const attempt = await prisma.paymentAttempt.findFirst({
        where: { paymentId, status: { in: pendingStatuses } },
      });
      if (attempt) {
        try {
          await this.synchronize(attempt.id);
        } catch {
          console.warn('[Payment] Status verification deferred for payment %s', payment.id);
        }
      }
    }
    return formatPayment(await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } }));
  }

  async handleWebhook(payload: FeexPayWebhook) {
    // This endpoint accepts no user JWT. The body is a signal, never proof of payment.
    // Re-read the transaction using our merchant credential before modifying data.
    const known = await prisma.paymentAttempt.findUnique({
      where: { reference: payload.reference },
    });
    if (known && !isPending(known.status)) return { received: true };
    // Pre-filter unknown references locally. An untrusted callback is only a
    // lookup hint; the authenticated API must independently confirm its value.
    const hint = callbackValue(payload.callback_info);
    const candidate =
      known ??
      (hint
        ? await prisma.paymentAttempt.findFirst({
            where: {
              gateway: 'FEEXPAY',
              callbackInfo: hint,
              reference: null,
              status: { in: pendingStatuses },
            },
          })
        : null);
    if (!candidate)
      throw new NotFoundError('Tentative de paiement introuvable.', 'PAYMENT_ATTEMPT_NOT_FOUND');
    const remote = await feexPayService.getDepositStatus(payload.reference);
    if (
      remote.reference !== payload.reference ||
      remote.amount !== payload.amount ||
      (!known && callbackValue(remote.callback_info) !== candidate.callbackInfo)
    ) {
      throw new ValidationError('Notification de paiement incohérente.', 'PAYMENT_DATA_MISMATCH');
    }
    const attempt = candidate;
    await this.applyVerified(attempt.id, remote);
    return { received: true };
  }

  async reconcilePendingPayments(limit = 50) {
    if (this.reconciling) return;
    this.reconciling = true;
    try {
      const attempts = await prisma.paymentAttempt.findMany({
        where: {
          gateway: 'FEEXPAY',
          status: { in: pendingStatuses },
          createdAt: { lte: new Date(Date.now() - 60000) },
          OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lte: new Date(Date.now() - 60000) } }],
        },
        orderBy: [{ lastCheckedAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }],
        take: limit,
      });
      // Limit gateway concurrency and isolate failures so one bad reference cannot starve the batch.
      for (let i = 0; i < attempts.length; i += 5) {
        await Promise.all(
          attempts.slice(i, i + 5).map(async (attempt) => {
            try {
              await this.synchronize(attempt.id);
            } catch {
              console.warn('[Payment] Reconciliation deferred for attempt %s', attempt.id);
            }
          })
        );
      }
    } finally {
      this.reconciling = false;
    }
  }
}

function formatPayment(payment: Payment) {
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
