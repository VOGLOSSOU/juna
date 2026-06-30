-- CreateEnum
CREATE TYPE "SubscriptionProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_PROPOSAL_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_PROPOSAL_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'SUBSCRIPTION_PROPOSAL_REJECTED';

-- CreateTable
CREATE TABLE "subscription_proposals" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "type" "SubscriptionType" NOT NULL,
    "category" "SubscriptionCategory" NOT NULL,
    "duration" "SubscriptionDuration" NOT NULL,
    "message" TEXT,
    "status" "SubscriptionProposalStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "resultingSubscriptionId" UUID,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_proposal_meals" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "mealId" UUID NOT NULL,
    "mealPricingLabel" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "subscription_proposal_meals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_proposals_resultingSubscriptionId_key" ON "subscription_proposals"("resultingSubscriptionId");

-- CreateIndex
CREATE INDEX "subscription_proposals_userId_status_idx" ON "subscription_proposals"("userId", "status");

-- CreateIndex
CREATE INDEX "subscription_proposals_providerId_status_idx" ON "subscription_proposals"("providerId", "status");

-- CreateIndex
CREATE INDEX "subscription_proposal_meals_mealId_idx" ON "subscription_proposal_meals"("mealId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_proposal_meals_proposalId_mealId_key" ON "subscription_proposal_meals"("proposalId", "mealId");

-- AddForeignKey
ALTER TABLE "subscription_proposals" ADD CONSTRAINT "subscription_proposals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_proposals" ADD CONSTRAINT "subscription_proposals_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_proposals" ADD CONSTRAINT "subscription_proposals_resultingSubscriptionId_fkey" FOREIGN KEY ("resultingSubscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_proposal_meals" ADD CONSTRAINT "subscription_proposal_meals_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "subscription_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_proposal_meals" ADD CONSTRAINT "subscription_proposal_meals_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
