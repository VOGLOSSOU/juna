import { Router } from 'express';
import { countryController, cityController, landmarkController } from '@/controllers/geography.controller';
import { authenticate, authorize } from '@/middlewares/auth.middleware';
import { validate, validateParams } from '@/middlewares/validation.middleware';
import {
  createCountrySchema,
  createCitySchema,
  createLandmarkSchema,
  cityIdSchema,
  landmarkIdSchema,
} from '@/validators/geography.validator';
import { UserRole } from '@prisma/client';

const router = Router();

// ============================================
// ENDPOINTS PUBLICS
// ============================================

// Lister tous les pays
router.get('/countries', countryController.listAll.bind(countryController));

// Villes d'un pays (par code pays ex: BJ)
router.get('/countries/:code/cities', cityController.listByCountry.bind(cityController));

// Landmarks d'une ville
router.get('/cities/:cityId/landmarks', landmarkController.listByCity.bind(landmarkController));

// ============================================
// ENDPOINTS ADMIN
// ============================================

// Pays
router.post(
  '/admin/countries',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(createCountrySchema),
  countryController.create.bind(countryController)
);

router.delete(
  '/admin/countries/:id',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  countryController.delete.bind(countryController)
);

// Villes
router.post(
  '/admin/cities',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(createCitySchema),
  cityController.create.bind(cityController)
);

router.delete(
  '/admin/cities/:id',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validateParams(cityIdSchema),
  cityController.delete.bind(cityController)
);

// Landmarks
router.post(
  '/admin/landmarks',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validate(createLandmarkSchema),
  landmarkController.create.bind(landmarkController)
);

router.delete(
  '/admin/landmarks/:id',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  validateParams(landmarkIdSchema),
  landmarkController.delete.bind(landmarkController)
);

export default router;
