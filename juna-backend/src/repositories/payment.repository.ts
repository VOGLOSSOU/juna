import prisma from '@/config/database';
import { Payment, PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';

export class PaymentRepository {
  async create(data: {
    orderId: string;
    userId: string;
    amount: number;
    currency?: string;
    method: PaymentMethod;
    transactionId: string;
    gatewayResponse?: any;
  }): Promise<Payment> {
    return prisma.payment.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency ?? 'XOF',
        method: data.method,
        status: PaymentStatus.PROCESSING,
        transactionId: data.transactionId,
        gatewayResponse: data.gatewayResponse ?? Prisma.JsonNull,
      },
    });
  }

  async findById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { id } });
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { orderId } });
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({ where: { transactionId } });
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    extras?: { gatewayResponse?: any; paidAt?: Date }
  ): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data: {
        status,
        ...(extras?.paidAt && { paidAt: extras.paidAt }),
        ...(extras?.gatewayResponse !== undefined && {
          gatewayResponse: extras.gatewayResponse,
        }),
      },
    });
  }
}

export default new PaymentRepository();
