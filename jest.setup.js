// Jest setup file for property-based testing
// Configure fast-check and other testing utilities

// Increase timeout for property-based tests
jest.setTimeout(30000);

// Mock React Native modules that aren't available in Node.js test environment
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
}));

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => {
    // Generate a UUID v4 for testing
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

// In-memory storage for SQLite mock
const mockSqliteStore = {
  charts: [],
  journal: [],
  settings: null,
  interpretations: [],
};

// Mock expo-sqlite for tests that import localDb
const createMockDb = () => ({
  execAsync: jest.fn(async () => {}),
  runAsync: jest.fn(async (sql, params) => {
    // Handle INSERT/UPDATE/DELETE
    if (sql.includes('INSERT') || sql.includes('REPLACE')) {
      return { changes: 1, lastInsertRowId: 1 };
    }
    if (sql.includes('DELETE')) {
      return { changes: 1, lastInsertRowId: 0 };
    }
    return { changes: 0, lastInsertRowId: 0 };
  }),
  getFirstAsync: jest.fn(async (sql, params) => {
    if (sql.includes('PRAGMA user_version')) {
      return { user_version: 2 };
    }
    if (sql.includes('app_settings')) {
      return mockSqliteStore.settings;
    }
    if (sql.includes('saved_charts') && params?.[0]) {
      return mockSqliteStore.charts.find(c => c.id === params[0]) || null;
    }
    if (sql.includes('journal_entries') && params?.[0]) {
      return mockSqliteStore.journal.find(j => j.id === params[0]) || null;
    }
    return null;
  }),
  getAllAsync: jest.fn(async (sql) => {
    if (sql.includes('saved_charts')) {
      return mockSqliteStore.charts.filter(c => !c.is_deleted);
    }
    if (sql.includes('journal_entries')) {
      return mockSqliteStore.journal.filter(j => !j.is_deleted);
    }
    if (sql.includes('cached_interpretations')) {
      return mockSqliteStore.interpretations;
    }
    return [];
  }),
});

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => createMockDb()),
}));