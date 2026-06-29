import { z } from 'zod';

const mealTypeEnum = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);
const mealPriceTypeEnum = z.enum(['FIXED', 'MULTIPLE', 'RANGE']);

const mealPricingSchema = z.object({
  label: z.string().min(1, 'Label requis').max(100, 'Maximum 100 caractères').trim(),
  price: z.number().positive('Le prix doit être positif').min(100, 'Prix minimum: 100 XOF'),
});

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
  mealType: mealTypeEnum,
  imageUrl: z
    .string({ required_error: 'URL de l\'image requise' })
    .url('URL invalide'),
  priceType: mealPriceTypeEnum.default('FIXED'),
  // FIXED & MULTIPLE : prix de base (affiché dans les listings "à partir de")
  price: z.number().positive('Le prix doit être positif').min(100, 'Prix minimum: 100 XOF').optional(),
  // RANGE
  priceMin: z.number().positive('Prix minimum invalide').min(100).optional(),
  priceMax: z.number().positive('Prix maximum invalide').min(100).optional(),
  // Facultatif pour tous les types
  priceGuideline: z.string().max(300, 'Maximum 300 caractères').trim().optional().nullable(),
  // MULTIPLE
  pricings: z.array(mealPricingSchema).min(2, 'Au moins 2 variantes requises').optional(),
}).superRefine((data, ctx) => {
  if (data.priceType === 'FIXED') {
    if (data.price === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Le prix est requis', path: ['price'] });
    }
  }

  if (data.priceType === 'MULTIPLE') {
    if (!data.pricings || data.pricings.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Au moins 2 variantes de prix requises', path: ['pricings'] });
    }
  }

  if (data.priceType === 'RANGE') {
    if (data.priceMin === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Prix minimum requis', path: ['priceMin'] });
    }
    if (data.priceMax === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Prix maximum requis', path: ['priceMax'] });
    }
    if (data.priceMin !== undefined && data.priceMax !== undefined && data.priceMax <= data.priceMin) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Le prix maximum doit être supérieur au prix minimum', path: ['priceMax'] });
    }
  }
});

export const updateMealSchema = z.object({
  name: z.string().min(2, 'Minimum 2 caractères').max(100, 'Maximum 100 caractères').trim().optional(),
  description: z.string().min(5, 'Minimum 5 caractères').max(500, 'Maximum 500 caractères').trim().optional(),
  mealType: mealTypeEnum.optional(),
  imageUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  priceType: mealPriceTypeEnum.optional(),
  price: z.number().positive('Le prix doit être positif').min(100).optional(),
  priceMin: z.number().positive().min(100).optional(),
  priceMax: z.number().positive().min(100).optional(),
  priceGuideline: z.string().max(300, 'Maximum 300 caractères').trim().optional().nullable(),
  pricings: z.array(mealPricingSchema).min(2, 'Au moins 2 variantes requises').optional(),
}).superRefine((data, ctx) => {
  if (data.priceType === 'FIXED' && data.price === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Le prix est requis pour le type FIXED', path: ['price'] });
  }
  if (data.priceType === 'MULTIPLE' && (!data.pricings || data.pricings.length < 2)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Au moins 2 variantes de prix requises', path: ['pricings'] });
  }
  if (data.priceType === 'RANGE') {
    if (data.priceMin === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Prix minimum requis', path: ['priceMin'] });
    if (data.priceMax === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Prix maximum requis', path: ['priceMax'] });
    if (data.priceMin !== undefined && data.priceMax !== undefined && data.priceMax <= data.priceMin) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Le prix maximum doit être supérieur au prix minimum', path: ['priceMax'] });
    }
  }
});

export const mealFiltersSchema = z.object({
  providerId: z.string().uuid('ID de fournisseur invalide').optional(),
  mealType: mealTypeEnum.optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

export const mealIdSchema = z.object({
  id: z.string().uuid('ID de repas invalide'),
});

export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
export type MealFiltersInput = z.infer<typeof mealFiltersSchema>;
