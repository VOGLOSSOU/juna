import prisma from '@/config/database';
import providerRepository from '@/repositories/provider.repository';
import userRepository from '@/repositories/user.repository';
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import {
  RegisterProviderDTO,
  UpdateProviderDTO,
} from '@/validators/provider.validator';
import { ProviderStatus } from '@prisma/client';

export class ProviderService {
  /**
   * Enregistrer un nouveau fournisseur
   * Un USER fait une demande pour devenir fournisseur
   */
  async register(userId: string, data: RegisterProviderDTO) {
    // Verifier si l'utilisateur existe
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable', ERROR_CODES.USER_NOT_FOUND);
    }

    // Verifier si l'utilisateur est deja un fournisseur
    const existingProvider = await providerRepository.findByUserId(userId);
    if (existingProvider) {
      throw new ConflictError(
        'Vous etes deja enregistre comme fournisseur',
        ERROR_CODES.PROVIDER_EXISTS
      );
    }

    // Creer le fournisseur avec statut PENDING
    const provider = await providerRepository.create({
      user: { connect: { id: userId } },
      businessName: data.businessName,
      description: data.description,
      businessAddress: data.businessAddress,
      documentUrl: data.documentUrl,
      status: 'PENDING',
    });

    return {
      id: provider.id,
      businessName: provider.businessName,
      status: provider.status,
      message: 'Votre demande a ete enregistree. En attente de validation par l\'admin.',
    };
  }

  /**
   * Obtenir le profil du fournisseur connecte
   */
  async getMyProfile(userId: string) {
    const provider = await providerRepository.findByUserIdWithSubscriptions(userId);
    if (!provider) {
      throw new NotFoundError(
        'Profil fournisseur introuvable',
        ERROR_CODES.PROVIDER_NOT_FOUND
      );
    }

    return {
      id: provider.id,
      businessName: provider.businessName,
      description: provider.description,
      businessAddress: provider.businessAddress,
      documentUrl: provider.documentUrl,
      status: provider.status,
      rating: provider.rating,
      totalReviews: provider.totalReviews,
      createdAt: provider.createdAt,
      subscriptions: provider.subscriptions,
    };
  }

  /**
   * Mettre a jour le profil du fournisseur
   */
  async updateProfile(userId: string, data: UpdateProviderDTO) {
    const provider = await providerRepository.findByUserId(userId);
    if (!provider) {
      throw new NotFoundError(
        'Profil fournisseur introuvable',
        ERROR_CODES.PROVIDER_NOT_FOUND
      );
    }

    // Only approved providers can update their profile
    if (provider.status !== 'APPROVED') {
      throw new ForbiddenError(
        'Vous devez etre approuve pour modifier votre profil',
        ERROR_CODES.PROVIDER_NOT_APPROVED
      );
    }

    const updateData: any = {};
    if (data.businessName) updateData.businessName = data.businessName;
    if (data.description) updateData.description = data.description;
    if (data.businessAddress) updateData.businessAddress = data.businessAddress;
    if (data.documentUrl) updateData.documentUrl = data.documentUrl;

    const updatedProvider = await providerRepository.update(provider.id, updateData);

    return {
      id: updatedProvider.id,
      businessName: updatedProvider.businessName,
      description: updatedProvider.description,
      businessAddress: updatedProvider.businessAddress,
      status: updatedProvider.status,
    };
  }

  /**
   * Approuver un fournisseur (Admin uniquement)
   */
  async approve(providerId: string, adminId: string, message?: string) {
    const provider = await providerRepository.findByIdWithUser(providerId);
    if (!provider) {
      throw new NotFoundError(
        'Fournisseur introuvable',
        ERROR_CODES.PROVIDER_NOT_FOUND
      );
    }

    if (provider.status !== 'PENDING') {
      throw new ConflictError(
        'Ce fournisseur a deja ete traite',
        ERROR_CODES.PROVIDER_ALREADY_PROCESSED
      );
    }

    // Mettre a jour le statut du fournisseur
    await providerRepository.updateStatus(providerId, 'APPROVED');

    // Mettre a jour le role de l'utilisateur
    await prisma.user.update({
      where: { id: provider.userId },
      data: { role: 'PROVIDER' },
    });

    return {
      success: true,
      message: message || 'Fournisseur approuve avec succes',
      provider: {
        id: provider.id,
        businessName: provider.businessName,
        status: 'APPROVED' as const,
      },
    };
  }

  /**
   * Rejeter un fournisseur (Admin uniquement)
   */
  async reject(providerId: string, adminId: string, reason: string) {
    const provider = await providerRepository.findByIdWithUser(providerId);
    if (!provider) {
      throw new NotFoundError(
        'Fournisseur introuvable',
        ERROR_CODES.PROVIDER_NOT_FOUND
      );
    }

    if (provider.status !== 'PENDING') {
      throw new ConflictError(
        'Ce fournisseur a deja ete traite',
        ERROR_CODES.PROVIDER_ALREADY_PROCESSED
      );
    }

    // Mettre a jour le statut du fournisseur
    await providerRepository.updateStatus(providerId, 'REJECTED');

    return {
      success: true,
      message: 'Fournisseur rejete',
      provider: {
        id: provider.id,
        businessName: provider.businessName,
        status: 'REJECTED' as const,
        rejectionReason: reason,
      },
    };
  }

  /**
   * Lister tous les fournisseurs (Admin uniquement)
   */
  async listAll(filters?: { status?: ProviderStatus; search?: string }) {
    const providers = await providerRepository.findAll(filters);

    return providers.map((provider) => ({
      id: provider.id,
      businessName: provider.businessName,
      description: provider.description,
      businessAddress: provider.businessAddress,
      status: provider.status,
      rating: provider.rating,
      totalReviews: provider.totalReviews,
      createdAt: provider.createdAt,
    }));
  }

  /**
   * Obtenir les fournisseurs en attente (Admin uniquement)
   */
  async getPending() {
    return this.listAll({ status: 'PENDING' });
  }

  /**
   * Suspendre un fournisseur (Admin uniquement)
   */
  async suspend(providerId: string, adminId: string, reason?: string) {
    const provider = await providerRepository.findById(providerId);
    if (!provider) {
      throw new NotFoundError(
        'Fournisseur introuvable',
        ERROR_CODES.PROVIDER_NOT_FOUND
      );
    }

    await providerRepository.updateStatus(providerId, 'SUSPENDED');

    return {
      success: true,
      message: 'Fournisseur suspendu',
    };
  }
}

export default new ProviderService();
