-- CreateEnum
CREATE TYPE "PayoutNetwork" AS ENUM ('MTN', 'MOOV');

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "payoutNetwork" "PayoutNetwork",
ADD COLUMN     "payoutPhoneNumber" VARCHAR(20);
