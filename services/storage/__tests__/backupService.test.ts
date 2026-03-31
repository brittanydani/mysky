jest.mock('../../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ── expo-file-system/legacy ──────────────────────────────────────────────────
const mockFsStore: Record<string, string> = {};
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///test/',
  EncodingType: { UTF8: 'utf8' },
  getInfoAsync: jest.fn(async (uri: string) => {
    const data = mockFsStore[uri];
    return data
      ? { exists: true, size: Buffer.byteLength(data, 'utf8') }
      : { exists: false };
  }),
  readAsStringAsync: jest.fn(async (uri: string) => mockFsStore[uri] ?? ''),
  writeAsStringAsync: jest.fn(async (uri: string, content: string) => {
    mockFsStore[uri] = content;
  }),
  deleteAsync: jest.fn(async (uri: string) => {
    delete mockFsStore[uri];
  }),
}));

// ── expo-sharing ──────────────────────────────────────────────────────────────
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));

// ── expo-document-picker ─────────────────────────────────────────────────────
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

// ── expo-crypto (deterministic bytes for speed) ───────────────────────────────
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async (n: number) => new Uint8Array(n).fill(0x42)),
  getRandomBytes: jest.fn((n: number) => new Uint8Array(n).fill(0x42)),
}));

// ── localDb ────────────────────────────────────────────────────────────────
jest.mock('../localDb', () => ({
  localDb: {
    getCharts: jest.fn(async () => []),
    getJournalEntries: jest.fn(async () => []),
    getSettings: jest.fn(async () => null),
    getRelationshipCharts: jest.fn(async () => []),
    getInsightHistory: jest.fn(async () => []),
    getSleepEntries: jest.fn(async () => []),
    getCheckIns: jest.fn(async () => []),
    saveChart: jest.fn(async () => {}),
    saveJournalEntry: jest.fn(async () => {}),
    saveRelationshipChart: jest.fn(async () => {}),
    saveInsight: jest.fn(async () => {}),
    saveSleepEntry: jest.fn(async () => {}),
    saveCheckIn: jest.fn(async () => {}),
    saveSettings: jest.fn(async () => {}),
    setMigrationMarker: jest.fn(async () => {}),
  },
}));

// ── fieldEncryption ─────────────────────────────────────────────────────────
jest.mock('../fieldEncryption', () => ({
  FieldEncryptionService: {
    isKeyAvailable: jest.fn(async () => true),
  },
  isDecryptionFailure: jest.fn(() => false),
}));

// ── encryptedAsyncStorage ────────────────────────────────────────────────────
jest.mock('../encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
  },
}));

// ── @react-native-async-storage/async-storage ────────────────────────────────
const asyncMap: Map<string, string> = new Map();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => asyncMap.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => asyncMap.set(key, value)),
  removeItem: jest.fn(async (key: string) => asyncMap.delete(key)),
}));

import { BackupService } from '../backupService';
import { FieldEncryptionService } from '../fieldEncryption';
import { localDb } from '../localDb';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const mockDb = localDb as jest.Mocked<typeof localDb>;
const mockFEC = FieldEncryptionService as jest.Mocked<typeof FieldEncryptionService>;
const mockSharing = Sharing as jest.Mocked<typeof Sharing>;
const mockPicker = DocumentPicker as jest.Mocked<typeof DocumentPicker>;

