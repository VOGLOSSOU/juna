import { z } from 'zod';

/**
 * Schéma pour l'inscription d'un fournisseur
 */
export const registerProviderSchema = z.object({
  businessName: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caracteres'),
  description: z.string().optional(),
  businessAddress: z.string().trim().min(3, 'L\'adresse doit contenir au moins 3 caracteres'),
  documentUrl: z.string().optional(),
});

export type RegisterProviderDTO = z.infer<typeof registerProviderSchema>;

/**
 * Schéma pour la mise à jour du profil fournisseur
 */
export const updateProviderSchema = z.object({
  businessName: z.string().trim().min(2).optional(),
  description: z.string().optional(),
  businessAddress: z.string().trim().min(3).optional(),
  documentUrl: z.string().optional(),
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
