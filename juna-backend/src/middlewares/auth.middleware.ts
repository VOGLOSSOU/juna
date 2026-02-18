import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/utils/jwt.util';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors.util';
import { UserRole } from '@prisma/client';
import { isRoleAtLeast } from '@/constants/roles';
import prisma from '@/config/database';

/**
 * Middleware pour vérifier l'authentification
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token manquant');
    }

    const token = authHeader.split(' ')[1];

    // Vérifier le token
    const payload = verifyAccessToken(token);

    // Chercher le provider associated si existant
    const provider = await prisma.provider.findFirst({
      where: { userId: payload.userId },
      select: { id: true, status: true }
    });

    // Ajouter l'utilisateur au request
    (req as any).user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
      providerId: provider?.id || null,
      providerStatus: provider?.status || null,
    };

    next();
  } catch (error: any) {
    if (error.message === 'TOKEN_EXPIRED') {
      next(new UnauthorizedError('Token expiré'));
    } else if (error.message === 'INVALID_TOKEN') {
      next(new UnauthorizedError('Token invalide'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware pour vérifier les rôles autorisés
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!(req as any).user) {
        throw new UnauthorizedError('Non authentifié');
      }

      const userRole = (req as any).user.role;

      // Vérifier si l'utilisateur a un des rôles autorisés
      const hasRole = allowedRoles.some((role) => userRole === role);

      if (!hasRole) {
        throw new ForbiddenError('Permissions insuffisantes');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware pour vérifier le niveau de rôle minimum
 */
export const requireRole = (minimumRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!(req as any).user) {
        throw new UnauthorizedError('Non authentifié');
      }

      const userRole = (req as any).user.role;

      if (!isRoleAtLeast(userRole, minimumRole)) {
        throw new ForbiddenError('Permissions insuffisantes');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware optionnel : authentification sans erreur si pas de token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyAccessToken(token);

      // Chercher le provider associé si existant
      const provider = await prisma.provider.findFirst({
        where: { userId: payload.userId },
        select: { id: true, status: true }
      });

      (req as any).user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
        providerId: provider?.id || null,
        providerStatus: provider?.status || null,
      };
    }

    next();
  } catch (error) {
    // On ignore les erreurs et on continue sans user
    next();
  }
};