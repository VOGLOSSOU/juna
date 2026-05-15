import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { RATE_LIMIT } from '@/config/constants';
import { sendError } from '@/utils/response.util';

/**
 * Rate limiter global (100 requêtes / 15 minutes)
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'Trop de requêtes, veuillez réessayer plus tard', 429, 'TOO_MANY_REQUESTS');
  },
});

/**
 * Rate limiter pour les endpoints d'authentification (5 requêtes / 15 minutes)
 */
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_REQUESTS,
  message: 'Trop de tentatives de connexion, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
  handler: (req, res) => {
    sendError(
      res,
      'Trop de tentatives de connexion, veuillez réessayer plus tard',
      429,
      'TOO_MANY_REQUESTS'
    );
  },
});

/**
 * Rate limiter pour les admins (500 requêtes / 15 minutes)
 */
export const adminRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.ADMIN_MAX_REQUESTS,
  message: 'Limite de requêtes atteinte',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 'Limite de requêtes atteinte', 429, 'TOO_MANY_REQUESTS');
  },
});

/**
 * Rate limiter pour l'envoi de codes OTP (3 envois max / 10 minutes par IP)
 * Compte toutes les requêtes y compris les succès pour éviter le spam d'emails
 */
export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(
      res,
      'Trop de codes envoyés. Veuillez patienter 10 minutes avant de réessayer.',
      429,
      'TOO_MANY_REQUESTS'
    );
  },
});

/**
 * Rate limiter personnalisable
 */
export const createRateLimiter = (maxRequests: number, windowMs: number = RATE_LIMIT.WINDOW_MS) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: 'Trop de requêtes, veuillez réessayer plus tard',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      sendError(res, 'Trop de requêtes, veuillez réessayer plus tard', 429, 'TOO_MANY_REQUESTS');
    },
  });
};