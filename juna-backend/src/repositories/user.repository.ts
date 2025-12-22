import prisma from '@/config/database';
import { User, UserProfile, RefreshToken, Prisma } from '@prisma/client';

export class UserRepository {
  /**
   * Créer un utilisateur
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Trouver un utilisateur par email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Trouver un utilisateur par ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Trouver un utilisateur par téléphone
   */
  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  /**
   * Trouver un utilisateur avec son profil
   */
  async findByIdWithProfile(id: string): Promise<(User & { profile: UserProfile | null }) | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  /**
   * Mettre à jour un utilisateur
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Supprimer un utilisateur
   */
  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Créer un profil utilisateur
   */
  async createProfile(userId: string, data: Prisma.UserProfileCreateInput): Promise<UserProfile> {
    return prisma.userProfile.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  /**
   * Sauvegarder un refresh token
   */
  async saveRefreshToken(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  /**
   * Trouver un refresh token
   */
  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  /**
   * Révoquer un refresh token
   */
  async revokeRefreshToken(token: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true },
    });
  }

  /**
   * Révoquer tous les refresh tokens d'un utilisateur
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  /**
   * Supprimer les tokens expirés
   */
  async deleteExpiredTokens(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

export default new UserRepository();