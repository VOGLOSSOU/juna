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
  'WORK_WEEK',       // 5 jours (Lundi-Vendredi)
  'WORK_WEEK_2',     // 10 jours (2 semaines de travail)
  'WORK_MONTH',      // 20 jours (4 semaines de travail)
  'WEEKEND',         // 2 jours (Samedi-Dimanche)
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
  junaCommissionPercent: z
    .number()
    .min(0, 'Commission minimum: 0%')
    .max(100, 'Commission maximum: 100%')
    .default(10),
  type: subscriptionTypeEnum,
  category: subscriptionCategoryEnum,
  duration: subscriptionDurationEnum,
  imageUrl: z
    .string({ required_error: 'URL de l\'image requise' })
    .url('URL invalide')
    .min(1, 'URL de l\'image obligatoire'),
  isPublic: z.boolean().optional(),
  isImmediate: z.boolean().optional(),
  preparationHours: z.number().int().min(0, 'Le délai ne peut pas être négatif').optional(),
  mealIds: z
    .array(z.string().uuid('ID de repas invalide'))
    .min(1, 'Au moins un repas requis'),
}).refine(
  (data) => data.isImmediate !== false || (data.preparationHours !== undefined && data.preparationHours > 0),
  { message: 'Le délai de préparation est requis si l\'abonnement n\'est pas immédiat', path: ['preparationHours'] }
);

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
  junaCommissionPercent: z
    .number()
    .min(0, 'Commission minimum: 0%')
    .max(100, 'Commission maximum: 100%')
    .optional(),
  type: subscriptionTypeEnum.optional(),
  category: subscriptionCategoryEnum.optional(),
  duration: subscriptionDurationEnum.optional(),
  imageUrl: z
    .string()
    .url('URL invalide')
    .optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  isImmediate: z.boolean().optional(),
  preparationHours: z.number().int().min(0).optional(),
  mealIds: z
    .array(z.string().uuid('ID de repas invalide'))
    .optional(),
}).refine(
  (data) => data.isImmediate !== false || (data.preparationHours !== undefined && data.preparationHours > 0),
  { message: 'Le délai de préparation est requis si l\'abonnement n\'est pas immédiat', path: ['preparationHours'] }
);

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
  city: z.string().optional(),
  cityId: z.string().uuid('ID ville invalide').optional(),
  country: z.string().length(2).toUpperCase().optional(),
  landmarkId: z.string().uuid('ID lieu invalide').optional(),
  sort: z.enum(['popular', 'recent', 'rating', 'price_asc', 'price_desc']).optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
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
