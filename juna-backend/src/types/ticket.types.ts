import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

export interface CreateTicketDTO {
  orderId?: string;
  category: TicketCategory;
  subject: string;
  description: string;
}

export interface CreateTicketMessageDTO {
  message: string;
  attachments?: any;
}

export interface AssignTicketDTO {
  assignedTo: string;
}

export interface UpdateTicketStatusDTO {
  status: TicketStatus;
}

export interface UpdateTicketPriorityDTO {
  priority: TicketPriority;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  userId?: string;
  assignedTo?: string;
}