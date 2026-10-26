import { z } from 'zod';

export const addFavoriteSchema = z
  .object({
    subscriptionId: z.string().uuid("ID d'abonnement invalide"),
  })
  .strict();

export const favoriteParamsSchema = z.object({
  subscriptionId: z.string().uuid("ID d'abonnement invalide"),
});

export const favoriteQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
