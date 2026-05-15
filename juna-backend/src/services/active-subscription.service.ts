import activeSubscriptionRepository from '@/repositories/active-subscription.repository';
import { NotFoundError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';

export class ActiveSubscriptionService {
  /**
   * Obtenir les abonnements actifs d'un utilisateur
   */
  async getUserActiveSubscriptions(userId: string) {
    return activeSubscriptionRepository.findByUserId(userId);
  }

  /**
   * Vérifier si un user a un abonnement actif
   */
  async hasActiveSubscription(userId: string, category?: string, type?: string) {
    return activeSubscriptionRepository.hasActiveSubscription(userId, category, type);
  }

  /**
   * Supprimer les abonnements expirés (pour le cron job)
   */
  async cleanupExpiredSubscriptions() {
    const result = await activeSubscriptionRepository.deleteExpired();
    return result;
  }

  /**
   * Statistiques des abonnements actifs
   */
  async getActiveSubscriptionsStats() {
    const count = await activeSubscriptionRepository.countActive();
    return { activeSubscriptionsCount: count };
  }

  /**
   * Obtenir les abonnements actifs d'un provider
   */
  async getProviderActiveSubscriptions(providerId: string) {
    return activeSubscriptionRepository.findByProviderId(providerId);
  }

  /**
   * Détail d'un abonnement actif
   */
  async getActiveSubscriptionById(id: string) {
    const activeSub = await activeSubscriptionRepository.findById(id);
    if (!activeSub) {
      throw new NotFoundError('Abonnement actif introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    return activeSub;
  }
}

export default new ActiveSubscriptionService();