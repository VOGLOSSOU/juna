import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { sendAdminPaymentReceivedEmail } from './email.service';

const RETRY_MS = 5 * 60 * 1000;

export function paymentEmailRecipient() {
  return process.env.PAYMENT_NOTIFICATION_EMAIL?.trim() || 'n969601@gmail.com';
}

export function paymentEmailDisabledReason(): string | null {
  const configured = process.env.PAYMENT_NOTIFICATIONS_ENABLED?.trim().toLowerCase();
  const enabled = configured ? configured === 'true' : process.env.NODE_ENV === 'production';
  if (!enabled)
    return 'PAYMENT_NOTIFICATIONS_ENABLED must be true (or NODE_ENV production when unset)';
  if (!process.env.BREVO_API_KEY?.trim()) return 'BREVO_API_KEY is missing';
  return null;
}

export function paymentEmailsEnabled() {
  return paymentEmailDisabledReason() === null;
}

// Same exact-reference evidence used by the FeexPay migration. Docker deployments
// using db push may have added the default PAWAPAY without running that backfill.
// This predicate is for alerts only: no gateway, amount or payment status changes.
const feexPayEmailSource = Prisma.sql`(
  "gateway" = 'FEEXPAY' OR (
    "gateway" = 'PAWAPAY' AND "transactionId" IS NOT NULL
    AND "gatewayResponse"->>'reference' = "transactionId"
  )
)`;
const pendingPaymentEmails = () => Prisma.sql`
  ${feexPayEmailSource} AND "status" = 'SUCCESS' AND "adminEmailSentAt" IS NULL
  AND ("adminEmailNextAttemptAt" IS NULL OR "adminEmailNextAttemptAt" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'))
`;

export class PaymentEmailService {
  private running = false;
  private reportedStartup = false;

  async deliver(paymentId: string) {
    if (!paymentEmailsEnabled()) return false;
    const claim = randomUUID();
    // Atomic lease across workers and API replicas, recovered after a crash.
    const reserved = await prisma.$executeRaw`
      UPDATE "payments"
      SET "adminEmailClaimToken" = ${claim}::uuid,
          "adminEmailNextAttemptAt" = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + ${RETRY_MS} * INTERVAL '1 millisecond' 
      WHERE "id" = ${paymentId}::uuid AND ${pendingPaymentEmails()}
    `;
    if (reserved !== 1) return false;
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
    } catch (error) {
      // Only log provider status/code, never credentials or the full HTTP error.
      const failure = error as {
        statusCode?: unknown;
        code?: unknown;
        body?: { code?: unknown };
      } | null;
      const rawCode = failure?.body?.code ?? failure?.code;
      const code =
        typeof rawCode === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(rawCode) ? rawCode : 'UNKNOWN';
      const status = typeof failure?.statusCode === 'number' ? failure.statusCode : null;
      console.error('[Payment email] Delivery deferred', { paymentId, status, code });
      // Never turn an email outage into a payment failure. Retry next batch.
      await prisma.payment.updateMany({
        where: { id: paymentId, adminEmailClaimToken: claim },
        data: {
          adminEmailClaimToken: null,
          adminEmailNextAttemptAt: new Date(Date.now() + RETRY_MS),
        },
      });
      return false;
    }
  }

  async processPending(limit = 20) {
    if (this.running) return;
    const disabledReason = paymentEmailDisabledReason();
    if (disabledReason) {
      if (!this.reportedStartup)
        console.warn('[Payment email] Worker disabled: %s', disabledReason);
      this.reportedStartup = true;
      return;
    }
    this.running = true;
    try {
      if (!this.reportedStartup) {
        const successful = await prisma.payment.groupBy({
          by: ['gateway'],
          where: { status: 'SUCCESS' },
          _count: { _all: true },
        });
        const [delivery] = await prisma.$queryRaw<Array<{ eligible: number; sent: number }>>`
          SELECT COUNT(*)::int AS eligible,
            COUNT("adminEmailSentAt")::int AS sent
          FROM "payments" WHERE ${feexPayEmailSource} AND "status" = 'SUCCESS'
        `;
        console.info('[Payment email] Worker started', {
          recipient: paymentEmailRecipient(),
          successfulByGateway: successful,
          eligible: delivery.eligible,
          alreadySent: delivery.sent,
        });
        this.reportedStartup = true;
      }
      const payments = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "payments" WHERE ${pendingPaymentEmails()}
        ORDER BY "paidAt" ASC NULLS LAST, "id" ASC LIMIT ${limit}
      `;
      let sent = 0;
      for (const payment of payments) if (await this.deliver(payment.id)) sent++;
      console.info('[Payment email] Batch completed', { selected: payments.length, sent });
    } finally {
      this.running = false;
    }
  }
}

export default new PaymentEmailService();
