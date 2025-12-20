import { PAGINATION } from '@/config/constants';

/**
 * Valider et parser les paramètres de pagination
 */
export const parsePaginationParams = (
  page?: string | number,
  limit?: string | number
): { page: number; limit: number; skip: number } => {
  const parsedPage = Math.max(1, parseInt(String(page || PAGINATION.DEFAULT_PAGE), 10));
  const parsedLimit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(String(limit || PAGINATION.DEFAULT_LIMIT), 10))
  );
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
  };
};

/**
 * Valider un email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valider un numéro de téléphone (format international)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s-]{8,}$/;
  return phoneRegex.test(phone);
};

/**
 * Valider un mot de passe
 * - Minimum 8 caractères
 * - Au moins une majuscule
 * - Au moins un chiffre
 */
export const isValidPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
};

/**
 * Nettoyer une chaîne de caractères (trim, lowercase)
 */
export const sanitizeString = (str: string): string => {
  return str.trim().toLowerCase();
};

/**
 * Générer un numéro de commande unique
 */
export const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${random}`;
};

/**
 * Générer un numéro de ticket unique
 */
export const generateTicketNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `TICK-${year}-${random}`;
};