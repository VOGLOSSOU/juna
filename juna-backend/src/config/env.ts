import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement depuis la racine du projet
dotenv.config({ path: path.join(process.cwd(), '.env') });

interface EnvConfig {
  // Application
  nodeEnv: string;
  port: number;
  apiVersion: string;
  appName: string;

  // Database
  databaseUrl: string;

  // Redis
  redisHost: string;
  redisPort: number;
  redisPassword?: string;

  // JWT
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;

  // CORS
  corsOrigin: string[];

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  // Logging
  logLevel: string;
  logFileError: string;
  logFileCombined: string;

  // Bcrypt
  bcryptRounds: number;

  // Frontend
  frontendUrl: string;

  // Admin
  adminEmail: string;
}

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env: EnvConfig = {
  // Application
  nodeEnv: getEnvVariable('NODE_ENV', 'development'),
  port: parseInt(getEnvVariable('PORT', '5000'), 10),
  apiVersion: getEnvVariable('API_VERSION', 'v1'),
  appName: getEnvVariable('APP_NAME', 'Juna API'),

  // Database
  databaseUrl: getEnvVariable('DATABASE_URL'),

  // Redis
  redisHost: getEnvVariable('REDIS_HOST', 'localhost'),
  redisPort: parseInt(getEnvVariable('REDIS_PORT', '6379'), 10),
  redisPassword: process.env.REDIS_PASSWORD,

  // JWT
  jwtAccessSecret: getEnvVariable('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: getEnvVariable('JWT_REFRESH_SECRET'),
  jwtAccessExpiry: getEnvVariable('JWT_ACCESS_EXPIRY', '15m'),
  jwtRefreshExpiry: getEnvVariable('JWT_REFRESH_EXPIRY', '7d'),

  // CORS
  corsOrigin: getEnvVariable('CORS_ORIGIN', 'http://localhost:3000').split(','),

  // Rate Limiting
  rateLimitWindowMs: parseInt(getEnvVariable('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  rateLimitMaxRequests: parseInt(getEnvVariable('RATE_LIMIT_MAX_REQUESTS', '100'), 10),

  // Logging
  logLevel: getEnvVariable('LOG_LEVEL', 'info'),
  logFileError: getEnvVariable('LOG_FILE_ERROR', 'logs/error.log'),
  logFileCombined: getEnvVariable('LOG_FILE_COMBINED', 'logs/combined.log'),

  // Bcrypt
  bcryptRounds: parseInt(getEnvVariable('BCRYPT_ROUNDS', '10'), 10),

  // Frontend
  frontendUrl: getEnvVariable('FRONTEND_URL', 'http://localhost:3000'),

  // Admin
  adminEmail: getEnvVariable('ADMIN_EMAIL', 'admin@juna.app'),
};

// Validation de l'environnement au démarrage
export const validateEnv = (): void => {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  console.log('✅ Environment variables validated successfully');
};