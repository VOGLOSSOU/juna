import { z } from 'zod';
import {
  feexPayReferenceSchema,
  normalizePaymentPhone,
  resolveNetwork,
} from '@/services/feexpay.service';

export const initiateDepositSchema = z.object({
  orderId: z.string().uuid('ID commande invalide'),
  phoneNumber: z
    .string()
    .min(8)
    .max(32)
    .superRefine((value, ctx) => {
      try {
        normalizePaymentPhone(value);
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'Numéro béninois invalide (229 suivi du numéro à 10 chiffres).',
        });
      }
    }),
  provider: z
    .string()
    .min(1)
    .max(40)
    .superRefine((value, ctx) => {
      try {
        resolveNetwork(value);
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'Opérateur non pris en charge. Choisissez MTN, Moov ou Celtiis au Bénin.',
        });
      }
    }),
});

export const feexPayWebhookSchema = z
  .object({
    reference: feexPayReferenceSchema,
    status: z.enum(['SUCCESSFUL', 'FAILED', 'PENDING', 'IN PENDING STATE']),
    amount: z.number().finite().positive(),
    callback_info: z.unknown().optional(),
  })
  .passthrough();
export type FeexPayWebhook = z.infer<typeof feexPayWebhookSchema>;
export const paymentIdSchema = z.object({ id: z.string().uuid('ID paiement invalide') });
export type InitiateDepositInput = z.infer<typeof initiateDepositSchema>;
