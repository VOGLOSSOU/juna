import { randomUUID } from 'crypto';
import prisma from '@/config/database';
import feexPayService from '@/services/feexpay.service';
import { PayoutService } from '@/services/payout.service';
import { sendPayoutSuccessEmail } from '@/services/email.service';

const mockMail = jest.fn();
jest.mock('@getbrevo/brevo', () => ({
  BrevoClient: jest.fn().mockImplementation(() => ({
    transactionalEmails: { sendTransacEmail: (...args: unknown[]) => mockMail(...args) },
  })),
}));
jest.mock('@/services/feexpay.service', () => ({
  ...jest.requireActual('@/services/feexpay.service'),
  __esModule: true,
  default: {
    initiatePayout: jest.fn(),
    getPayoutStatus: jest.fn(),
    findPayoutReference: jest.fn(),
  },
}));
const gateway = jest.mocked(feexPayService);
const userId = randomUUID();
const providerUserId = randomUUID();
let countryId: string, cityId: string, providerId: string, subscriptionId: string, orderId: string;
let service: PayoutService;
const oldKey = process.env.BREVO_API_KEY;
const reference = 'payout-test-reference';
const validStatus = () => ({
  reference,
  status: 'SUCCESSFUL' as const,
  amount: 1000,
  phoneNumber: '2290166000000',
  callback_info: orderId,
});
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
async function intent() {
  return prisma.$transaction((tx) => service.createIntent(tx, orderId, providerId, 1000));
}
async function stored() {
  return prisma.payout.findUniqueOrThrow({ where: { orderId } });
}

beforeAll(async () => {
  await prisma.user.createMany({
    data: [userId, providerUserId].map((id) => ({
      id,
      email: `${id}@example.invalid`,
      name: 'Payout Test',
      password: 'unused',
      isVerified: true,
    })),
  });
  countryId = (
    await prisma.country.create({
      data: { code: randomUUID().slice(0, 8), translations: { fr: 'Test' } },
    })
  ).id;
  cityId = (await prisma.city.create({ data: { countryId, name: 'Test' } })).id;
  providerId = (
    await prisma.provider.create({
      data: {
        userId: providerUserId,
        businessName: 'Test',
        businessAddress: 'Test',
        cityId,
        logo: 'https://example.invalid/test.jpg',
        status: 'APPROVED',
        payoutPhoneNumber: '2290166000000',
        payoutNetwork: 'MTN',
      },
    })
  ).id;
  subscriptionId = (
    await prisma.subscription.create({
      data: {
        providerId,
        name: 'Test',
        description: 'Test',
        price: 1100,
        providerPrice: 1000,
        type: 'LUNCH',
        category: 'AFRICAN',
        duration: 'WEEK',
        imageUrl: 'https://example.invalid/test.jpg',
      },
    })
  ).id;
});
beforeEach(async () => {
  await prisma.order.deleteMany({ where: { userId } });
  service = new PayoutService();
  process.env.BREVO_API_KEY = 'test-not-a-real-key';
  mockMail.mockReset().mockResolvedValue({ messageId: 'accepted' });
  gateway.initiatePayout.mockReset().mockResolvedValue({ reference, status: 'PENDING' });
  gateway.getPayoutStatus.mockReset().mockImplementation(async () => validStatus());
  gateway.findPayoutReference.mockReset().mockResolvedValue(reference);
  orderId = (
    await prisma.order.create({
      data: {
        userId,
        subscriptionId,
        orderNumber: `TEST-${randomUUID()}`,
        amount: 1100,
        providerAmount: 1000,
        status: 'ACTIVE',
        deliveryMethod: 'PICKUP',
      },
    })
  ).id;
});
afterAll(async () => {
  if (oldKey === undefined) delete process.env.BREVO_API_KEY;
  else process.env.BREVO_API_KEY = oldKey;
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.subscription.deleteMany({ where: { providerId } });
  await prisma.provider.delete({ where: { id: providerId } });
  await prisma.city.delete({ where: { id: cityId } });
  await prisma.country.delete({ where: { id: countryId } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, providerUserId] } } });
  await prisma.$disconnect();
});

test('concurrent claims initiate once and confirm only after querying the status endpoint', async () => {
  const payout = await intent();
  await Promise.all([service.attemptPayout(payout.id), service.attemptPayout(payout.id)]);
  expect(gateway.initiatePayout).toHaveBeenCalledTimes(1);
  expect(gateway.getPayoutStatus).toHaveBeenCalledWith(reference);
  expect((await stored()).status).toBe('SUCCESS');
  expect(mockMail).toHaveBeenCalledTimes(1);
  expect(mockMail.mock.calls[0][0].headers).toEqual({ idempotencyKey: payout.id });
});

test.each([
  ['missing amount', { amount: undefined }, 'AMOUNT_MISMATCH'],
  ['wrong amount', { amount: 1 }, 'AMOUNT_MISMATCH'],
  ['fractional amount', { amount: 999.9 }, 'AMOUNT_MISMATCH'],
  ['missing recipient', { phoneNumber: undefined }, 'RECIPIENT_MISMATCH'],
  ['wrong recipient', { phoneNumber: '2290100000000' }, 'RECIPIENT_MISMATCH'],
  ['invalid recipient', { phoneNumber: 'not-a-phone' }, 'RECIPIENT_MISMATCH'],
  ['wrong callback', { callback_info: 'another-order' }, 'CALLBACK_MISMATCH'],
  ['unrecognized callback object', { callback_info: { other: 'value' } }, 'CALLBACK_MISMATCH'],
  ['wrong reference', { reference: 'other-reference' }, 'GATEWAY_DATA_MISMATCH'],
] as const)(
  '%s blocks finalization without triggering another payout',
  async (_name, override, reason) => {
    const payout = await intent();
    gateway.getPayoutStatus.mockResolvedValue({ ...validStatus(), ...override });
    await service.attemptPayout(payout.id);
    const after = await stored();
    expect(after.status).toBe('PROCESSING');
    expect(after.needsReview).toBe(true);
    expect(after.reviewReason).toBe(reason);
    expect(after.paidAt).toBeNull();
    expect(mockMail).not.toHaveBeenCalled();
    expect(gateway.initiatePayout).toHaveBeenCalledTimes(1);
  }
);

