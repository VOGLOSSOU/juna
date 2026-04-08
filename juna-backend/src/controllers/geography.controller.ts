import { Request, Response, NextFunction } from 'express';
import { countryService, cityService, landmarkService } from '@/services/geography.service';
import { sendSuccess } from '@/utils/response.util';

// ============================================
// COUNTRY
// ============================================

export class CountryController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await countryService.create(req.body);
      sendSuccess(res, 'Pays créé avec succès', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await countryService.listAll();
      sendSuccess(res, 'Liste des pays', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await countryService.delete(req.params.id);
      sendSuccess(res, 'Pays supprimé');
    } catch (error) {
      next(error);
    }
  }
}

// ============================================
// CITY
// ============================================

export class CityController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await cityService.create(req.body);
      sendSuccess(res, 'Ville créée avec succès', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async listByCountry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await cityService.listByCountry(req.params.code);
      sendSuccess(res, 'Villes du pays', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await cityService.delete(req.params.id);
      sendSuccess(res, 'Ville supprimée');
    } catch (error) {
      next(error);
    }
  }
}

// ============================================
// LANDMARK
// ============================================

export class LandmarkController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await landmarkService.create(req.body);
      sendSuccess(res, 'Lieu créé avec succès', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async listByCity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await landmarkService.listByCity(req.params.cityId);
      sendSuccess(res, 'Lieux de la ville', result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await landmarkService.delete(req.params.id);
      sendSuccess(res, 'Lieu supprimé');
    } catch (error) {
      next(error);
    }
  }
}

export const countryController = new CountryController();
export const cityController = new CityController();
export const landmarkController = new LandmarkController();
