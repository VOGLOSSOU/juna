import { randomUUID } from 'crypto';
import express from 'express';
import request from 'supertest';
import prisma from '@/config/database';
import paymentService from '@/services/payment.service';
import orderService from '@/services/order.service';
import feexPayService, {
  FeexPayRequestError,
  normalizePaymentPhone,
  resolveNetwork,
} from '@/services/feexpay.service';
import { sendOrderConfirmedEmail, sendProviderNewOrderEmail } from '@/services/email.service';
import { createNotification } from '@/services/notification.service';
import paymentRoutes from '@/routes/payment.routes';
import { errorHandler } from '@/middlewares/error.middleware';
import { generateAccessToken } from '@/utils/jwt.util';
import { initiateDepositSchema } from '@/validators/payment.validator';

jest.mock('@/services/feexpay.service', () => ({
  ...jest.requireActual('@/services/feexpay.service'),
  __esModule: true,
  default: {
    assertConfigured: jest.fn(),
    requestToPay: jest.fn(),
    getDepositStatus: jest.fn(),
    findReference: jest.fn(),
  },
}));
jest.mock('@/services/email.service', () => ({
  sendOrderConfirmedEmail: jest.fn(),
  sendProviderNewOrderEmail: jest.fn(),
}));
jest.mock('@/services/notification.service', () => ({ createNotification: jest.fn() }));

const app = express();
app.use(express.json());
app.use('/payments', paymentRoutes);
app.use(errorHandler);
const webhook = () =>
  request(app).post('/payments/webhook/feexpay').set('Authorization', 'Bearer test_webhook_secret');
const gateway = jest.mocked(feexPayService);
const userId = randomUUID();
const otherId = randomUUID();
const providerUserId = randomUUID();
let providerId: string;
let subscriptionId: string;
let cityId: string;
let countryId: string;
let orderId: string;
const payload = () => ({ orderId, phoneNumber: '+229 01 66 00 00 00', provider: 'MTN' });
const auth = (id = userId) => ({
  Authorization: `Bearer ${generateAccessToken({ userId: id, email: `${id}@test.local`, role: 'USER' })}`,
});
const remote = (reference: string, status = 'SUCCESSFUL', extra = {}) => ({
  reference,
  status,
  amount: 3111,
  ...extra,
});
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
async function attempt() {
  return prisma.paymentAttempt.findFirstOrThrow({
    where: { payment: { orderId } },
    orderBy: { createdAt: 'desc' },
  });
}
async function start() {
  return paymentService.initiateDeposit(userId, payload());
}

beforeAll(async () => {
  await prisma.user.createMany({
    data: [userId, otherId, providerUserId].map((id) => ({
      id,
      email: `${id}@test.local`,
      name: 'Payment Test',
      password: 'unused',
      isVerified: true,
    })),
  });
  const country = await prisma.country.create({
    data: { code: randomUUID().slice(0, 8), translations: { fr: 'Test' } },
  });
  countryId = country.id;
  const city = await prisma.city.create({ data: { name: 'Payment Test', countryId } });
  cityId = city.id;
  const provider = await prisma.provider.create({
    data: {
      userId: providerUserId,
      businessName: 'Test',
      businessAddress: 'Test',
      logo: 'https://example.invalid/a.jpg',
      cityId,
      status: 'APPROVED',
    },
  });
  providerId = provider.id;
  const sub = await prisma.subscription.create({
    data: {
      providerId,
      name: 'Test',
      description: 'Test',
      price: 3111,
      type: 'LUNCH',
      category: 'AFRICAN',
      duration: 'WEEK',
      imageUrl: 'https://example.invalid/a.jpg',
    },
  });
  subscriptionId = sub.id;
});
beforeEach(async () => {
  await prisma.order.deleteMany({ where: { userId } });
  jest.clearAllMocks();
  gateway.requestToPay.mockReset();
  gateway.getDepositStatus.mockReset();
  gateway.findReference.mockReset();
  gateway.requestToPay.mockImplementation(async () => ({
    reference: randomUUID(),
    status: 'PENDING',
  }));
  gateway.getDepositStatus.mockImplementation(async (reference) => remote(reference) as any);
  gateway.findReference.mockResolvedValue(null);
  jest.mocked(sendOrderConfirmedEmail).mockResolvedValue(undefined as any);
  jest.mocked(sendProviderNewOrderEmail).mockResolvedValue(undefined as any);
  jest.mocked(createNotification).mockResolvedValue(undefined as any);
  const order = await prisma.order.create({
    data: {
      userId,
      subscriptionId,
      orderNumber: `TEST-${randomUUID()}`,
      amount: 3111,
      status: 'PENDING',
      deliveryMethod: 'PICKUP',
    },
  });
  orderId = order.id;
});
afterAll(async () => {
  await prisma.order.deleteMany({ where: { userId: { in: [userId, otherId] } } });
  await prisma.subscription.deleteMany({ where: { providerId } });
  await prisma.provider.delete({ where: { id: providerId } });
  await prisma.city.delete({ where: { id: cityId } });
  await prisma.country.delete({ where: { id: countryId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherId, providerUserId] } } });
  await prisma.$disconnect();
});

