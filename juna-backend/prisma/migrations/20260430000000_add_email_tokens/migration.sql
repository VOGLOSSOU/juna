-- AlterTable: add email verification and password reset token fields to users
ALTER TABLE "users" ADD COLUMN     "emailVerificationExpires" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN     "emailVerificationToken" TEXT;
ALTER TABLE "users" ADD COLUMN     "passwordResetExpires" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN     "passwordResetToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "users"("passwordResetToken");
