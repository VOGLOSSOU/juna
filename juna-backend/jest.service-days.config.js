module.exports = {
  preset: 'ts-jest', testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/unit/service-days.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
