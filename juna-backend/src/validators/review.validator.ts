import { z } from 'zod';
import { ReviewStatus } from '@prisma/client';

/**
 * Schéma de validation pour créer un avis
 */
export const createReviewSchema = z.object({
  orderId: z
    .string({ required_error: 'ID de commande requis' })
    .uuid('ID de commande invalide'),
  subscriptionId: z
    .string({ required_error: 'ID d\'abonnement requis' })
    .uuid('ID d\'abonnement invalide'),
  rating: z
    .number({ required_error: 'Note requise' })
    .int('La note doit être un entier')
    .min(1, 'Note minimum: 1')
    .max(5, 'Note maximum: 5'),
  comment: z
    .string()
    .max(1000, 'Maximum 1000 caractères')
    .optional()
    .nullable(),
});

/**
 * Schéma de validation pour mettre à jour un avis
 */
export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int('La note doit être un entier')
    .min(1, 'Note minimum: 1')
    .max(5, 'Note maximum: 5')
    .optional(),
  comment: z
    .string()
    .max(1000, 'Maximum 1000 caractères')
    .optional()
    .nullable(),
});

/**
 * Schéma de validation pour modérer un avis
 */
export const moderateReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    required_error: 'Statut requis',
    invalid_type_error: 'Statut invalide',
  }),
  reason: z
    .string()
    .max(500, 'Maximum 500 caractères')
    .optional()
    .nullable(),
});

/**
 * Schéma de validation pour les filtres d'avis
 */
export const reviewFiltersSchema = z.object({
  status: z.nativeEnum(ReviewStatus).optional(),
  subscriptionId: z.string().uuid('ID d\'abonnement invalide').optional(),
  userId: z.string().uuid('ID d\'utilisateur invalide').optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

/**
 * Schéma de validation pour l'ID dans les params
 */
export const reviewIdSchema = z.object({
  id: z.string().uuid('ID d\'avis invalide'),
});

/**
 * Schéma de validation pour l'ID de commande dans les params
 */
export const orderIdSchema = z.object({
  orderId: z.string().uuid('ID de commande invalide'),
});

/**
 * Schéma de validation pour l'ID d'abonnement dans les params
 */
export const subscriptionIdSchema = z.object({
  subscriptionId: z.string().uuid('ID d\'abonnement invalide'),
});

/**
 * Type inféré pour créer un avis
 */
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

/**
 * Type inféré pour mettre à jour un avis
 */
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

/**
 * Type inféré pour modérer un avis
 */
export type ModerateReviewInput = z.infer<typeof moderateReviewSchema>;

/**
 * Type inféré pour les filtres
 */
export type ReviewFiltersInput = z.infer<typeof reviewFiltersSchema>;
