import { Request, Response, NextFunction } from 'express';
import notificationService from '@/services/notification.service';
import { sendSuccess } from '@/utils/response.util';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 30;
      const result = await notificationService.getMyNotifications(userId, page, limit);
      sendSuccess(res, 'Notifications récupérées', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const result = await notificationService.markAsRead(userId, id);
      sendSuccess(res, 'Notification marquée comme lue', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const result = await notificationService.markAllAsRead(userId);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const result = await notificationService.deleteNotification(userId, id);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
