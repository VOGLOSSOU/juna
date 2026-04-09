import { SubscriptionCategory, SubscriptionDuration, SubscriptionType } from '@prisma/client';

export interface CreateSubscriptionDTO {
  name: string;
  description: string;
  price: number;
  type: SubscriptionType;
  category: SubscriptionCategory;
  duration: SubscriptionDuration;
  imageUrl?: string;
  isPublic?: boolean;
  mealIds?: string[];
}

export interface UpdateSubscriptionDTO {
  name?: string;
  description?: string;
  price?: number;
  type?: SubscriptionType;
  category?: SubscriptionCategory;
  duration?: SubscriptionDuration;
  imageUrl?: string;
  isActive?: boolean;
  isPublic?: boolean;
  mealIds?: string[];
}

export interface SubscriptionFilters {
  type?: SubscriptionType;
  category?: SubscriptionCategory;
  duration?: SubscriptionDuration;
  minPrice?: number;
  maxPrice?: number;
  providerId?: string;
  search?: string;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface SubscriptionSortOptions {
  sortBy?: 'price' | 'rating' | 'createdAt' | 'subscriberCount';
  order?: 'asc' | 'desc';
}

// Type pour la réponse avec les repas
export interface SubscriptionWithMeals {
  id: string;
  providerId: string;
  name: string;
  description: string;
  price: number;
  type: SubscriptionType;
  category: SubscriptionCategory;
  duration: SubscriptionDuration;
  isActive: boolean;
  isPublic: boolean;
  imageUrl: string | null;
  subscriberCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
  provider: {
    id: string;
    businessName: string;
  };
  meals: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string | null;
    mealType: string;
    quantity: number;
  }>;
}
