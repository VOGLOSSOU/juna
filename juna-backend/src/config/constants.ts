// Cache TTL (Time To Live) en secondes
export const CACHE_TTL = {
  SHORT: 60 * 5, // 5 minutes
  MEDIUM: 60 * 30, // 30 minutes
  LONG: 60 * 60 * 24, // 24 heures
  WEEK: 60 * 60 * 24 * 7, // 7 jours
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Rate limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  AUTH_MAX_REQUESTS: 5, // Pour les endpoints d'auth
  ADMIN_MAX_REQUESTS: 500,
};

// JWT
export const JWT = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
};

// Password
export const PASSWORD = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
};

// File upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
};

// QR Code
export const QR_CODE = {
  SIZE: 300,
  ERROR_CORRECTION: 'M',
  MAX_REGENERATIONS: 2,
};

// Review
export const REVIEW = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  EDIT_WINDOW_DAYS: 7,
};

// Order
export const ORDER = {
  CANCELLATION_WINDOW_HOURS: 24,
};

// Proposal
export const PROPOSAL = {
  VALIDATION_DELAY_HOURS: 48,
  EXPIRY_DAYS: 30,
};

// Referral
export const REFERRAL = {
  CODE_LENGTH: 8,
  REWARD_AMOUNT: 500, // XOF
  EXPIRY_DAYS: 90,
};

export default {
  CACHE_TTL,
  PAGINATION,
  RATE_LIMIT,
  JWT,
  PASSWORD,
  FILE_UPLOAD,
  QR_CODE,
  REVIEW,
  ORDER,
  PROPOSAL,
  REFERRAL,
};