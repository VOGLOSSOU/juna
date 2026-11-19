import { randomUUID } from 'crypto';
import prisma from '@/config/database';
import { Prisma, PayoutStatus } from '@prisma/client';
import feexPayService, { FeexPayRequestError, sanitizeMotif, PayoutStatusResponse } from './feexpay.service';
import { sendPayoutSuccessEmail } from './email.service';

const PENDING_STATUSES: PayoutStatus[] = ['PENDING', 'PROCESSING'];
const EMAIL_RETRY_MS = 5 * 60 * 1000;
const isPending = (status: PayoutStatus) => PENDING_STATUSES.includes(status);
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
// Never log a raw error: an AxiosError carries the request config, including the
// Authorization header with the FeexPay merchant token.
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'unknown error');

export class PayoutService {
  private reconciling = false;

  // À appeler DANS la transaction d'activation de la commande : le Payout existe
  // dès que la commande passe ACTIVE, même si le process s'arrête juste après le
  // commit — rien n'est perdu, la réconciliation reprendra la ligne PENDING.
  async createIntent(
    tx: Prisma.TransactionClient,
    orderId: string,
    providerId: string,
    rawAmount: number
  ) {
    const provider = await tx.provider.findUniqueOrThrow({ where: { id: providerId } });
    const amount = Math.round(rawAmount);

    if (!provider.payoutPhoneNumber || !provider.payoutNetwork) {
      return tx.payout.create({
        data: {
          orderId,
          providerId,
          amount,
          status: 'FAILED',
          needsReview: true,
          reviewReason: 'PROVIDER_PAYOUT_NOT_CONFIGURED',
        },
      });
    }
    if (!(amount > 0)) {
      return tx.payout.create({
        data: {
          orderId,
          providerId,
          amount,
          phoneNumber: provider.payoutPhoneNumber,
          network: provider.payoutNetwork,
          status: 'FAILED',
          needsReview: true,
          reviewReason: 'INVALID_PAYOUT_AMOUNT',
        },
      });
    }
    return tx.payout.create({
      data: {
        orderId,
        providerId,
        amount,
        phoneNumber: provider.payoutPhoneNumber,
        network: provider.payoutNetwork,
        status: 'PENDING',
      },
    });
  }

  // Idempotent et sûr en cas d'appels concurrents (déclenchement immédiat après
  // activation + un passage du cron sur la même ligne) : seule l'exécution qui
  // réclame atomiquement le Payout appelle réellement FeexPay.
  async attemptPayout(payoutId: string) {
    const claimed = await prisma.payout.updateMany({
      where: { id: payoutId, status: 'PENDING', reference: null, gatewayResponse: { equals: Prisma.DbNull } },
      data: { status: 'PROCESSING' },
    });
    if (claimed.count === 0) return;

    const payout = await prisma.payout.findUniqueOrThrow({
      where: { id: payoutId },
      include: { order: true },
    });
    if (!payout.phoneNumber || !payout.network) return;

    try {
      const initiation = await feexPayService.initiatePayout(payout.network, {
        phoneNumber: payout.phoneNumber,
        amount: payout.amount,
        motif: sanitizeMotif(`Versement ${payout.order.orderNumber}`),
        callback_info: payout.orderId,
      });
      await this.bindReference(payout.id, initiation.reference, initiation);

      // La réponse d'initiation n'est jamais une confirmation : FeexPay exige de
      // repasser par l'endpoint de statut avant d'acter un virement.
      try {
        const verified = await feexPayService.getPayoutStatus(initiation.reference);
        await this.applyVerified(payout.id, verified);
      } catch (error) {
        console.warn('[Payout] Verification deferred for payout %s: %s', payout.id, errorMessage(error));
      }
    } catch (error) {
      if (error instanceof FeexPayRequestError && error.definitelyRejected) {
        await prisma.payout.updateMany({
          where: { id: payout.id, status: 'PROCESSING', reference: null },
          data: { status: 'FAILED', needsReview: true, reviewReason: 'PAYOUT_REJECTED' },
        });
      }
      // Échec ambigu (timeout/5xx) : on reste en PROCESSING sans reference. La
      // réconciliation tentera de retrouver la trace via l'historique FeexPay,
      // jamais via un nouvel appel à initiatePayout (risque de double virement).
    }
  }

  private async bindReference(payoutId: string, reference: string, response: unknown) {
    await prisma.payout.updateMany({
      where: { id: payoutId, status: 'PROCESSING', reference: null },
      data: { reference, gatewayResponse: json(response) },
    });
  }

