/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/services', '<rootDir>/utils', '<rootDir>/store', '<rootDir>/lib'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // Keep force-exit available for debugging flaky environments, but do not
  // enable it by default because it produces a misleading open-handle warning.
  forceExit: process.env.JEST_FORCE_EXIT === '1',
  moduleNameMapper: {
    // Expo native packages that use ESM and cannot run in Node test environment
    '^expo-crypto$': '<rootDir>/__mocks__/expo-crypto.js',
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.js',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    // @noble/ciphers uses ESM — redirect to the CJS-compatible build
    '^@noble/ciphers/aes\\.js$': '<rootDir>/__mocks__/noble-ciphers-aes.js',
    // @noble/hashes uses ESM — redirect to CJS-compatible mocks
    '^@noble/hashes/hmac$': '<rootDir>/__mocks__/noble-hashes-hmac.js',
    '^@noble/hashes/sha2$': '<rootDir>/__mocks__/noble-hashes-sha2.js',
    '^@noble/hashes/utils$': '<rootDir>/__mocks__/noble-hashes-utils.js',
    '^@noble/hashes/pbkdf2$': '<rootDir>/__mocks__/noble-hashes-pbkdf2.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'services/**/*.ts',
    'utils/**/*.ts',
    'lib/**/*.ts',
    '!**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
