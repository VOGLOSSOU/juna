import { sendAdminPaymentReceivedEmail, AdminPaymentEmail } from '@/services/email.service';

const mockSend = jest.fn();
jest.mock('@getbrevo/brevo', () => ({
  BrevoClient: jest.fn().mockImplementation(() => ({
    transactionalEmails: { sendTransacEmail: (...args: unknown[]) => mockSend(...args) },
  })),
}));

const payment: AdminPaymentEmail = {
  paymentId: '05f900c3-2b58-4fe9-8c80-b76c87a1df40',
  reference: 'ref-1',
  orderNumber: 'JUNA-001',
  customerName: '<script>unsafe</script>',
  subscriptionName: 'Riz & Alloco',
  providerName: 'Chez Awa',
  amount: 3111,
  currency: 'XOF',
  method: 'MOBILE_MONEY_MTN',
  paidAt: new Date('2026-11-01T12:00:00Z'),
  createdAt: new Date('2026-11-01T11:00:00Z'),
};
let originalKey: string | undefined;
beforeEach(() => {
  originalKey = process.env.BREVO_API_KEY;
  process.env.BREVO_API_KEY = 'test-key';
  mockSend.mockReset().mockResolvedValue({ messageId: 'sent' });
});
afterEach(() => {
  if (originalKey === undefined) delete process.env.BREVO_API_KEY;
  else process.env.BREVO_API_KEY = originalKey;
});

test('admin email uses the exact recipient, safe HTML and a stable payment idempotency key', async () => {
  await sendAdminPaymentReceivedEmail('n969601@gmail.com', payment);
  const [payload, options] = mockSend.mock.calls[0];
  expect(payload.to).toEqual([{ email: 'n969601@gmail.com' }]);
  expect(payload.headers).toEqual({ idempotencyKey: payment.paymentId });
  expect(payload.htmlContent).toContain('&lt;script&gt;unsafe&lt;/script&gt;');
  expect(payload.htmlContent).not.toContain('<script>');
  expect(payload.htmlContent).toContain('Riz &amp; Alloco');
  expect(payload.htmlContent).toContain('13:00:00');
  expect(options).toEqual({ timeoutInSeconds: 20, maxRetries: 0 });
});
test('missing configuration and gateway errors are not mistaken for successful delivery', async () => {
  delete process.env.BREVO_API_KEY;
  await expect(sendAdminPaymentReceivedEmail('n969601@gmail.com', payment)).rejects.toThrow(
    'BREVO_API_KEY'
  );
  expect(mockSend).not.toHaveBeenCalled();
  process.env.BREVO_API_KEY = 'test-key';
  mockSend.mockRejectedValueOnce(new Error('unavailable'));
  await expect(sendAdminPaymentReceivedEmail('n969601@gmail.com', payment)).rejects.toThrow(
    'unavailable'
  );
});
test('only an explicit duplicate idempotency response is treated as already accepted', async () => {
  mockSend.mockRejectedValueOnce({
    body: { code: 'duplicate_parameter', message: 'idempotency key already used' },
  });
  await expect(
    sendAdminPaymentReceivedEmail('n969601@gmail.com', payment)
  ).resolves.toBeUndefined();
  mockSend.mockRejectedValueOnce({
    body: { code: 'duplicate_parameter', message: 'invalid other parameter' },
  });
  await expect(sendAdminPaymentReceivedEmail('n969601@gmail.com', payment)).rejects.toBeDefined();
});
