import axios, { AxiosInstance } from 'axios';
import { ServiceUnavailableError } from '@/utils/errors.util';

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
  statementDescription?: string;
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

  async initiateDeposit(payload: DepositPayload): Promise<DepositResponse> {
    try {
      const { data } = await this.client.post<DepositResponse>('/v2/deposits', payload);
      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? 'PawaPay indisponible';
      throw new ServiceUnavailableError(`Erreur PawaPay: ${msg}`, 'PAWAPAY_ERROR');
    }
  }

  async predictProvider(phoneNumber: string): Promise<PredictProviderResponse> {
    try {
      const { data } = await this.client.post<PredictProviderResponse>('/v2/predict-provider', {
        phoneNumber,
      });
      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? 'Numéro invalide';
      throw new ServiceUnavailableError(`Erreur PawaPay: ${msg}`, 'PAWAPAY_ERROR');
    }
  }

  async getDepositStatus(depositId: string): Promise<any> {
    try {
      const { data } = await this.client.get(`/v2/deposits/${depositId}`);
      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? 'PawaPay indisponible';
      throw new ServiceUnavailableError(`Erreur PawaPay: ${msg}`, 'PAWAPAY_ERROR');
    }
  }
}

export default new PawaPayService();
