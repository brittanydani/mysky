module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx'
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', { diagnostics: false }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo-sqlite|expo-crypto|expo-secure-store|expo-constants|@expo|react-native|@noble/ciphers)/)',
  ],
  moduleNameMapper: {
    '^@noble/ciphers/aes$': '@noble/ciphers/aes.js',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    '!services/**/*.d.ts',
    '!services/**/__tests__/**',
  ],
  testTimeout: 30000, // Increased timeout for property-based tests
};