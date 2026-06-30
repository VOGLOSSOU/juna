-- AlterTable: remove old link-based email verification fields (replaced by OTP flow)
ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerificationToken";
ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerificationExpires";

-- DropIndex (if they exist)
DROP INDEX IF EXISTS "users_emailVerificationToken_key";

-- CreateTable: OTP codes table (independent of user — used before registration too)
CREATE TABLE "email_verification_codes" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "verifiedToken" TEXT,
    "verifiedTokenExpiresAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_codes_verifiedToken_key" ON "email_verification_codes"("verifiedToken");
CREATE INDEX "email_verification_codes_email_idx" ON "email_verification_codes"("email");
