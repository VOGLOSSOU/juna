import { Router } from 'express';
import authController from '@/controllers/auth.controller';
import { validate } from '@/middlewares/validation.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { authRateLimiter } from '@/middlewares/rateLimiter.middleware';
import {
  sendVerificationCodeSchema,
  verifyCodeSchema,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/validators/auth.validator';

const router = Router();

/**
 * POST /api/v1/auth/send-verification-code
 * Envoyer un code OTP à l'email (étape 1 avant inscription ou re-vérification)
 */
router.post(
  '/send-verification-code',
  authRateLimiter,
  validate(sendVerificationCodeSchema),
  authController.sendVerificationCode.bind(authController)
);

/**
 * POST /api/v1/auth/verify-code
 * Vérifier le code OTP reçu par email
 */
router.post(
  '/verify-code',
  authRateLimiter,
  validate(verifyCodeSchema),
  authController.verifyCode.bind(authController)
);

/**
 * POST /api/v1/auth/register
 * Inscription (requiert un verifiedToken valide)
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  authController.register.bind(authController)
);

/**
 * POST /api/v1/auth/login
 * Connexion d'un utilisateur
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  authController.login.bind(authController)
);

/**
 * POST /api/v1/auth/refresh
 * Rafraîchir l'access token
 */
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  authController.refreshToken.bind(authController)
);

/**
 * POST /api/v1/auth/logout
 * Déconnexion d'un utilisateur
 */
router.post(
  '/logout',
  validate(logoutSchema),
  authController.logout.bind(authController)
);

/**
 * POST /api/v1/auth/change-password
 * Changer le mot de passe (authentification requise)
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword.bind(authController)
);

/**
 * POST /api/v1/auth/forgot-password
 * Demander un lien de réinitialisation de mot de passe
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController)
);

/**
 * POST /api/v1/auth/reset-password
 * Réinitialiser le mot de passe via token reçu par email
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController)
);

export default router;