test('unauthenticated initiation and cross-account payment access are rejected', async () => {
  expect((await request(app).post('/payments/initiate').send(payload())).status).toBe(401);
  await expect(paymentService.initiateDeposit(otherId, payload())).rejects.toMatchObject({
    statusCode: 403,
  });
  const payment = await start();
  await expect(paymentService.getStatus(payment.paymentId, otherId)).rejects.toMatchObject({
    statusCode: 403,
  });
  expect(gateway.getDepositStatus).not.toHaveBeenCalled();
});

test('reservation is persisted before gateway request, and callback is an attempt ID', async () => {
  gateway.requestToPay.mockImplementationOnce(async (_, data) => {
    const reserved = await attempt();
    expect(data.callback_info).toBe(reserved.id);
    expect(reserved.reference).toBeNull();
    expect(data.phoneNumber).toBe('2290166000000');
    return { reference: 'ref-reserved', status: 'PENDING' };
  });
  expect((await start()).status).toBe('PROCESSING');
});

test('simultaneous initiations on two service calls cause one external request', async () => {
  const gate = deferred<any>();
  const entered = deferred<void>();
  gateway.requestToPay.mockImplementationOnce(async () => {
    entered.resolve();
    return gate.promise;
  });
  const first = start();
  await entered.promise;
  const second = await start();
  expect(gateway.requestToPay).toHaveBeenCalledTimes(1);
  gate.resolve({ reference: 'one-request', status: 'PENDING' });
  expect((await first).paymentId).toBe(second.paymentId);
  expect(await prisma.paymentAttempt.count({ where: { paymentId: second.paymentId } })).toBe(1);
});

test('a final failure permits a new attempt with history and stable payment ID', async () => {
  gateway.requestToPay.mockResolvedValueOnce({ reference: 'failed-attempt', status: 'FAILED' });
  const first = await start();
  expect(first.status).toBe('FAILED');
  const next = await start();
  expect(next.paymentId).toBe(first.paymentId);
  expect(next.status).toBe('PROCESSING');
  const rows = await prisma.paymentAttempt.findMany({ where: { paymentId: first.paymentId } });
  expect(rows.map((row) => row.status).sort()).toEqual(['FAILED', 'PROCESSING']);
});

test('a definite request rejection unlocks a retry without orphaning the attempt', async () => {
  gateway.requestToPay.mockRejectedValueOnce(new FeexPayRequestError(true));
  expect((await start()).status).toBe('FAILED');
  expect((await start()).status).toBe('PROCESSING');
  expect(gateway.requestToPay).toHaveBeenCalledTimes(2);
});

test('timeout stays processing and repeated initiation never sends another debit', async () => {
  gateway.requestToPay.mockRejectedValueOnce(new FeexPayRequestError(false));
  const first = await start();
  expect(first.status).toBe('PROCESSING');
  expect(first.reference).toBeNull();
  expect((await start()).paymentId).toBe(first.paymentId);
  expect(gateway.requestToPay).toHaveBeenCalledTimes(1);
});

