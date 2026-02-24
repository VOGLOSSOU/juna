import { z } from 'zod';
import { DeliveryMethod } from '@prisma/client';

/**
 * Schéma de validation pour créer une commande
 */
export const createOrderSchema = z.object({
  subscriptionId: z
    .string({ required_error: 'ID d\'abonnement requis' })
    .uuid('ID d\'abonnement invalide'),
  deliveryMethod: z.enum(['DELIVERY', 'PICKUP'], {
    required_error: 'Mode de livraison requis',
    invalid_type_error: 'Mode de livraison invalide',
  }),
  deliveryAddress: z
    .string()
    .max(500, 'Maximum 500 caractères')
    .optional()
    .nullable(),
  pickupLocation: z
    .string()
    .max(500, 'Maximum 500 caractères')
    .optional()
    .nullable(),
  scheduledFor: z
    .string()
    .datetime('Date invalide')
    .optional()
    .nullable(),
});

/**
 * Schéma de validation pour l'ID dans les params
 */
export const orderIdSchema = z.object({
  id: z.string().uuid('ID de commande invalide'),
});

/**
 * Schéma de validation pour le numéro de commande
 */
export const orderNumberSchema = z.object({
  orderNumber: z.string().min(1, 'Numéro de commande requis'),
});

/**
 * Schéma de validation pour scanner QR
 */
export const qrCodeSchema = z.object({
  qrCode: z.string().min(1, 'QR code requis'),
});

/**
 * Type inféré pour créer une commande
 */
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
