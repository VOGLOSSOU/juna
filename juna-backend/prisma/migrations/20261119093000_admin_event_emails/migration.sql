CREATE TABLE "admin_email_events" (
  "id" UUID NOT NULL,
  "eventKey" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "orderId" UUID NOT NULL,
  "sentAt" TIMESTAMP(3),
  "claimToken" UUID,
  "nextAttemptAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_email_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_email_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "admin_email_events_eventKey_key" ON "admin_email_events"("eventKey");
CREATE INDEX "admin_email_events_sentAt_nextAttemptAt_idx" ON "admin_email_events"("sentAt", "nextAttemptAt");
