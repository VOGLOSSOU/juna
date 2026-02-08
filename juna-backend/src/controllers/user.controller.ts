import { Request, Response, NextFunction } from 'express';
import userService from '@/services/user.service';
import { sendSuccess } from '@/utils/response.util';
import { SUCCESS_MESSAGES } from '@/constants/messages';
import { UpdateProfileDTO, UpdatePreferencesDTO, DeleteAccountDTO } from '@/validators/user.validator';

export class UserController {
  /**
   * Obtenir le profil de l'utilisateur connecté
   * GET /api/v1/users/me
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const result = await userService.getProfile(userId);
      sendSuccess(res, 'Profil récupéré avec succès', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour le profil
   * PUT /api/v1/users/me
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const data: UpdateProfileDTO = req.body;
      const result = await userService.updateProfile(userId, data);
      sendSuccess(res, SUCCESS_MESSAGES.PROFILE_UPDATED, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour les préférences
   * PUT /api/v1/users/me/preferences
   */
  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const data: UpdatePreferencesDTO = req.body;
      const result = await userService.updatePreferences(userId, data);
      sendSuccess(res, SUCCESS_MESSAGES.PREFERENCES_UPDATED, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer le compte
   * DELETE /api/v1/users/me
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const data: DeleteAccountDTO = req.body;
      const result = await userService.deleteAccount(userId, data);
      sendSuccess(res, SUCCESS_MESSAGES.ACCOUNT_DELETED, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
