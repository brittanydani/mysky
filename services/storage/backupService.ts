// File: services/storage/backupService.ts

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';

// Polyfill WebCrypto (crypto.subtle) for Expo
import 'expo-standard-web-crypto';

import { localDb } from './localDb';
import { secureStorage } from './secureStorage';
import type { AppSettings, SavedChart, JournalEntry } from './models';

/* ============================================================================
 * Types
 * ============================================================================
 */

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

/* ============================================================================
 * Constants
 * ============================================================================
 */

const KDF_ITERATIONS = 100_000;
const KEY_LEN = 32; // bytes (AES-256)
const SALT_LEN = 16;
const IV_LEN = 12;

/* ============================================================================
 * Encoding helpers
 * ============================================================================
 */

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

const encodeUtf8 = (value: string): Uint8Array =>
  new TextEncoder().encode(value);

const decodeUtf8 = (value: Uint8Array): string =>
  new TextDecoder().decode(value);

/* ============================================================================
 * WebCrypto helpers (TS-safe)
 * ============================================================================
 */

type SubtleLike = {
  importKey: (...args: any[]) => Promise<any>;
  deriveKey: (...args: any[]) => Promise<any>;
  encrypt: (...args: any[]) => Promise<ArrayBuffer>;
  decrypt: (...args: any[]) => Promise<ArrayBuffer>;
};

function getSubtle(): SubtleLike {
  const cryptoObj = (globalThis as any)?.crypto;
  const subtle = cryptoObj?.subtle as SubtleLike | undefined;

  if (!subtle) {
    throw new Error(
      'WebCrypto (crypto.subtle) is not available. Ensure expo-standard-web-crypto is installed and imported.'
    );
  }
  return subtle;
}

/**
 * IMPORTANT:
 * We must COPY bytes into a fresh ArrayBuffer to avoid
 * ArrayBuffer | SharedArrayBuffer TypeScript errors.
 */
function u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(u8.byteLength);
  copy.set(u8);
  return copy.buffer;
}

function arrayBufferToU8(buf: ArrayBuffer | SharedArrayBuffer): Uint8Array {
  return new Uint8Array(buf as ArrayBuffer);
}

/* ============================================================================
 * Crypto primitives
 * ============================================================================
 */

async function deriveAesKeyPBKDF2(
  passphrase: string,
  salt: Uint8Array
): Promise<any> {
  const subtle = getSubtle();

  const passBytes = encodeUtf8(passphrase);

  const baseKey = await subtle.importKey(
    'raw',
    u8ToArrayBuffer(passBytes),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: u8ToArrayBuffer(salt),
      iterations: KDF_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptAesGcm(
  plaintext: Uint8Array,
  key: any,
  iv: Uint8Array
): Promise<Uint8Array> {
  const subtle = getSubtle();
  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv: u8ToArrayBuffer(iv) },
    key,
    u8ToArrayBuffer(plaintext)
  );
  return arrayBufferToU8(ciphertext);
}

async function decryptAesGcm(
  ciphertext: Uint8Array,
  key: any,
  iv: Uint8Array
): Promise<Uint8Array> {
  const subtle = getSubtle();
  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv: u8ToArrayBuffer(iv) },
    key,
    u8ToArrayBuffer(ciphertext)
  );
  return arrayBufferToU8(plaintext);
}

/* ============================================================================
 * Backup Service
 * ============================================================================
 */

export class BackupService {
  static async createEncryptedBackupFile(
    passphrase: string
  ): Promise<{ uri: string; filename: string }> {
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

    const salt = await Crypto.getRandomBytesAsync(SALT_LEN);
    const iv = await Crypto.getRandomBytesAsync(IV_LEN);

    const key = await deriveAesKeyPBKDF2(passphrase, salt);
    const ciphertext = await encryptAesGcm(plaintext, key, iv);

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

    const filename = `mysky-backup-${new Date()
      .toISOString()
      .replace(/[:.]/g, '-')}.msky`;

    const baseDir =
      FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

    if (!baseDir) {
      throw new Error('No writable directory available for backup');
    }

    const uri = `${baseDir}${filename}`;

    await FileSystem.writeAsStringAsync(uri, JSON.stringify(envelope), {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return { uri, filename };
  }

  static async restoreFromBackupFile(
    uri: string,
    passphrase: string
  ): Promise<void> {
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

    if (
      envelope.kdf.name !== 'pbkdf2-sha256' ||
      envelope.cipher.name !== 'aes-256-gcm'
    ) {
      throw new Error('Unsupported encryption parameters');
    }

    const salt = fromHex(envelope.kdf.saltHex);
    const iv = fromHex(envelope.cipher.ivHex);
    const ciphertext = fromHex(envelope.ciphertextHex);

    const key = await deriveAesKeyPBKDF2(passphrase, salt);

    let plaintextBytes: Uint8Array;
    try {
      plaintextBytes = await decryptAesGcm(ciphertext, key, iv);
    } catch {
      throw new Error(
        'Unable to decrypt backup. Passphrase may be incorrect or file corrupted.'
      );
    }

    const payload = JSON.parse(
      decodeUtf8(plaintextBytes)
    ) as BackupPayload;

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

    await localDb.setMigrationMarker('data_migration_completed');
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
