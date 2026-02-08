import { Router } from 'express';
import userController from '@/controllers/user.controller';
import { validate } from '@/middlewares/validation.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import {
  updateProfileSchema,
  updatePreferencesSchema,
  deleteAccountSchema,
} from '@/validators/user.validator';

const router = Router();

/**
 * GET /api/v1/users/me
 * Obtenir le profil de l'utilisateur connecté
 */
router.get(
  '/me',
  authenticate,
  userController.getProfile.bind(userController)
);

/**
 * PUT /api/v1/users/me
 * Mettre à jour le profil
 */
router.put(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  userController.updateProfile.bind(userController)
);

/**
 * PUT /api/v1/users/me/preferences
 * Mettre à jour les préférences
 */
router.put(
  '/me/preferences',
  authenticate,
  validate(updatePreferencesSchema),
  userController.updatePreferences.bind(userController)
);

/**
 * DELETE /api/v1/users/me
 * Supprimer le compte
 */
router.delete(
  '/me',
  authenticate,
  validate(deleteAccountSchema),
  userController.deleteAccount.bind(userController)
);

export default router;
