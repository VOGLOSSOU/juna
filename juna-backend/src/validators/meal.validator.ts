import { z } from 'zod';
import { MealType } from '@prisma/client';

// Validation pour MealType
const mealTypeEnum = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);

/**
 * Schéma de validation pour créer un repas
 */
export const createMealSchema = z.object({
  name: z
    .string({ required_error: 'Nom requis' })
    .min(2, 'Minimum 2 caractères')
    .max(100, 'Maximum 100 caractères')
    .trim(),
  description: z
    .string({ required_error: 'Description requise' })
    .min(5, 'Minimum 5 caractères')
    .max(500, 'Maximum 500 caractères')
    .trim(),
  price: z
    .number({ required_error: 'Prix requis' })
    .positive('Le prix doit être positif')
    .min(100, 'Prix minimum: 100 XOF'),
  imageUrl: z
    .string({ required_error: 'URL de l\'image requise' })
    .url('URL invalide')
    .min(1, 'URL de l\'image requise'),
  mealType: mealTypeEnum,
});

/**
 * Schéma de validation pour mettre à jour un repas
 */
export const updateMealSchema = z.object({
  name: z
    .string()
    .min(2, 'Minimum 2 caractères')
    .max(100, 'Maximum 100 caractères')
    .trim()
    .optional(),
  description: z
    .string()
    .min(5, 'Minimum 5 caractères')
    .max(500, 'Maximum 500 caractères')
    .trim()
    .optional(),
  price: z
    .number()
    .positive('Le prix doit être positif')
    .min(100, 'Prix minimum: 100 XOF')
    .optional(),
  imageUrl: z
    .string()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),
  mealType: mealTypeEnum.optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schéma de validation pour les filtres de repas
 */
export const mealFiltersSchema = z.object({
  providerId: z.string().uuid('ID de fournisseur invalide').optional(),
  mealType: mealTypeEnum.optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

/**
 * Schéma de validation pour l'ID dans les params
 */
export const mealIdSchema = z.object({
  id: z.string().uuid('ID de repas invalide'),
});

/**
 * Type inféré pour créer un repas
 */
export type CreateMealInput = z.infer<typeof createMealSchema>;

/**
 * Type inféré pour mettre à jour un repas
 */
export type UpdateMealInput = z.infer<typeof updateMealSchema>;

/**
 * Type inféré pour les filtres
 */
export type MealFiltersInput = z.infer<typeof mealFiltersSchema>;
