import { countryRepository, cityRepository, landmarkRepository } from '@/repositories/geography.repository';
import { ConflictError, NotFoundError } from '@/utils/errors.util';
import { ERROR_CODES } from '@/constants/errors';
import { CreateCountryInput, CreateCityInput, CreateLandmarkInput } from '@/validators/geography.validator';

// ============================================
// COUNTRY
// ============================================

export const countryService = {
  async create(data: CreateCountryInput) {
    const existing = await countryRepository.findByCode(data.code);
    if (existing) {
      throw new ConflictError(
        `Le pays avec le code "${data.code}" existe déjà`,
        ERROR_CODES.EMAIL_ALREADY_EXISTS // code générique de conflit disponible
      );
    }
    return countryRepository.create(data);
  },

  async listAll() {
    return countryRepository.findAll();
  },

  async delete(id: string) {
    const country = await countryRepository.findById(id);
    if (!country) {
      throw new NotFoundError('Pays introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    return countryRepository.delete(id);
  },
};

// ============================================
// CITY
// ============================================

export const cityService = {
  async create(data: CreateCityInput) {
    const country = await countryRepository.findById(data.countryId);
    if (!country) {
      throw new NotFoundError('Pays introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const existing = await cityRepository.findByNameAndCountry(data.name, data.countryId);
    if (existing) {
      throw new ConflictError(
        `La ville "${data.name}" existe déjà dans ce pays`,
        ERROR_CODES.EMAIL_ALREADY_EXISTS
      );
    }

    return cityRepository.create(data);
  },

  async listByCountry(countryCode: string) {
    const country = await countryRepository.findByCode(countryCode);
    if (!country) {
      throw new NotFoundError('Pays introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    return cityRepository.findByCountry(country.id);
  },

  async delete(id: string) {
    const city = await cityRepository.findById(id);
    if (!city) {
      throw new NotFoundError('Ville introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    return cityRepository.delete(id);
  },
};

// ============================================
// LANDMARK
// ============================================

export const landmarkService = {
  async create(data: CreateLandmarkInput) {
    const city = await cityRepository.findById(data.cityId);
    if (!city) {
      throw new NotFoundError('Ville introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    const existing = await landmarkRepository.findByNameAndCity(data.name, data.cityId);
    if (existing) {
      throw new ConflictError(
        `Le lieu "${data.name}" existe déjà dans cette ville`,
        ERROR_CODES.EMAIL_ALREADY_EXISTS
      );
    }

    return landmarkRepository.create(data);
  },

  async listByCity(cityId: string) {
    const city = await cityRepository.findById(cityId);
    if (!city) {
      throw new NotFoundError('Ville introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    return landmarkRepository.findByCity(cityId);
  },

  async delete(id: string) {
    const landmark = await landmarkRepository.findById(id);
    if (!landmark) {
      throw new NotFoundError('Lieu introuvable', ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    return landmarkRepository.delete(id);
  },
};
