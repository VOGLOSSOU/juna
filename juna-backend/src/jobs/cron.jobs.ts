import cron from 'node-cron';
import prisma from '@/config/database';
import { logInfo, logError } from '@/utils/logger.util';

/**
 * Job cron pour nettoyer les abonnements actifs expirés
 * S'exécute tous les jours à 2h du matin
 */
export const cleanupExpiredSubscriptions = () => {
  cron.schedule('0 2 * * *', async () => {
    try {
      logInfo('Starting cleanup of expired active subscriptions...');

      const result = await prisma.activeSubscription.deleteMany({
        where: {
          endsAt: {
            lt: new Date()  // Supprimer si endsAt < maintenant
          }
        }
      });

      if (result.count > 0) {
        logInfo(`Cleaned up ${result.count} expired active subscriptions`);
      } else {
        logInfo('No expired subscriptions to clean up');
      }
    } catch (error) {
      logError('Error during cleanup of expired subscriptions', error);
    }
  }, {
    timezone: 'UTC'  // Ajuster selon le fuseau horaire souhaité
  });
};

/**
 * Démarrer tous les jobs cron
 */
export const startCronJobs = () => {
  logInfo('Starting cron jobs...');
  cleanupExpiredSubscriptions();
  logInfo('Cron jobs started successfully');
};