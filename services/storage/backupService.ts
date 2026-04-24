// File: services/storage/backupService.ts

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { supabaseDb } from './supabaseDb';
import { EncryptedAsyncStorage } from './encryptedAsyncStorage';
import { AccountScopedAsyncStorage } from './accountScopedStorage';
import { ENCRYPTED_ASYNC_USER_DATA_KEYS, PLAIN_ASYNC_USER_DATA_KEYS } from './userDataKeys';
import type { AppSettings, SavedChart, JournalEntry, RelationshipChart, SleepEntry } from './models';
import type { SavedInsight } from './insightHistory';
import { logger } from '../../utils/logger';

type BackupPayload = {
  schemaVersion: 2;
  exportedAt: string;
  charts: SavedChart[];
  journalEntries: JournalEntry[];
  relationshipCharts: RelationshipChart[];
  insightHistory: SavedInsight[];
  sleepEntries: SleepEntry[];
  checkIns?: import('../patterns/types').DailyCheckIn[];
  settings: AppSettings | null;
  asyncStorageData?: Record<string, string>;
};

const MAX_BACKUP_SIZE = 50 * 1024 * 1024;

export class BackupService {
  static async createBackupFile(): Promise<{ uri: string; filename: string }> {
    const [charts, journalEntries, settings] = await Promise.all([
      supabaseDb.getCharts(),
      supabaseDb.getJournalEntries(),
      supabaseDb.getSettings(),
    ]);

    const relationshipCharts: RelationshipChart[] = [];
    const insightHistory: SavedInsight[] = [];
    const sleepEntries: SleepEntry[] = [];
    const checkIns: import('../patterns/types').DailyCheckIn[] = [];

    await Promise.all(charts.map(async (chart) => {
      const [rels, insights, sleep, dailyCheckIns] = await Promise.all([
        supabaseDb.getRelationshipCharts(chart.id),
        supabaseDb.getInsightHistory(chart.id),
        supabaseDb.getSleepEntries(chart.id, 10000),
        supabaseDb.getCheckIns(chart.id, 10000),
      ]);
      relationshipCharts.push(...rels);
      insightHistory.push(...insights);
      sleepEntries.push(...sleep);
      checkIns.push(...dailyCheckIns);
    }));

    const asyncStorageData: Record<string, string> = {};
    await Promise.all([
      ...ENCRYPTED_ASYNC_USER_DATA_KEYS.map(async (key) => {
        try {
          const value = await EncryptedAsyncStorage.getItem(key);
          if (value) asyncStorageData[key] = value;
        } catch (error) {
          logger.error(`[Backup] Failed to read encrypted key ${key}:`, error);
        }
      }),
      ...PLAIN_ASYNC_USER_DATA_KEYS.map(async (key) => {
        try {
          const value = await AccountScopedAsyncStorage.getItem(key);
          if (value) asyncStorageData[key] = value;
        } catch (error) {
          logger.error(`[Backup] Failed to read plain key ${key}:`, error);
        }
      }),
    ]);

    const payload: BackupPayload = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      charts,
      journalEntries,
      relationshipCharts,
      insightHistory,
      sleepEntries,
      checkIns,
      settings,
      asyncStorageData: Object.keys(asyncStorageData).length > 0 ? asyncStorageData : undefined,
    };

    const serialized = JSON.stringify(payload);
    const size = new TextEncoder().encode(serialized).length;
    if (size > MAX_BACKUP_SIZE) {
      throw new Error(
        `Backup too large (${Math.round(size / 1024 / 1024)} MB). The maximum is 50 MB.`,
      );
    }

    const filename = `mysky-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.msky`;
    const baseDir = FileSystem.documentDirectory;
    if (!baseDir) {
      throw new Error('No writable directory available for backup');
    }

    const uri = `${baseDir}${filename}`;
    await FileSystem.writeAsStringAsync(uri, serialized, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return { uri, filename };
  }

  static async restoreFromBackupFile(uri: string): Promise<void> {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Backup file does not exist');
    }
    if (fileInfo.exists && 'size' in fileInfo && (fileInfo.size as number) > MAX_BACKUP_SIZE) {
      throw new Error('Backup file is too large (max 50 MB)');
    }

    const raw = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    let payload: BackupPayload;
    try {
      payload = JSON.parse(raw) as BackupPayload;
    } catch {
      throw new Error('Invalid backup file — could not parse. The file may be corrupted.');
    }

    if (payload?.schemaVersion !== 2) {
      throw new Error('Unsupported backup format');
    }

    const hasData =
      (payload.charts?.length ?? 0) > 0 ||
      (payload.journalEntries?.length ?? 0) > 0 ||
      (payload.checkIns?.length ?? 0) > 0 ||
      payload.settings !== null;
    if (!hasData) {
      throw new Error('Backup file contains no data to restore.');
    }

    await supabaseDb.clearAccountScopedData();
    await Promise.all([
      ...ENCRYPTED_ASYNC_USER_DATA_KEYS.map((key) => EncryptedAsyncStorage.removeItem(key)),
      ...PLAIN_ASYNC_USER_DATA_KEYS.map((key) => AccountScopedAsyncStorage.removeItem(key)),
    ]);

    for (const chart of payload.charts ?? []) {
      await supabaseDb.saveChart(chart);
    }
    for (const entry of payload.journalEntries ?? []) {
      await supabaseDb.saveJournalEntry(entry);
    }
    for (const rel of payload.relationshipCharts ?? []) {
      await supabaseDb.saveRelationshipChart(rel);
    }
    for (const insight of payload.insightHistory ?? []) {
      await supabaseDb.saveInsight(insight);
    }
    for (const entry of payload.sleepEntries ?? []) {
      await supabaseDb.saveSleepEntry(entry);
    }
    for (const checkIn of payload.checkIns ?? []) {
      await supabaseDb.saveCheckIn(checkIn);
    }
    if (payload.settings) {
      await supabaseDb.saveSettings(payload.settings);
    }

    if (payload.asyncStorageData) {
      const allowedKeys = new Set<string>([
        ...(ENCRYPTED_ASYNC_USER_DATA_KEYS as readonly string[]),
        ...(PLAIN_ASYNC_USER_DATA_KEYS as readonly string[]),
      ]);
      for (const [key, value] of Object.entries(payload.asyncStorageData)) {
        if (!allowedKeys.has(key)) continue;
        try {
          if ((ENCRYPTED_ASYNC_USER_DATA_KEYS as readonly string[]).includes(key)) {
            await EncryptedAsyncStorage.setItem(key, value);
          } else {
            await AccountScopedAsyncStorage.setItem(key, value);
          }
        } catch (error) {
          logger.error(`[Restore] Failed to restore AsyncStorage key ${key}:`, error);
        }
      }
    }
  }

  static async shareBackupFile(uri: string, deleteAfter = true): Promise<void> {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      throw new Error('Sharing is not available on this device');
    }
    await Sharing.shareAsync(uri);

    if (deleteAfter) {
      await new Promise<void>((resolve) => setTimeout(resolve, 2000));
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      } catch {
        // Best-effort cleanup
      }
    }
  }

  static async cleanupBackupFile(uri: string): Promise<void> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch {
      // Best-effort cleanup
    }
  }

  static async pickBackupFile(): Promise<string | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return null;
    }

    return result.assets[0].uri;
  }
}
