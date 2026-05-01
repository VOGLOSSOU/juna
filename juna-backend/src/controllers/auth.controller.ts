import { Request, Response, NextFunction } from 'express';
import authService from '@/services/auth.service';
import { sendSuccess } from '@/utils/response.util';
import { SUCCESS_MESSAGES } from '@/constants/messages';
import { RegisterDTO, LoginDTO, ChangePasswordDTO, RefreshTokenDTO, SendVerificationCodeDTO, VerifyCodeDTO } from '@/types/auth.types';

export class AuthController {
  /**
   * Envoyer le code OTP de vérification
   * POST /api/v1/auth/send-verification-code
   */
  async sendVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: SendVerificationCodeDTO = req.body;
      const result = await authService.sendVerificationCode(data.email);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifier le code OTP
   * POST /api/v1/auth/verify-code
   */
  async verifyCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: VerifyCodeDTO = req.body;
      const result = await authService.verifyCode(data.email, data.code);
      sendSuccess(res, 'Email vérifié avec succès', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Inscription
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: RegisterDTO = req.body;
      const result = await authService.register(data);
      sendSuccess(res, SUCCESS_MESSAGES.REGISTER_SUCCESS, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Connexion
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: LoginDTO = req.body;
      const result = await authService.login(data);
      sendSuccess(res, SUCCESS_MESSAGES.LOGIN_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rafraîchir l'access token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: RefreshTokenDTO = req.body;
      const result = await authService.refreshAccessToken(data);
      sendSuccess(res, 'Token rafraîchi avec succès', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Déconnexion
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      sendSuccess(res, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Changer le mot de passe
   * PUT /api/v1/auth/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user!.id;
      const data: ChangePasswordDTO = req.body;
      await authService.changePassword(userId, data);
      sendSuccess(res, SUCCESS_MESSAGES.PASSWORD_CHANGED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mot de passe oublié
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Réinitialiser le mot de passe
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();