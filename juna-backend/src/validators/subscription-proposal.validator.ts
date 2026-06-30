import { z } from 'zod';

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

const subscriptionDurationEnum = z.enum([
  'DAY',
  'THREE_DAYS',
  'WEEK',
  'TWO_WEEKS',
  'MONTH',
  'WORK_WEEK',
  'WORK_WEEK_2',
  'WORK_MONTH',
  'WEEKEND',
]);

const subscriptionProposalStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

const proposalMealSchema = z.object({
  mealId: z.string().uuid('ID de repas invalide'),
  // Variante choisie pour un plat à prix MULTIPLE (ex: "Demi"). Stockée en snapshot,
  // pas vérifiée contre MealPricing — c'est une indication pour le provider, pas une FK.
  mealPricingLabel: z.string().max(100, 'Maximum 100 caractères').trim().optional(),
  quantity: z.number().int().positive('La quantité doit être positive').default(1),
});

/**
 * Schéma de validation pour créer une proposition d'abonnement
 */
export const createSubscriptionProposalSchema = z.object({
  providerId: z.string({ required_error: 'Fournisseur requis' }).uuid('ID de fournisseur invalide'),
  type: subscriptionTypeEnum,
  category: subscriptionCategoryEnum,
  duration: subscriptionDurationEnum,
  message: z.string().max(500, 'Maximum 500 caractères').trim().optional().nullable(),
  meals: z
    .array(proposalMealSchema)
    .min(1, 'Au moins un repas requis')
    .max(20, 'Maximum 20 repas par proposition'),
});

/**
 * Schéma de validation pour approuver une proposition (le provider fixe les détails finaux)
 */
export const approveSubscriptionProposalSchema = z
  .object({
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
    junaCommissionPercent: z.number().min(0).max(100).default(10),
    type: subscriptionTypeEnum.optional(),
    category: subscriptionCategoryEnum.optional(),
    duration: subscriptionDurationEnum.optional(),
    imageUrl: z.string({ required_error: "URL de l'image requise" }).url('URL invalide'),
    isImmediate: z.boolean().optional(),
    preparationHours: z.number().int().min(0, 'Le délai ne peut pas être négatif').optional(),
    // Si omis, on reprend les repas/quantités tels que proposés par le user
    meals: z
      .array(
        z.object({
          mealId: z.string().uuid('ID de repas invalide'),
          quantity: z.number().int().positive('La quantité doit être positive').default(1),
        })
      )
      .min(1, 'Au moins un repas requis')
      .max(20, 'Maximum 20 repas par abonnement')
      .optional(),
  })
  .refine(
    (data) =>
      data.isImmediate !== false ||
      (data.preparationHours !== undefined && data.preparationHours > 0),
    {
      message: "Le délai de préparation est requis si l'abonnement n'est pas immédiat",
      path: ['preparationHours'],
    }
  );

/**
 * Schéma de validation pour rejeter une proposition
 */
export const rejectSubscriptionProposalSchema = z.object({
  rejectionReason: z
    .string({ required_error: 'Motif de rejet requis' })
    .min(5, 'Minimum 5 caractères')
    .max(500, 'Maximum 500 caractères')
    .trim(),
});

export const subscriptionProposalFiltersSchema = z.object({
  status: subscriptionProposalStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export const subscriptionProposalIdSchema = z.object({
  id: z.string().uuid('ID de proposition invalide'),
});

export type CreateSubscriptionProposalInput = z.infer<typeof createSubscriptionProposalSchema>;
export type ApproveSubscriptionProposalInput = z.infer<typeof approveSubscriptionProposalSchema>;
export type RejectSubscriptionProposalInput = z.infer<typeof rejectSubscriptionProposalSchema>;
export type SubscriptionProposalFiltersInput = z.infer<typeof subscriptionProposalFiltersSchema>;
