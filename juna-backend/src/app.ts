import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from '@/config/env';
import { httpLogger } from '@/middlewares/logger.middleware';
import { globalRateLimiter } from '@/middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from '@/middlewares/error.middleware';
import { sendSuccess } from '@/utils/response.util';

// Import des routes
import routes from '@/routes';

const app: Application = express();

// ============================================
// MIDDLEWARES GLOBAUX
// ============================================

// Sécurité HTTP headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Compression des réponses
app.use(compression());

// Parser JSON
app.use(express.json({ limit: '10mb' }));

// Parser URL-encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging HTTP
app.use(httpLogger);

// Rate limiting global
app.use(globalRateLimiter);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (_req, res) => {
  sendSuccess(res, 'API is running', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.nodeEnv,
  });
});

app.get('/api/health', (_req, res) => {
  sendSuccess(res, 'API is running', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.nodeEnv,
  });
});

// ============================================
// API VERSION
// ============================================

app.get('/api/version', (_req, res) => {
  sendSuccess(res, 'API version', {
    version: '1.0.0',
    apiVersion: env.apiVersion,
    environment: env.nodeEnv,
  });
});

// ============================================
// ROUTES
// ============================================

// Routes API v1
app.use(`/api/${env.apiVersion}`, routes);

// ============================================
// GESTION DES ERREURS
// ============================================

// Route non trouvée (404)
app.use(notFoundHandler);

// Gestionnaire d'erreurs global
app.use(errorHandler);

export default app;