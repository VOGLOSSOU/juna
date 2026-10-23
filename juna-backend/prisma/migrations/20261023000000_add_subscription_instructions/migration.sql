-- Optional provider instructions; existing subscriptions remain NULL.
ALTER TABLE "subscriptions" ADD COLUMN "instructions" TEXT;
