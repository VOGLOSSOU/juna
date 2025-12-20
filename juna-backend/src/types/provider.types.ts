import { ProviderStatus } from '@prisma/client';

export interface RegisterProviderDTO {
  businessName: string;
  description?: string;
  businessAddress: string;
  documentUrl?: string;
}

export interface UpdateProviderDTO {
  businessName?: string;
  description?: string;
  businessAddress?: string;
  documentUrl?: string;
}

export interface ApproveProviderDTO {
  message?: string;
}

export interface RejectProviderDTO {
  reason: string;
}

export interface ProviderFilters {
  status?: ProviderStatus;
  search?: string;
}

export interface ProviderStatsResponse {
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  ordersToday: number;
  ordersByStatus: {
    [key: string]: number;
  };
  topSubscriptions: Array<{
    name: string;
    orderCount: number;
  }>;
}