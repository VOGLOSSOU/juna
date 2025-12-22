import { Router } from 'express';
import authController from '@/controllers/auth.controller';
import { validate } from '@/middlewares/validation.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { authRateLimiter } from '@/middlewares/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  changePasswordSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/validators/auth.validator';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Inscription d'un nouvel utilisateur
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
 * PUT /api/v1/auth/change-password
 * Changer le mot de passe (authentification requise)
 */
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword.bind(authController)
);

/**
 * POST /api/v1/auth/verify-email
 * Vérifier l'email (à implémenter)
 */
router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  authController.verifyEmail.bind(authController)
);

/**
 * POST /api/v1/auth/forgot-password
 * Mot de passe oublié (à implémenter)
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController)
);

/**
 * POST /api/v1/auth/reset-password
 * Réinitialiser le mot de passe (à implémenter)
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController)
);

export default router;