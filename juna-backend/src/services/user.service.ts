import prisma from '@/config/database';
import userRepository from '@/repositories/user.repository';
import { comparePassword } from '@/utils/hash.util';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { UpdateProfileDTO, UpdatePreferencesDTO, DeleteAccountDTO } from '@/validators/user.validator';
import { UserProfileResponse } from '@/types/user.types';
import { User, UserProfile, Prisma } from '@prisma/client';

export class UserService {
  /**
   * Obtenir le profil de l'utilisateur connecté
   */
  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await userRepository.findByIdWithProfile(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    return this.formatUserProfile(user);
  }

  /**
   * Mettre à jour le profil
   */
  async updateProfile(userId: string, data: UpdateProfileDTO): Promise<UserProfileResponse> {
    // Vérifier si l'utilisateur existe
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    // Vérifier si le téléphone est déjà utilisé (si modifié)
    if (data.phone && data.phone !== existingUser.phone) {
      const phoneExists = await userRepository.findByPhone(data.phone);
      if (phoneExists) {
        throw new ConflictError(
          'Ce numéro de téléphone est déjà utilisé',
          ERROR_CODES.PHONE_ALREADY_EXISTS
        );
      }
    }

    // Mettre à jour l'utilisateur
    const updateData: Prisma.UserUpdateInput = {
      name: data.name,
      phone: data.phone,
    };
    await userRepository.update(userId, updateData);

    // Mettre à jour ou créer le profil
    if (data.address || data.city || data.country || data.latitude !== undefined || data.longitude !== undefined) {
      // Vérifier si un profil existe
      const userWithProfile = await userRepository.findByIdWithProfile(userId);
      
      if (userWithProfile?.profile) {
        // Mettre à jour le profil existant
        await prisma.userProfile.update({
          where: { userId },
          data: {
            address: data.address,
            city: data.city,
            country: data.country,
            latitude: data.latitude,
            longitude: data.longitude,
          },
        });
      } else {
        // Créer un nouveau profil directement avec prisma
        await prisma.userProfile.create({
          data: {
            userId,
            address: data.address || '',
            city: data.city || '',
            country: data.country || '',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
          },
        });
      }
    }

    // Retourner le profil mis à jour
    return this.getProfile(userId);
  }

  /**
   * Mettre à jour les préférences
   */
  async updatePreferences(userId: string, data: UpdatePreferencesDTO): Promise<{ message: string }> {
    // Vérifier si l'utilisateur existe
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    // Vérifier si un profil existe
    const userWithProfile = await userRepository.findByIdWithProfile(userId);
    
    if (userWithProfile?.profile) {
      // Mettre à jour les préférences
      await prisma.userProfile.update({
        where: { userId },
        data: {
          preferences: data as Prisma.JsonObject,
        },
      });
    } else {
      // Créer un nouveau profil avec les préférences directement avec prisma
      await prisma.userProfile.create({
        data: {
          userId,
          address: '',
          city: '',
          country: '',
          latitude: 0,
          longitude: 0,
          preferences: data as Prisma.JsonObject,
        },
      });
    }

    return { message: 'Préférences mises à jour avec succès' };
  }

  /**
   * Supprimer le compte
   */
  async deleteAccount(userId: string, data: DeleteAccountDTO): Promise<{ message: string }> {
    // Vérifier si l'utilisateur existe
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(
        'Mot de passe incorrect',
        ERROR_CODES.INVALID_PASSWORD
      );
    }

    // TODO: Envoyer un email de confirmation avant suppression définitive
    // Pour l'instant, suppression directe

    // Révoquer tous les tokens
    await userRepository.revokeAllUserTokens(userId);

    // Supprimer l'utilisateur (cascade supprimera les données liées)
    await userRepository.delete(userId);

    return { message: 'Compte supprimé avec succès' };
  }

  /**
   * Formater le profil utilisateur pour la réponse
   */
  private formatUserProfile(user: User & { profile: UserProfile | null }): UserProfileResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profile: {
        avatar: user.profile?.avatar || null,
        address: user.profile?.address || null,
        city: user.profile?.city || null,
        country: user.profile?.country || null,
        latitude: user.profile?.latitude || null,
        longitude: user.profile?.longitude || null,
        preferences: user.profile?.preferences || null,
      },
    };
  }
}

export default new UserService();
