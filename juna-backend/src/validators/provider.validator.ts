import { z } from 'zod';

/**
 * Format d'une zone de livraison
 * { city: "Cotonou", country: "BJ", cost: 500 }
 */
const deliveryZoneSchema = z.object({
  city: z.string().min(2, 'Ville invalide').trim(),
  country: z.string().length(2, 'Code pays invalide (ex: BJ)').toUpperCase().trim(),
  cost: z.number().min(0, 'Le coût de livraison ne peut pas être négatif'),
});

/**
 * Schéma pour l'inscription d'un fournisseur
 */
export const registerProviderSchema = z.object({
  businessName: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  businessAddress: z.string().trim().min(3, 'L\'adresse doit contenir au moins 3 caractères'),
  logo: z.string().url('Le logo doit être une URL valide'),
  cityId: z.string().uuid('ID ville invalide'),
  acceptsDelivery: z.boolean({ required_error: 'Précisez si vous proposez la livraison' }),
  acceptsPickup: z.boolean({ required_error: 'Précisez si vous acceptez le retrait sur place' }),
  deliveryZones: z.array(deliveryZoneSchema).optional(),
  documentUrl: z.string().optional(),
  landmarkIds: z.array(z.string().uuid('ID lieu invalide')).optional(),
}).refine(
  (data) => data.acceptsDelivery || data.acceptsPickup,
  { message: 'Vous devez proposer au moins un mode de réception (livraison ou retrait sur place)' }
).refine(
  (data) => !data.acceptsDelivery || (data.deliveryZones && data.deliveryZones.length > 0),
  { message: 'Vous devez définir au moins une zone de livraison si vous proposez la livraison' }
);

export type RegisterProviderDTO = z.infer<typeof registerProviderSchema>;

/**
 * Schéma pour la mise à jour du profil fournisseur
 */
export const updateProviderSchema = z.object({
  businessName: z.string().trim().min(2).optional(),
  description: z.string().optional(),
  businessAddress: z.string().trim().min(3).optional(),
  logo: z.string().url().optional(),
  cityId: z.string().uuid('ID ville invalide').optional(),
  acceptsDelivery: z.boolean().optional(),
  acceptsPickup: z.boolean().optional(),
  deliveryZones: z.array(deliveryZoneSchema).optional(),
  documentUrl: z.string().optional(),
  landmarkIds: z.array(z.string().uuid('ID lieu invalide')).optional(),
}).refine(
  (data) => {
    // Si les deux sont explicitement définis à false, c'est invalide
    if (data.acceptsDelivery === false && data.acceptsPickup === false) return false;
    return true;
  },
  { message: 'Vous devez proposer au moins un mode de réception' }
).refine(
  (data) => {
    // Si livraison activée, des zones sont requises
    if (data.acceptsDelivery === true && (!data.deliveryZones || data.deliveryZones.length === 0)) return false;
    return true;
  },
  { message: 'Vous devez définir au moins une zone de livraison' }
);

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
