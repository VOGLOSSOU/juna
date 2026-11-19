import { Request, Response, NextFunction } from 'express';
import favoriteService from '@/services/favorite.service';
import providerService from '@/services/provider.service';
import { sendSuccess } from '@/utils/response.util';
import { SUCCESS_MESSAGES } from '@/constants/messages';
import { RegisterProviderDTO, UpdateProviderDTO, ApproveProviderDTO, RejectProviderDTO, SetPayoutInfoDTO } from '@/validators/provider.validator';

export class ProviderController {
  /**
   * Enregistrer un nouveau fournisseur
   * POST /api/v1/providers/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const data: RegisterProviderDTO = req.body;
      const result = await providerService.register(userId, data);
      sendSuccess(res, SUCCESS_MESSAGES.PROVIDER_REGISTERED, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir mon profil fournisseur
   * GET /api/v1/providers/me
   */
  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const result = await providerService.getMyProfile(userId);
      sendSuccess(res, 'Profil fournisseur recupere avec succes', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre a jour le profil fournisseur
   * PUT /api/v1/providers/me
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const data: UpdateProviderDTO = req.body;
      const result = await providerService.updateProfile(userId, data);
      sendSuccess(res, SUCCESS_MESSAGES.PROVIDER_PROFILE_UPDATED, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Définir le numéro Mobile Money de réception des versements
   * PUT /api/v1/providers/me/payout
   */
  async setPayoutInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const data: SetPayoutInfoDTO = req.body;
      const result = await providerService.setPayoutInfo(userId, data);
      sendSuccess(res, SUCCESS_MESSAGES.PROVIDER_PAYOUT_INFO_UPDATED, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Paiements clients reçus et suivi de leur versement automatique
   * GET /api/v1/providers/me/payouts
   */
  async listPayouts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const result = await providerService.listPayouts(userId, { page, limit });
      sendSuccess(res, 'Versements recuperes avec succes', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approuver un fournisseur (Admin)
   * PUT /api/v1/admin/providers/:id/approve
   */
  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user!.id;
      const { id } = req.params;
      const data: ApproveProviderDTO = req.body;
      const result = await providerService.approve(id, adminId, data.message);
      sendSuccess(res, SUCCESS_MESSAGES.PROVIDER_APPROVED, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rejeter un fournisseur (Admin)
   * PUT /api/v1/admin/providers/:id/reject
   */
  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user!.id;
      const { id } = req.params;
      const data: RejectProviderDTO = req.body;
      const result = await providerService.reject(id, adminId, data.reason);
      sendSuccess(res, SUCCESS_MESSAGES.PROVIDER_REJECTED, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister tous les fournisseurs (Admin)
   * GET /api/v1/admin/providers
   */
  async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search } = req.query as any;
      const result = await providerService.listAll({ status, search });
      sendSuccess(res, 'Liste des fournisseurs', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les fournisseurs en attente (Admin)
   * GET /api/v1/admin/providers/pending
   */
  async getPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await providerService.getPending();
      sendSuccess(res, 'Fournisseurs en attente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Page publique d'un prestataire
   * GET /api/v1/providers/:id
   */
  async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await providerService.getPublicProfile(id);
      sendSuccess(res, 'Profil prestataire', {
        ...result, subscriptions: await favoriteService.annotate(result.subscriptions, req.user?.id),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suspendre un fournisseur (Admin)
   * PUT /api/v1/admin/providers/:id/suspend
   */
  async suspend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user!.id;
      const { id } = req.params;
      const { reason } = req.body as any;
      const result = await providerService.suspend(id, adminId, reason);
      sendSuccess(res, 'Fournisseur suspendu avec succes', result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProviderController();
