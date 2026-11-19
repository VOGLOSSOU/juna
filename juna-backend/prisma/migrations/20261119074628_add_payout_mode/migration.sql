-- CreateEnum
CREATE TYPE "PayoutMode" AS ENUM ('AUTOMATIC', 'MANUAL', 'TRIGGERED');

-- AlterTable
ALTER TABLE "payouts" ADD COLUMN     "mode" "PayoutMode" NOT NULL DEFAULT 'AUTOMATIC';
