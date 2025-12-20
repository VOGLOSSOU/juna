import { MealType, ProposalStatus } from '@prisma/client';

export interface CreateProposalDTO {
  foodType: string;
  frequency: string;
  mealType: MealType;
  budget: number;
  zone: string;
  city: string;
  country: string;
  details?: string;
  isPublic: boolean;
}

export interface UpdateProposalDTO {
  foodType?: string;
  frequency?: string;
  mealType?: MealType;
  budget?: number;
  zone?: string;
  city?: string;
  country?: string;
  details?: string;
  isPublic?: boolean;
}

export interface ApproveProposalDTO {
  assignedSubscriptionId: string;
}

export interface RejectProposalDTO {
  reason: string;
}

export interface ProposalFilters {
  status?: ProposalStatus;
  userId?: string;
  isPublic?: boolean;
  city?: string;
  country?: string;
}