/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/services', '<rootDir>/utils'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // Force-exit after all tests complete. astronomy-engine and native module
  // stubs keep the V8 isolate alive in jest workers, causing the
  // "worker process failed to exit gracefully" warning without this.
  forceExit: true,
  moduleNameMapper: {
    // Expo native packages that use ESM and cannot run in Node test environment
    '^expo-crypto$': '<rootDir>/__mocks__/expo-crypto.js',
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.js',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
  },
};
