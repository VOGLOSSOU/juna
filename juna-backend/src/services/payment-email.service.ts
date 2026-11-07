import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { sendAdminPaymentReceivedEmail } from './email.service';

const RETRY_MS = 5 * 60 * 1000;

export function paymentEmailRecipient() {
  return process.env.PAYMENT_NOTIFICATION_EMAIL?.trim() || 'n969601@gmail.com';
}

export function paymentEmailsEnabled() {
  return (
    (process.env.PAYMENT_NOTIFICATIONS_ENABLED ??
      (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true' &&
    !!process.env.BREVO_API_KEY
  );
}

// SUCCESS is written only after the authenticated FeexPay verification.
// Null sentAt deliberately includes historical payments after deployment.
export function pendingPaymentEmails(now = new Date()): Prisma.PaymentWhereInput {
  return {
    gateway: 'FEEXPAY',
    status: 'SUCCESS',
    adminEmailSentAt: null,
    OR: [{ adminEmailNextAttemptAt: null }, { adminEmailNextAttemptAt: { lte: now } }],
  };
}

export class PaymentEmailService {
  private running = false;

  async deliver(paymentId: string) {
    if (!paymentEmailsEnabled()) return false;
    const now = new Date();
    const claim = randomUUID();
    // Atomic lease across workers and API replicas, recovered after a crash.
    const reserved = await prisma.payment.updateMany({
      where: { id: paymentId, ...pendingPaymentEmails(now) },
      data: {
        adminEmailClaimToken: claim,
        adminEmailNextAttemptAt: new Date(now.getTime() + RETRY_MS),
      },
    });
    if (reserved.count !== 1) return false;
    try {
      const payment = await prisma.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: {
          user: true,
          order: { include: { subscription: { include: { provider: true } } } },
        },
      });
      await sendAdminPaymentReceivedEmail(paymentEmailRecipient(), {
        paymentId: payment.id,
        reference: payment.transactionId ?? payment.id,
        orderNumber: payment.order.orderNumber,
        customerName: payment.user.name,
        subscriptionName: payment.order.subscription.name,
        providerName: payment.order.subscription.provider.businessName,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      });
      await prisma.payment.updateMany({
        where: { id: paymentId, adminEmailClaimToken: claim },
        data: {
          adminEmailSentAt: new Date(),
          adminEmailClaimToken: null,
          adminEmailNextAttemptAt: null,
        },
      });
      return true;
    } catch {
      // Never turn an email outage into a payment failure. Retry next batch.
      await prisma.payment.updateMany({
        where: { id: paymentId, adminEmailClaimToken: claim },
        data: {
          adminEmailClaimToken: null,
          adminEmailNextAttemptAt: new Date(Date.now() + RETRY_MS),
        },
      });
      console.error('[Payment email] Delivery deferred for payment %s', paymentId);
      return false;
    }
  }

  async processPending(limit = 20) {
    if (this.running || !paymentEmailsEnabled()) return;
    this.running = true;
    try {
      const payments = await prisma.payment.findMany({
        where: pendingPaymentEmails(),
        select: { id: true },
        orderBy: [{ paidAt: 'asc' }, { id: 'asc' }],
        take: limit,
      });
      for (const payment of payments) await this.deliver(payment.id);
    } finally {
      this.running = false;
    }
  }
}

export default new PaymentEmailService();
