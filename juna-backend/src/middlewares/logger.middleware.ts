import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import logger from '@/utils/logger.util';
import { env } from '@/config/env';

/**
 * Stream pour rediriger les logs de Morgan vers Winston
 */
const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

/**
 * Format de logs Morgan pour développement
 */
const devFormat = morgan('dev', { stream: morganStream });

/**
 * Format de logs Morgan pour production
 */
const prodFormat = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
  { stream: morganStream }
);

/**
 * Middleware de logging HTTP
 */
export const httpLogger = env.nodeEnv === 'development' ? devFormat : prodFormat;

/**
 * Middleware de logging personnalisé
 */
export const customLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Logger la requête
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.id,
  });

  // Logger la réponse
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.id,
    };

    if (res.statusCode >= 500) {
      logger.error('Server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};