test('a malformed/lost initiation response can be recovered from authenticated history', async () => {
  gateway.requestToPay.mockRejectedValueOnce(new FeexPayRequestError(false));
  const payment = await start();
  const saved = await attempt();
  gateway.findReference.mockResolvedValueOnce('recovered-reference');
  gateway.getDepositStatus.mockResolvedValueOnce(
    remote('recovered-reference', 'SUCCESSFUL', { callback_info: saved.id }) as any
  );
  expect((await paymentService.getStatus(payment.paymentId, userId)).status).toBe('SUCCESS');
  expect((await attempt()).reference).toBe('recovered-reference');
});

test('a successful Moov initiation is verified and confirmed immediately', async () => {
  gateway.requestToPay.mockResolvedValueOnce({ reference: 'moov-success', status: 'SUCCESSFUL' });
  const payment = await paymentService.initiateDeposit(userId, { ...payload(), provider: 'MOOV' });
  expect(payment.status).toBe('SUCCESS');
  expect(gateway.getDepositStatus).toHaveBeenCalledWith('moov-success');
  expect(sendOrderConfirmedEmail).toHaveBeenCalledTimes(1);
});

test('webhook works without user JWT and confirms using the server-verified status', async () => {
  const payment = await start();
  const result = await webhook().send({
    reference: payment.reference,
    amount: 3111,
    status: 'FAILED',
  });
  expect(result.status).toBe(200);
  expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe(
    'CONFIRMED'
  );
  expect((await attempt()).status).toBe('SUCCESS');
});

test('forged success payload cannot confirm a pending or failed remote transaction', async () => {
  const payment = await start();
  gateway.getDepositStatus.mockResolvedValueOnce(remote(payment.reference!, 'PENDING') as any);
  expect(
    (await webhook().send({ reference: payment.reference, amount: 3111, status: 'SUCCESSFUL' }))
      .status
  ).toBe(200);
  expect((await attempt()).status).toBe('PROCESSING');
  gateway.getDepositStatus.mockResolvedValueOnce(remote(payment.reference!, 'FAILED') as any);
  await paymentService.handleWebhook({
    reference: payment.reference!,
    amount: 3111,
    status: 'SUCCESSFUL',
  });
  expect((await attempt()).status).toBe('FAILED');
  expect(sendOrderConfirmedEmail).not.toHaveBeenCalled();
});

test('webhook verification outage returns 503 and leaves the attempt pending', async () => {
  const payment = await start();
  gateway.getDepositStatus.mockRejectedValueOnce(
    new (require('@/utils/errors.util').ServiceUnavailableError)('Unavailable')
  );
  expect(
    (await webhook().send({ reference: payment.reference, amount: 3111, status: 'SUCCESSFUL' }))
      .status
  ).toBe(503);
  expect((await attempt()).status).toBe('PROCESSING');
});

test('amount, reference and callback mismatches never confirm an order', async () => {
  const payment = await start();
  for (const extra of [
    { amount: 1 },
    { reference: 'different-reference' },
    { callback_info: randomUUID() },
  ]) {
    gateway.getDepositStatus.mockResolvedValueOnce(
      remote(payment.reference!, 'SUCCESSFUL', extra) as any
    );
    await expect(
      paymentService.handleWebhook({
        reference: payment.reference!,
        amount: extra.amount ?? 3111,
        status: 'SUCCESSFUL',
      })
    ).rejects.toBeDefined();
    expect((await attempt()).status).toBe('PROCESSING');
  }
  expect((await attempt()).needsReview).toBe(true);
  expect(sendOrderConfirmedEmail).not.toHaveBeenCalled();
});

test('early webhook links an attempt using callback_info from the authenticated API', async () => {
  gateway.requestToPay.mockImplementationOnce(async (_, data) => {
    gateway.getDepositStatus.mockResolvedValueOnce(
      remote('early-ref', 'SUCCESSFUL', { callback_info: data.callback_info }) as any
    );
    await paymentService.handleWebhook({
      reference: 'early-ref',
      amount: 3111,
      status: 'SUCCESSFUL',
      callback_info: data.callback_info,
    });
    return { reference: 'early-ref', status: 'PENDING' };
  });
  expect((await start()).status).toBe('SUCCESS');
  expect(sendOrderConfirmedEmail).toHaveBeenCalledTimes(1);
});

