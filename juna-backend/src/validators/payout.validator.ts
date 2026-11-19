import { z } from 'zod';

export const adminListPayoutsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    // z.coerce.boolean() coercerait "false" en true (chaîne non vide) : on
    // valide explicitement les deux seules valeurs attendues dans la query string.
    needsAction: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
  })
  .strict();

export type AdminListPayoutsQueryDTO = z.infer<typeof adminListPayoutsQuerySchema>;

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid('ID de commande invalide'),
});

// Montant optionnel : l'admin ne le précise que si ce qui a réellement été
// versé en dehors du système diffère du montant actuellement enregistré.
export const confirmManualPayoutSchema = z
  .object({
    amount: z.coerce.number().positive('Le montant doit être positif').optional(),
  })
  .strict();

export type ConfirmManualPayoutDTO = z.infer<typeof confirmManualPayoutSchema>;
