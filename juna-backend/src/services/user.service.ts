import prisma from '@/config/database';
import userRepository from '@/repositories/user.repository';
import { cityRepository } from '@/repositories/geography.repository';
import { comparePassword } from '@/utils/hash.util';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { UpdateProfileDTO, UpdatePreferencesDTO, DeleteAccountDTO, UpdateLocationDTO } from '@/validators/user.validator';
import { User, UserProfile, Prisma } from '@prisma/client';

export class UserService {
  /**
   * Obtenir le profil de l'utilisateur connecté
   */
  async getProfile(userId: string) {
    const user = await userRepository.findByIdWithProfile(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }
    return this.formatUserProfile(user);
  }

  /**
   * Mettre à jour le profil
   */
  async updateProfile(userId: string, data: UpdateProfileDTO) {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    if (data.phone && data.phone !== existingUser.phone) {
      const phoneExists = await userRepository.findByPhone(data.phone);
      if (phoneExists) {
        throw new ConflictError('Ce numéro de téléphone est déjà utilisé', ERROR_CODES.PHONE_ALREADY_EXISTS);
      }
    }

    const updateData: Prisma.UserUpdateInput = {
      name: data.name,
      phone: data.phone,
    };
    await userRepository.update(userId, updateData);

    if (data.address || data.cityId) {
      const userWithProfile = await userRepository.findByIdWithProfile(userId);

      if (userWithProfile?.profile) {
        await prisma.userProfile.update({
          where: { userId },
          data: {
            address: data.address,
            ...(data.cityId && { cityId: data.cityId }),
          },
        });
      } else {
        await prisma.userProfile.create({
          data: {
            userId,
            address: data.address || '',
            ...(data.cityId && { cityId: data.cityId }),
          },
        });
      }
    }

    return this.getProfile(userId);
  }

  /**
   * Mettre à jour les préférences
   */
  async updatePreferences(userId: string, data: UpdatePreferencesDTO): Promise<{ message: string }> {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    const userWithProfile = await userRepository.findByIdWithProfile(userId);

    if (userWithProfile?.profile) {
      await prisma.userProfile.update({
        where: { userId },
        data: { preferences: data as Prisma.JsonObject },
      });
    } else {
      await prisma.userProfile.create({
        data: {
          userId,
          preferences: data as Prisma.JsonObject,
        },
      });
    }

    return { message: 'Préférences mises à jour avec succès' };
  }

  /**
   * Mettre à jour la localisation de l'utilisateur
   */
  async updateLocation(userId: string, data: UpdateLocationDTO) {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    const city = await cityRepository.findById(data.cityId);
    if (!city) {
      throw new NotFoundError('Ville introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const userWithProfile = await userRepository.findByIdWithProfile(userId);

    if (userWithProfile?.profile) {
      await prisma.userProfile.update({
        where: { userId },
        data: { cityId: data.cityId },
      });
    } else {
      await prisma.userProfile.create({
        data: { userId, cityId: data.cityId },
      });
    }

    return {
      cityId: city.id,
      cityName: city.name,
      countryCode: (city as any).country?.code ?? null,
    };
  }

  /**
   * Supprimer le compte
   */
  async deleteAccount(userId: string, data: DeleteAccountDTO): Promise<{ message: string }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Mot de passe incorrect', ERROR_CODES.INVALID_PASSWORD);
    }

    await userRepository.revokeAllUserTokens(userId);
    await userRepository.delete(userId);

    return { message: 'Compte supprimé avec succès' };
  }

  /**
   * Formater le profil utilisateur pour la réponse
   */
  private formatUserProfile(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      isProfileComplete: !!(user.phone && user.profile?.cityId),
      profile: {
        avatar: user.profile?.avatar || null,
        address: user.profile?.address || null,
        city: user.profile?.city ?? null,
        preferences: user.profile?.preferences || null,
      },
    };
  }
}

export default new UserService();
