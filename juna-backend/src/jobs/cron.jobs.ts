import cron from 'node-cron';
import prisma from '@/config/database';
import emailVerificationCodeRepository from '@/repositories/emailVerificationCode.repository';
import { logInfo, logError } from '@/utils/logger.util';
import paymentService from '@/services/payment.service';
import paymentEmailService from '@/services/payment-email.service';

/**
 * Job cron pour nettoyer les abonnements actifs expirés
 * S'exécute tous les jours à 2h du matin
 */
export const cleanupExpiredSubscriptions = () => {
  cron.schedule('0 2 * * *', async () => {
    try {
      logInfo('Starting cleanup of expired active subscriptions...');

      const expired = await prisma.activeSubscription.findMany({
        where: { endsAt: { lt: new Date() } },
        select: { id: true, orderId: true },
      });

      if (expired.length === 0) {
        logInfo('No expired subscriptions to clean up');
        return;
      }

      const orderIds = expired.map((s) => s.orderId);
      const activeSubIds = expired.map((s) => s.id);

      await prisma.$transaction([
        prisma.order.updateMany({
          where: { id: { in: orderIds }, status: 'ACTIVE' },
          data: { status: 'COMPLETED', completedAt: new Date() },
        }),
        prisma.activeSubscription.deleteMany({
          where: { id: { in: activeSubIds } },
        }),
      ]);

      logInfo(`Cleaned up ${expired.length} expired active subscriptions, orders marked COMPLETED`);
    } catch (error) {
      logError('Error during cleanup of expired subscriptions', error);
    }
  }, {
    timezone: 'UTC',
  });
};

/**
 * Job cron pour nettoyer les codes OTP expirés
 * S'exécute toutes les heures
 */
export const cleanupExpiredOtpCodes = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      await emailVerificationCodeRepository.deleteExpired();
    } catch (error) {
      logError('Error during cleanup of expired OTP codes', error);
    }
  }, { timezone: 'UTC' });
};

/**
 * Démarrer tous les jobs cron
 */
export const startCronJobs = () => {
  logInfo('Starting cron jobs...');
  cleanupExpiredSubscriptions();
  cleanupExpiredOtpCodes();
  const sendPaymentEmails = async () => {
    try {
      await paymentEmailService.processPending();
    } catch (error) {
      logError('Payment email delivery failed', error);
    }
  };
  // Also catches up successful payments made before this feature was deployed.
  void sendPaymentEmails();
  cron.schedule('*/15 * * * *', sendPaymentEmails, { timezone: 'UTC' });
  cron.schedule('* * * * *', async () => {
    try {
      await paymentService.reconcilePendingPayments();
    } catch (error) {
      logError('Payment reconciliation failed', error);
    }
  }, { timezone: 'UTC' });
  logInfo('Cron jobs started successfully');
};