test('a supplied matching callback object and formatted destination are accepted', async () => {
  const payout = await intent();
  gateway.getPayoutStatus.mockResolvedValue({
    ...validStatus(),
    phoneNumber: '+229 01 66 00 00 00',
    callback_info: { order_id: orderId },
  });
  await service.attemptPayout(payout.id);
  expect((await stored()).status).toBe('SUCCESS');
});
test('an identified reference may have a null callback and snake-case phone number', async () => {
  const payout = await intent();
  gateway.getPayoutStatus.mockResolvedValue({
    ...validStatus(),
    phoneNumber: undefined,
    phone_number: '2290166000000',
    callback_info: null,
  });
  await service.attemptPayout(payout.id);
  expect((await stored()).status).toBe('SUCCESS');
});
test('a pending status without final details does not become a success or an email', async () => {
  const payout = await intent();
  gateway.getPayoutStatus.mockResolvedValue({ reference, status: 'PENDING' });
  await service.attemptPayout(payout.id);
  expect((await stored()).status).toBe('PROCESSING');
  expect(mockMail).not.toHaveBeenCalled();
});
test('Brevo failure is retried later without sending a second Mobile Money transfer', async () => {
  const payout = await intent();
  mockMail.mockRejectedValueOnce(new Error('Brevo unavailable'));
  await service.attemptPayout(payout.id);
  const failedEmail = await stored();
  expect(failedEmail.status).toBe('SUCCESS');
  expect(failedEmail.successEmailSentAt).toBeNull();
  expect(failedEmail.successEmailNextAttemptAt!.getTime()).toBeGreaterThan(Date.now());
  await service.sendPendingSuccessEmails();
  expect(mockMail).toHaveBeenCalledTimes(1);
  await prisma.payout.update({
    where: { id: payout.id },
    data: { successEmailNextAttemptAt: new Date(0) },
  });
  await Promise.all([
    service.sendPendingSuccessEmails(),
    new PayoutService().sendPendingSuccessEmails(),
  ]);
  expect(mockMail).toHaveBeenCalledTimes(2);
  expect((await stored()).successEmailSentAt).not.toBeNull();
  expect(gateway.initiatePayout).toHaveBeenCalledTimes(1);
});
test('missing Brevo credentials leave the success email eligible for retry', async () => {
  const payout = await intent();
  delete process.env.BREVO_API_KEY;
  await service.attemptPayout(payout.id);
  expect((await stored()).status).toBe('SUCCESS');
  expect((await stored()).successEmailSentAt).toBeNull();
  expect(mockMail).not.toHaveBeenCalled();
});
test('two reconciliation workers cannot finalize and notify the same success twice', async () => {
  const payout = await intent();
  await prisma.payout.update({
    where: { id: payout.id },
    data: {
      status: 'PROCESSING',
      reference,
      createdAt: new Date(Date.now() - 120000),
    },
  });
  const gate = deferred();
  gateway.getPayoutStatus.mockImplementation(async () => {
    await gate.promise;
    return validStatus();
  });
  const first = service.reconcilePendingPayouts();
  const second = new PayoutService().reconcilePendingPayouts();
  gate.resolve();
  await Promise.all([first, second]);
  expect((await stored()).status).toBe('SUCCESS');
  expect(mockMail).toHaveBeenCalledTimes(1);
  expect(gateway.initiatePayout).not.toHaveBeenCalled();
});
test('history recovery cannot attach a different status reference', async () => {
  const payout = await intent();
  await prisma.payout.update({
    where: { id: payout.id },
    data: {
      status: 'PROCESSING',
      createdAt: new Date(Date.now() - 120000),
    },
  });
  gateway.getPayoutStatus.mockResolvedValue({ ...validStatus(), reference: 'different-reference' });
  await service.reconcilePendingPayouts();
  const after = await stored();
  expect(after.status).toBe('PROCESSING');
  expect(after.reference).toBeNull();
  expect(after.needsReview).toBe(true);
  expect(mockMail).not.toHaveBeenCalled();
  expect(gateway.initiatePayout).not.toHaveBeenCalled();
});
test('only a duplicate idempotency response counts as an already accepted email', async () => {
  const email = { orderNumber: 'TEST', amount: 1000, payoutId: randomUUID() };
  mockMail.mockRejectedValueOnce({
    body: { code: 'duplicate_parameter', message: 'idempotency key already used' },
  });
  await expect(
    sendPayoutSuccessEmail('test@example.invalid', 'Test', email)
  ).resolves.toBeUndefined();
  mockMail.mockRejectedValueOnce({
    body: { code: 'duplicate_parameter', message: 'another parameter' },
  });
  await expect(sendPayoutSuccessEmail('test@example.invalid', 'Test', email)).rejects.toBeDefined();
});
