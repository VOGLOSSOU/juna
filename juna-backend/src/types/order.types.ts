import { DeliveryMethod, OrderStatus, PaymentMethod } from '@prisma/client';

export interface CreateOrderDTO {
  subscriptionId: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  pickupLocation?: any;
  scheduledFor?: Date;
  paymentMethod: PaymentMethod;
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
}

export interface CancelOrderDTO {
  reason: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  userId?: string;
  subscriptionId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  amount: number;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string | null;
  pickupLocation: any;
  scheduledFor: Date | null;
  completedAt: Date | null;
  qrCode: string | null;
  createdAt: Date;
  subscription: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  payment?: {
    id: string;
    status: string;
    method: string;
  };
}