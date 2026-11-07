import axios, { AxiosInstance } from 'axios';
import { z } from 'zod';
import { AppError, ServiceUnavailableError, ValidationError } from '@/utils/errors.util';

export const feexPayReferenceSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9_-]+$/);
const statusSchema = z.enum(['PENDING', 'IN PENDING STATE', 'SUCCESSFUL', 'FAILED']);
const callbackSchema = z
  .union([z.string(), z.record(z.unknown())])
  .nullable()
  .optional();
const initiationSchema = z
  .object({
    reference: feexPayReferenceSchema,
    status: statusSchema,
    amount: z.coerce.number().finite().positive().optional(),
    callback_info: callbackSchema,
  })
  .passthrough();
const depositStatusSchema = initiationSchema.extend({
  amount: z.coerce.number().finite().positive(),
});
export type DepositStatusResponse = z.infer<typeof depositStatusSchema>;

export interface RequestToPayPayload {
  phoneNumber: string;
  amount: number;
  description: string;
  callback_info: string;
}

export type Network = 'mtn' | 'moov' | 'celtiis_bj';
// Keep the Benin codes used by older web clients, reject other countries/networks.
const networks: Record<string, Network> = {
  MTN: 'mtn',
  MTN_MOMO_BEN: 'mtn',
  MTN_BEN: 'mtn',
  MOOV: 'moov',
  MOOV_BEN: 'moov',
  CELTIIS: 'celtiis_bj',
  CELTIIS_BJ: 'celtiis_bj',
  CELTIIS_BEN: 'celtiis_bj',
};
export function resolveNetwork(provider?: string): Network {
  const network = networks[(provider ?? '').trim().toUpperCase()];
  if (!network)
    throw new ValidationError(
      'Choisissez MTN, Moov ou Celtiis au Bénin.',
      'UNSUPPORTED_PAYMENT_PROVIDER'
    );
  return network;
}

export function normalizePaymentPhone(phone: string): string {
  const digits = phone.trim().replace(/[\s()+.-]/g, '');
  const normalized = /^(?:229)?01\d{8}$/.test(digits)
    ? digits.startsWith('229')
      ? digits
      : `229${digits}`
    : '';
  if (!normalized)
    throw new ValidationError(
      'Numéro béninois invalide : utilisez 01 suivi de 8 chiffres.',
      'INVALID_PHONE_NUMBER'
    );
  return normalized;
}

export function callbackValue(value: unknown): string | null {
  if (typeof value === 'string' && value) return value;
  if (value && typeof value === 'object') {
    const orderId = (value as Record<string, unknown>).order_id;
    if (typeof orderId === 'string' && orderId) return orderId;
  }
  return null;
}

export class FeexPayRequestError extends AppError {
  constructor(public readonly definitelyRejected: boolean) {
    super(
      definitelyRejected
        ? 'La demande de paiement a été refusée par FeexPay.'
        : 'Confirmation FeexPay indisponible. Ne relancez pas le paiement.',
      definitelyRejected ? 400 : 503,
      definitelyRejected ? 'INVALID_PAYMENT_REQUEST' : 'FEEXPAY_ERROR'
    );
  }
}

export class FeexPayService {
  private client: AxiosInstance;
  private shop: string;
  private token: string;

  constructor() {
    this.shop = process.env.FEEXPAY_SHOP_ID ?? '';
    this.token = process.env.FEEXPAY_API_TOKEN ?? '';
    this.client = axios.create({
      baseURL: process.env.FEEXPAY_BASE_URL || 'https://api-v2.feexpay.me/api',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      timeout: 30000,
    });
  }

  assertConfigured() {
    if (!this.shop || !this.token) {
      throw new ServiceUnavailableError(
        'Configuration FeexPay incomplète.',
        'FEEXPAY_MISCONFIGURED'
      );
    }
  }

  async requestToPay(network: Network, payload: RequestToPayPayload) {
    this.assertConfigured();
    try {
      const { data } = await this.client.post<unknown>(
        `/transactions/public/requesttopay/${network}`,
        {
          ...payload,
          shop: this.shop,
        }
      );
      const parsed = initiationSchema.safeParse(data);
      if (!parsed.success) throw new FeexPayRequestError(false);
      return parsed.data;
    } catch (error) {
      if (error instanceof FeexPayRequestError) throw error;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      // 5xx/timeouts may occur after the operator has accepted the request.
      // A malformed response is equally ambiguous; never retry it automatically.
      throw new FeexPayRequestError(
        status !== undefined && [400, 401, 403, 404, 422].includes(status)
      );
    }
  }

  async getDepositStatus(reference: string): Promise<DepositStatusResponse> {
    this.assertConfigured();
    const safeReference = feexPayReferenceSchema.parse(reference);
    try {
      const { data } = await this.client.get<unknown>(
        `/transactions/public/single/status/${encodeURIComponent(safeReference)}`
      );
      const result = depositStatusSchema.safeParse(data);
      if (!result.success) throw new Error('Invalid FeexPay status response');
      return result.data;
    } catch {
      throw new ServiceUnavailableError('Vérification FeexPay indisponible.', 'FEEXPAY_ERROR');
    }
  }

  // Recover a lost initiation response from the merchant's authenticated history.
  // Only an exact callback_info match is usable; an empty/capped history is not
  // evidence of failure and must never unlock another debit.
  async findReference(callbackInfo: string, createdAt: Date): Promise<string | null> {
    this.assertConfigured();
    if (Date.now() - createdAt.getTime() > 30 * 86400000) return null;
    const end = new Date(Math.min(Date.now(), createdAt.getTime() + 86400000));
    const { data } = await this.client.post<unknown>('/transactions/history', {
      start_date: createdAt.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      shop: this.shop,
      type: 'PAYIN',
      status: 'ALL',
    });
    const history = z
      .object({
        success: z.literal(true),
        data: z.array(
          z
            .object({
              reference: feexPayReferenceSchema,
              callback_info: callbackSchema,
            })
            .passthrough()
        ),
      })
      .safeParse(data);
    if (!history.success)
      throw new ServiceUnavailableError('Historique FeexPay indisponible.', 'FEEXPAY_ERROR');
    const matches = history.data.data.filter(
      (row) => callbackValue(row.callback_info) === callbackInfo
    );
    if (matches.length > 1)
      throw new ServiceUnavailableError(
        'Plusieurs transactions nécessitent un contrôle.',
        'PAYMENT_REVIEW_REQUIRED'
      );
    return matches[0]?.reference ?? null;
  }
}

export default new FeexPayService();
