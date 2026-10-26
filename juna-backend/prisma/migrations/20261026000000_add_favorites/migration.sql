CREATE TABLE "favorites" (
    "userId" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_pkey" PRIMARY KEY ("userId", "subscriptionId")
);
CREATE INDEX "favorites_userId_createdAt_idx" ON "favorites"("userId", "createdAt");
CREATE INDEX "favorites_subscriptionId_idx" ON "favorites"("subscriptionId");
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_subscriptionId_fkey"
    FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
