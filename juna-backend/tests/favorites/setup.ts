// Cette suite ne peut cibler qu'une base locale réservée aux tests de favoris.
const databaseUrl =
  process.env.FAVORITES_TEST_DATABASE_URL ||
  'postgresql://juna_test@127.0.0.1:55439/juna_favorites_test?schema=public';
const target = new URL(databaseUrl);
if (
  !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) ||
  !target.pathname.endsWith('_favorites_test')
) {
  throw new Error('Utiliser uniquement une base locale nommée *_favorites_test');
}
process.env.DATABASE_URL = databaseUrl;
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'favorites-test-access-secret';
process.env.JWT_REFRESH_SECRET = 'favorites-test-refresh-secret';
