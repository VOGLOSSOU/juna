import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors.util';
import { sendError } from '@/utils/response.util';
import { logError } from '@/utils/logger.util';
import { env } from '@/config/env';
import { Prisma } from '@prisma/client';

/**
 * Middleware de gestion des erreurs globales
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Logger l'erreur
  logError(err.message, err);

  // Erreur personnalisée (AppError)
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  // Erreurs Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(err, res);
    return;
  }

  // Erreur de validation Prisma
  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(res, 'Erreur de validation des données', 400, 'VALIDATION_ERROR');
    return;
  }

  // Erreur inconnue
  const statusCode = 500;
  const message = env.nodeEnv === 'development' ? err.message : 'Erreur serveur interne';
  const errorCode = 'INTERNAL_SERVER_ERROR';

  sendError(
    res,
    message,
    statusCode,
    errorCode,
    env.nodeEnv === 'development' ? { stack: err.stack } : undefined
  );
};

/**
 * Gérer les erreurs Prisma spécifiques
 */
const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError, res: Response): void => {
  switch (err.code) {
    // Violation de contrainte unique
    case 'P2002': {
      const field = (err.meta?.target as string[])?.join(', ') || 'champ';
      sendError(res, `Ce ${field} est déjà utilisé`, 409, 'CONFLICT');
      break;
    }

    // Enregistrement non trouvé
    case 'P2025': {
      sendError(res, 'Ressource introuvable', 404, 'NOT_FOUND');
      break;
    }

    // Violation de clé étrangère
    case 'P2003': {
      sendError(res, 'Ressource liée introuvable', 400, 'BAD_REQUEST');
      break;
    }

    // Contrainte de relation violée
    case 'P2014': {
      sendError(res, 'Cette ressource est liée à d\'autres ressources', 400, 'BAD_REQUEST');
      break;
    }

    // Erreur par défaut
    default: {
      sendError(res, 'Erreur de base de données', 500, 'DATABASE_ERROR');
    }
  }
};

/**
 * Middleware pour les routes non trouvées (404)
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.originalUrl} introuvable`, 404, 'NOT_FOUND');
};