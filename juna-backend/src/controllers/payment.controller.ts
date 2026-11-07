import { Request, Response, NextFunction } from 'express';
import paymentService from '@/services/payment.service';
import { UnauthorizedError } from '@/utils/errors.util';
import { feexPayWebhookSchema, initiateDepositSchema } from '@/validators/payment.validator';

export class PaymentController {
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.handleWebhook(feexPayWebhookSchema.parse(req.body));
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async initiateDeposit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const userId = req.user.id;
      const { orderId, phoneNumber, provider } = initiateDepositSchema.parse(req.body);

      const result = await paymentService.initiateDeposit(userId, {
        orderId,
        phoneNumber,
        provider,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const userId = req.user.id;
      const { id } = req.params;

      const payment = await paymentService.getStatus(id, userId);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new PaymentController();
