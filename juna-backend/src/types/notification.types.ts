import { NotificationType } from '@prisma/client';

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
  userId?: string;
}