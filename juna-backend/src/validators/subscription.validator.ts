import { z } from 'zod';
import { SubscriptionType, SubscriptionCategory, SubscriptionDuration } from '@prisma/client';

// Validation pour SubscriptionType
const subscriptionTypeEnum = z.enum([
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'SNACK',
  'BREAKFAST_LUNCH',
  'BREAKFAST_DINNER',
  'LUNCH_DINNER',
  'FULL_DAY',
  'CUSTOM',
]);

// Validation pour SubscriptionCategory
const subscriptionCategoryEnum = z.enum([
  'AFRICAN',
  'EUROPEAN',
  'ASIAN',
  'AMERICAN',
  'FUSION',
  'VEGETARIAN',
  'VEGAN',
  'HALAL',
  'OTHER',
]);

// Validation pour SubscriptionDuration
const subscriptionDurationEnum = z.enum([
  'DAY',
  'THREE_DAYS',
  'WEEK',
  'TWO_WEEKS',
  'MONTH',
]);

/**
 * Schéma de validation pour créer un abonnement
 */
export const createSubscriptionSchema = z.object({
  name: z
    .string({ required_error: 'Nom requis' })
    .min(3, 'Minimum 3 caractères')
    .max(100, 'Maximum 100 caractères')
    .trim(),
  description: z
    .string({ required_error: 'Description requise' })
    .min(10, 'Minimum 10 caractères')
    .max(1000, 'Maximum 1000 caractères')
    .trim(),
  price: z
    .number({ required_error: 'Prix requis' })
    .positive('Le prix doit être positif')
    .min(100, 'Prix minimum: 100 XOF'),
  type: subscriptionTypeEnum,
  category: subscriptionCategoryEnum,
  duration: subscriptionDurationEnum,
  deliveryZones: z.any().optional(),
  pickupLocations: z.any().optional(),
  imageUrl: z
    .string()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),
  isPublic: z.boolean().optional(),
  mealIds: z
    .array(z.string().uuid('ID de repas invalide'))
    .optional(),
});

/**
 * Schéma de validation pour mettre à jour un abonnement
 */
export const updateSubscriptionSchema = z.object({
  name: z
    .string()
    .min(3, 'Minimum 3 caractères')
    .max(100, 'Maximum 100 caractères')
    .trim()
    .optional(),
  description: z
    .string()
    .min(10, 'Minimum 10 caractères')
    .max(1000, 'Maximum 1000 caractères')
    .trim()
    .optional(),
  price: z
    .number()
    .positive('Le prix doit être positif')
    .min(100, 'Prix minimum: 100 XOF')
    .optional(),
  type: subscriptionTypeEnum.optional(),
  category: subscriptionCategoryEnum.optional(),
  duration: subscriptionDurationEnum.optional(),
  deliveryZones: z.any().optional(),
  pickupLocations: z.any().optional(),
  imageUrl: z
    .string()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  mealIds: z
    .array(z.string().uuid('ID de repas invalide'))
    .optional(),
});

/**
 * Schéma de validation pour les filtres d'abonnement
 */
export const subscriptionFiltersSchema = z.object({
  type: subscriptionTypeEnum.optional(),
  category: subscriptionCategoryEnum.optional(),
  duration: subscriptionDurationEnum.optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  providerId: z.string().uuid('ID de fournisseur invalide').optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

/**
 * Schéma de validation pour l'ID dans les params
 */
export const subscriptionIdSchema = z.object({
  id: z.string().uuid('ID d\'abonnement invalide'),
});

/**
 * Type inféré pour créer un abonnement
 */
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

/**
 * Type inféré pour mettre à jour un abonnement
 */
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

/**
 * Type inféré pour les filtres
 */
export type SubscriptionFiltersInput = z.infer<typeof subscriptionFiltersSchema>;