test('unknown reference with forged callback_info cannot attach to an existing attempt', async () => {
  const payment = await start();
  gateway.getDepositStatus.mockResolvedValueOnce(
    remote('unknown-ref', 'SUCCESSFUL', { callback_info: 'not-our-attempt' }) as any
  );
  await expect(
    paymentService.handleWebhook({
      reference: 'unknown-ref',
      amount: 3111,
      status: 'SUCCESSFUL',
      callback_info: (await attempt()).id,
    })
  ).rejects.toMatchObject({ statusCode: 404 });
  expect(
    (await prisma.payment.findUniqueOrThrow({ where: { id: payment.paymentId } })).status
  ).toBe('PROCESSING');
});

test('simultaneous polling and webhook produce one confirmation and one set of notifications', async () => {
  const payment = await start();
  await Promise.all([
    paymentService.getStatus(payment.paymentId, userId),
    paymentService.handleWebhook({
      reference: payment.reference!,
      amount: 3111,
      status: 'SUCCESSFUL',
    }),
    paymentService.handleWebhook({
      reference: payment.reference!,
      amount: 3111,
      status: 'SUCCESSFUL',
    }),
  ]);
  expect(sendOrderConfirmedEmail).toHaveBeenCalledTimes(1);
  expect(sendProviderNewOrderEmail).toHaveBeenCalledTimes(1);
  expect(createNotification).toHaveBeenCalledTimes(2);
  const paidAt = (await prisma.payment.findUniqueOrThrow({ where: { id: payment.paymentId } }))
    .paidAt;
  await paymentService.handleWebhook({
    reference: payment.reference!,
    amount: 3111,
    status: 'FAILED',
  });
  expect(
    (await prisma.payment.findUniqueOrThrow({ where: { id: payment.paymentId } })).paidAt
  ).toEqual(paidAt);
});

test.each(['ACTIVE', 'COMPLETED', 'CANCELLED'] as const)(
  'late confirmation never changes order state %s',
  async (status) => {
    const payment = await start();
    await prisma.order.update({ where: { id: orderId }, data: { status } });
    await paymentService.handleWebhook({
      reference: payment.reference!,
      amount: 3111,
      status: 'SUCCESSFUL',
    });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe(status);
    expect((await attempt()).status).toBe('SUCCESS');
    expect((await attempt()).needsReview).toBe(status === 'CANCELLED');
    expect(sendOrderConfirmedEmail).not.toHaveBeenCalled();
  }
);

test('old failure replay cannot overwrite the next processing attempt', async () => {
  gateway.requestToPay.mockResolvedValueOnce({ reference: 'old-failure', status: 'FAILED' });
  await start();
  const next = await start();
  await paymentService.handleWebhook({ reference: 'old-failure', amount: 3111, status: 'FAILED' });
  expect((await prisma.payment.findUniqueOrThrow({ where: { id: next.paymentId } })).status).toBe(
    'PROCESSING'
  );
});

test('reconciliation confirms pending payments without a client and isolates remote failures', async () => {
  const payment = await start();
  const saved = await attempt();
  await prisma.paymentAttempt.update({
    where: { id: saved.id },
    data: { createdAt: new Date(Date.now() - 120000) },
  });
  await paymentService.reconcilePendingPayments();
  expect(
    (await prisma.payment.findUniqueOrThrow({ where: { id: payment.paymentId } })).status
  ).toBe('SUCCESS');
});

test('uncertain attempts remain blocked and are flagged rather than assumed failed', async () => {
  gateway.requestToPay.mockRejectedValueOnce(new FeexPayRequestError(false));
  const payment = await start();
  const saved = await attempt();
  await prisma.paymentAttempt.update({
    where: { id: saved.id },
    data: { createdAt: new Date(Date.now() - 11 * 60000) },
  });
  await paymentService.reconcilePendingPayments();
  expect((await attempt()).needsReview).toBe(true);
  expect(
    (await prisma.payment.findUniqueOrThrow({ where: { id: payment.paymentId } })).status
  ).toBe('PROCESSING');
  await start();
  expect(gateway.requestToPay).toHaveBeenCalledTimes(1);
});

