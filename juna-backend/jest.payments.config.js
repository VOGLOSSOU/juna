module.exports = {
  ...require('./jest.config'),
  setupFilesAfterEnv: ['<rootDir>/tests/payments/setup.ts'],
  testMatch: ['<rootDir>/tests/payments/**/*.test.ts'],
  coverageThreshold: {},
};
