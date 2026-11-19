-- AlterTable
ALTER TABLE "payouts" ADD COLUMN     "successEmailClaimToken" UUID,
ADD COLUMN     "successEmailNextAttemptAt" TIMESTAMP(3),
ADD COLUMN     "successEmailSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "payouts_success_email_pending_idx" ON "payouts"("status", "successEmailSentAt", "successEmailNextAttemptAt");