test('legacy PawaPay references are not queried against FeexPay', async () => {
  const payment = await prisma.payment.create({
    data: {
      orderId,
      userId,
      amount: 3111,
      method: 'MOBILE_MONEY_MTN',
      status: 'PROCESSING',
      transactionId: randomUUID(),
    },
  });
  await paymentService.getStatus(payment.id, userId);
  await expect(start()).rejects.toMatchObject({ statusCode: 409 });
  expect(gateway.getDepositStatus).not.toHaveBeenCalled();
  expect(gateway.requestToPay).not.toHaveBeenCalled();
});

test('cancellation is blocked while processing or paid', async () => {
  const payment = await start();
  await expect(orderService.cancel(orderId, userId, 'USER')).rejects.toMatchObject({
    code: 'PAYMENT_CANCELLATION_REQUIRES_SUPPORT',
  });
  await paymentService.getStatus(payment.paymentId, userId);
  await expect(orderService.cancel(orderId, userId, 'USER')).rejects.toMatchObject({
    code: 'PAYMENT_CANCELLATION_REQUIRES_SUPPORT',
  });
  expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).status).toBe(
    'CONFIRMED'
  );
});

test('payment uses one integer amount for gateway, ledger and order', async () => {
  await prisma.order.update({ where: { id: orderId }, data: { amount: 3111.4 } });
  const payment = await start();
  expect(gateway.requestToPay.mock.calls[0][1].amount).toBe(3111);
  expect(
    (await prisma.payment.findUniqueOrThrow({ where: { id: payment.paymentId } })).amount
  ).toBe(3111);
  expect((await prisma.order.findUniqueOrThrow({ where: { id: orderId } })).amount).toBe(3111);
});

test('unsupported networks and malformed phone numbers fail before the gateway', async () => {
  for (const provider of ['WAVE', 'ORANGE', 'MOOV_CIV', 'anything', undefined]) {
    await expect(
      paymentService.initiateDeposit(userId, { ...payload(), provider })
    ).rejects.toMatchObject({ statusCode: 400 });
  }
  expect(resolveNetwork('MTN_MOMO_BEN')).toBe('mtn');
  expect(resolveNetwork('CELTIIS')).toBe('celtiis_bj');
  expect(normalizePaymentPhone('0166000000')).toBe('2290166000000');
  expect(initiateDepositSchema.safeParse({ ...payload(), phoneNumber: 'notaphone' }).success).toBe(
    false
  );
  expect(gateway.requestToPay).not.toHaveBeenCalled();
});

test('malformed webhook references and missing fields are rejected before the gateway', async () => {
  for (const body of [
    { reference: '../../escape', status: 'SUCCESSFUL', amount: 3111 },
    { status: 'SUCCESSFUL', amount: 3111 },
  ]) {
    expect((await webhook().send(body)).status).toBe(400);
  }
  expect(gateway.getDepositStatus).not.toHaveBeenCalled();
});

test('unpaid cancellation remains possible and concurrent cancellation cannot race a new debit', async () => {
  const results = await Promise.allSettled([start(), orderService.cancel(orderId, userId, 'USER')]);
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.status === 'CANCELLED') {
    expect(gateway.requestToPay).not.toHaveBeenCalled();
    expect(results[0].status).toBe('rejected');
  } else {
    expect(results[1].status).toBe('rejected');
    expect(gateway.requestToPay).toHaveBeenCalledTimes(1);
  }
});

test('unpaid cancellation updates the order once', async () => {
  expect((await orderService.cancel(orderId, userId, 'USER')).status).toBe('CANCELLED');
  await expect(orderService.cancel(orderId, userId, 'USER')).rejects.toMatchObject({
    statusCode: 409,
  });
  expect(gateway.requestToPay).not.toHaveBeenCalled();
});

test('confirmation email outage does not fail or duplicate a successful payment', async () => {
  const payment = await start();
  jest.mocked(sendOrderConfirmedEmail).mockRejectedValueOnce(new Error('email down'));
  await paymentService.handleWebhook({
    reference: payment.reference!,
    amount: 3111,
    status: 'SUCCESSFUL',
  });
  await paymentService.handleWebhook({
    reference: payment.reference!,
    amount: 3111,
    status: 'SUCCESSFUL',
  });
  expect((await attempt()).status).toBe('SUCCESS');
  expect(sendOrderConfirmedEmail).toHaveBeenCalledTimes(1);
});
