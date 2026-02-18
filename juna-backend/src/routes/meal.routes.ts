import { Router } from 'express';
import mealController from '@/controllers/meal.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate, validateQuery, validateParams } from '@/middlewares/validation.middleware';
import { createMealSchema, updateMealSchema, mealIdSchema, mealFiltersSchema } from '@/validators/meal.validator';

const router = Router();

// Routes pour les repas (provider)
// Toutes ces routes nécessitent une authentification et un rôle PROVIDER
router.post(
  '/',
  authenticate,
  validate(createMealSchema),
  mealController.create.bind(mealController)
);

router.get(
  '/me',
  authenticate,
  mealController.getMyMeals.bind(mealController)
);

router.put(
  '/:id',
  authenticate,
  validateParams(mealIdSchema),
  validate(updateMealSchema),
  mealController.update.bind(mealController)
);

router.put(
  '/:id/toggle',
  authenticate,
  validateParams(mealIdSchema),
  mealController.toggleActive.bind(mealController)
);

router.delete(
  '/:id',
  authenticate,
  validateParams(mealIdSchema),
  mealController.delete.bind(mealController)
);

// Routes publiques
router.get(
  '/',
  validateQuery(mealFiltersSchema),
  mealController.getAll.bind(mealController)
);

router.get(
  '/:id',
  validateParams(mealIdSchema),
  mealController.getById.bind(mealController)
);

export default router;
