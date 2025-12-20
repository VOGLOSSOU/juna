import {
  SubscriptionCategory,
  SubscriptionFrequency,
  MealType,
} from '@prisma/client';

export interface CreateSubscriptionDTO {
  name: string;
  description: string;
  category: SubscriptionCategory;
  cuisine?: string;
  price: number;
  frequency: SubscriptionFrequency;
  mealType: MealType;
  deliveryZones?: any;
  pickupLocations?: any;
  imageUrl?: string;
  isPublic?: boolean;
}

export interface UpdateSubscriptionDTO {
  name?: string;
  description?: string;
  category?: SubscriptionCategory;
  cuisine?: string;
  price?: number;
  frequency?: SubscriptionFrequency;
  mealType?: MealType;
  deliveryZones?: any;
  pickupLocations?: any;
  imageUrl?: string;
  isActive?: boolean;
}

export interface SubscriptionFilters {
  category?: SubscriptionCategory;
  mealType?: MealType;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  country?: string;
  search?: string;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface SubscriptionSortOptions {
  sortBy?: 'price' | 'rating' | 'createdAt' | 'subscriberCount';
  order?: 'asc' | 'desc';
}