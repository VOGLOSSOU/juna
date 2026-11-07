import axios, { AxiosInstance } from 'axios';
import { ServiceUnavailableError, ValidationError } from '@/utils/errors.util';

interface RequestToPayPayload {
  phoneNumber: string;
  amount: number;
  first_name?: string;
  last_name?: string;
  description?: string;
  callback_info?: string;
}

interface RequestToPayResponse {
  reference: string;
  message: string;
  status: 'PENDING';
  amount: number;
  description: string;
  callback_info: string | null;
  phoneNumber: string;
}

interface DepositStatusResponse {
  reference: string;
  amount: number;
  phoneNumber: string;
  status: 'SUCCESSFUL' | 'FAILED' | 'PENDING';
  responsecode: string;
  responsemsg: string;
  transref: string;
  serviceref: string;
  comment: string;
  reason: string;
  description: string;
  date: string;
  operator_id: string;
}

// Réseaux Mobile Money disponibles au Bénin, tels que documentés par FeexPay.
// Celtiis/Coris existent côté FeexPay mais n'ont pas d'équivalent dans l'enum
// PaymentMethod actuel (MTN/MOOV/ORANGE/WAVE uniquement) — à ajouter si besoin.
const SUPPORTED_NETWORKS = ['mtn', 'moov'] as const;
type Network = (typeof SUPPORTED_NETWORKS)[number];

export function resolveNetwork(provider: string | undefined): Network {
  const p = (provider ?? 'MTN').toUpperCase();
  if (p.startsWith('MOOV')) return 'moov';
  return 'mtn';
}

export class FeexPayService {
  private client: AxiosInstance;
  private shop: string;

  constructor() {
    const baseURL = process.env.FEEXPAY_BASE_URL ?? 'https://api-v2.feexpay.me/api';
    const token = process.env.FEEXPAY_API_TOKEN ?? '';
    this.shop = process.env.FEEXPAY_SHOP_ID ?? '';

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  private extractErrorMessage(err: any): string {
    const body = err?.response?.data;
    if (!body) return err?.message ?? 'FeexPay indisponible';
    if (typeof body === 'string') return body;
    return body.message ?? body.error ?? JSON.stringify(body);
  }

  async requestToPay(network: Network, payload: RequestToPayPayload): Promise<RequestToPayResponse> {
    if (!this.shop) {
      throw new ServiceUnavailableError('FEEXPAY_SHOP_ID non configuré', 'FEEXPAY_MISCONFIGURED');
    }
    console.log('[FeexPay] POST /transactions/public/requesttopay/%s payload:', network, JSON.stringify(payload));
    try {
      const { data } = await this.client.post<RequestToPayResponse>(
        `/transactions/public/requesttopay/${network}`,
        { ...payload, shop: this.shop }
      );
      console.log('[FeexPay] POST /transactions/public/requesttopay/%s response:', network, JSON.stringify(data));
      return data;
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = this.extractErrorMessage(err);
      console.error('[FeexPay] POST /transactions/public/requesttopay/%s error status=%s body=%s', network, status, detail);
      if (status === 400) {
        throw new ValidationError(`Requête FeexPay invalide: ${detail}`, 'INVALID_PAYMENT_REQUEST');
      }
      throw new ServiceUnavailableError(`Erreur FeexPay: ${detail}`, 'FEEXPAY_ERROR');
    }
  }

  async getDepositStatus(reference: string): Promise<DepositStatusResponse> {
    try {
      const { data } = await this.client.get<DepositStatusResponse>(
        `/transactions/public/single/status/${reference}`
      );
      return data;
    } catch (err: any) {
      console.error('[FeexPay] GET status error:', JSON.stringify(err?.response?.data ?? err?.message));
      throw new ServiceUnavailableError(`Erreur FeexPay: ${this.extractErrorMessage(err)}`, 'FEEXPAY_ERROR');
    }
  }
}

export default new FeexPayService();
