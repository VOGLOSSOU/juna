ALTER TABLE "payments"
  ADD COLUMN "adminEmailSentAt" TIMESTAMP(3),
  ADD COLUMN "adminEmailClaimToken" UUID,
  ADD COLUMN "adminEmailNextAttemptAt" TIMESTAMP(3);

CREATE INDEX "payments_admin_email_pending_idx"
ON "payments"("gateway", "status", "adminEmailSentAt", "adminEmailNextAttemptAt");
