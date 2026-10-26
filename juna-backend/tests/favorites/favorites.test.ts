import request from 'supertest';
import express from 'express';
import { randomUUID } from 'crypto';
import prisma from '@/config/database';
import favoriteRoutes from '@/routes/favorite.routes';
import subscriptionRoutes from '@/routes/subscription.routes';
import providerRoutes from '@/routes/provider.routes';
import homeRoutes from '@/routes/home.routes';
import { errorHandler } from '@/middlewares/error.middleware';
import { generateAccessToken } from '@/utils/jwt.util';

const app = express();
app.use(express.json());
app.use('/favorites', favoriteRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/providers', providerRoutes);
app.use(homeRoutes);
app.use(errorHandler);

const userA = randomUUID();
const userB = randomUUID();
const providerUser = randomUUID();
let providerId: string;
let cityId: string;
let countryId: string;
let subId: string;
let otherSubId: string;
const token = (id: string) =>
  generateAccessToken({ userId: id, email: `${id}@test.local`, role: 'USER' });
const auth = (id = userA) => ({ Authorization: `Bearer ${token(id)}` });

beforeAll(async () => {
  await prisma.user.createMany({
    data: [userA, userB, providerUser].map((id) => ({
      id,
      email: `${id}@test.local`,
      name: 'Test favoris',
      password: 'unused',
    })),
  });
  const country = await prisma.country.create({
    data: { code: randomUUID().slice(0, 8), translations: { fr: 'Test' } },
  });
  countryId = country.id;
  const city = await prisma.city.create({ data: { name: 'Ville test', countryId } });
  cityId = city.id;
  const provider = await prisma.provider.create({
    data: {
      userId: providerUser,
      businessName: 'Prestataire test',
      businessAddress: 'Test',
      logo: 'https://example.com/logo.jpg',
      cityId,
      status: 'APPROVED',
    },
  });
  providerId = provider.id;
  const data = {
    providerId,
    description: 'Description de test',
    instructions: 'Consigne test',
    price: 1111,
    type: 'LUNCH' as const,
    category: 'AFRICAN' as const,
    duration: 'WEEK' as const,
    imageUrl: 'https://example.com/meal.jpg',
    isPublic: true,
    isActive: true,
  };
  subId = (await prisma.subscription.create({ data: { ...data, name: 'Formule test' } })).id;
  otherSubId = (await prisma.subscription.create({ data: { ...data, name: 'Autre formule' } })).id;
});

beforeEach(async () => {
  await prisma.favorite.deleteMany({ where: { userId: { in: [userA, userB] } } });
  await prisma.user.updateMany({
    where: { id: { in: [userA, providerUser] } },
    data: { isActive: true },
  });
  await prisma.subscription.update({
    where: { id: subId },
    data: { isActive: true, isPublic: true },
  });
  await prisma.provider.update({ where: { id: providerId }, data: { status: 'APPROVED' } });
});

afterAll(async () => {
  if (providerId) {
    await prisma.subscription.deleteMany({ where: { providerId } });
    await prisma.provider.deleteMany({ where: { id: providerId } });
  }
  await prisma.user.deleteMany({ where: { id: { in: [userA, userB, providerUser] } } });
  if (countryId) await prisma.country.deleteMany({ where: { id: countryId } });
  await prisma.$disconnect();
});

test('all favorite routes require a valid token', async () => {
  expect((await request(app).get('/favorites')).status).toBe(401);
  expect((await request(app).post('/favorites').send({ subscriptionId: subId })).status).toBe(401);
  expect((await request(app).delete(`/favorites/${subId}`)).status).toBe(401);
  expect((await request(app).get('/favorites').set('Authorization', 'Bearer invalid')).status).toBe(
    401
  );
});

test('adding twice and concurrently creates only one favorite', async () => {
  const responses = await Promise.all(
    Array.from({ length: 8 }, () =>
      request(app).post('/favorites').set(auth()).send({ subscriptionId: subId })
    )
  );
  expect(responses.every((res) => res.status === 200 && res.body.data.isFavorite)).toBe(true);
  expect(await prisma.favorite.count({ where: { userId: userA, subscriptionId: subId } })).toBe(1);
});

test('list and deletion are isolated by the authenticated account', async () => {
  await request(app).post('/favorites').set(auth()).send({ subscriptionId: subId }).expect(200);
  const mine = await request(app).get('/favorites').set(auth()).expect(200);
  expect(mine.body.data.favorites[0]).toMatchObject({
    id: subId,
    isFavorite: true,
    isAvailable: true,
    instructions: 'Consigne test',
    currency: 'XOF',
  });
  expect(mine.body.data.favorites[0].provider.user).toBeUndefined();
  const other = await request(app).get('/favorites').set(auth(userB)).expect(200);
  expect(other.body.data.favorites).toEqual([]);
  await request(app).delete(`/favorites/${subId}`).set(auth(userB)).expect(200);
  expect(await prisma.favorite.count({ where: { userId: userA } })).toBe(1);
  await request(app).delete(`/favorites/${subId}`).set(auth()).expect(200);
  await request(app).delete(`/favorites/${subId}`).set(auth()).expect(200);
  expect(await prisma.favorite.count({ where: { userId: userA } })).toBe(0);
});

test('pagination is stable and newest first, including empty pages', async () => {
  await prisma.favorite.createMany({
    data: [
      { userId: userA, subscriptionId: subId, createdAt: new Date('2026-01-01') },
      { userId: userA, subscriptionId: otherSubId, createdAt: new Date('2026-01-02') },
    ],
  });
  const first = await request(app).get('/favorites?page=1&limit=1').set(auth()).expect(200);
  expect(first.body.data.favorites.map((sub: { id: string }) => sub.id)).toEqual([otherSubId]);
  expect(first.body.data.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
  const second = await request(app).get('/favorites?page=2&limit=1').set(auth()).expect(200);
  expect(second.body.data.favorites[0].id).toBe(subId);
  const empty = await request(app).get('/favorites?page=3&limit=1').set(auth()).expect(200);
  expect(empty.body.data.favorites).toEqual([]);
});

test('invalid IDs, ownership injection and invalid pagination are rejected', async () => {
  for (const body of [{ subscriptionId: 'bad' }, { subscriptionId: subId, userId: userB }, {}]) {
    await request(app).post('/favorites').set(auth()).send(body).expect(400);
  }
  await request(app).delete('/favorites/bad').set(auth()).expect(400);
  for (const query of [
    'page=0',
    'page=1.5',
    'limit=101',
    'limit=0',
    'page=bad',
    `userId=${userB}`,
  ]) {
    await request(app).get(`/favorites?${query}`).set(auth()).expect(400);
  }
});

test('missing, private or inactive subscriptions cannot be added', async () => {
  await request(app)
    .post('/favorites')
    .set(auth())
    .send({ subscriptionId: randomUUID() })
    .expect(404);
  await prisma.subscription.update({ where: { id: subId }, data: { isPublic: false } });
  await request(app).post('/favorites').set(auth()).send({ subscriptionId: subId }).expect(404);
  await prisma.subscription.update({
    where: { id: subId },
    data: { isPublic: true, isActive: false },
  });
  await request(app).post('/favorites').set(auth()).send({ subscriptionId: subId }).expect(404);
});

test('unavailable favorites are retained and can still be removed', async () => {
  await request(app).post('/favorites').set(auth()).send({ subscriptionId: subId }).expect(200);
  await prisma.subscription.update({ where: { id: subId }, data: { isPublic: false } });
  await prisma.provider.update({ where: { id: providerId }, data: { status: 'SUSPENDED' } });
  const list = await request(app).get('/favorites').set(auth()).expect(200);
  expect(list.body.data.favorites[0].isAvailable).toBe(false);
  await request(app).post('/favorites').set(auth()).send({ subscriptionId: subId }).expect(200);
  await request(app).delete(`/favorites/${subId}`).set(auth()).expect(200);
});

test('suspended users cannot access favorites and suspended providers cannot receive new favorites', async () => {
  await prisma.user.update({ where: { id: userA }, data: { isActive: false } });
  await request(app).get('/favorites').set(auth()).expect(403);
  await request(app).post('/favorites').set(auth()).send({ subscriptionId: subId }).expect(403);
  await request(app).delete(`/favorites/${subId}`).set(auth()).expect(403);
  await prisma.user.update({ where: { id: userA }, data: { isActive: true } });
  await prisma.user.update({ where: { id: providerUser }, data: { isActive: false } });
  await request(app).post('/favorites').set(auth()).send({ subscriptionId: subId }).expect(404);
});

test('discovery marks only the current account favorites and protects personalized caching', async () => {
  await request(app).post('/favorites').set(auth()).send({ subscriptionId: subId }).expect(200);
  for (const path of [
    `/subscriptions/${subId}`,
    '/subscriptions?sort=recent',
    `/home?cityId=${cityId}`,
    `/providers/${providerId}`,
  ]) {
    const guest = await request(app).get(path).expect(200);
    const mine = await request(app).get(path).set(auth()).expect(200);
    const other = await request(app).get(path).set(auth(userB)).expect(200);
    function flatten(value: any): any[] {
      if (!value || typeof value !== 'object') return [];
      return [...(value.id === subId ? [value] : []), ...Object.values(value).flatMap(flatten)];
    }
    expect(flatten(guest.body.data).every((sub) => sub.isFavorite === false)).toBe(true);
    expect(flatten(mine.body.data).length).toBeGreaterThan(0);
    expect(flatten(mine.body.data).every((sub) => sub.isFavorite === true)).toBe(true);
    expect(flatten(other.body.data).every((sub) => sub.isFavorite === false)).toBe(true);
    expect(mine.headers['cache-control']).toBe('private, no-store');
    expect(guest.headers.vary).toContain('Authorization');
  }
});

test('deleting an account or subscription cascades to its favorites', async () => {
  const temp = await prisma.user.create({
    data: { email: `${randomUUID()}@test.local`, name: 'Test', password: 'unused' },
  });
  await prisma.favorite.create({ data: { userId: temp.id, subscriptionId: subId } });
  await prisma.user.delete({ where: { id: temp.id } });
  expect(await prisma.favorite.count({ where: { userId: temp.id } })).toBe(0);
  const sub = await prisma.subscription.create({
    data: {
      providerId,
      name: 'Temp',
      description: 'Test',
      price: 1000,
      type: 'LUNCH',
      category: 'AFRICAN',
      duration: 'DAY',
      imageUrl: 'https://example.com/a.jpg',
    },
  });
  await prisma.favorite.create({ data: { userId: userA, subscriptionId: sub.id } });
  await prisma.subscription.delete({ where: { id: sub.id } });
  expect(await prisma.favorite.count({ where: { subscriptionId: sub.id } })).toBe(0);
});
