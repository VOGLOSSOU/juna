-- CreateTable
CREATE TABLE "active_subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "duration" "SubscriptionDuration" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "active_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "active_subscriptions_orderId_key" ON "active_subscriptions"("orderId");

-- CreateIndex
CREATE INDEX "active_subscriptions_userId_idx" ON "active_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "active_subscriptions_endsAt_idx" ON "active_subscriptions"("endsAt");

-- CreateIndex
CREATE INDEX "active_subscriptions_subscriptionId_idx" ON "active_subscriptions"("subscriptionId");

-- AddForeignKey
ALTER TABLE "active_subscriptions" ADD CONSTRAINT "active_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_subscriptions" ADD CONSTRAINT "active_subscriptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_subscriptions" ADD CONSTRAINT "active_subscriptions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
