import { Buffer } from 'buffer';

jest.mock('../../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockFsStore: Record<string, string> = {};
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///test/',
  EncodingType: { UTF8: 'utf8' },
  getInfoAsync: jest.fn(async (uri: string) => {
    const data = mockFsStore[uri];
    return data ? { exists: true, size: Buffer.byteLength(data, 'utf8') } : { exists: false };
  }),
  readAsStringAsync: jest.fn(async (uri: string) => mockFsStore[uri] ?? ''),
  writeAsStringAsync: jest.fn(async (uri: string, content: string) => {
    mockFsStore[uri] = content;
  }),
  deleteAsync: jest.fn(async (uri: string) => {
    delete mockFsStore[uri];
  }),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

jest.mock('../supabaseDb', () => ({
  supabaseDb: {
    getCharts: jest.fn(async () => []),
    getJournalEntries: jest.fn(async () => []),
    getSettings: jest.fn(async () => null),
    getRelationshipCharts: jest.fn(async () => []),
    getInsightHistory: jest.fn(async () => []),
    getSleepEntries: jest.fn(async () => []),
    getCheckIns: jest.fn(async () => []),
    clearAccountScopedData: jest.fn(async () => {}),
    saveChart: jest.fn(async () => {}),
    saveJournalEntry: jest.fn(async () => {}),
    saveRelationshipChart: jest.fn(async () => {}),
    saveInsight: jest.fn(async () => {}),
    saveSleepEntry: jest.fn(async () => {}),
    saveCheckIn: jest.fn(async () => {}),
    saveSettings: jest.fn(async () => {}),
  },
}));

jest.mock('../encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  },
}));

const asyncMap: Map<string, string> = new Map();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => asyncMap.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => asyncMap.set(key, value)),
  removeItem: jest.fn(async (key: string) => asyncMap.delete(key)),
}));

import { BackupService } from '../backupService';
import { supabaseDb } from '../supabaseDb';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const mockDb = supabaseDb as jest.Mocked<typeof supabaseDb>;
const mockSharing = Sharing as jest.Mocked<typeof Sharing>;
const mockPicker = DocumentPicker as jest.Mocked<typeof DocumentPicker>;

describe('BackupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockFsStore).forEach((key) => delete mockFsStore[key]);
    asyncMap.clear();
    (mockSharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (mockSharing.shareAsync as jest.Mock).mockResolvedValue(undefined);
    (mockPicker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: true, assets: [] });
  });

  describe('createBackupFile()', () => {
    it('creates a backup file and returns uri + filename', async () => {
      const { uri, filename } = await BackupService.createBackupFile();
      expect(uri).toContain('mysky-backup-');
      expect(filename).toMatch(/\.msky$/);
    });

    it('writes a schemaVersion 2 payload', async () => {
      const { uri } = await BackupService.createBackupFile();
      const payload = JSON.parse(mockFsStore[uri]);
      expect(payload.schemaVersion).toBe(2);
      expect(payload.exportedAt).toEqual(expect.any(String));
    });

    it('roundtrips a backup payload', async () => {
      mockDb.getCharts.mockResolvedValueOnce([
        {
          id: 'chart-1',
          name: 'Test',
          birthDate: '1990-01-01',
          birthTime: '12:00',
          hasUnknownTime: false,
          birthPlace: 'Detroit',
          latitude: 42.33,
          longitude: -83.05,
          createdAt: '2026-04-23T00:00:00Z',
          updatedAt: '2026-04-23T00:00:00Z',
          isDeleted: false,
        },
      ]);
      const { uri } = await BackupService.createBackupFile();
      await expect(BackupService.restoreFromBackupFile(uri)).resolves.not.toThrow();
    });
  });

  describe('restoreFromBackupFile()', () => {
    it('throws when file does not exist', async () => {
      await expect(BackupService.restoreFromBackupFile('file:///missing.msky')).rejects.toThrow(
        'does not exist',
      );
    });

    it('throws when file exceeds 50 MB', async () => {
      const fs = require('expo-file-system/legacy');
      (fs.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true, size: 51 * 1024 * 1024 });
      await expect(BackupService.restoreFromBackupFile('file:///big.msky')).rejects.toThrow(
        'too large',
      );
    });

    it('throws on corrupted file', async () => {
      const fs = require('expo-file-system/legacy');
      (fs.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true, size: 10 });
      (fs.readAsStringAsync as jest.Mock).mockResolvedValueOnce('NOT JSON!!!');
      await expect(BackupService.restoreFromBackupFile('file:///bad.msky')).rejects.toThrow(
        'Invalid backup file',
      );
    });

    it('throws on unsupported schemaVersion', async () => {
      const fs = require('expo-file-system/legacy');
      const bad = JSON.stringify({ schemaVersion: 1 });
      (fs.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: true, size: bad.length });
      (fs.readAsStringAsync as jest.Mock).mockResolvedValueOnce(bad);
      await expect(BackupService.restoreFromBackupFile('file:///bad.msky')).rejects.toThrow(
        'Unsupported backup format',
      );
    });
  });

  describe('shareBackupFile()', () => {
    it('calls shareAsync', async () => {
      await BackupService.shareBackupFile('file:///test.msky');
      expect(mockSharing.shareAsync).toHaveBeenCalledWith('file:///test.msky');
    });
  });

  describe('pickBackupFile()', () => {
    it('returns null when user cancels', async () => {
      expect(await BackupService.pickBackupFile()).toBeNull();
    });

    it('returns uri when a file is selected', async () => {
      (mockPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///picked.msky' }],
      });
      await expect(BackupService.pickBackupFile()).resolves.toBe('file:///picked.msky');
    });
  });
});
