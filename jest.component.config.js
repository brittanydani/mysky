/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  watchman: false,
  roots: ['<rootDir>/components', '<rootDir>/app', '<rootDir>/context'],
  testMatch: ['**/__tests__/**/*.test.tsx'],
  setupFiles: ['<rootDir>/jest.component.setup.js'],
  moduleNameMapper: {
    '^expo-crypto$': '<rootDir>/__mocks__/expo-crypto.js',
    '^expo-sqlite$': '<rootDir>/__mocks__/expo-sqlite.js',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.js',
    '^@noble/ciphers/aes\\.js$': '<rootDir>/__mocks__/noble-ciphers-aes.js',
    '^@noble/hashes/hmac$': '<rootDir>/__mocks__/noble-hashes-hmac.js',
    '^@noble/hashes/sha2$': '<rootDir>/__mocks__/noble-hashes-sha2.js',
    '^@noble/hashes/utils$': '<rootDir>/__mocks__/noble-hashes-utils.js',
    '^@noble/hashes/pbkdf2$': '<rootDir>/__mocks__/noble-hashes-pbkdf2.js',
    '^@/(.*)$': '<rootDir>/$1',
  },
};
