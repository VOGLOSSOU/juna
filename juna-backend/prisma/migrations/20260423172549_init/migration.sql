/*
  Warnings:

  - The values [PREPARING,READY,IN_DELIVERY,DELIVERED,REFUNDED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `city` on the `custom_proposals` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `custom_proposals` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryZones` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `pickupLocations` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `user_profiles` table. All the data in the column will be lost.
  - Added the required column `cityId` to the `custom_proposals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cityId` to the `providers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `logo` to the `providers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Made the column `imageUrl` on table `subscriptions` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SubscriptionDuration" AS ENUM ('DAY', 'THREE_DAYS', 'WEEK', 'TWO_WEEKS', 'MONTH', 'WORK_WEEK', 'WORK_WEEK_2', 'WORK_MONTH', 'WEEKEND');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "subscriptions_frequency_idx";

-- AlterTable
ALTER TABLE "custom_proposals" DROP COLUMN "city",
DROP COLUMN "country",
ADD COLUMN     "cityId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryCity" TEXT,
ADD COLUMN     "deliveryCost" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "providers" ADD COLUMN     "acceptsDelivery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsPickup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cityId" UUID NOT NULL,
ADD COLUMN     "deliveryZones" JSONB,
ADD COLUMN     "logo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "deliveryZones",
DROP COLUMN "frequency",
DROP COLUMN "pickupLocations",
ADD COLUMN     "duration" "SubscriptionDuration" NOT NULL,
ADD COLUMN     "isImmediate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "junaCommissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
ADD COLUMN     "preparationHours" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "imageUrl" SET NOT NULL;

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "cityId" UUID;

-- DropEnum
DROP TYPE "SubscriptionFrequency";

-- CreateTable
CREATE TABLE "countries" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "translations" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landmarks" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "landmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_landmarks" (
    "providerId" UUID NOT NULL,
    "landmarkId" UUID NOT NULL,

    CONSTRAINT "provider_landmarks_pkey" PRIMARY KEY ("providerId","landmarkId")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE INDEX "cities_countryId_idx" ON "cities"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_countryId_key" ON "cities"("name", "countryId");

-- CreateIndex
CREATE INDEX "landmarks_cityId_idx" ON "landmarks"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "landmarks_name_cityId_key" ON "landmarks"("name", "cityId");

-- CreateIndex
CREATE INDEX "custom_proposals_cityId_idx" ON "custom_proposals"("cityId");

-- CreateIndex
CREATE INDEX "providers_cityId_idx" ON "providers"("cityId");

-- CreateIndex
CREATE INDEX "subscriptions_duration_idx" ON "subscriptions"("duration");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_proposals" ADD CONSTRAINT "custom_proposals_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landmarks" ADD CONSTRAINT "landmarks_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_landmarks" ADD CONSTRAINT "provider_landmarks_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_landmarks" ADD CONSTRAINT "provider_landmarks_landmarkId_fkey" FOREIGN KEY ("landmarkId") REFERENCES "landmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
