-- CreateEnum
CREATE TYPE "MealPriceType" AS ENUM ('FIXED', 'MULTIPLE', 'RANGE');

-- AlterTable
ALTER TABLE "meals" ADD COLUMN     "priceGuideline" TEXT,
ADD COLUMN     "priceMax" DOUBLE PRECISION,
ADD COLUMN     "priceMin" DOUBLE PRECISION,
ADD COLUMN     "priceType" "MealPriceType" NOT NULL DEFAULT 'FIXED';

-- CreateTable
CREATE TABLE "meal_pricings" (
    "id" UUID NOT NULL,
    "mealId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "meal_pricings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meal_pricings_mealId_idx" ON "meal_pricings"("mealId");

-- AddForeignKey
ALTER TABLE "meal_pricings" ADD CONSTRAINT "meal_pricings_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
