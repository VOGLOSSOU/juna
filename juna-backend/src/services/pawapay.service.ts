import axios, { AxiosInstance } from 'axios';
import { ServiceUnavailableError, ValidationError } from '@/utils/errors.util';

interface DepositPayload {
  depositId: string;
  amount: string;
  currency: string;
  payer: {
    type: 'MMO';
    accountDetails: {
      phoneNumber: string;
      provider: string;
    };
  };
}

interface DepositResponse {
  depositId: string;
  status: 'ACCEPTED' | 'REJECTED';
  nextStep?: string;
  failureReason?: {
    failureCode: string;
    failureMessage: string;
  };
  created: string;
}

interface PredictProviderResponse {
  country: string;
  provider: string;
  phoneNumber: string;
}

export class PawaPayService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.PAWAPAY_BASE_URL ?? 'https://api.sandbox.pawapay.io';
    const token = process.env.PAWAPAY_API_TOKEN ?? '';

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
    if (!body) return err?.message ?? 'PawaPay indisponible';
    if (typeof body === 'string') return body;
    return body.message ?? body.error ?? body.errors?.[0]?.message ?? JSON.stringify(body);
  }

  async initiateDeposit(payload: DepositPayload): Promise<DepositResponse> {
    console.log('[PawaPay] POST /v2/deposits payload:', JSON.stringify(payload));
    try {
      const { data } = await this.client.post<DepositResponse>('/v2/deposits', payload);
      console.log('[PawaPay] POST /v2/deposits response:', JSON.stringify(data));
      return data;
    } catch (err: any) {
      console.error('[PawaPay] POST /v2/deposits error:', JSON.stringify(err?.response?.data ?? err?.message));
      throw new ServiceUnavailableError(`Erreur PawaPay: ${this.extractErrorMessage(err)}`, 'PAWAPAY_ERROR');
    }
  }

  async predictProvider(phoneNumber: string): Promise<PredictProviderResponse> {
    console.log('[PawaPay] POST /v2/predict-provider phoneNumber:', phoneNumber);
    try {
      const { data } = await this.client.post<PredictProviderResponse>('/v2/predict-provider', {
        phoneNumber,
      });
      console.log('[PawaPay] POST /v2/predict-provider response:', JSON.stringify(data));
      return data;
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = this.extractErrorMessage(err);
      console.error('[PawaPay] POST /v2/predict-provider error status=%d body=%s', status, JSON.stringify(err?.response?.data ?? err?.message));
      // 400 = numéro invalide → erreur de validation, pas 503
      if (status === 400) {
        throw new ValidationError(
          `Numéro de téléphone invalide ou non reconnu par PawaPay: ${detail}`,
          'INVALID_PHONE_NUMBER'
        );
      }
      throw new ServiceUnavailableError(`Erreur PawaPay: ${detail}`, 'PAWAPAY_ERROR');
    }
  }

  async getDepositStatus(depositId: string): Promise<any> {
    try {
      const { data } = await this.client.get(`/v2/deposits/${depositId}`);
      return data;
    } catch (err: any) {
      console.error('[PawaPay] GET /v2/deposits/:id error:', JSON.stringify(err?.response?.data ?? err?.message));
      throw new ServiceUnavailableError(`Erreur PawaPay: ${this.extractErrorMessage(err)}`, 'PAWAPAY_ERROR');
    }
  }
}

export default new PawaPayService();
