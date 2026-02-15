/**
 * Field-Level Encryption at Rest — Verification Tests
 *
 * Proves that sensitive fields written through localDb CRUD methods
 * are never stored as plaintext in SQLite.
 *
 * Approach: Mock expo-sqlite to capture the raw parameters passed to
 * runAsync (INSERT/UPDATE), then assert the sensitive values carry the
 * AES-GCM encrypted prefix (ENC2:) rather than the original plaintext.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── In-memory SecureStore mock ──────────────────────────────────────────────
const secureStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => secureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    secureStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    secureStore.delete(key);
  }),
}));

// ─── expo-standard-web-crypto mock (Node.js has native crypto.subtle) ────────
jest.mock('expo-standard-web-crypto', () => {});

// ─── expo-crypto mock ────────────────────────────────────────────────────────
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
  ),
  getRandomBytes: jest.fn((size: number) => {
    // Use Node.js crypto for random bytes in tests
    const { randomBytes } = require('crypto');
    return new Uint8Array(randomBytes(size));
  }),
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  digestStringAsync: jest.fn(async (_algo: string, data: string) => {
    // Simple deterministic hash for tests
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }),
}));

// ─── Polyfill crypto.subtle for Node.js test environment ─────────────────────
import { webcrypto } from 'crypto';
if (!(globalThis as any).crypto?.subtle) {
  (globalThis as any).crypto = webcrypto;
}

// ─── Capture all SQL writes ──────────────────────────────────────────────────
const sqlWrites: Array<{ sql: string; params: any[] }> = [];

const createMockDb = () => ({
  execAsync: jest.fn(async () => {}),
  runAsync: jest.fn(async (sql: string, params: any[] = []) => {
    sqlWrites.push({ sql, params });
    return { changes: 1, lastInsertRowId: 1 };
  }),
  getFirstAsync: jest.fn(async (sql: string) => {
    if (sql.includes('PRAGMA user_version')) {
      return { user_version: 7 }; // Already at v7, skip migrations
    }
    if (sql.includes('app_settings')) {
      return { id: 'default', cloud_sync_enabled: 0, created_at: '2025-01-01', updated_at: '2025-01-01' };
    }
    if (sql.includes('migration_markers')) {
      return null;
    }
    return null;
  }),
  getAllAsync: jest.fn(async () => []),
});

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => createMockDb()),
}));

// ─── Import the modules under test AFTER mocks ──────────────────────────────
import { FieldEncryptionService } from '../fieldEncryption';
import { localDb } from '../localDb';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the last SQL INSERT/REPLACE write that matches a table name. */
function findWrite(table: string): { sql: string; params: any[] } | undefined {
  return [...sqlWrites].reverse().find(w =>
    w.sql.includes(table) && (w.sql.includes('INSERT') || w.sql.includes('REPLACE'))
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Field-level encryption at rest verification', () => {
  beforeAll(async () => {
    secureStore.clear();
    sqlWrites.length = 0;
    // Initialize encryption (creates DEK in mock SecureStore)
    await FieldEncryptionService.initialize();
    // Initialize the database
    await localDb.initialize();
  });

  beforeEach(() => {
    sqlWrites.length = 0;
  });

  test('journal_entries.content is NOT stored as plaintext in SQLite', async () => {
    const plaintext = 'Today I reflected on my inner journey and felt at peace with the stars.';

    await localDb.addJournalEntry({
      id: 'test-journal-1',
      date: '2025-06-15',
      mood: 'calm',
      moonPhase: 'full',
      title: 'Reflections',
      content: plaintext,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    });

    const write = findWrite('journal_entries');
    expect(write).toBeDefined();

    // The content parameter (index 5 in the INSERT) must NOT be plaintext
    const storedContent = write!.params[5]; // content column
    expect(storedContent).not.toBe(plaintext);
    expect(FieldEncryptionService.isEncrypted(storedContent)).toBe(true);

    // The title parameter (index 4) must also be encrypted
    const storedTitle = write!.params[4]; // title column
    expect(storedTitle).not.toBe('Reflections');
    expect(FieldEncryptionService.isEncrypted(storedTitle)).toBe(true);
  });

  test('saved_charts.birth_place is NOT stored as plaintext in SQLite', async () => {
    const birthPlace = 'Detroit, Michigan, USA';

    await localDb.upsertChart({
      id: 'test-chart-1',
      name: 'Test Chart',
      birthDate: '1990-05-15',
      birthTime: '14:30',
      hasUnknownTime: false,
      birthPlace,
      latitude: 42.33,
      longitude: -83.05,
      houseSystem: 'whole-sign',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    });

    const write = findWrite('saved_charts');
    expect(write).toBeDefined();

    // The birth_place parameter (index 5 in the INSERT) must NOT be plaintext
    const storedBirthPlace = write!.params[5]; // birth_place column
    expect(storedBirthPlace).not.toBe(birthPlace);
    expect(FieldEncryptionService.isEncrypted(storedBirthPlace)).toBe(true);
  });

  test('daily_check_ins.note is NOT stored as plaintext in SQLite', async () => {
    const note = 'Calm|Steady|At ease';

    await localDb.saveCheckIn({
      id: 'test-checkin-1',
      date: '2025-06-15',
      chartId: 'test-chart-1',
      moodScore: 7,
      energyLevel: 'medium',
      stressLevel: 'low',
      tags: [],
      note,
      wins: 'Felt grounded today',
      challenges: 'Overthinking at night',
      moonSign: 'Cancer',
      moonHouse: 4,
      sunHouse: 10,
      transitEvents: [],
      lunarPhase: 'full',
      retrogrades: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const write = findWrite('daily_check_ins');
    expect(write).toBeDefined();

    // The note param (index 7) must be encrypted
    const storedNote = write!.params[7];
    expect(storedNote).not.toBe(note);
    expect(FieldEncryptionService.isEncrypted(storedNote)).toBe(true);

    // The wins param (index 8) must be encrypted
    const storedWins = write!.params[8];
    expect(storedWins).not.toBe('Felt grounded today');
    expect(FieldEncryptionService.isEncrypted(storedWins)).toBe(true);

    // The challenges param (index 9) must be encrypted
    const storedChallenges = write!.params[9];
    expect(storedChallenges).not.toBe('Overthinking at night');
    expect(FieldEncryptionService.isEncrypted(storedChallenges)).toBe(true);
  });

  test('encrypt → decrypt round-trip preserves data', async () => {
    const original = 'The Moon in Cancer trines my natal Neptune — deep emotional clarity.';
    const encrypted = await FieldEncryptionService.encryptField(original);

    // Must be encrypted
    expect(FieldEncryptionService.isEncrypted(encrypted)).toBe(true);
    expect(encrypted).not.toBe(original);

    // Must decrypt back to original
    const decrypted = await FieldEncryptionService.decryptField(encrypted);
    expect(decrypted).toBe(original);
  });

  test('decryption with unavailable key returns safe placeholder, not raw ciphertext', async () => {
    const original = 'Sensitive content that was encrypted';
    const encrypted = await FieldEncryptionService.encryptField(original);

    // Clear the DEK cache and remove the key from SecureStore
    FieldEncryptionService.clearCache();
    secureStore.delete('field_encryption_dek');

    // Decryption should NOT return the raw encrypted string
    const result = await FieldEncryptionService.decryptField(encrypted);
    expect(result).not.toBe(encrypted);
    expect(result).toContain('Unable to access encrypted data');

    // Restore DEK for other tests
    await FieldEncryptionService.initialize();
  });

  test('plaintext values pass through decryptField unchanged', async () => {
    const plain = 'Just a regular string with no encryption prefix';
    const result = await FieldEncryptionService.decryptField(plain);
    expect(result).toBe(plain);
  });

  test('empty strings and nullish values pass through safely', async () => {
    expect(await FieldEncryptionService.encryptField('')).toBe('');
    expect(await FieldEncryptionService.decryptField('')).toBe('');
  });

  test('double-encryption is prevented', async () => {
    const original = 'Some sensitive text';
    const encrypted = await FieldEncryptionService.encryptField(original);
    const doubleEncrypted = await FieldEncryptionService.encryptField(encrypted);

    // Should return the same value (no double-encryption)
    expect(doubleEncrypted).toBe(encrypted);
  });
});
