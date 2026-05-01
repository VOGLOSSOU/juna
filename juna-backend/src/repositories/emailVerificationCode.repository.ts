import { randomUUID } from 'crypto';
import prisma from '@/config/database';
import { EmailVerificationCode } from '@prisma/client';

export class EmailVerificationCodeRepository {
  async create(email: string, code: string, expiresAt: Date): Promise<EmailVerificationCode> {
    // Supprimer les anciens codes pour cet email avant d'en créer un nouveau
    await prisma.emailVerificationCode.deleteMany({ where: { email } });

    return prisma.emailVerificationCode.create({
      data: { email, code, expiresAt },
    });
  }

  async findByEmailAndCode(email: string, code: string): Promise<EmailVerificationCode | null> {
    return prisma.emailVerificationCode.findFirst({
      where: { email, code, verifiedAt: null },
    });
  }

  async markVerified(id: string): Promise<EmailVerificationCode> {
    const verifiedToken = randomUUID();
    const verifiedTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    return prisma.emailVerificationCode.update({
      where: { id },
      data: { verifiedAt: new Date(), verifiedToken, verifiedTokenExpiresAt },
    });
  }

  async findByVerifiedToken(token: string): Promise<EmailVerificationCode | null> {
    return prisma.emailVerificationCode.findUnique({
      where: { verifiedToken: token },
    });
  }

  async deleteByEmail(email: string): Promise<void> {
    await prisma.emailVerificationCode.deleteMany({ where: { email } });
  }

  async deleteExpired(): Promise<void> {
    await prisma.emailVerificationCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

export default new EmailVerificationCodeRepository();
