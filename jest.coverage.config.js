const base = require('./jest.config');

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  ...base,
  testMatch: [
    '<rootDir>/services/auth/__tests__/**/*.test.ts',
    '<rootDir>/services/config/__tests__/**/*.test.ts',
    '<rootDir>/services/offline/__tests__/offlineQueue.test.ts',
    '<rootDir>/services/patterns/__tests__/checkInService.test.ts',
    '<rootDir>/services/premium/__tests__/purchaseWorkflow.test.ts',
    '<rootDir>/services/premium/__tests__/revenuecat.test.ts',
    '<rootDir>/services/validation/__tests__/**/*.test.ts',
    '<rootDir>/utils/__tests__/logger.test.ts',
    '<rootDir>/utils/__tests__/sentry.test.ts',
    '<rootDir>/utils/__tests__/withRetry.test.ts',
  ],
  collectCoverageFrom: [
    'services/auth/**/*.ts',
    'services/config/**/*.ts',
    'services/offline/offlineQueue.ts',
    'services/patterns/checkInService.ts',
    'services/premium/revenuecat.ts',
    'services/validation/**/*.ts',
    'utils/logger.ts',
    'utils/sentry.ts',
    'utils/withRetry.ts',
    '!**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 55,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
