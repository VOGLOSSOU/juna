import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { paymentEmailRecipient, paymentEmailsEnabled } from './payment-email.service';
import { sendAdminEventEmail } from './email.service';

type EventKind = 'ORDER_ACTIVATED' | 'PAYOUT_SUCCEEDED';
const RETRY_MS = 5 * 60 * 1000;

export class AdminEventEmailService {
  private running = false;

  // Must be called inside the transaction that commits the business event.
  enqueue(tx: Prisma.TransactionClient, kind: EventKind, orderId: string) {
    return tx.adminEmailEvent.upsert({
      where: { eventKey: `${kind}:${orderId}` },
      create: { eventKey: `${kind}:${orderId}`, kind, orderId },
      update: {},
    });
  }

  async deliverForOrder(kind: EventKind, orderId: string) {
    if (!paymentEmailsEnabled()) return;
    const event = await prisma.adminEmailEvent.findUnique({
      where: { eventKey: `${kind}:${orderId}` },
    });
    if (event) await this.deliver(event.id);
  }

  async deliver(id: string) {
    if (!paymentEmailsEnabled()) return false;
    const claimToken = randomUUID();
    const claimed = await prisma.adminEmailEvent.updateMany({
      where: {
        id,
        sentAt: null,
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      },
      data: { claimToken, nextAttemptAt: new Date(Date.now() + RETRY_MS) },
    });
    if (claimed.count !== 1) return false;
    try {
      const event = await prisma.adminEmailEvent.findUniqueOrThrow({
        where: { id },
        include: {
          order: {
            include: { user: true, subscription: { include: { provider: true } }, payout: true },
          },
        },
      });
      const { order } = event;
      if (event.kind !== 'ORDER_ACTIVATED' && event.kind !== 'PAYOUT_SUCCEEDED')
        throw new Error('Invalid event kind');
      if (event.kind === 'ORDER_ACTIVATED' && !order.activatedAt)
        throw new Error('Missing activation');
      if (event.kind === 'PAYOUT_SUCCEEDED' && order.payout?.status !== 'SUCCESS')
        throw new Error('Payout not successful');
      await sendAdminEventEmail(paymentEmailRecipient(), {
        eventId: event.id,
        kind: event.kind,
        orderNumber: order.orderNumber,
        customerName: order.user.name,
        providerName: order.subscription.provider.businessName,
        subscriptionName: order.subscription.name,
        amount: event.kind === 'PAYOUT_SUCCEEDED' ? order.payout!.amount : order.amount,
        occurredAt:
          event.kind === 'PAYOUT_SUCCEEDED'
            ? (order.payout!.paidAt ?? event.createdAt)
            : order.activatedAt!,
        mode: event.kind === 'PAYOUT_SUCCEEDED' ? order.payout!.mode : undefined,
        reference: event.kind === 'PAYOUT_SUCCEEDED' ? order.payout!.reference : null,
      });
      await prisma.adminEmailEvent.updateMany({
        where: { id, claimToken },
        data: { sentAt: new Date(), claimToken: null, nextAttemptAt: null },
      });
      return true;
    } catch {
      await prisma.adminEmailEvent.updateMany({
        where: { id, claimToken },
        data: { claimToken: null },
      });
      console.error('[Admin email] Delivery deferred for event %s', id);
      return false;
    }
  }

  async processPending(limit = 20) {
    if (this.running || !paymentEmailsEnabled()) return;
    this.running = true;
    try {
      const events = await prisma.adminEmailEvent.findMany({
        where: {
          sentAt: null,
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: limit,
        select: { id: true },
      });
      for (const event of events) await this.deliver(event.id);
    } finally {
      this.running = false;
    }
  }
}
export default new AdminEventEmailService();
