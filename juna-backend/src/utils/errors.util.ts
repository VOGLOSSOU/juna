/**
 * Classe de base pour les erreurs custom
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur de validation (400)
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Erreur de validation', code: string = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

/**
 * Erreur d'authentification (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Non authentifié', code: string = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

/**
 * Erreur d'autorisation (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Accès refusé', code: string = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

/**
 * Erreur de ressource introuvable (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Ressource introuvable', code: string = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

/**
 * Erreur de conflit (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflit détecté', code: string = 'CONFLICT') {
    super(message, 409, code);
  }
}

/**
 * Erreur de rate limiting (429)
 */
export class TooManyRequestsError extends AppError {
  constructor(
    message: string = 'Trop de requêtes, veuillez réessayer plus tard',
    code: string = 'TOO_MANY_REQUESTS'
  ) {
    super(message, 429, code);
  }
}

/**
 * Erreur serveur interne (500)
 */
export class InternalServerError extends AppError {
  constructor(
    message: string = 'Erreur serveur interne',
    code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message, 500, code);
  }
}

/**
 * Erreur de service externe (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = 'Service temporairement indisponible',
    code: string = 'SERVICE_UNAVAILABLE'
  ) {
    super(message, 503, code);
  }
}