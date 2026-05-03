import { Router } from 'express';
import notificationController from '@/controllers/notification.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/notifications?page=1&limit=30
 */
router.get('/', notificationController.getMyNotifications.bind(notificationController));

/**
 * PATCH /api/v1/notifications/read-all
 */
router.patch('/read-all', notificationController.markAllAsRead.bind(notificationController));

/**
 * PATCH /api/v1/notifications/:id/read
 */
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));

/**
 * DELETE /api/v1/notifications/:id
 */
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

export default router;
