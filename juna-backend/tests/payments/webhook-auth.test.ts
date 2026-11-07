import express, { ErrorRequestHandler } from 'express';
import request from 'supertest';
import { authenticateFeexPayWebhook } from '@/middlewares/feexpay-webhook.middleware';
import { AppError } from '@/utils/errors.util';

const app = express();
const handler = jest.fn();
app.post('/webhook', authenticateFeexPayWebhook, (_req, res) => {
  handler();
  res.sendStatus(200);
});
const errors: ErrorRequestHandler = (err: AppError, _req, res, _next) => {
  res.status(err.statusCode || 500).json({ code: err.code });
};
app.use(errors);
beforeEach(() => {
  handler.mockClear();
  process.env.FEEXPAY_WEBHOOK_SECRET = 'test_webhook_secret';
});

test('dedicated Bearer token authenticates a webhook without a user JWT', async () => {
  expect(
    (await request(app).post('/webhook').set('Authorization', 'Bearer test_webhook_secret')).status
  ).toBe(200);
  expect(handler).toHaveBeenCalledTimes(1);
});

test.each([
  undefined,
  'Bearer wrong',
  'Basic test_webhook_secret',
  'Bearer Bearer test_webhook_secret',
])('missing or invalid token is rejected: %p', async (header) => {
  const req = request(app).post('/webhook');
  if (header) req.set('Authorization', header);
  expect((await req).status).toBe(401);
  expect(handler).not.toHaveBeenCalled();
});

test('unconfigured secret fails closed before payment processing', async () => {
  delete process.env.FEEXPAY_WEBHOOK_SECRET;
  try {
    expect(
      (await request(app).post('/webhook').set('Authorization', 'Bearer test_webhook_secret'))
        .status
    ).toBe(503);
    expect(handler).not.toHaveBeenCalled();
  } finally {
    process.env.FEEXPAY_WEBHOOK_SECRET = 'test_webhook_secret';
  }
});
