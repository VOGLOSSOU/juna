import { Request, Response, NextFunction } from 'express';
import mealService from '@/services/meal.service';
import { sendSuccess } from '@/utils/response.util';
import { SUCCESS_MESSAGES } from '@/constants/messages';

export class MealController {
  /**
   * Créer un repas
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const data = req.body;

      const meal = await mealService.create(providerId, data);
      sendSuccess(res, SUCCESS_MESSAGES.MEAL_CREATED, meal, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un repas par ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const meal = await mealService.getByIdWithProvider(id);
      sendSuccess(res, SUCCESS_MESSAGES.MEAL_FETCHED, meal);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir tous mes repas (fournisseur)
   */
  async getMyMeals(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const meals = await mealService.getByProviderId(providerId);
      sendSuccess(res, SUCCESS_MESSAGES.MEALS_FETCHED, meals);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lister les repas (public)
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        providerId: req.query.providerId as string,
        mealType: req.query.mealType as any,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search as string,
      };
      const meals = await mealService.getAll(filters);
      sendSuccess(res, SUCCESS_MESSAGES.MEALS_FETCHED, meals);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour un repas
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;
      const data = req.body;

      const meal = await mealService.update(id, providerId, data);
      sendSuccess(res, SUCCESS_MESSAGES.MEAL_UPDATED, meal);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activer/Désactiver un repas
   */
  async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;

      const meal = await mealService.toggleActive(id, providerId);
      sendSuccess(res, SUCCESS_MESSAGES.MEAL_TOGGLED, meal);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un repas
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const providerId = (req as any).user.providerId;
      const { id } = req.params;

      await mealService.delete(id, providerId);
      sendSuccess(res, SUCCESS_MESSAGES.MEAL_DELETED);
    } catch (error) {
      next(error);
    }
  }
}

export default new MealController();
