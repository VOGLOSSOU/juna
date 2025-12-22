import userRepository from '@/repositories/user.repository';
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

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(data: RegisterDTO): Promise<AuthResponse> {
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

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(data.password);

    // Créer l'utilisateur
    const user = await userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      role: 'USER',
    });

    // Créer le profil utilisateur
    await userRepository.createProfile(user.id, {
      user: { connect: { id: user.id } },
    });

    // Générer les tokens
    const tokens = this.generateTokens(user);

    // Sauvegarder le refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Retourner la réponse sans le mot de passe
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    // Trouver l'utilisateur par email
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError(
        'Email ou mot de passe incorrect',
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(
        'Email ou mot de passe incorrect',
        ERROR_CODES.INVALID_CREDENTIALS
      );
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new ForbiddenError('Compte suspendu ou banni', ERROR_CODES.ACCOUNT_SUSPENDED);
    }

    // Générer les tokens
    const tokens = this.generateTokens(user);

    // Sauvegarder le refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Retourner la réponse sans le mot de passe
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Rafraîchir l'access token
   */
  async refreshAccessToken(data: RefreshTokenDTO): Promise<{ accessToken: string }> {
    // Vérifier le refresh token
    const payload = verifyRefreshToken(data.refreshToken);

    // Vérifier si le token existe en DB et n'est pas révoqué
    const tokenRecord = await userRepository.findRefreshToken(data.refreshToken);
    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new UnauthorizedError('Refresh token invalide', ERROR_CODES.INVALID_TOKEN);
    }

    // Vérifier si le token est expiré
    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedError('Refresh token expiré', ERROR_CODES.TOKEN_EXPIRED);
    }

    // Trouver l'utilisateur
    const user = await userRepository.findById(payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Utilisateur introuvable ou inactif');
    }

    // Générer un nouveau access token
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
    // Trouver l'utilisateur
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await comparePassword(data.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Mot de passe actuel incorrect', ERROR_CODES.INVALID_PASSWORD);
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(data.newPassword);

    // Mettre à jour le mot de passe
    await userRepository.update(userId, { password: hashedPassword });

    // Révoquer tous les refresh tokens de l'utilisateur
    await userRepository.revokeAllUserTokens(userId);
  }

  /**
   * Générer les tokens (access + refresh)
   */
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

  /**
   * Sauvegarder un refresh token en base de données
   */
  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    // Expiration dans 7 jours
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