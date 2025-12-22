import { z } from 'zod';
import { PASSWORD } from '@/config/constants';

/**
 * Schéma de validation pour l'inscription
 */
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email requis' })
      .email('Email invalide')
      .toLowerCase()
      .trim(),
    password: z
      .string({ required_error: 'Mot de passe requis' })
      .min(PASSWORD.MIN_LENGTH, `Minimum ${PASSWORD.MIN_LENGTH} caractères`)
      .max(PASSWORD.MAX_LENGTH, `Maximum ${PASSWORD.MAX_LENGTH} caractères`)
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    name: z
      .string({ required_error: 'Nom requis' })
      .min(2, 'Minimum 2 caractères')
      .max(100, 'Maximum 100 caractères')
      .trim(),
    phone: z
      .string()
      .regex(/^[+]?[\d\s-]{8,}$/, 'Numéro de téléphone invalide')
      .optional(),
  }),
});

/**
 * Schéma de validation pour la connexion
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email requis' })
      .email('Email invalide')
      .toLowerCase()
      .trim(),
    password: z.string({ required_error: 'Mot de passe requis' }),
  }),
});

/**
 * Schéma de validation pour le refresh token
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token requis' }),
  }),
});

/**
 * Schéma de validation pour la déconnexion
 */
export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token requis' }),
  }),
});

/**
 * Schéma de validation pour la vérification d'email
 */
export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Token de vérification requis' }),
  }),
});

/**
 * Schéma de validation pour mot de passe oublié
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email requis' })
      .email('Email invalide')
      .toLowerCase()
      .trim(),
  }),
});

/**
 * Schéma de validation pour réinitialiser le mot de passe
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Token de réinitialisation requis' }),
    newPassword: z
      .string({ required_error: 'Nouveau mot de passe requis' })
      .min(PASSWORD.MIN_LENGTH, `Minimum ${PASSWORD.MIN_LENGTH} caractères`)
      .max(PASSWORD.MAX_LENGTH, `Maximum ${PASSWORD.MAX_LENGTH} caractères`)
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  }),
});

/**
 * Schéma de validation pour changer le mot de passe
 */
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ required_error: 'Mot de passe actuel requis' }),
    newPassword: z
      .string({ required_error: 'Nouveau mot de passe requis' })
      .min(PASSWORD.MIN_LENGTH, `Minimum ${PASSWORD.MIN_LENGTH} caractères`)
      .max(PASSWORD.MAX_LENGTH, `Maximum ${PASSWORD.MAX_LENGTH} caractères`)
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  }),
});