// Suite dédiée : les anciens tests référencent un tests/setup.ts absent.
module.exports = {
  ...require('./jest.config'),
  setupFilesAfterEnv: ['<rootDir>/tests/favorites/setup.ts'],
  testMatch: ['<rootDir>/tests/favorites/**/*.test.ts'],
  coverageThreshold: {},
};
