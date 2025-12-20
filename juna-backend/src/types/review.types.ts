import { ReviewStatus } from '@prisma/client';

export interface CreateReviewDTO {
  orderId: string;
  subscriptionId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewDTO {
  rating?: number;
  comment?: string;
}

export interface ReportReviewDTO {
  reason: string;
  details?: string;
}

export interface ModerateReviewDTO {
  status: ReviewStatus;
  reason?: string;
}

export interface ReviewFilters {
  status?: ReviewStatus;
  subscriptionId?: string;
  userId?: string;
  rating?: number;
}

export interface ReviewStatsResponse {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}