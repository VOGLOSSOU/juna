import { z } from 'zod';

/**
 * Schéma pour l'inscription d'un fournisseur
 */
export const registerProviderSchema = z.object({
  businessName: z.string().min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  businessAddress: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  documentUrl: z.string().url('URL du document invalide').optional(),
});

export type RegisterProviderDTO = z.infer<typeof registerProviderSchema>;

/**
 * Schéma pour la mise à jour du profil fournisseur
 */
export const updateProviderSchema = z.object({
  businessName: z.string().min(2).optional(),
  description: z.string().optional(),
  businessAddress: z.string().min(5).optional(),
  documentUrl: z.string().url().optional(),
});

export type UpdateProviderDTO = z.infer<typeof updateProviderSchema>;

/**
 * Schéma pour approuver un fournisseur
 */
export const approveProviderSchema = z.object({
  message: z.string().optional(),
});

export type ApproveProviderDTO = z.infer<typeof approveProviderSchema>;

/**
 * Schéma pour rejeter un fournisseur
 */
export const rejectProviderSchema = z.object({
  reason: z.string().min(10, 'La raison du rejet doit contenir au moins 10 caractères'),
});

export type RejectProviderDTO = z.infer<typeof rejectProviderSchema>;
