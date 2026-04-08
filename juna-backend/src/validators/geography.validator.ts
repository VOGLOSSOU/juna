import { z } from 'zod';

// ============================================
// COUNTRY
// ============================================

export const createCountrySchema = z.object({
  code: z
    .string()
    .length(2, 'Le code pays doit faire exactement 2 caractères')
    .toUpperCase(),
  translations: z.object({
    fr: z.string().min(1, 'Le nom en français est requis'),
    en: z.string().min(1, 'Le nom en anglais est requis'),
  }),
});

export const countryCodeSchema = z.object({
  code: z.string().length(2).toUpperCase(),
});

// ============================================
// CITY
// ============================================

export const createCitySchema = z.object({
  name: z.string().min(2, 'Le nom de la ville est requis'),
  countryId: z.string().uuid('ID pays invalide'),
});

export const cityIdSchema = z.object({
  id: z.string().uuid('ID ville invalide'),
});

// ============================================
// LANDMARK
// ============================================

export const createLandmarkSchema = z.object({
  name: z.string().min(2, 'Le nom du lieu est requis'),
  cityId: z.string().uuid('ID ville invalide'),
});

export const landmarkIdSchema = z.object({
  id: z.string().uuid('ID lieu invalide'),
});

// ============================================
// TYPES
// ============================================

export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type CreateCityInput = z.infer<typeof createCitySchema>;
export type CreateLandmarkInput = z.infer<typeof createLandmarkSchema>;
