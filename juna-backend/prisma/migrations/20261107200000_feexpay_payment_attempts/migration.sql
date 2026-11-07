ALTER TABLE "payments" ADD COLUMN "gateway" TEXT NOT NULL DEFAULT 'PAWAPAY';

CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "gateway" TEXT NOT NULL DEFAULT 'FEEXPAY',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PROCESSING',
    "reference" TEXT,
    "callbackInfo" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "method" "PaymentMethod" NOT NULL,
    "phoneNumber" TEXT,
    "network" TEXT,
    "gatewayResponse" JSONB,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewReason" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_attempts_reference_key" ON "payment_attempts"("reference");
CREATE INDEX "payment_attempts_paymentId_createdAt_idx" ON "payment_attempts"("paymentId", "createdAt");
CREATE INDEX "payment_attempts_gateway_status_lastCheckedAt_idx" ON "payment_attempts"("gateway", "status", "lastCheckedAt");
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Only migrate identifiable FeexPay responses. Unknown legacy references must
-- never be queried against the wrong gateway or retried automatically.
UPDATE "payments" SET "gateway" = 'FEEXPAY'
WHERE "transactionId" IS NOT NULL AND "gatewayResponse"->>'reference' = "transactionId";

INSERT INTO "payment_attempts" (
    "id", "paymentId", "gateway", "status", "reference", "callbackInfo", "amount",
    "currency", "method", "phoneNumber", "gatewayResponse", "createdAt", "updatedAt"
)
SELECT "id", "id", "gateway", "status", "transactionId",
       COALESCE(NULLIF("gatewayResponse"->>'callback_info', ''), "orderId"::text),
       CASE WHEN "gateway" = 'FEEXPAY' THEN ROUND("amount"::numeric)::double precision ELSE "amount" END, "currency", "method",
       "gatewayResponse"->>'phoneNumber', "gatewayResponse", "createdAt", "updatedAt"
FROM "payments";

UPDATE "payments" SET "amount" = ROUND("amount"::numeric)::double precision
WHERE "gateway" = 'FEEXPAY';
