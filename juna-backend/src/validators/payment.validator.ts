import { z } from 'zod';

export const initiateDepositSchema = z.object({
  orderId: z.string().uuid('ID commande invalide'),
  phoneNumber: z.string().min(8, 'Numéro de téléphone invalide'),
  provider: z.string().optional(),
});

export const paymentIdSchema = z.object({
  id: z.string().uuid('ID paiement invalide'),
});

export type InitiateDepositInput = z.infer<typeof initiateDepositSchema>;
