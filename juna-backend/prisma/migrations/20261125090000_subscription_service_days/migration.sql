ALTER TABLE "subscriptions" ADD COLUMN "serviceDaysCount" INTEGER;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_service_days_range" CHECK ("serviceDaysCount" BETWEEN 1 AND 30);
