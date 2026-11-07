import axios from 'axios';
import { FeexPayService, FeexPayRequestError } from '@/services/feexpay.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: { create: jest.fn(), isAxiosError: (e: any) => e?.isAxiosError === true },
}));
const post = jest.fn();
const get = jest.fn();
let service: FeexPayService;
const payload = {
  phoneNumber: '2290166000000',
  amount: 3111,
  callback_info: 'attempt-id',
  description: 'Commande Test',
};
beforeEach(() => {
  jest.clearAllMocks();
  post.mockReset();
  get.mockReset();
  jest.mocked(axios.create).mockReturnValue({ post, get } as any);
  service = new FeexPayService();
});

test('gateway uses API v2, server bearer token, shop and correct network endpoint', async () => {
  post.mockResolvedValueOnce({ data: { reference: 'MOOV_ref-1', status: 'PENDING' } });
  expect((await service.requestToPay('moov', payload)).reference).toBe('MOOV_ref-1');
  expect(axios.create).toHaveBeenCalledWith(
    expect.objectContaining({
      baseURL: 'https://api-v2.feexpay.me/api',
      headers: expect.objectContaining({ Authorization: 'Bearer test_not_a_real_key' }),
    })
  );
  expect(post).toHaveBeenCalledWith('/transactions/public/requesttopay/moov', {
    ...payload,
    shop: 'test_shop',
  });
});

test.each([
  {},
  null,
  { reference: 'ref', status: 'COMPLETED' },
  { reference: '../../x', status: 'PENDING' },
])('malformed gateway response is ambiguous: %p', async (data) => {
  post.mockResolvedValueOnce({ data });
  await expect(service.requestToPay('mtn', payload)).rejects.toMatchObject({
    definitelyRejected: false,
  });
});

test.each([400, 401, 403, 404, 422, 429, 500, 502, 504])(
  'HTTP %s rejection classification avoids unsafe retry',
  async (status) => {
    post.mockRejectedValueOnce({ isAxiosError: true, response: { status } });
    await expect(service.requestToPay('mtn', payload)).rejects.toMatchObject({
      definitelyRejected: [400, 401, 403, 404, 422].includes(status),
    });
  }
);

test('timeout and missing response remain uncertain', async () => {
  post.mockRejectedValueOnce(new Error('timeout'));
  await expect(service.requestToPay('mtn', payload)).rejects.toBeInstanceOf(FeexPayRequestError);
});

test('status response requires a valid reference, status and amount', async () => {
  get.mockResolvedValueOnce({ data: { reference: 'valid', status: 'SUCCESSFUL' } });
  await expect(service.getDepositStatus('valid')).rejects.toMatchObject({ code: 'FEEXPAY_ERROR' });
  get.mockResolvedValueOnce({ data: { reference: 'valid', status: 'SUCCESSFUL', amount: '3111' } });
  expect((await service.getDepositStatus('valid')).amount).toBe(3111);
});

test('history recovery uses only an exact authenticated callback match', async () => {
  post.mockResolvedValueOnce({
    data: {
      success: true,
      data: [
        { reference: 'unrelated', callback_info: 'other-attempt' },
        { reference: 'recovered', callback_info: { order_id: 'attempt-id' } },
      ],
    },
  });
  expect(await service.findReference('attempt-id', new Date())).toBe('recovered');
  expect(post).toHaveBeenCalledWith(
    '/transactions/history',
    expect.objectContaining({ shop: 'test_shop', type: 'PAYIN' })
  );
});

test('missing history entry does not imply failure and duplicate matches require review', async () => {
  post.mockResolvedValueOnce({ data: { success: true, data: [] } });
  expect(await service.findReference('attempt-id', new Date())).toBeNull();
  post.mockResolvedValueOnce({
    data: {
      success: true,
      data: [
        { reference: 'a', callback_info: 'attempt-id' },
        { reference: 'b', callback_info: 'attempt-id' },
      ],
    },
  });
  await expect(service.findReference('attempt-id', new Date())).rejects.toMatchObject({
    code: 'PAYMENT_REVIEW_REQUIRED',
  });
});

test('missing merchant credentials are rejected before a network request', async () => {
  const token = process.env.FEEXPAY_API_TOKEN;
  delete process.env.FEEXPAY_API_TOKEN;
  try {
    const missing = new FeexPayService();
    await expect(missing.requestToPay('mtn', payload)).rejects.toMatchObject({
      code: 'FEEXPAY_MISCONFIGURED',
    });
    expect(post).not.toHaveBeenCalled();
  } finally {
    process.env.FEEXPAY_API_TOKEN = token;
  }
});
