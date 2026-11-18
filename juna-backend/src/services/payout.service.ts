import prisma from '@/config/database';
import { Prisma, PayoutStatus } from '@prisma/client';
import feexPayService, { FeexPayRequestError, sanitizeMotif, PayoutStatusResponse } from './feexpay.service';
import { sendPayoutSuccessEmail } from './email.service';

const PENDING_STATUSES: PayoutStatus[] = ['PENDING', 'PROCESSING'];
const isPending = (status: PayoutStatus) => PENDING_STATUSES.includes(status);
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

export class PayoutService {
  private reconciling = false;

  // Appelé une seule fois, juste après que la transaction d'activation de la commande
  // ait été validée. Idempotent : ne crée jamais deux Payout pour une même commande.
  async initiateForOrder(orderId: string) {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { subscription: { select: { providerId: true } } },
    });
    const provider = await prisma.provider.findUniqueOrThrow({
      where: { id: order.subscription.providerId },
    });

    if (!provider.payoutPhoneNumber || !provider.payoutNetwork) {
      await this.createPayout(order.id, provider.id, {
        amount: order.providerAmount,
        status: 'FAILED',
        needsReview: true,
        reviewReason: 'PROVIDER_PAYOUT_NOT_CONFIGURED',
      });
      return;
    }

    const amount = Math.round(order.providerAmount);
    const payout = await this.createPayout(order.id, provider.id, {
      amount,
      phoneNumber: provider.payoutPhoneNumber,
      network: provider.payoutNetwork,
      status: 'PROCESSING',
    });
    if (!payout) return; // un Payout existait déjà pour cette commande

    try {
      const response = await feexPayService.initiatePayout(provider.payoutNetwork, {
        phoneNumber: provider.payoutPhoneNumber,
        amount,
        motif: sanitizeMotif(`Versement ${order.orderNumber}`),
        callback_info: order.id,
      });
      await this.bindReference(payout.id, response.reference, response);
      if (response.status === 'SUCCESSFUL' || response.status === 'FAILED') {
        await this.applyVerified(payout.id, { ...response, amount });
      }
    } catch (error) {
      if (error instanceof FeexPayRequestError && error.definitelyRejected) {
        await prisma.payout.updateMany({
          where: { id: payout.id, status: { in: PENDING_STATUSES }, reference: null },
          data: { status: 'FAILED', needsReview: true, reviewReason: 'PAYOUT_REJECTED' },
        });
      }
      // Échec ambigu (timeout/5xx) : l'argent a pu partir malgré tout.
      // On laisse le Payout en PROCESSING, la réconciliation tranchera.
    }
  }

  private async createPayout(
    orderId: string,
    providerId: string,
    data: {
      amount: number;
      status: PayoutStatus;
      phoneNumber?: string;
      network?: 'MTN' | 'MOOV';
      needsReview?: boolean;
      reviewReason?: string;
    }
  ) {
    try {
      return await prisma.payout.create({ data: { orderId, providerId, ...data } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return null; // déjà créé par un appel concurrent — jamais de doublon
      }
      throw error;
    }
  }

  private async bindReference(payoutId: string, reference: string, response: unknown) {
    await prisma.payout.updateMany({
      where: { id: payoutId, status: { in: PENDING_STATUSES }, reference: null },
      data: { reference, gatewayResponse: json(response) },
    });
  }

  private async applyVerified(payoutId: string, remote: PayoutStatusResponse & { amount: number }) {
    const payout = await prisma.payout.findUniqueOrThrow({ where: { id: payoutId } });
    if (!isPending(payout.status)) return;
    if (payout.reference && remote.reference !== payout.reference) {
      await prisma.payout.update({
        where: { id: payoutId },
        data: { needsReview: true, reviewReason: 'GATEWAY_DATA_MISMATCH', lastCheckedAt: new Date() },
      });
      return;
    }

    const finalStatus: PayoutStatus | null =
      remote.status === 'SUCCESSFUL' ? 'SUCCESS' : remote.status === 'FAILED' ? 'FAILED' : null;

    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        reference: remote.reference,
        gatewayResponse: json(remote),
        lastCheckedAt: new Date(),
        needsReview: finalStatus === 'FAILED',
        reviewReason: finalStatus === 'FAILED' ? 'PAYOUT_REJECTED' : null,
        ...(finalStatus ? { status: finalStatus } : {}),
        ...(finalStatus === 'SUCCESS' ? { paidAt: new Date() } : {}),
      },
    });

    if (finalStatus === 'SUCCESS') {
      await this.notifySuccess(payoutId).catch(() => {});
    }
  }

  private async notifySuccess(payoutId: string) {
    const payout = await prisma.payout.findUniqueOrThrow({
      where: { id: payoutId },
      include: { order: true, provider: { include: { user: true } } },
    });
    await sendPayoutSuccessEmail(payout.provider.user.email, payout.provider.user.name, {
      orderNumber: payout.order.orderNumber,
      amount: payout.amount,
    });
  }

  // Jamais de nouvel appel à initiatePayout ici : si la demande initiale a échoué de
  // façon ambiguë, on retrouve la référence via l'historique (lecture seule), on ne
  // relance jamais un virement — un double appel pourrait réellement payer deux fois.
  private async synchronize(payoutId: string) {
    const payout = await prisma.payout.findUniqueOrThrow({ where: { id: payoutId } });
    if (!isPending(payout.status)) return;
    await prisma.payout.update({ where: { id: payoutId }, data: { lastCheckedAt: new Date() } });

    const reference =
      payout.reference ?? (await feexPayService.findPayoutReference(payout.orderId, payout.createdAt));
    if (!reference) {
      if (Date.now() - payout.createdAt.getTime() > 10 * 60000) {
        await prisma.payout.update({
          where: { id: payoutId },
          data: { needsReview: true, reviewReason: 'INITIATION_OUTCOME_UNKNOWN' },
        });
      }
      return;
    }

    const remote = await feexPayService.getPayoutStatus(reference);
    if (remote.reference !== reference) {
      await prisma.payout.update({
        where: { id: payoutId },
        data: { needsReview: true, reviewReason: 'PAYOUT_DATA_MISMATCH' },
      });
      return;
    }
    await this.applyVerified(payoutId, { ...remote, amount: remote.amount ?? payout.amount });
  }

  async reconcilePendingPayouts(limit = 50) {
    if (this.reconciling) return;
    this.reconciling = true;
    try {
      const payouts = await prisma.payout.findMany({
        where: {
          status: { in: PENDING_STATUSES },
          createdAt: { lte: new Date(Date.now() - 60000) },
          OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lte: new Date(Date.now() - 60000) } }],
        },
        orderBy: [{ lastCheckedAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'asc' }],
        take: limit,
      });
      for (let i = 0; i < payouts.length; i += 5) {
        await Promise.all(
          payouts.slice(i, i + 5).map((payout) =>
            this.synchronize(payout.id).catch((error) =>
              console.warn('[Payout] Reconciliation deferred for payout %s', payout.id, error)
            )
          )
        );
      }
    } finally {
      this.reconciling = false;
    }
  }
}

export default new PayoutService();