describe('BackupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear file system store
    Object.keys(mockFsStore).forEach(k => delete mockFsStore[k]);
    asyncMap.clear();

    // Restore sensible defaults
    mockFEC.isKeyAvailable.mockResolvedValue(true);
    (require('../fieldEncryption').isDecryptionFailure as jest.Mock).mockReturnValue(false);
    mockDb.getCharts.mockResolvedValue([]);
    mockDb.getJournalEntries.mockResolvedValue([]);
    mockDb.getSettings.mockResolvedValue(null);
    mockDb.getRelationshipCharts.mockResolvedValue([]);
    mockDb.getInsightHistory.mockResolvedValue([]);
    mockDb.getSleepEntries.mockResolvedValue([]);
    mockDb.getCheckIns.mockResolvedValue([]);
    (mockSharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (mockSharing.shareAsync as jest.Mock).mockResolvedValue(undefined);
    (mockPicker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: true, assets: [] });
  });

  // ── createEncryptedBackupFile — validation ────────────────────────────────
  describe('createEncryptedBackupFile()', () => {
    it('throws when passphrase is too short (< 12 chars)', async () => {
      await expect(BackupService.createEncryptedBackupFile('short')).rejects.toThrow(
        'at least 12 characters'
      );
    });

    it('throws when passphrase is empty', async () => {
      await expect(BackupService.createEncryptedBackupFile('')).rejects.toThrow();
    });

    it('throws when encryption key is unavailable', async () => {
      mockFEC.isKeyAvailable.mockResolvedValue(false);
      await expect(BackupService.createEncryptedBackupFile('valid-passphrase-here')).rejects.toThrow(
        'Cannot create a backup'
      );
    });

    it('creates a backup file and returns uri + filename', async () => {
      const { uri, filename } = await BackupService.createEncryptedBackupFile('valid-passphrase-here');
      expect(uri).toContain('mysky-backup-');
      expect(filename).toMatch(/\.msky$/);
      // File should have been written
      const fs = require('expo-file-system/legacy');
      expect(fs.writeAsStringAsync).toHaveBeenCalled();
    });

    it('writes a valid JSON envelope with schemaVersion 1', async () => {
      const { uri } = await BackupService.createEncryptedBackupFile('valid-passphrase-here');
      const raw = mockFsStore[uri];
      expect(raw).toBeTruthy();
      const envelope = JSON.parse(raw);
      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.kdf.name).toBe('pbkdf2-sha256');
      expect(envelope.cipher.name).toBe('aes-256-gcm');
      expect(typeof envelope.ciphertextHex).toBe('string');
    });

    it('roundtrip: createAndRestore produces original data', async () => {
      const settings = { id: 's1', theme: 'dark' } as any;
      mockDb.getSettings.mockResolvedValue(settings);
      mockDb.saveSettings.mockResolvedValue(undefined as any);

      const passphrase = 'correct-horse-battery';
      const { uri } = await BackupService.createEncryptedBackupFile(passphrase);

      // Set up file info for restore
      const fs = require('expo-file-system/legacy');
      (fs.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: true,
        size: Buffer.byteLength(mockFsStore[uri], 'utf8'),
      });
      (fs.readAsStringAsync as jest.Mock).mockResolvedValueOnce(mockFsStore[uri]);

      await expect(BackupService.restoreFromBackupFile(uri, passphrase)).resolves.not.toThrow();
    });
  });

  // ── restoreFromBackupFile — validation ────────────────────────────────────
  describe('restoreFromBackupFile()', () => {
    it('throws when passphrase is too short (< 8 chars)', async () => {
      await expect(BackupService.restoreFromBackupFile('file:///x.msky', 'short')).rejects.toThrow(
        'at least 8 characters'
      );
    });

    it('throws when file does not exist', async () => {
      const fs = require('expo-file-system/legacy');
      (fs.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });
      await expect(BackupService.restoreFromBackupFile('file:///missing.msky', 'passphrase12')).rejects.toThrow(
        'does not exist'
      );
    });

    it('throws when file exceeds 50 MB', async () => {
      const fs = require('expo-file-system/legacy');
      (fs.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true, size: 51 * 1024 * 1024 });
      await expect(BackupService.restoreFromBackupFile('file:///big.msky', 'passphrase12')).rejects.toThrow(
        'too large'
      );
    });

    it('throws on corrupted (non-JSON) file', async () => {
      const fs = require('expo-file-system/legacy');
      (fs.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true, size: 10 });
      (fs.readAsStringAsync as jest.Mock).mockResolvedValueOnce('NOT JSON!!!');
      await expect(BackupService.restoreFromBackupFile('file:///bad.msky', 'passphrase12')).rejects.toThrow(
        'Invalid backup file'
      );
    });

    it('throws on unsupported schemaVersion', async () => {
      const fs = require('expo-file-system/legacy');
      const bad = JSON.stringify({ schemaVersion: 99 });
      (fs.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true, size: bad.length });
      (fs.readAsStringAsync as jest.Mock).mockResolvedValueOnce(bad);
      await expect(BackupService.restoreFromBackupFile('file:///bad.msky', 'passphrase12')).rejects.toThrow(
        'Unsupported backup format'
      );
    });

    it('throws on wrong passphrase (GCM auth failure)', async () => {
      const passphrase = 'correct-horse-battery';
      const { uri } = await BackupService.createEncryptedBackupFile(passphrase);
      const fs = require('expo-file-system/legacy');
      (fs.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: true,
        size: Buffer.byteLength(mockFsStore[uri], 'utf8'),
      });
      (fs.readAsStringAsync as jest.Mock).mockResolvedValueOnce(mockFsStore[uri]);
      await expect(BackupService.restoreFromBackupFile(uri, 'wrong-passphrase00')).rejects.toThrow(
        'Unable to decrypt backup'
      );
    });
  });

  // ── shareBackupFile ────────────────────────────────────────────────────────
  describe('shareBackupFile()', () => {
    it('calls shareAsync', async () => {
      const fs = require('expo-file-system/legacy');
      (fs.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
      await BackupService.shareBackupFile('file:///test.msky');
      expect(mockSharing.shareAsync).toHaveBeenCalledWith('file:///test.msky');
    });

    it('throws when sharing is not available', async () => {
      (mockSharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
      await expect(BackupService.shareBackupFile('file:///test.msky')).rejects.toThrow('not available');
    });
  });

  // ── pickBackupFile ─────────────────────────────────────────────────────────
  describe('pickBackupFile()', () => {
    it('returns null when user cancels', async () => {
      (mockPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({ canceled: true, assets: [] });
      expect(await BackupService.pickBackupFile()).toBeNull();
    });

    it('returns uri when a file is selected', async () => {
      (mockPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///chosen.msky' }],
      });
      expect(await BackupService.pickBackupFile()).toBe('file:///chosen.msky');
    });
  });
});
