// expo-secure-store is auto-mocked via moduleNameMapper → __mocks__/expo-secure-store.js

jest.mock('../../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// EncryptionManager: passthrough sign/verify so we can test consent + trim logic
// without real HMAC keys.
jest.mock('../encryptionManager', () => ({
  EncryptionManager: {
    signSensitiveData: jest.fn(async (value: any) => JSON.stringify(value)),
    verifySensitiveData: jest.fn(async (payload: any) => JSON.parse(payload)),
  },
}));

// expo-crypto: stub randomUUID and getRandomBytes
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid'),
  getRandomBytes: jest.fn(() => new Uint8Array(64).fill(0xab)),
}));

import { secureStorage } from '../secureStorage';
import { EncryptionManager } from '../encryptionManager';

// Clear SecureStore + all mocks between tests
async function resetAll() {
  jest.clearAllMocks();
  // Restore passthrough implementations after clearAllMocks
  (EncryptionManager.signSensitiveData as jest.Mock).mockImplementation(async (value: any) => JSON.stringify(value));
  (EncryptionManager.verifySensitiveData as jest.Mock).mockImplementation(async (payload: any) => JSON.parse(payload as string));
  const SecureStore = require('expo-secure-store');
  // Reset the in-memory store in the mock
  if (typeof SecureStore.__reset === 'function') {
    SecureStore.__reset();
  } else {
    // Fallback: delete all known keys
    const KEYS = [
      'secure_charts', 'secure_journal', 'secure_settings', 'secure_deleted_charts',
      'secure_deleted_journal', 'privacy_consent', 'data_processing_consent',
      'privacy_policy_version', 'lawful_basis_records', 'secure_audit_trail',
      'consent_history', 'terms_consent',
    ];
    for (const k of KEYS) {
      try { await SecureStore.deleteItemAsync(k); } catch {}
    }
  }
}

describe('SecureStorageService', () => {
  beforeEach(async () => {
    await resetAll();
  });

  // ── Consent ──────────────────────────────────────────────────────────────
  describe('hasPrivacyConsent()', () => {
    it('returns false when nothing is stored', async () => {
      expect(await secureStorage.hasPrivacyConsent()).toBe(false);
    });

    it('returns true after consent is granted', async () => {
      await secureStorage.setPrivacyConsent(true);
      expect(await secureStorage.hasPrivacyConsent()).toBe(true);
    });

    it('returns false after consent is revoked', async () => {
      await secureStorage.setPrivacyConsent(true);
      await secureStorage.setPrivacyConsent(false);
      expect(await secureStorage.hasPrivacyConsent()).toBe(false);
    });
  });

  describe('getConsentRecord()', () => {
    it('returns null before consent is set', async () => {
      expect(await secureStorage.getConsentRecord()).toBeNull();
    });

    it('returns the consent record after setPrivacyConsent()', async () => {
      await secureStorage.setPrivacyConsent(true, '2.0', 'onboarding');
      const record = await secureStorage.getConsentRecord();
      expect(record?.granted).toBe(true);
      expect(record?.version).toBe('2.0');
    });
  });

  // ── requireConsent enforcement ───────────────────────────────────────────
  describe('saveChart() — consent enforcement', () => {
    it('throws when no consent', async () => {
      const chart = { id: 'c1', name: 'Test', birthDate: '2000-01-01', birthTime: '12:00', birthPlace: 'NYC', latitude: 0, longitude: 0, timezone: 'UTC', createdAt: '', updatedAt: '', hasUnknownTime: false, isDeleted: false } as any;
      await expect(secureStorage.saveChart(chart)).rejects.toThrow('Privacy consent required');
    });

    it('saves chart after consent is granted', async () => {
      await secureStorage.setPrivacyConsent(true);
      const chart = { id: 'c1', name: 'Test', birthDate: '2000-01-01', birthTime: '12:00', birthPlace: 'NYC', latitude: 0, longitude: 0, timezone: 'UTC', createdAt: '', updatedAt: '', hasUnknownTime: false, isDeleted: false } as any;
      await expect(secureStorage.saveChart(chart)).resolves.not.toThrow();
      const charts = await secureStorage.getCharts();
      expect(charts).toHaveLength(1);
      expect(charts[0].id).toBe('c1');
    });
  });

  describe('saveJournalEntry() — consent enforcement', () => {
    it('throws when no consent', async () => {
      const entry = { id: 'e1', content: 'hello', title: 'T', chartId: 'c1', createdAt: '', updatedAt: '', tags: [], mood: null, dreamDate: null, date: '', moonPhase: 'new', isDeleted: false } as any;
      await expect(secureStorage.saveJournalEntry(entry)).rejects.toThrow('Privacy consent required');
    });
  });

  // ── getCharts empty state ────────────────────────────────────────────────
  describe('getCharts()', () => {
    it('returns empty array when nothing stored', async () => {
      expect(await secureStorage.getCharts()).toEqual([]);
    });
  });

  // ── auditDataAccess rolling cap ──────────────────────────────────────────
  describe('auditDataAccess() rolling cap at 10', () => {
    it('keeps at most 10 most-recent entries', async () => {
      // Write 15 explicit audit entries
      for (let i = 0; i < 15; i++) {
        await secureStorage.auditDataAccess(`op_${i}`);
      }
      const events = await secureStorage.getRecentSecurityEvents();
      // Rolling window caps at 10; size-trimming may reduce further — never exceeds 10
      expect(events.length).toBeGreaterThan(0);
      expect(events.length).toBeLessThanOrEqual(10);
    });
  });

  // ── HMAC failure returns null ────────────────────────────────────────────
  describe('getEncryptedItem HMAC failure', () => {
    it('returns null (not throwing) when verifySensitiveData rejects', async () => {
      // Store a valid value first
      await secureStorage.setPrivacyConsent(true);
      // Now make verify always throw to simulate tampered data
    (EncryptionManager.verifySensitiveData as jest.Mock).mockRejectedValueOnce(new Error('Bad HMAC'));
      // getConsentRecord wraps getEncryptedItem and should return null
      const record = await secureStorage.getConsentRecord();
      expect(record).toBeNull();
    });
  });

  // ── deleteAllUserData ────────────────────────────────────────────────────
  describe('deleteAllUserData()', () => {
    it('clears charts after delete', async () => {
      await secureStorage.setPrivacyConsent(true);
      const chart = { id: 'd1', name: 'Del', birthDate: '1990-01-01', birthTime: '00:00', birthPlace: 'LA', latitude: 0, longitude: 0, timezone: 'UTC', createdAt: '', updatedAt: '', hasUnknownTime: false, isDeleted: false } as any;
      await secureStorage.saveChart(chart);
      await secureStorage.deleteAllUserData();
      expect(await secureStorage.getCharts()).toEqual([]);
    });
  });

  // ── settings (no consent required) ──────────────────────────────────────
  describe('getSettings() / saveSettings()', () => {
    it('returns null before any settings are stored', async () => {
      expect(await secureStorage.getSettings()).toBeNull();
    });

    it('round-trips settings without requiring consent', async () => {
      const settings = { id: 's1', theme: 'dark' } as any;
      await secureStorage.saveSettings(settings);
      const fetched = await secureStorage.getSettings();
      expect(fetched).toMatchObject({ id: 's1', theme: 'dark' });
    });
  });
});