  private async applyVerified(payoutId: string, remote: PayoutStatusResponse) {
    const payout = await prisma.payout.findUniqueOrThrow({ where: { id: payoutId } });
    if (!isPending(payout.status)) return;

    if (payout.reference && remote.reference !== payout.reference) {
      await prisma.payout.update({
        where: { id: payoutId },
        data: { needsReview: true, reviewReason: 'GATEWAY_DATA_MISMATCH', lastCheckedAt: new Date() },
      });
      return;
    }
    if (remote.amount !== undefined && Math.round(remote.amount) !== Math.round(payout.amount)) {
      await prisma.payout.update({
        where: { id: payoutId },
        data: { needsReview: true, reviewReason: 'AMOUNT_MISMATCH', lastCheckedAt: new Date() },
      });
      return;
    }

    const finalStatus: PayoutStatus | null =
      remote.status === 'SUCCESSFUL' ? 'SUCCESS' : remote.status === 'FAILED' ? 'FAILED' : null;
    if (!finalStatus) {
      await prisma.payout.update({ where: { id: payoutId }, data: { lastCheckedAt: new Date() } });
      return;
    }

    // Transition conditionnelle : une seule exécution concurrente peut faire
    // gagner ce updateMany, donc un seul email de succès peut jamais partir.
    const applied = await prisma.payout.updateMany({
      where: { id: payoutId, status: { in: PENDING_STATUSES } },
      data: {
        reference: remote.reference,
        gatewayResponse: json(remote),
        lastCheckedAt: new Date(),
        needsReview: finalStatus === 'FAILED',
        reviewReason: finalStatus === 'FAILED' ? 'PAYOUT_REJECTED' : null,
        status: finalStatus,
        ...(finalStatus === 'SUCCESS' ? { paidAt: new Date() } : {}),
      },
    });
    if (applied.count === 1 && finalStatus === 'SUCCESS') {
      await this.deliverSuccessEmail(payoutId);
    }
  }

  // Même mécanisme que PaymentEmailService : bail atomique par jeton pour
  // survivre à un crash ou une course entre deux workers, backoff en cas de
  // panne d'envoi (jamais traité comme un échec du virement lui-même).
  private async deliverSuccessEmail(payoutId: string) {
    const claim = randomUUID();
    const reserved = await prisma.payout.updateMany({
      where: {
        id: payoutId,
        status: 'SUCCESS',
        successEmailSentAt: null,
        OR: [{ successEmailNextAttemptAt: null }, { successEmailNextAttemptAt: { lte: new Date() } }],
      },
      data: { successEmailClaimToken: claim, successEmailNextAttemptAt: new Date(Date.now() + EMAIL_RETRY_MS) },
    });
    if (reserved.count !== 1) return;

    try {
      const payout = await prisma.payout.findUniqueOrThrow({
        where: { id: payoutId },
        include: { order: true, provider: { include: { user: true } } },
      });
      await sendPayoutSuccessEmail(payout.provider.user.email, payout.provider.user.name, {
        orderNumber: payout.order.orderNumber,
        amount: payout.amount,
      });
      await prisma.payout.updateMany({
        where: { id: payoutId, successEmailClaimToken: claim },
        data: { successEmailSentAt: new Date(), successEmailClaimToken: null, successEmailNextAttemptAt: null },
      });
    } catch (error) {
      console.error('[Payout] Success email deferred for payout %s: %s', payoutId, errorMessage(error));
      await prisma.payout.updateMany({
        where: { id: payoutId, successEmailClaimToken: claim },
        data: { successEmailClaimToken: null },
      });
    }
  }

  async sendPendingSuccessEmails(limit = 50) {
    const payouts = await prisma.payout.findMany({
      where: {
        status: 'SUCCESS',
        successEmailSentAt: null,
        OR: [{ successEmailNextAttemptAt: null }, { successEmailNextAttemptAt: { lte: new Date() } }],
      },
      take: limit,
    });
    for (const payout of payouts) await this.deliverSuccessEmail(payout.id);
  }

  private async synchronize(payoutId: string) {
    const payout = await prisma.payout.findUniqueOrThrow({ where: { id: payoutId } });
    if (!isPending(payout.status)) return;

    // Jamais tentée (ex. crash juste après l'activation, avant le déclenchement
    // immédiat) : on relance l'attempt normalement, la réclamation atomique
    // garantit qu'un seul appel réseau partira.
    if (payout.status === 'PENDING' && !payout.reference && !payout.gatewayResponse) {
      await this.attemptPayout(payoutId);
      return;
    }

    await prisma.payout.update({ where: { id: payoutId }, data: { lastCheckedAt: new Date() } });

    let reference = payout.reference;
    if (!reference) {
      try {
        reference = await feexPayService.findPayoutReference(payout.orderId, payout.createdAt);
      } catch (error) {
        console.warn('[Payout] History lookup failed for payout %s: %s', payoutId, errorMessage(error));
        return;
      }
    }
    if (!reference) {
      if (Date.now() - payout.createdAt.getTime() > 10 * 60000) {
        await prisma.payout.update({
          where: { id: payoutId },
          data: { needsReview: true, reviewReason: 'INITIATION_OUTCOME_UNKNOWN' },
        });
      }
      return;
    }

    let remote: PayoutStatusResponse;
    try {
      remote = await feexPayService.getPayoutStatus(reference);
    } catch (error) {
      console.warn('[Payout] Status check failed for payout %s: %s', payoutId, errorMessage(error));
      return;
    }
    if (!payout.reference) await this.bindReference(payoutId, reference, remote);
    await this.applyVerified(payoutId, remote);
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
              console.warn('[Payout] Reconciliation deferred for payout %s: %s', payout.id, errorMessage(error))
            )
          )
        );
      }
      await this.sendPendingSuccessEmails();
    } finally {
      this.reconciling = false;
    }
  }
}

export default new PayoutService();
