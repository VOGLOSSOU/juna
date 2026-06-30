import { Request, Response, NextFunction } from 'express';
import subscriptionProposalService from '@/services/subscription-proposal.service';
import { sendSuccess } from '@/utils/response.util';
import { SUCCESS_MESSAGES } from '@/constants/messages';
import {
  CreateSubscriptionProposalInput,
  ApproveSubscriptionProposalInput,
  RejectSubscriptionProposalInput,
  SubscriptionProposalFiltersInput,
} from '@/validators/subscription-proposal.validator';

export class SubscriptionProposalController {
  /**
   * Créer une proposition d'abonnement
   * POST /api/v1/subscription-proposals
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const data: CreateSubscriptionProposalInput = req.body;
      const result = await subscriptionProposalService.create(userId, data);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_PROPOSAL_CREATED, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mes propositions envoyées (consumer)
   * GET /api/v1/subscription-proposals/me
   */
  async getMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const filters: SubscriptionProposalFiltersInput = req.query as any;
      const result = await subscriptionProposalService.getMine(userId, filters);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_PROPOSALS_FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Propositions reçues (provider)
   * GET /api/v1/subscription-proposals/received
   */
  async getReceived(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = (req as any).user.providerId;
      const filters: SubscriptionProposalFiltersInput = req.query as any;
      const result = await subscriptionProposalService.getReceived(providerId, filters);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_PROPOSALS_FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Détail d'une proposition
   * GET /api/v1/subscription-proposals/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const result = await subscriptionProposalService.getById(id, {
        userId: user.id,
        providerId: user.providerId,
      });
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_PROPOSAL_FETCHED, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approuver une proposition (provider)
   * POST /api/v1/subscription-proposals/:id/approve
   */
  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;
      const data: ApproveSubscriptionProposalInput = req.body;
      const result = await subscriptionProposalService.approve(id, providerId, data);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_PROPOSAL_APPROVED, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rejeter une proposition (provider)
   * POST /api/v1/subscription-proposals/:id/reject
   */
  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;
      const data: RejectSubscriptionProposalInput = req.body;
      const result = await subscriptionProposalService.reject(id, providerId, data);
      sendSuccess(res, SUCCESS_MESSAGES.SUBSCRIPTION_PROPOSAL_REJECTED, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new SubscriptionProposalController();
