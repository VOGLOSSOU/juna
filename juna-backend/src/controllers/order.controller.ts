import { Request, Response, NextFunction } from 'express';
import orderService from '@/services/order.service';
import { sendSuccess } from '@/utils/response.util';
import { SUCCESS_MESSAGES } from '@/constants/messages';
import { DeliveryMethod } from '@prisma/client';

export class OrderController {
  /**
   * Créer une commande
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { subscriptionId, deliveryMethod, deliveryAddress, pickupLocation, scheduledFor } = req.body;

      const order = await orderService.create(userId, {
        subscriptionId,
        deliveryMethod: deliveryMethod as DeliveryMethod,
        deliveryAddress,
        pickupLocation,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      });

      sendSuccess(res, SUCCESS_MESSAGES.ORDER_CREATED, order, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une commande par ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await orderService.getById(id);
      sendSuccess(res, SUCCESS_MESSAGES.ORDER_FETCHED, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une commande par numéro
   */
  async getByOrderNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNumber } = req.params;
      const order = await orderService.getByOrderNumber(orderNumber);
      sendSuccess(res, SUCCESS_MESSAGES.ORDER_FETCHED, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Scanner QR code
   */
  async scanQrCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, qrCode } = req.params;
      const order = await orderService.complete(id, qrCode);
      sendSuccess(res, SUCCESS_MESSAGES.QR_SCANNED, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mes commandes
   */
  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const orders = await orderService.getMyOrders(userId);
      sendSuccess(res, SUCCESS_MESSAGES.ORDERS_FETCHED, orders);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Commandes du fournisseur
   */
  async getProviderOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const orders = await orderService.getByProviderId(providerId);
      sendSuccess(res, SUCCESS_MESSAGES.ORDERS_FETCHED, orders);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister toutes les commandes (admin)
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        userId: req.query.userId as string,
        subscriptionId: req.query.subscriptionId as string,
        providerId: req.query.providerId as string,
        status: req.query.status as any,
        deliveryMethod: req.query.deliveryMethod as any,
      };
      const orders = await orderService.getAll(filters);
      sendSuccess(res, SUCCESS_MESSAGES.ORDERS_FETCHED, orders);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirmer une commande
   */
  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;

      const order = await orderService.confirm(id, providerId);
      sendSuccess(res, SUCCESS_MESSAGES.ORDER_STATUS_UPDATED, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marquer comme prêt
   */
  async markReady(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;

      const order = await orderService.markReady(id, providerId);
      sendSuccess(res, SUCCESS_MESSAGES.ORDER_STATUS_UPDATED, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valider le retrait/livraison
   */
  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { qrCode } = req.body;

      const order = await orderService.complete(id, qrCode);
      sendSuccess(res, SUCCESS_MESSAGES.QR_SCANNED, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Annuler une commande
   */
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const { id } = req.params;

      const order = await orderService.cancel(id, userId, userRole);
      sendSuccess(res, SUCCESS_MESSAGES.ORDER_CANCELLED, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Régénérer le QR code
   */
  async regenerateQrCode(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;

      const order = await orderService.regenerateQrCode(id, providerId);
      sendSuccess(res, SUCCESS_MESSAGES.QR_CODE_REGENERATED, order);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Nombre de commandes en attente (admin)
   */
  async getPendingCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await orderService.countPending();
      sendSuccess(res, SUCCESS_MESSAGES.COUNT_FETCHED, { pendingCount: count });
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();
