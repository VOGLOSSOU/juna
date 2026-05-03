import notificationRepository from '@/repositories/notification.repository';
import { NotFoundError, ForbiddenError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  async getMyNotifications(userId: string, page = 1, limit = 30) {
    const offset = (page - 1) * limit;
    const [notifications, unreadCount] = await Promise.all([
      notificationRepository.findByUserId(userId, limit, offset),
      notificationRepository.countUnread(userId),
    ]);

    return { notifications, unreadCount, page, limit };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notif = await notificationRepository.findById(notificationId);
    if (!notif) {
      throw new NotFoundError('Notification introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    if (notif.userId !== userId) {
      throw new ForbiddenError('Accès refusé', ERROR_CODES.FORBIDDEN);
    }

    return notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string) {
    await notificationRepository.markAllAsRead(userId);
    return { message: 'Toutes les notifications ont été marquées comme lues' };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notif = await notificationRepository.findById(notificationId);
    if (!notif) {
      throw new NotFoundError('Notification introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    if (notif.userId !== userId) {
      throw new ForbiddenError('Accès refusé', ERROR_CODES.FORBIDDEN);
    }

    await notificationRepository.delete(notificationId);
    return { message: 'Notification supprimée' };
  }
}

// ─── Fonction utilitaire pour créer une notif depuis n'importe quel service ──

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>
) {
  try {
    await notificationRepository.create({ userId, type, title, message, data });
  } catch (err) {
    console.error('[notification] Failed to create notification:', err);
  }
}

export default new NotificationService();
