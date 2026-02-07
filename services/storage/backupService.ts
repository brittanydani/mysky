import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha2';
import { gcm } from '@noble/ciphers/aes';

import { localDb } from './localDb';
import { secureStorage } from './secureStorage';
import type { AppSettings, SavedChart, JournalEntry } from './models';

type BackupPayload = {
  schemaVersion: 1;
  exportedAt: string;
  charts: SavedChart[];
  journalEntries: JournalEntry[];
  settings: AppSettings | null;
};

type BackupEnvelope = {
  schemaVersion: 1;
  kdf: {
    name: 'pbkdf2-sha256';
    iterations: number;
    saltHex: string;
    keyLen: number;
  };
  cipher: {
    name: 'aes-256-gcm';
    ivHex: string;
  };
  ciphertextHex: string;
  createdAt: string;
};

const KDF_ITERATIONS = 100_000;
const KEY_LEN = 32;

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const fromHex = (hex: string): Uint8Array => {
  if (!hex || hex.length % 2 !== 0) {
    throw new Error('Invalid hex payload');
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return out;
};

const encodeUtf8 = (value: string): Uint8Array => new TextEncoder().encode(value);
const decodeUtf8 = (value: Uint8Array): string => new TextDecoder().decode(value);

const deriveKey = (passphrase: string, salt: Uint8Array): Uint8Array => {
  return pbkdf2(sha256, passphrase, salt, { c: KDF_ITERATIONS, dkLen: KEY_LEN });
};

export class BackupService {
  static async createEncryptedBackupFile(passphrase: string): Promise<{ uri: string; filename: string }> {
    if (!passphrase || passphrase.trim().length < 8) {
      throw new Error('Passphrase must be at least 8 characters long');
    }

    const [charts, journalEntries, settings] = await Promise.all([
      localDb.getCharts(),
      localDb.getJournalEntries(),
      localDb.getSettings(),
    ]);

    const payload: BackupPayload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      charts,
      journalEntries,
      settings,
    };

    const plaintext = encodeUtf8(JSON.stringify(payload));
    const salt = await Crypto.getRandomBytesAsync(16);
    const iv = await Crypto.getRandomBytesAsync(12);
    const key = deriveKey(passphrase, salt);

    const cipher = gcm(key, iv);
    const ciphertext = cipher.encrypt(plaintext);

    const envelope: BackupEnvelope = {
      schemaVersion: 1,
      kdf: {
        name: 'pbkdf2-sha256',
        iterations: KDF_ITERATIONS,
        saltHex: toHex(salt),
        keyLen: KEY_LEN,
      },
      cipher: {
        name: 'aes-256-gcm',
        ivHex: toHex(iv),
      },
      ciphertextHex: toHex(ciphertext),
      createdAt: new Date().toISOString(),
    };

    const filename = `mysky-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.msky`;
    const uri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(envelope), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return { uri, filename };
  }

  static async restoreFromBackupFile(uri: string, passphrase: string): Promise<void> {
    if (!passphrase || passphrase.trim().length < 8) {
      throw new Error('Passphrase must be at least 8 characters long');
    }

    const raw = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const envelope = JSON.parse(raw) as BackupEnvelope;

    if (envelope?.schemaVersion !== 1) {
      throw new Error('Unsupported backup format');
    }

    const salt = fromHex(envelope.kdf.saltHex);
    const iv = fromHex(envelope.cipher.ivHex);
    const ciphertext = fromHex(envelope.ciphertextHex);
    const key = deriveKey(passphrase, salt);

    const cipher = gcm(key, iv);
    const plaintextBytes = cipher.decrypt(ciphertext);
    const payload = JSON.parse(decodeUtf8(plaintextBytes)) as BackupPayload;

    if (payload?.schemaVersion !== 1) {
      throw new Error('Invalid backup contents');
    }

    await secureStorage.clearContentData();

    for (const chart of payload.charts ?? []) {
      await localDb.saveChart(chart);
    }
    for (const entry of payload.journalEntries ?? []) {
      await localDb.saveJournalEntry(entry);
    }
    if (payload.settings) {
      await localDb.saveSettings(payload.settings);
    }
  }

  static async shareBackupFile(uri: string): Promise<void> {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      throw new Error('Sharing is not available on this device');
    }
    await Sharing.shareAsync(uri);
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
