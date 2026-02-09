import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/utils/errors.util';

/**
 * Middleware de validation avec Zod
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Valider uniquement le body
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        next(
          new ValidationError(`Validation failed: ${JSON.stringify(errors)}`, 'VALIDATION_ERROR')
        );
      } else {
        next(error);
      }
    }
  };
};

/**
 * Middleware de validation du body uniquement
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const errorMessage = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
        next(new ValidationError(errorMessage, 'VALIDATION_ERROR'));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Middleware de validation des query params
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const errorMessage = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
        next(new ValidationError(errorMessage, 'VALIDATION_ERROR'));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Middleware de validation des params
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const errorMessage = errors.map((e) => `${e.field}: ${e.message}`).join(', ');
        next(new ValidationError(errorMessage, 'VALIDATION_ERROR'));
      } else {
        next(error);
      }
    }
  };
};