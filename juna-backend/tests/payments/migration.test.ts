import fs from 'fs';
import path from 'path';
import prisma from '@/config/database';

afterAll(async () => prisma.$disconnect());
test('migration preserves PawaPay rows and backfills only identifiable FeexPay payments', async () => {
  const schema = 'payment_migration_test';
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`CREATE SCHEMA ${schema}`);
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO ${schema}`);
    await tx.$executeRawUnsafe(
      `CREATE TYPE "PaymentStatus" AS ENUM ('PENDING','PROCESSING','SUCCESS','FAILED','REFUNDED')`
    );
    await tx.$executeRawUnsafe(`CREATE TYPE "PaymentMethod" AS ENUM ('MOBILE_MONEY_MTN')`);
    await tx.$executeRawUnsafe(`CREATE TABLE payments (
      id UUID PRIMARY KEY, "orderId" UUID NOT NULL, status "PaymentStatus", "transactionId" TEXT,
      amount DOUBLE PRECISION, currency TEXT, method "PaymentMethod", "gatewayResponse" JSONB,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP)`);
    await tx.$executeRawUnsafe(`INSERT INTO payments (id,"orderId",status,"transactionId",amount,currency,method,"gatewayResponse") VALUES
      ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','PROCESSING','pawa-ref',3111.4,'XOF','MOBILE_MONEY_MTN','{"depositId":"pawa-ref","status":"ACCEPTED"}'),
      ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000012','PROCESSING','feex-ref',3111.4,'XOF','MOBILE_MONEY_MTN','{"reference":"feex-ref","status":"PENDING","callback_info":null}')`);
    const sql = fs.readFileSync(
      path.join(
        __dirname,
        '../../prisma/migrations/20261107200000_feexpay_payment_attempts/migration.sql'
      ),
      'utf8'
    );
    for (const statement of sql.split(';').filter((s) => s.trim()))
      await tx.$executeRawUnsafe(statement);
    const payments = await tx.$queryRawUnsafe<any[]>(`SELECT * FROM payments ORDER BY id`);
    const attempts = await tx.$queryRawUnsafe<any[]>(`SELECT * FROM payment_attempts`);
    expect(payments[0].gateway).toBe('PAWAPAY');
    expect(payments[0].amount).toBe(3111.4);
    expect(payments[1].gateway).toBe('FEEXPAY');
    expect(payments[1].amount).toBe(3111);
    expect(attempts).toHaveLength(2);
    expect(attempts.find((row) => row.gateway === 'PAWAPAY')).toMatchObject({
      reference: 'pawa-ref',
      amount: 3111.4,
    });
    expect(attempts.find((row) => row.gateway === 'FEEXPAY')).toMatchObject({
      reference: 'feex-ref',
      status: 'PROCESSING',
      amount: 3111,
      callbackInfo: '00000000-0000-4000-8000-000000000012',
    });
    await tx.$executeRawUnsafe(`DROP SCHEMA ${schema} CASCADE`);
  });
});
