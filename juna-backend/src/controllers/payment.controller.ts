import { Request, Response, NextFunction } from 'express';
import paymentService from '@/services/payment.service';

export class PaymentController {
  async initiateDeposit(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { orderId, phoneNumber, provider } = req.body;

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

  async depositCallback(req: Request, res: Response, next: NextFunction) {
    try {
      await paymentService.handleDepositCallback(req.body);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async payoutCallback(req: Request, res: Response) {
    console.log('[Webhook] Payout callback received:', JSON.stringify(req.body));
    res.status(200).json({ success: true });
  }

  async refundCallback(req: Request, res: Response) {
    console.log('[Webhook] Refund callback received:', JSON.stringify(req.body));
    res.status(200).json({ success: true });
  }

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
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
