import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Envoyer une réponse de succès
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

/**
 * Envoyer une réponse d'erreur
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errorCode?: string,
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code: errorCode || 'ERROR',
      details,
    },
  };
  return res.status(statusCode).json(response);
};

/**
 * Envoyer une réponse paginée
 */
export const sendPaginated = <T>(
  res: Response,
  message: string,
  data: T[],
  pagination: PaginationMeta,
  statusCode: number = 200
): Response => {
  const response: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    pagination,
  };
  return res.status(statusCode).json(response);
};

/**
 * Calculer les métadonnées de pagination
 */
export const calculatePagination = (
  totalItems: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};