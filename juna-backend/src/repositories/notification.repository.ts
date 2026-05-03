import prisma from '@/config/database';
import { NotificationType } from '@prisma/client';

export class NotificationRepository {
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }) {
    return prisma.notification.create({ data });
  }

  async findByUserId(userId: string, limit = 30, offset = 0) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  }

  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async delete(id: string) {
    return prisma.notification.delete({ where: { id } });
  }
}

export default new NotificationRepository();
