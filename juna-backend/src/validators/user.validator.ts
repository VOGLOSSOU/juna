import { z } from 'zod';

/**
 * Schéma pour la mise à jour du profil
 */
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Format de téléphone invalide').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;

/**
 * Schéma pour la mise à jour des préférences
 */
export const updatePreferencesSchema = z.object({
  dietaryRestrictions: z.array(z.string()).optional(),
  favoriteCategories: z.array(z.string()).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
});

export type UpdatePreferencesDTO = z.infer<typeof updatePreferencesSchema>;

/**
 * Schéma pour la suppression de compte
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Le mot de passe est requis'),
  reason: z.string().optional(),
});

export type DeleteAccountDTO = z.infer<typeof deleteAccountSchema>;

/**
 * Schéma pour l'upload d'avatar (v1 basique - sans fichier)
 */
export const avatarSchema = z.object({
  avatarUrl: z.string().url('URL d\'avatar invalide').optional(),
});

export type AvatarDTO = z.infer<typeof avatarSchema>;
