-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "providerPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "junaCommissionPercent" SET DEFAULT 3.3;
