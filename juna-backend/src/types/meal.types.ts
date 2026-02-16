import { MealType } from '@prisma/client';

export interface CreateMealDTO {
  providerId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  mealType: MealType;
}

export interface UpdateMealDTO {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  mealType?: MealType;
  isActive?: boolean;
}

export interface MealFilters {
  providerId?: string;
  mealType?: MealType;
  isActive?: boolean;
  search?: string;
}

export interface MealSortOptions {
  sortBy?: 'price' | 'name' | 'createdAt';
  order?: 'asc' | 'desc';
}

// Type pour la réponse avec provider
export interface MealWithProvider {
  id: string;
  providerId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  mealType: MealType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  provider: {
    id: string;
    businessName: string;
  };
}
