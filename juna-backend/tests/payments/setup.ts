// Never load the project's database for financial integration tests.
const paymentTestUrl =
  process.env.PAYMENTS_TEST_DATABASE_URL ||
  'postgresql://juna_payment_test@127.0.0.1:55441/juna_payments_test?schema=public';
const paymentTestTarget = new URL(paymentTestUrl);
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(paymentTestTarget.hostname) ||
  !paymentTestTarget.pathname.endsWith('_payments_test')
) {
  throw new Error('Payment tests require a local database named *_payments_test');
}
process.env.DATABASE_URL = paymentTestUrl;
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'payment-test-access-secret';
process.env.JWT_REFRESH_SECRET = 'payment-test-refresh-secret';
process.env.FEEXPAY_API_TOKEN = 'test_not_a_real_key';
process.env.FEEXPAY_SHOP_ID = 'test_shop';

process.env.FEEXPAY_WEBHOOK_SECRET = 'test_webhook_secret';
