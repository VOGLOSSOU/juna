import { Prisma } from '@prisma/client';

// Always lock the order first, in initiation, finalization and cancellation.
// PostgreSQL serializes competing requests, including across API instances.
export async function lockPaymentOrder(tx: Prisma.TransactionClient, orderId: string) {
  await tx.$queryRaw`SELECT id FROM orders WHERE id = ${orderId}::uuid FOR UPDATE`;
}
