import prisma from '@/config/database';
import { CreateCountryInput, CreateCityInput, CreateLandmarkInput } from '@/validators/geography.validator';

// ============================================
// COUNTRY
// ============================================

export const countryRepository = {
  async create(data: CreateCountryInput) {
    return prisma.country.create({ data });
  },

  async findAll() {
    return prisma.country.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  },

  async findByCode(code: string) {
    return prisma.country.findUnique({ where: { code } });
  },

  async findById(id: string) {
    return prisma.country.findUnique({ where: { id } });
  },

  async delete(id: string) {
    return prisma.country.update({ where: { id }, data: { isActive: false } });
  },
};

// ============================================
// CITY
// ============================================

export const cityRepository = {
  async create(data: CreateCityInput) {
    return prisma.city.create({
      data,
      include: { country: true },
    });
  },

  async findByCountry(countryId: string) {
    return prisma.city.findMany({
      where: { countryId, isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string) {
    return prisma.city.findUnique({
      where: { id },
      include: { country: true },
    });
  },

  async findByNameAndCountry(name: string, countryId: string) {
    return prisma.city.findUnique({
      where: { name_countryId: { name, countryId } },
    });
  },

  async delete(id: string) {
    return prisma.city.update({ where: { id }, data: { isActive: false } });
  },
};

// ============================================
// LANDMARK
// ============================================

export const landmarkRepository = {
  async create(data: CreateLandmarkInput) {
    return prisma.landmark.create({
      data,
      include: { city: { include: { country: true } } },
    });
  },

  async findByCity(cityId: string) {
    return prisma.landmark.findMany({
      where: { cityId, isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string) {
    return prisma.landmark.findUnique({
      where: { id },
      include: { city: { include: { country: true } } },
    });
  },

  async findByNameAndCity(name: string, cityId: string) {
    return prisma.landmark.findUnique({
      where: { name_cityId: { name, cityId } },
    });
  },

  async delete(id: string) {
    return prisma.landmark.update({ where: { id }, data: { isActive: false } });
  },
};
