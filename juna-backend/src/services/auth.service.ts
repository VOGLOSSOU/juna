import crypto from 'crypto';
import userRepository from '@/repositories/user.repository';
import emailVerificationCodeRepository from '@/repositories/emailVerificationCode.repository';
import { hashPassword, comparePassword } from '@/utils/hash.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt.util';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  ChangePasswordDTO,
  RefreshTokenDTO,
} from '@/types/auth.types';
import { User } from '@prisma/client';
import {
  sendVerificationCodeEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from '@/services/email.service';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class AuthService {
  /**
   * Envoyer un code OTP de vérification à l'email
   */
  async sendVerificationCode(email: string): Promise<{ message: string }> {
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await emailVerificationCodeRepository.create(email, code, expiresAt);
    sendVerificationCodeEmail(email, code).catch(() => {});

    return { message: 'Code de vérification envoyé' };
  }

  /**
   * Vérifier le code OTP
   * — Pour le flow pré-inscription : retourne un verifiedToken à utiliser dans register
   * — Pour le flow post-connexion (user non vérifié) : met isVerified à true en base
   */
  async verifyCode(email: string, code: string): Promise<{
    verified: boolean;
    verifiedToken: string;
    userExists: boolean;
  }> {
    const record = await emailVerificationCodeRepository.findByEmailAndCode(email, code);

    if (!record) {
      throw new UnauthorizedError('Code invalide', ERROR_CODES.INVALID_TOKEN);
    }

    if (new Date() > record.expiresAt) {
      throw new UnauthorizedError('Code expiré', ERROR_CODES.TOKEN_EXPIRED);
    }

    const updated = await emailVerificationCodeRepository.markVerified(record.id);

    // Si l'user existe déjà (flow post-connexion), on marque isVerified: true
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      await userRepository.update(existingUser.id, { isVerified: true });
    }

    return {
      verified: true,
      verifiedToken: updated.verifiedToken!,
      userExists: !!existingUser,
    };
  }

  /**
   * Inscription d'un nouvel utilisateur
   * Requiert un verifiedToken valide (issu de verifyCode)
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Valider le verifiedToken
    const tokenRecord = await emailVerificationCodeRepository.findByVerifiedToken(data.verifiedToken);
    if (!tokenRecord) {
      throw new UnauthorizedError('Token de vérification invalide', ERROR_CODES.INVALID_TOKEN);
    }

    if (tokenRecord.email !== data.email) {
      throw new UnauthorizedError('Email ne correspond pas au token', ERROR_CODES.INVALID_TOKEN);
    }

    if (!tokenRecord.verifiedTokenExpiresAt || new Date() > tokenRecord.verifiedTokenExpiresAt) {
      throw new UnauthorizedError('Token de vérification expiré', ERROR_CODES.TOKEN_EXPIRED);
    }

    // Vérifier si l'email existe déjà
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Cet email est déjà utilisé', ERROR_CODES.EMAIL_ALREADY_EXISTS);
    }

    // Vérifier si le téléphone existe déjà (si fourni)
    if (data.phone) {
      const existingPhone = await userRepository.findByPhone(data.phone);
      if (existingPhone) {
        throw new ConflictError(
          'Ce numéro de téléphone est déjà utilisé',
          ERROR_CODES.PHONE_ALREADY_EXISTS
        );
      }
    }

    const hashedPassword = await hashPassword(data.password);

    // Créer l'user avec isVerified: true directement (email déjà validé par OTP)
    const user = await userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      role: 'USER',
      isVerified: true,
    });

    await userRepository.createProfile(user.id, {
      user: { connect: { id: user.id } },
    });

    // Supprimer le code de vérification utilisé
    await emailVerificationCodeRepository.deleteByEmail(data.email);

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Email de bienvenue (non-bloquant)
    sendWelcomeEmail(user.email, user.name).catch(() => {});

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
      isProfileComplete: false,
    };
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError(
        'Email ou mot de passe incorrect',
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(
        'Email ou mot de passe incorrect',
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    if (!user.isActive) {
      throw new ForbiddenError('Compte suspendu ou banni', ERROR_CODES.ACCOUNT_SUSPENDED);
    }

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    const userWithProfile = await userRepository.findByIdWithProfile(user.id);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
      isProfileComplete: !!(userWithProfile?.profile?.cityId),
    };
  }

  /**
   * Rafraîchir l'access token
   */
  async refreshAccessToken(data: RefreshTokenDTO): Promise<{ accessToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(data.refreshToken);
    } catch {
      throw new UnauthorizedError('Refresh token invalide ou expiré', ERROR_CODES.INVALID_TOKEN);
    }

    const tokenRecord = await userRepository.findRefreshToken(data.refreshToken);
    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new UnauthorizedError('Refresh token invalide', ERROR_CODES.INVALID_TOKEN);
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedError('Refresh token expiré', ERROR_CODES.TOKEN_EXPIRED);
    }

    const user = await userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Utilisateur introuvable ou inactif');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  }

  /**
   * Déconnexion (révoquer le refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenRecord = await userRepository.findRefreshToken(refreshToken);
    if (tokenRecord && !tokenRecord.isRevoked) {
      await userRepository.revokeRefreshToken(refreshToken);
    }
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(userId: string, data: ChangePasswordDTO): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    const isPasswordValid = await comparePassword(data.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Mot de passe actuel incorrect', ERROR_CODES.INVALID_PASSWORD);
    }

    const hashedPassword = await hashPassword(data.newPassword);
    await userRepository.update(userId, { password: hashedPassword });
    await userRepository.revokeAllUserTokens(userId);
  }

  /**
   * Mot de passe oublié — envoyer le lien de réinitialisation
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return { message: 'Si cet email existe, un lien de réinitialisation vous a été envoyé' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    sendPasswordResetEmail(user.email, user.name, resetToken).catch(() => {});

    return { message: 'Si cet email existe, un lien de réinitialisation vous a été envoyé' };
  }

  /**
   * Réinitialiser le mot de passe via token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await userRepository.findByPasswordResetToken(token);
    if (!user) {
      throw new UnauthorizedError('Token de réinitialisation invalide', ERROR_CODES.INVALID_TOKEN);
    }

    if (!user.passwordResetExpires || new Date() > user.passwordResetExpires) {
      throw new UnauthorizedError('Token de réinitialisation expiré', ERROR_CODES.TOKEN_EXPIRED);
    }

    const hashedPassword = await hashPassword(newPassword);

    await userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    await userRepository.revokeAllUserTokens(user.id);

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await userRepository.saveRefreshToken({
      user: { connect: { id: userId } },
      token,
      expiresAt,
    });
  }
}

export default new AuthService();
