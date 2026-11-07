import request from 'supertest';
import app from '@/app';

jest.mock('@/routes', () => require('express').Router());
jest.mock('@/middlewares/logger.middleware', () => ({
  httpLogger: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
jest.mock('@/middlewares/rateLimiter.middleware', () => ({
  globalRateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

test('root welcomes visitors with useful links without exposing configuration', async () => {
  const result = await request(app).get('/').expect(200);
  expect(result.body.success).toBe(true);
  expect(result.body.message).toContain('Bienvenue');
  expect(result.body.data).toEqual({
    website: 'https://junaeats.com',
    api: '/api/v1',
    health: '/api/health',
    version: '/api/version',
  });
});
test('unknown routes still return a genuine 404', async () => {
  const result = await request(app).get('/does-not-exist').expect(404);
  expect(result.body.success).toBe(false);
  expect(result.body.error.code).toBe('NOT_FOUND');
});
