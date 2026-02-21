// File: services/storage/localDb.ts

import * as SQLite from 'expo-sqlite';
import { SavedChart, JournalEntry, AppSettings, RelationshipChart } from './models';
import { SavedInsight } from './insightHistory';
import { DailyCheckIn } from '../patterns/types';
import { logger } from '../../utils/logger';
import { FieldEncryptionService } from './fieldEncryption';

const CURRENT_DB_VERSION = 14;

class LocalDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  // ✅ NEW: tracks in-flight init so multiple callers don't race
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize DB once. Safe to call multiple times.
   */
  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        this.db = await SQLite.openDatabaseAsync('mysky.db');
        // Initialize field encryption DEK (creates key on first run)
        await FieldEncryptionService.initialize();
        await this.handleMigrations();
      } catch (error) {
        // Reset so next call can retry instead of being permanently bricked
        this.db = null;
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /** Returns the initialized DB handle. Services outside localDb should use this instead of opening SQLite directly. */
  async getDb(): Promise<SQLite.SQLiteDatabase> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] getDb() called (ready)');
    return db;
  }

  /** Ensures DB is initialized before any query runs. Prevents "Database not initialized" across the app. */
  private async ensureReady(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  private async handleMigrations(): Promise<void> {
    const db = await this.ensureReady();

    const result = await db.getFirstAsync('PRAGMA user_version');
    const currentVersion = (result as any)?.user_version || 0;

    logger.info(`[LocalDB] Current version: ${currentVersion}, Target version: ${CURRENT_DB_VERSION}`);

    if (currentVersion < CURRENT_DB_VERSION) {
      await this.runMigrations(currentVersion);
      await db.execAsync(`PRAGMA user_version = ${CURRENT_DB_VERSION}`);
      logger.info(`[LocalDB] Migrated to version ${CURRENT_DB_VERSION}`);
    }

    // Defensive repairs for columns that may be missing even on higher user_version databases
    await this.ensureTimezoneColumn();
    await this.ensureLastBackupAtColumn();
  }

  private async ensureTimezoneColumn(): Promise<void> {
    const db = await this.ensureReady();
    const info = (await db.getAllAsync('PRAGMA table_info(saved_charts)')) as any[];
    const columns = info.map((col) => col.name);
    if (!columns.includes('timezone')) {
      await db.execAsync('ALTER TABLE saved_charts ADD COLUMN timezone TEXT;');
      logger.info('[LocalDB] Defensive repair: added missing timezone column to saved_charts');
    }
  }

  private async ensureLastBackupAtColumn(): Promise<void> {
    const db = await this.ensureReady();

    // Ensure app_settings exists (for edge cases / partial schemas)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        cloud_sync_enabled INTEGER NOT NULL DEFAULT 0,
        last_sync_at TEXT,
        last_backup_at TEXT,
        user_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    const info = (await db.getAllAsync('PRAGMA table_info(app_settings)')) as any[];
    const columns = info.map((col) => col.name);
    if (!columns.includes('last_backup_at')) {
      await db.execAsync('ALTER TABLE app_settings ADD COLUMN last_backup_at TEXT;');
      logger.info('[LocalDB] Defensive repair: added missing last_backup_at column to app_settings');
    }
  }

  private async runMigrations(fromVersion: number): Promise<void> {
    await this.ensureReady();

    if (fromVersion < 1) {
      await this.createInitialSchema();
    }

    if (fromVersion < 2) {
      await this.migrateToVersion2();
    }

    if (fromVersion < 3) {
      await this.migrateToVersion3();
    }

    if (fromVersion < 4) {
      await this.migrateToVersion4();
    }

    if (fromVersion < 5) {
      await this.migrateToVersion5();
    }

    if (fromVersion < 6) {
      await this.migrateToVersion6();
    }

    if (fromVersion < 7) {
      await this.migrateToVersion7();
    }

    if (fromVersion < 8) {
      await this.migrateToVersion8();
    }

    if (fromVersion < 9) {
      await this.migrateToVersion9();
    }

    if (fromVersion < 10) {
      await this.migrateToVersion10();
    }

    if (fromVersion < 11) {
      await this.migrateToVersion11();
    }

    if (fromVersion < 12) {
      await this.migrateToVersion12();
    }

    if (fromVersion < 13) {
      await this.migrateToVersion13();
    }

    if (fromVersion < 14) {
      await this.migrateToVersion14();
    }
  }

  private async createInitialSchema(): Promise<void> {
    const db = await this.ensureReady();

    logger.info('[LocalDB] Creating initial schema...');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS saved_charts (
        id TEXT PRIMARY KEY,
        name TEXT,
        birth_date TEXT NOT NULL,
        birth_time TEXT,
        has_unknown_time INTEGER NOT NULL DEFAULT 0,
        birth_place TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timezone TEXT,
        house_system TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        mood TEXT NOT NULL CHECK (mood IN ('calm', 'soft', 'okay', 'heavy', 'stormy')),
        moon_phase TEXT NOT NULL CHECK (moon_phase IN ('new', 'waxing', 'full', 'waning')),
        title TEXT,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );
    `);

    // ✅ FIXED: correct SQL + includes last_backup_at
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        cloud_sync_enabled INTEGER NOT NULL DEFAULT 0,
        last_sync_at TEXT,
        last_backup_at TEXT,
        user_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS migration_markers (
        key TEXT PRIMARY KEY,
        completed_at TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cached_interpretations (
        id TEXT PRIMARY KEY,
        chart_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (chart_id) REFERENCES saved_charts (id)
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_saved_charts_updated_at ON saved_charts(updated_at);
      CREATE INDEX IF NOT EXISTS idx_saved_charts_is_deleted ON saved_charts(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_updated_at ON journal_entries(updated_at);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_is_deleted ON journal_entries(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_cached_interpretations_chart_id ON cached_interpretations(chart_id);
    `);

    const settings = await this.getSettings();
    if (!settings) {
      await this.updateSettings({
        id: 'default',
        cloudSyncEnabled: false,
        lastBackupAt: null as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as AppSettings);
    }

    logger.info('[LocalDB] Initial schema created successfully');
  }

  private async migrateToVersion2(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 2...');

    try {
      const tableInfo = await db.getAllAsync('PRAGMA table_info(saved_charts)');
      const hasHouseSystem = (tableInfo as any[]).some((col) => col.name === 'house_system');

      if (!hasHouseSystem) {
        await db.execAsync(`ALTER TABLE saved_charts ADD COLUMN house_system TEXT;`);
        logger.info('[LocalDB] Added house_system column');
      } else {
        logger.info('[LocalDB] house_system column already exists, skipping');
      }
    } catch (error) {
      logger.warn('[LocalDB] Version 2 migration skipped - column may already exist', error);
    }
  }

  private async migrateToVersion3(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 3 (insight history)...');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS insight_history (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        chart_id TEXT NOT NULL,
        greeting TEXT NOT NULL,
        love_headline TEXT NOT NULL,
        love_message TEXT NOT NULL,
        energy_headline TEXT NOT NULL,
        energy_message TEXT NOT NULL,
        growth_headline TEXT NOT NULL,
        growth_message TEXT NOT NULL,
        gentle_reminder TEXT NOT NULL,
        journal_prompt TEXT NOT NULL,
        moon_sign TEXT,
        moon_phase TEXT,
        signals TEXT,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        viewed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(date, chart_id)
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_insight_history_date ON insight_history(date);
      CREATE INDEX IF NOT EXISTS idx_insight_history_chart_id ON insight_history(chart_id);
      CREATE INDEX IF NOT EXISTS idx_insight_history_favorite ON insight_history(is_favorite);
    `);

    logger.info('[LocalDB] Version 3 migration complete');
  }

  private async migrateToVersion4(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 4 (relationship charts)...');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS relationship_charts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        birth_time TEXT,
        has_unknown_time INTEGER NOT NULL DEFAULT 0,
        birth_place TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timezone TEXT,
        user_chart_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        deleted_at TEXT,
        FOREIGN KEY (user_chart_id) REFERENCES saved_charts (id)
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_relationship_charts_user ON relationship_charts(user_chart_id);
      CREATE INDEX IF NOT EXISTS idx_relationship_charts_deleted ON relationship_charts(is_deleted);
    `);

    logger.info('[LocalDB] Version 4 migration complete');
  }

  // ═══════════════════════════════════════════════════
  // Migration v5: Daily Check-Ins
  // ═══════════════════════════════════════════════════
  private async migrateToVersion5(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 5 (daily check-ins)...');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_check_ins (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        chart_id TEXT NOT NULL,
        mood_score INTEGER NOT NULL,
        energy_level TEXT NOT NULL,
        stress_level TEXT NOT NULL,
        tags TEXT NOT NULL,
        note TEXT,
        wins TEXT,
        challenges TEXT,
        moon_sign TEXT,
        moon_house INTEGER,
        sun_house INTEGER,
        transit_events TEXT,
        lunar_phase TEXT,
        retrogrades TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(date, chart_id)
      );
    `);

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_check_ins_date ON daily_check_ins(date);
      CREATE INDEX IF NOT EXISTS idx_check_ins_chart ON daily_check_ins(chart_id);
      CREATE INDEX IF NOT EXISTS idx_check_ins_mood ON daily_check_ins(mood_score);
    `);

    logger.info('[LocalDB] Version 5 migration complete');
  }

  private async migrateToVersion6(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 6 (migration markers)...');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS migration_markers (
        key TEXT PRIMARY KEY,
        completed_at TEXT NOT NULL
      );
    `);

    logger.info('[LocalDB] Version 6 migration complete');
  }

  // ═══════════════════════════════════════════════════
  // Migration v7: Encrypt sensitive fields at rest
  // Idempotent: safe to re-run; uses migration marker + ENC prefix check.
  // ═══════════════════════════════════════════════════
  private async migrateToVersion7(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 7 (field encryption at rest)...');

    // Idempotency: skip if already completed
    const markerKey = 'v7_field_encryption';
    try {
      const alreadyDone = await db.getFirstAsync(
        'SELECT key FROM migration_markers WHERE key = ?',
        [markerKey]
      );
      if (alreadyDone) {
        logger.info('[LocalDB] v7 migration already completed (marker found), skipping');
        return;
      }
    } catch {
      // migration_markers table may not exist yet in edge cases; continue
    }

    let encrypted = 0;
    let failures = 0;

    // 1. Encrypt saved_charts.birth_place
    try {
      const charts = (await db.getAllAsync(
        'SELECT id, birth_place FROM saved_charts WHERE birth_place IS NOT NULL'
      )) as any[];
      for (const row of charts) {
        try {
          if (row.birth_place && !FieldEncryptionService.isEncrypted(row.birth_place)) {
            const enc = await FieldEncryptionService.encryptField(row.birth_place);
            await db.runAsync('UPDATE saved_charts SET birth_place = ? WHERE id = ?', [enc, row.id]);
            encrypted++;
          }
        } catch {
          failures++;
          logger.error(`[LocalDB] v7: failed to encrypt saved_charts row ${row.id}`);
        }
      }
    } catch (e) {
      logger.error('[LocalDB] v7: failed to encrypt saved_charts.birth_place', e);
    }

    // 2. Encrypt journal_entries.content and title
    try {
      const entries = (await db.getAllAsync(
        'SELECT id, content, title FROM journal_entries WHERE content IS NOT NULL'
      )) as any[];
      for (const row of entries) {
        try {
          const updates: string[] = [];
          const params: any[] = [];
          if (row.content && !FieldEncryptionService.isEncrypted(row.content)) {
            updates.push('content = ?');
            params.push(await FieldEncryptionService.encryptField(row.content));
            encrypted++;
          }
          if (row.title && !FieldEncryptionService.isEncrypted(row.title)) {
            updates.push('title = ?');
            params.push(await FieldEncryptionService.encryptField(row.title));
            encrypted++;
          }
          if (updates.length > 0) {
            params.push(row.id);
            await db.runAsync(`UPDATE journal_entries SET ${updates.join(', ')} WHERE id = ?`, params);
          }
        } catch {
          failures++;
          logger.error(`[LocalDB] v7: failed to encrypt journal_entries row ${row.id}`);
        }
      }
    } catch (e) {
      logger.error('[LocalDB] v7: failed to encrypt journal_entries', e);
    }

    // 3. Encrypt relationship_charts.birth_place
    try {
      const rels = (await db.getAllAsync(
        'SELECT id, birth_place FROM relationship_charts WHERE birth_place IS NOT NULL'
      )) as any[];
      for (const row of rels) {
        try {
          if (row.birth_place && !FieldEncryptionService.isEncrypted(row.birth_place)) {
            const enc = await FieldEncryptionService.encryptField(row.birth_place);
            await db.runAsync('UPDATE relationship_charts SET birth_place = ? WHERE id = ?', [
              enc,
              row.id,
            ]);
            encrypted++;
          }
        } catch {
          failures++;
          logger.error(`[LocalDB] v7: failed to encrypt relationship_charts row ${row.id}`);
        }
      }
    } catch (e) {
      logger.error('[LocalDB] v7: failed to encrypt relationship_charts.birth_place', e);
    }

    // 4. Encrypt daily_check_ins.note, wins, challenges
    try {
      const checkins = (await db.getAllAsync(
        'SELECT id, note, wins, challenges FROM daily_check_ins'
      )) as any[];
      for (const row of checkins) {
        try {
          const updates: string[] = [];
          const params: any[] = [];
          if (row.note && !FieldEncryptionService.isEncrypted(row.note)) {
            updates.push('note = ?');
            params.push(await FieldEncryptionService.encryptField(row.note));
            encrypted++;
          }
          if (row.wins && !FieldEncryptionService.isEncrypted(row.wins)) {
            updates.push('wins = ?');
            params.push(await FieldEncryptionService.encryptField(row.wins));
            encrypted++;
          }
          if (row.challenges && !FieldEncryptionService.isEncrypted(row.challenges)) {
            updates.push('challenges = ?');
            params.push(await FieldEncryptionService.encryptField(row.challenges));
            encrypted++;
          }
          if (updates.length > 0) {
            params.push(row.id);
            await db.runAsync(`UPDATE daily_check_ins SET ${updates.join(', ')} WHERE id = ?`, params);
          }
        } catch {
          failures++;
          logger.error(`[LocalDB] v7: failed to encrypt daily_check_ins row ${row.id}`);
        }
      }
    } catch (e) {
      logger.error('[LocalDB] v7: failed to encrypt daily_check_ins', e);
    }

    // Set idempotency marker so this migration won't re-run
    try {
      await db.runAsync(
        'INSERT OR REPLACE INTO migration_markers (key, completed_at) VALUES (?, ?)',
        [markerKey, new Date().toISOString()]
      );
    } catch {
      // Non-fatal: marker table may not exist in edge cases
    }

    if (failures > 0) {
      logger.warn(
        `[LocalDB] Version 7 migration completed with ${failures} row failures — encrypted ${encrypted} fields`
      );
    } else {
      logger.info(`[LocalDB] Version 7 migration complete — encrypted ${encrypted} fields`);
    }
  }

  // ═══════════════════════════════════════════════════
  // Migration v8: Add chart_id + transit_snapshot to journal_entries
  // Idempotent: checks PRAGMA table_info before ALTER.
  // ═══════════════════════════════════════════════════
  private async migrateToVersion8(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 8 (journal transit snapshot)...');

    const tableInfo = (await db.getAllAsync('PRAGMA table_info(journal_entries)')) as any[];
    const columns = tableInfo.map((col) => col.name);

    if (!columns.includes('chart_id')) {
      await db.execAsync('ALTER TABLE journal_entries ADD COLUMN chart_id TEXT;');
      logger.info('[LocalDB] Added chart_id column to journal_entries');
    }

    if (!columns.includes('transit_snapshot')) {
      await db.execAsync('ALTER TABLE journal_entries ADD COLUMN transit_snapshot TEXT;');
      logger.info('[LocalDB] Added transit_snapshot column to journal_entries');
    }

    logger.info('[LocalDB] Version 8 migration complete');
  }

  // ═══════════════════════════════════════════════════
  // Migration v9: Add last_backup_at to app_settings, timezone to saved_charts
  // Idempotent: checks PRAGMA table_info before ALTER.
  // ═══════════════════════════════════════════════════
  private async migrateToVersion9(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 9 (last_backup_at + timezone)...');

    // Add last_backup_at to app_settings
    const settingsInfo = (await db.getAllAsync('PRAGMA table_info(app_settings)')) as any[];
    const settingsColumns = settingsInfo.map((col) => col.name);
    if (!settingsColumns.includes('last_backup_at')) {
      await db.execAsync('ALTER TABLE app_settings ADD COLUMN last_backup_at TEXT;');
      logger.info('[LocalDB] Added last_backup_at column to app_settings');
    }

    // Add timezone to saved_charts
    const chartsInfo = (await db.getAllAsync('PRAGMA table_info(saved_charts)')) as any[];
    const chartsColumns = chartsInfo.map((col) => col.name);
    if (!chartsColumns.includes('timezone')) {
      await db.execAsync('ALTER TABLE saved_charts ADD COLUMN timezone TEXT;');
      logger.info('[LocalDB] Added timezone column to saved_charts');
    }

    logger.info('[LocalDB] Version 9 migration complete');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Migration v10: Add journal NLP summary columns
  // Idempotent: checks PRAGMA table_info before ALTER.
  // ═══════════════════════════════════════════════════════════════════════════
  private async migrateToVersion10(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 10 (journal NLP summaries)...');

    const tableInfo = (await db.getAllAsync('PRAGMA table_info(journal_entries)')) as any[];
    const columns = tableInfo.map((col) => col.name);

    if (!columns.includes('content_keywords_enc')) {
      await db.execAsync('ALTER TABLE journal_entries ADD COLUMN content_keywords_enc TEXT;');
      logger.info('[LocalDB] Added content_keywords_enc column to journal_entries');
    }

    if (!columns.includes('content_emotions_enc')) {
      await db.execAsync('ALTER TABLE journal_entries ADD COLUMN content_emotions_enc TEXT;');
      logger.info('[LocalDB] Added content_emotions_enc column to journal_entries');
    }

    if (!columns.includes('content_sentiment_enc')) {
      await db.execAsync('ALTER TABLE journal_entries ADD COLUMN content_sentiment_enc TEXT;');
      logger.info('[LocalDB] Added content_sentiment_enc column to journal_entries');
    }

    if (!columns.includes('content_word_count')) {
      await db.execAsync('ALTER TABLE journal_entries ADD COLUMN content_word_count INTEGER;');
      logger.info('[LocalDB] Added content_word_count column to journal_entries');
    }

    if (!columns.includes('content_reading_minutes')) {
      await db.execAsync('ALTER TABLE journal_entries ADD COLUMN content_reading_minutes REAL;');
      logger.info('[LocalDB] Added content_reading_minutes column to journal_entries');
    }

    logger.info('[LocalDB] Version 10 migration complete');
  }

  /**
   * Version 11 — Encrypt existing plaintext PII fields.
   * Encrypts name, birth_date, and birth_time in saved_charts and relationship_charts
   * for rows that haven't been encrypted yet (i.e., not already prefixed with ENC2: or ENC:).
   */
  private async migrateToVersion11(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Starting version 11 migration — encrypting PII fields...');

    // Encrypt saved_charts PII
    const charts = (await db.getAllAsync('SELECT id, name, birth_date, birth_time FROM saved_charts')) as any[];
    for (const row of charts) {
      const updates: string[] = [];
      const values: any[] = [];

      if (row.name && !FieldEncryptionService.isEncrypted(row.name)) {
        updates.push('name = ?');
        values.push(await FieldEncryptionService.encryptField(row.name));
      }
      if (row.birth_date && !FieldEncryptionService.isEncrypted(row.birth_date)) {
        updates.push('birth_date = ?');
        values.push(await FieldEncryptionService.encryptField(row.birth_date));
      }
      if (row.birth_time && !FieldEncryptionService.isEncrypted(row.birth_time)) {
        updates.push('birth_time = ?');
        values.push(await FieldEncryptionService.encryptField(row.birth_time));
      }

      if (updates.length > 0) {
        values.push(row.id);
        await db.runAsync(`UPDATE saved_charts SET ${updates.join(', ')} WHERE id = ?`, values);
      }
    }
    logger.info(`[LocalDB] Encrypted PII for ${charts.length} saved charts`);

    // Encrypt relationship_charts PII
    const rels = (await db.getAllAsync('SELECT id, name, birth_date, birth_time FROM relationship_charts')) as any[];
    for (const row of rels) {
      const updates: string[] = [];
      const values: any[] = [];

      if (row.name && !FieldEncryptionService.isEncrypted(row.name)) {
        updates.push('name = ?');
        values.push(await FieldEncryptionService.encryptField(row.name));
      }
      if (row.birth_date && !FieldEncryptionService.isEncrypted(row.birth_date)) {
        updates.push('birth_date = ?');
        values.push(await FieldEncryptionService.encryptField(row.birth_date));
      }
      if (row.birth_time && !FieldEncryptionService.isEncrypted(row.birth_time)) {
        updates.push('birth_time = ?');
        values.push(await FieldEncryptionService.encryptField(row.birth_time));
      }

      if (updates.length > 0) {
        values.push(row.id);
        await db.runAsync(`UPDATE relationship_charts SET ${updates.join(', ')} WHERE id = ?`, values);
      }
    }
    logger.info(`[LocalDB] Encrypted PII for ${rels.length} relationship charts`);

    logger.info('[LocalDB] Version 11 migration complete');
  }

  /**
   * Version 12 — Add time_of_day column for multi-check-ins per day.
   * Users can now check in up to 4 times per day: morning, afternoon, evening, night.
   * Changes UNIQUE constraint from (date, chart_id) to (date, chart_id, time_of_day).
   */
  private async migrateToVersion12(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Starting version 12 migration — adding time_of_day for multi check-ins...');

    // Add time_of_day column with default 'morning' for existing rows
    try {
      await db.execAsync(`ALTER TABLE daily_check_ins ADD COLUMN time_of_day TEXT NOT NULL DEFAULT 'morning'`);
    } catch (e: any) {
      // Column may already exist if migration ran partially
      if (!e.message?.includes('duplicate column')) throw e;
    }

    // Backfill existing check-ins with the correct time_of_day based on created_at hour
    const existing = (await db.getAllAsync('SELECT id, created_at FROM daily_check_ins')) as any[];
    for (const row of existing) {
      let tod = 'morning';
      if (row.created_at) {
        const h = new Date(row.created_at).getHours();
        if (h >= 5 && h < 12) tod = 'morning';
        else if (h >= 12 && h < 17) tod = 'afternoon';
        else if (h >= 17 && h < 21) tod = 'evening';
        else tod = 'night';
      }
      await db.runAsync('UPDATE daily_check_ins SET time_of_day = ? WHERE id = ?', [tod, row.id]);
    }

    // Rebuild table to replace UNIQUE(date, chart_id) with UNIQUE(date, chart_id, time_of_day)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_check_ins_v12 (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        chart_id TEXT NOT NULL,
        time_of_day TEXT NOT NULL DEFAULT 'morning',
        mood_score REAL NOT NULL,
        energy_level TEXT NOT NULL,
        stress_level TEXT NOT NULL,
        tags TEXT,
        note TEXT,
        wins TEXT,
        challenges TEXT,
        moon_sign TEXT,
        moon_house INTEGER,
        sun_house INTEGER,
        transit_events TEXT,
        lunar_phase TEXT,
        retrogrades TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(date, chart_id, time_of_day)
      );

      INSERT OR IGNORE INTO daily_check_ins_v12
        SELECT id, date, chart_id, time_of_day, mood_score, energy_level, stress_level,
               tags, note, wins, challenges, moon_sign, moon_house, sun_house,
               transit_events, lunar_phase, retrogrades, created_at, updated_at
        FROM daily_check_ins;

      DROP TABLE daily_check_ins;

      ALTER TABLE daily_check_ins_v12 RENAME TO daily_check_ins;

      CREATE INDEX IF NOT EXISTS idx_check_ins_date ON daily_check_ins(date);
      CREATE INDEX IF NOT EXISTS idx_check_ins_chart ON daily_check_ins(chart_id);
      CREATE INDEX IF NOT EXISTS idx_check_ins_mood ON daily_check_ins(mood_score);
    `);

    logger.info(`[LocalDB] Backfilled ${existing.length} check-ins with time_of_day`);
    logger.info('[LocalDB] Version 12 migration complete — table rebuilt with UNIQUE(date, chart_id, time_of_day)');
  }

  /**
   * Version 13 — Ensure the old UNIQUE(date, chart_id) table-level constraint
   * is removed for users who already ran v12 but still have the old table shape.
   * Re-creates the table if the old constraint is detected.
   */
  private async migrateToVersion13(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Starting version 13 migration — ensuring correct UNIQUE constraint...');

    const tableSql = (await db.getFirstAsync(
      `SELECT sql FROM sqlite_master WHERE type='table' AND name='daily_check_ins'`
    )) as any;

    const sql: string = tableSql?.sql ?? '';
    const hasOldConstraint =
      sql.includes('UNIQUE(date, chart_id)') && !sql.includes('UNIQUE(date, chart_id, time_of_day)');

    if (!hasOldConstraint) {
      logger.info('[LocalDB] Version 13 — table already has correct constraint, skipping rebuild');
      return;
    }

    try {
      await db.execAsync(`ALTER TABLE daily_check_ins ADD COLUMN time_of_day TEXT NOT NULL DEFAULT 'morning'`);
    } catch (_) {
      /* already exists */
    }

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS daily_check_ins_v13 (
        id TEXT PRIMARY KEY NOT NULL,
        date TEXT NOT NULL,
        chart_id TEXT NOT NULL,
        time_of_day TEXT NOT NULL DEFAULT 'morning',
        mood_score REAL NOT NULL,
        energy_level TEXT NOT NULL,
        stress_level TEXT NOT NULL,
        tags TEXT,
        note TEXT,
        wins TEXT,
        challenges TEXT,
        moon_sign TEXT,
        moon_house INTEGER,
        sun_house INTEGER,
        transit_events TEXT,
        lunar_phase TEXT,
        retrogrades TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(date, chart_id, time_of_day)
      );

      INSERT OR IGNORE INTO daily_check_ins_v13
        SELECT id, date, chart_id, time_of_day, mood_score, energy_level, stress_level,
               tags, note, wins, challenges, moon_sign, moon_house, sun_house,
               transit_events, lunar_phase, retrogrades, created_at, updated_at
        FROM daily_check_ins;

      DROP TABLE daily_check_ins;

      ALTER TABLE daily_check_ins_v13 RENAME TO daily_check_ins;

      CREATE INDEX IF NOT EXISTS idx_check_ins_date ON daily_check_ins(date);
      CREATE INDEX IF NOT EXISTS idx_check_ins_chart ON daily_check_ins(chart_id);
      CREATE INDEX IF NOT EXISTS idx_check_ins_mood ON daily_check_ins(mood_score);
    `);

    logger.info('[LocalDB] Version 13 migration complete — table rebuilt with correct UNIQUE constraint');
  }

  /**
   * Version 14 — Encrypt existing plaintext insight_history text fields.
   * Idempotent: skips any row whose greeting already starts with ENC2: or ENC:.
   */
  private async migrateToVersion14(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Starting version 14 migration — encrypting insight_history fields...');

    const rows = (await db.getAllAsync(
      `SELECT id, greeting, love_headline, love_message, energy_headline, energy_message,
              growth_headline, growth_message, gentle_reminder, journal_prompt, signals
       FROM insight_history`
    )) as any[];

    let encrypted = 0;
    let failures = 0;

    for (const row of rows) {
      if (FieldEncryptionService.isEncrypted(row.greeting)) continue;

      try {
        const encGreeting = await FieldEncryptionService.encryptField(row.greeting);
        const encLoveHeadline = await FieldEncryptionService.encryptField(row.love_headline);
        const encLoveMessage = await FieldEncryptionService.encryptField(row.love_message);
        const encEnergyHeadline = await FieldEncryptionService.encryptField(row.energy_headline);
        const encEnergyMessage = await FieldEncryptionService.encryptField(row.energy_message);
        const encGrowthHeadline = await FieldEncryptionService.encryptField(row.growth_headline);
        const encGrowthMessage = await FieldEncryptionService.encryptField(row.growth_message);
        const encGentleReminder = await FieldEncryptionService.encryptField(row.gentle_reminder);
        const encJournalPrompt = await FieldEncryptionService.encryptField(row.journal_prompt);
        const encSignals = row.signals ? await FieldEncryptionService.encryptField(row.signals) : null;

        await db.runAsync(
          `UPDATE insight_history SET
             greeting = ?, love_headline = ?, love_message = ?,
             energy_headline = ?, energy_message = ?,
             growth_headline = ?, growth_message = ?,
             gentle_reminder = ?, journal_prompt = ?, signals = ?
           WHERE id = ?`,
          [
            encGreeting,
            encLoveHeadline,
            encLoveMessage,
            encEnergyHeadline,
            encEnergyMessage,
            encGrowthHeadline,
            encGrowthMessage,
            encGentleReminder,
            encJournalPrompt,
            encSignals,
            row.id,
          ]
        );
        encrypted++;
      } catch {
        failures++;
        logger.error(`[LocalDB] v14: failed to encrypt insight_history row ${row.id}`);
      }
    }

    if (failures > 0) {
      logger.warn(
        `[LocalDB] Version 14 migration completed with ${failures} failures — encrypted ${encrypted} rows`
      );
    } else {
      logger.info(`[LocalDB] Version 14 migration complete — encrypted ${encrypted} insight rows`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Chart operations
  // ─────────────────────────────────────────────────────────────────────────────

  async upsertChart(chart: SavedChart): Promise<void> {
    const db = await this.ensureReady();

    // Encrypt sensitive fields before writing to SQLite
    const encBirthPlace = await FieldEncryptionService.encryptField(chart.birthPlace);
    const encName = chart.name ? await FieldEncryptionService.encryptField(chart.name) : null;
    const encBirthDate = await FieldEncryptionService.encryptField(chart.birthDate);
    const encBirthTime = chart.birthTime ? await FieldEncryptionService.encryptField(chart.birthTime) : null;

    await db.runAsync(
      `INSERT OR REPLACE INTO saved_charts
       (id, name, birth_date, birth_time, has_unknown_time, birth_place, latitude, longitude, timezone, house_system, created_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chart.id,
        encName,
        encBirthDate,
        encBirthTime,
        chart.hasUnknownTime ? 1 : 0,
        encBirthPlace,
        chart.latitude,
        chart.longitude,
        chart.timezone || null,
        chart.houseSystem || null,
        chart.createdAt,
        chart.updatedAt,
        chart.isDeleted ? 1 : 0,
      ]
    );
  }

  async getCharts(): Promise<SavedChart[]> {
    const db = await this.ensureReady();

    const result = await db.getAllAsync(
      'SELECT * FROM saved_charts WHERE is_deleted = 0 ORDER BY created_at DESC'
    );

    // Decrypt sensitive fields after reading from SQLite
    return Promise.all(
      (result as any[]).map(async (row: any) => ({
        id: row.id,
        name: row.name ? await FieldEncryptionService.decryptField(row.name) : row.name,
        birthDate: await FieldEncryptionService.decryptField(row.birth_date),
        birthTime: row.birth_time ? await FieldEncryptionService.decryptField(row.birth_time) : row.birth_time,
        hasUnknownTime: row.has_unknown_time === 1,
        birthPlace: await FieldEncryptionService.decryptField(row.birth_place),
        latitude: row.latitude,
        longitude: row.longitude,
        timezone: row.timezone || undefined,
        houseSystem: row.house_system || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isDeleted: row.is_deleted === 1,
      }))
    );
  }

  async updateAllChartsHouseSystem(houseSystem: string): Promise<void> {
    const db = await this.ensureReady();
    const now = new Date().toISOString();

    await db.runAsync('UPDATE saved_charts SET house_system = ?, updated_at = ? WHERE is_deleted = 0', [
      houseSystem,
      now,
    ]);
  }

  async deleteChart(id: string): Promise<void> {
    const db = await this.ensureReady();
    const now = new Date().toISOString();

    await db.runAsync('UPDATE saved_charts SET is_deleted = 1, updated_at = ? WHERE id = ?', [now, id]);
  }

  async hardDeleteChart(id: string): Promise<void> {
    const db = await this.ensureReady();
    await db.runAsync('DELETE FROM saved_charts WHERE id = ?', [id]);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Journal operations
  // ─────────────────────────────────────────────────────────────────────────────

  async addJournalEntry(entry: JournalEntry): Promise<void> {
    const db = await this.ensureReady();

    // Encrypt sensitive fields
    const encContent = await FieldEncryptionService.encryptField(entry.content);
    const encTitle = entry.title ? await FieldEncryptionService.encryptField(entry.title) : null;
    const encKeywords = entry.contentKeywords ? await FieldEncryptionService.encryptField(entry.contentKeywords) : null;
    const encEmotions = entry.contentEmotions ? await FieldEncryptionService.encryptField(entry.contentEmotions) : null;
    const encSentiment = entry.contentSentiment ? await FieldEncryptionService.encryptField(entry.contentSentiment) : null;

    await db.runAsync(
      `INSERT INTO journal_entries
       (id, date, mood, moon_phase, title, content, chart_id, transit_snapshot,
        content_keywords_enc, content_emotions_enc, content_sentiment_enc,
        content_word_count, content_reading_minutes,
        created_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.date,
        entry.mood,
        entry.moonPhase,
        encTitle,
        encContent,
        entry.chartId || null,
        entry.transitSnapshot || null,
        encKeywords,
        encEmotions,
        encSentiment,
        entry.contentWordCount ?? null,
        entry.contentReadingMinutes ?? null,
        entry.createdAt,
        entry.updatedAt,
        entry.isDeleted ? 1 : 0,
      ]
    );
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    const db = await this.ensureReady();

    const result = await db.getAllAsync(
      'SELECT * FROM journal_entries WHERE is_deleted = 0 ORDER BY date DESC, created_at DESC'
    );

    return Promise.all((result as any[]).map(async (row: any) => this.mapJournalRow(row)));
  }

  private async mapJournalRow(row: any): Promise<JournalEntry> {
    return {
      id: row.id,
      date: row.date,
      mood: row.mood,
      moonPhase: row.moon_phase,
      title: row.title ? await FieldEncryptionService.decryptField(row.title) : row.title,
      content: await FieldEncryptionService.decryptField(row.content),
      chartId: row.chart_id || undefined,
      transitSnapshot: row.transit_snapshot || undefined,
      contentKeywords: row.content_keywords_enc
        ? await FieldEncryptionService.decryptField(row.content_keywords_enc)
        : undefined,
      contentEmotions: row.content_emotions_enc
        ? await FieldEncryptionService.decryptField(row.content_emotions_enc)
        : undefined,
      contentSentiment: row.content_sentiment_enc
        ? await FieldEncryptionService.decryptField(row.content_sentiment_enc)
        : undefined,
      contentWordCount: row.content_word_count ?? undefined,
      contentReadingMinutes: row.content_reading_minutes ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted === 1,
    };
  }

  async updateJournalEntry(entry: JournalEntry): Promise<void> {
    const db = await this.ensureReady();

    const encContent = await FieldEncryptionService.encryptField(entry.content);
    const encTitle = entry.title ? await FieldEncryptionService.encryptField(entry.title) : null;
    const encKeywords = entry.contentKeywords ? await FieldEncryptionService.encryptField(entry.contentKeywords) : null;
    const encEmotions = entry.contentEmotions ? await FieldEncryptionService.encryptField(entry.contentEmotions) : null;
    const encSentiment = entry.contentSentiment ? await FieldEncryptionService.encryptField(entry.contentSentiment) : null;

    await db.runAsync(
      `UPDATE journal_entries
       SET mood = ?, moon_phase = ?, title = ?, content = ?, chart_id = ?, transit_snapshot = ?,
           content_keywords_enc = ?, content_emotions_enc = ?, content_sentiment_enc = ?,
           content_word_count = ?, content_reading_minutes = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        entry.mood,
        entry.moonPhase,
        encTitle,
        encContent,
        entry.chartId || null,
        entry.transitSnapshot || null,
        encKeywords,
        encEmotions,
        encSentiment,
        entry.contentWordCount ?? null,
        entry.contentReadingMinutes ?? null,
        entry.updatedAt,
        entry.id,
      ]
    );
  }

  async deleteJournalEntry(id: string): Promise<void> {
    const db = await this.ensureReady();
    const now = new Date().toISOString();

    await db.runAsync('UPDATE journal_entries SET is_deleted = 1, updated_at = ? WHERE id = ?', [
      now,
      id,
    ]);
  }

  async hardDeleteJournalEntry(id: string): Promise<void> {
    const db = await this.ensureReady();
    await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Settings operations
  // ─────────────────────────────────────────────────────────────────────────────

  async getSettings(): Promise<AppSettings | null> {
    const db = await this.ensureReady();

    const result = await db.getFirstAsync('SELECT * FROM app_settings WHERE id = ?', ['default']);
    if (!result) return null;

    return {
      id: (result as any).id,
      cloudSyncEnabled: (result as any).cloud_sync_enabled === 1,
      lastSyncAt: (result as any).last_sync_at,
      lastBackupAt: (result as any).last_backup_at || undefined,
      userId: (result as any).user_id,
      createdAt: (result as any).created_at,
      updatedAt: (result as any).updated_at,
    };
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    const db = await this.ensureReady();

    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings
       (id, cloud_sync_enabled, last_sync_at, last_backup_at, user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        settings.id,
        settings.cloudSyncEnabled ? 1 : 0,
        settings.lastSyncAt || null,
        settings.lastBackupAt || null,
        settings.userId || null,
        settings.createdAt,
        settings.updatedAt,
      ]
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Sync helpers
  // ─────────────────────────────────────────────────────────────────────────────

  async getChartsModifiedSince(timestamp: string): Promise<SavedChart[]> {
    const db = await this.ensureReady();

    const result = await db.getAllAsync('SELECT * FROM saved_charts WHERE updated_at > ? ORDER BY updated_at ASC', [
      timestamp,
    ]);

    return Promise.all(
      (result as any[]).map(async (row: any) => ({
        id: row.id,
        name: row.name ? await FieldEncryptionService.decryptField(row.name) : row.name,
        birthDate: await FieldEncryptionService.decryptField(row.birth_date),
        birthTime: row.birth_time ? await FieldEncryptionService.decryptField(row.birth_time) : row.birth_time,
        hasUnknownTime: row.has_unknown_time === 1,
        birthPlace: await FieldEncryptionService.decryptField(row.birth_place),
        latitude: row.latitude,
        longitude: row.longitude,
        timezone: row.timezone || undefined,
        houseSystem: row.house_system || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isDeleted: row.is_deleted === 1,
      }))
    );
  }

  async getJournalEntriesModifiedSince(timestamp: string): Promise<JournalEntry[]> {
    const db = await this.ensureReady();

    const result = await db.getAllAsync(
      'SELECT * FROM journal_entries WHERE updated_at > ? ORDER BY updated_at ASC',
      [timestamp]
    );

    return Promise.all((result as any[]).map(async (row: any) => this.mapJournalRow(row)));
  }

  async hardDeleteAllData(): Promise<void> {
    const db = await this.ensureReady();

    await db.execAsync(`
      DELETE FROM saved_charts;
      DELETE FROM journal_entries;
      DELETE FROM cached_interpretations;
      DELETE FROM app_settings;
      DELETE FROM daily_check_ins;
      DELETE FROM insight_history;
      DELETE FROM relationship_charts;
      DELETE FROM migration_markers;
      VACUUM;
    `);
  }

  // Aliases
  async saveChart(chart: SavedChart): Promise<void> {
    return this.upsertChart(chart);
  }

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    const db = await this.ensureReady();

    const exists = await db.getFirstAsync('SELECT id FROM journal_entries WHERE id = ?', [entry.id]);

    if (exists) {
      await this.updateJournalEntry(entry);
    } else {
      await this.addJournalEntry(entry);
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    return this.updateSettings(settings);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Migration Markers
  // ─────────────────────────────────────────────────────────────────────────────

  async getMigrationMarker(key: string): Promise<boolean> {
    const db = await this.ensureReady();
    const result = await db.getFirstAsync('SELECT key FROM migration_markers WHERE key = ?', [key]);
    return result != null;
  }

  async setMigrationMarker(key: string): Promise<void> {
    const db = await this.ensureReady();
    await db.runAsync('INSERT OR REPLACE INTO migration_markers (key, completed_at) VALUES (?, ?)', [
      key,
      new Date().toISOString(),
    ]);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Insight History Operations
  // ─────────────────────────────────────────────────────────────────────────────

  async saveInsight(insight: SavedInsight): Promise<void> {
    const db = await this.ensureReady();

    const encGreeting = await FieldEncryptionService.encryptField(insight.greeting);
    const encLoveHeadline = await FieldEncryptionService.encryptField(insight.loveHeadline);
    const encLoveMessage = await FieldEncryptionService.encryptField(insight.loveMessage);
    const encEnergyHeadline = await FieldEncryptionService.encryptField(insight.energyHeadline);
    const encEnergyMessage = await FieldEncryptionService.encryptField(insight.energyMessage);
    const encGrowthHeadline = await FieldEncryptionService.encryptField(insight.growthHeadline);
    const encGrowthMessage = await FieldEncryptionService.encryptField(insight.growthMessage);
    const encGentleReminder = await FieldEncryptionService.encryptField(insight.gentleReminder);
    const encJournalPrompt = await FieldEncryptionService.encryptField(insight.journalPrompt);
    const encSignals = insight.signals ? await FieldEncryptionService.encryptField(insight.signals) : null;

    await db.runAsync(
      `INSERT OR REPLACE INTO insight_history
       (id, date, chart_id, greeting, love_headline, love_message, energy_headline,
        energy_message, growth_headline, growth_message, gentle_reminder, journal_prompt,
        moon_sign, moon_phase, signals, is_favorite, viewed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        insight.id,
        insight.date,
        insight.chartId,
        encGreeting,
        encLoveHeadline,
        encLoveMessage,
        encEnergyHeadline,
        encEnergyMessage,
        encGrowthHeadline,
        encGrowthMessage,
        encGentleReminder,
        encJournalPrompt,
        insight.moonSign || null,
        insight.moonPhase || null,
        encSignals,
        insight.isFavorite ? 1 : 0,
        insight.viewedAt || null,
        insight.createdAt,
        insight.updatedAt,
      ]
    );
  }

  async getInsightByDate(date: string, chartId: string): Promise<SavedInsight | null> {
    const db = await this.ensureReady();

    const result = await db.getFirstAsync('SELECT * FROM insight_history WHERE date = ? AND chart_id = ?', [
      date,
      chartId,
    ]);

    if (!result) return null;
    return await this.mapInsightRow(result);
  }

  async getInsightById(id: string): Promise<SavedInsight | null> {
    const db = await this.ensureReady();

    const result = await db.getFirstAsync('SELECT * FROM insight_history WHERE id = ?', [id]);

    if (!result) return null;
    return await this.mapInsightRow(result);
  }

  async getInsightHistory(
    chartId: string,
    options?: { limit?: number; startDate?: string; endDate?: string; favoritesOnly?: boolean }
  ): Promise<SavedInsight[]> {
    const db = await this.ensureReady();

    let query = 'SELECT * FROM insight_history WHERE chart_id = ?';
    const params: any[] = [chartId];

    if (options?.startDate) {
      query += ' AND date >= ?';
      params.push(options.startDate);
    }

    if (options?.endDate) {
      query += ' AND date <= ?';
      params.push(options.endDate);
    }

    if (options?.favoritesOnly) {
      query += ' AND is_favorite = 1';
    }

    query += ' ORDER BY date DESC';

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const result = await db.getAllAsync(query, params);
    return Promise.all((result as any[]).map((row: any) => this.mapInsightRow(row)));
  }

  async updateInsightFavorite(id: string, isFavorite: boolean): Promise<void> {
    const db = await this.ensureReady();
    const now = new Date().toISOString();

    await db.runAsync('UPDATE insight_history SET is_favorite = ?, updated_at = ? WHERE id = ?', [
      isFavorite ? 1 : 0,
      now,
      id,
    ]);
  }

  async updateInsightViewedAt(id: string, viewedAt: string): Promise<void> {
    const db = await this.ensureReady();
    await db.runAsync('UPDATE insight_history SET viewed_at = ? WHERE id = ?', [viewedAt, id]);
  }

  private async mapInsightRow(row: any): Promise<SavedInsight> {
    return {
      id: row.id,
      date: row.date,
      chartId: row.chart_id,
      greeting: await FieldEncryptionService.decryptField(row.greeting),
      loveHeadline: await FieldEncryptionService.decryptField(row.love_headline),
      loveMessage: await FieldEncryptionService.decryptField(row.love_message),
      energyHeadline: await FieldEncryptionService.decryptField(row.energy_headline),
      energyMessage: await FieldEncryptionService.decryptField(row.energy_message),
      growthHeadline: await FieldEncryptionService.decryptField(row.growth_headline),
      growthMessage: await FieldEncryptionService.decryptField(row.growth_message),
      gentleReminder: await FieldEncryptionService.decryptField(row.gentle_reminder),
      journalPrompt: await FieldEncryptionService.decryptField(row.journal_prompt),
      moonSign: row.moon_sign,
      moonPhase: row.moon_phase,
      signals: row.signals ? await FieldEncryptionService.decryptField(row.signals) : row.signals,
      isFavorite: row.is_favorite === 1,
      viewedAt: row.viewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Relationship chart operations
  // ─────────────────────────────────────────────────────────────────────────────

  async saveRelationshipChart(chart: RelationshipChart): Promise<void> {
    const db = await this.ensureReady();

    const encBirthPlace = await FieldEncryptionService.encryptField(chart.birthPlace);
    const encName = await FieldEncryptionService.encryptField(chart.name);
    const encBirthDate = await FieldEncryptionService.encryptField(chart.birthDate);
    const encBirthTime = chart.birthTime ? await FieldEncryptionService.encryptField(chart.birthTime) : null;

    await db.runAsync(
      `INSERT OR REPLACE INTO relationship_charts 
       (id, name, relationship, birth_date, birth_time, has_unknown_time, birth_place, 
        latitude, longitude, timezone, user_chart_id, created_at, updated_at, is_deleted, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chart.id,
        encName,
        chart.relationship,
        encBirthDate,
        encBirthTime,
        chart.hasUnknownTime ? 1 : 0,
        encBirthPlace,
        chart.latitude,
        chart.longitude,
        chart.timezone || null,
        chart.userChartId,
        chart.createdAt,
        chart.updatedAt,
        chart.isDeleted ? 1 : 0,
        chart.deletedAt || null,
      ]
    );
  }

  async getRelationshipCharts(userChartId?: string): Promise<RelationshipChart[]> {
    const db = await this.ensureReady();

    let query = 'SELECT * FROM relationship_charts WHERE is_deleted = 0';
    const params: any[] = [];

    if (userChartId) {
      query += ' AND user_chart_id = ?';
      params.push(userChartId);
    }

    query += ' ORDER BY updated_at DESC';

    const result = await db.getAllAsync(query, params);
    return Promise.all((result as any[]).map((row: any) => this.mapRelationshipRow(row)));
  }

  async getRelationshipChartById(id: string): Promise<RelationshipChart | null> {
    const db = await this.ensureReady();

    const result = await db.getFirstAsync('SELECT * FROM relationship_charts WHERE id = ? AND is_deleted = 0', [
      id,
    ]);

    return result ? await this.mapRelationshipRow(result) : null;
  }

  async deleteRelationshipChart(id: string): Promise<void> {
    const db = await this.ensureReady();
    const now = new Date().toISOString();

    await db.runAsync('UPDATE relationship_charts SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?', [
      now,
      now,
      id,
    ]);
  }

  async getRelationshipChartCount(userChartId?: string): Promise<number> {
    const db = await this.ensureReady();

    let query = 'SELECT COUNT(*) as count FROM relationship_charts WHERE is_deleted = 0';
    const params: any[] = [];

    if (userChartId) {
      query += ' AND user_chart_id = ?';
      params.push(userChartId);
    }

    const result = (await db.getFirstAsync(query, params)) as any;
    return result?.count ?? 0;
  }

  private async mapRelationshipRow(row: any): Promise<RelationshipChart> {
    return {
      id: row.id,
      name: await FieldEncryptionService.decryptField(row.name),
      relationship: row.relationship,
      birthDate: await FieldEncryptionService.decryptField(row.birth_date),
      birthTime: row.birth_time ? await FieldEncryptionService.decryptField(row.birth_time) : row.birth_time,
      hasUnknownTime: row.has_unknown_time === 1,
      birthPlace: await FieldEncryptionService.decryptField(row.birth_place),
      latitude: row.latitude,
      longitude: row.longitude,
      timezone: row.timezone,
      userChartId: row.user_chart_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted === 1,
      deletedAt: row.deleted_at,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Check-In CRUD
  // ─────────────────────────────────────────────────────────────────────────────

  async saveCheckIn(checkIn: DailyCheckIn): Promise<void> {
    const db = await this.ensureReady();

    const encNote = checkIn.note ? await FieldEncryptionService.encryptField(checkIn.note) : null;
    const encWins = checkIn.wins ? await FieldEncryptionService.encryptField(checkIn.wins) : null;
    const encChallenges = checkIn.challenges ? await FieldEncryptionService.encryptField(checkIn.challenges) : null;

    const existing = (await db.getFirstAsync(
      'SELECT id FROM daily_check_ins WHERE date = ? AND chart_id = ? AND time_of_day = ?',
      [checkIn.date, checkIn.chartId, checkIn.timeOfDay]
    )) as any;

    if (existing) {
      await db.runAsync(
        `UPDATE daily_check_ins SET
         mood_score = ?, energy_level = ?, stress_level = ?, tags = ?, note = ?, wins = ?, challenges = ?,
         moon_sign = ?, moon_house = ?, sun_house = ?, transit_events = ?, lunar_phase = ?, retrogrades = ?,
         updated_at = ?
         WHERE id = ?`,
        [
          checkIn.moodScore,
          checkIn.energyLevel,
          checkIn.stressLevel,
          JSON.stringify(checkIn.tags),
          encNote,
          encWins,
          encChallenges,
          checkIn.moonSign,
          checkIn.moonHouse,
          checkIn.sunHouse,
          JSON.stringify(checkIn.transitEvents),
          checkIn.lunarPhase,
          JSON.stringify(checkIn.retrogrades),
          checkIn.updatedAt,
          existing.id,
        ]
      );
    } else {
      await db.runAsync(
        `INSERT INTO daily_check_ins
         (id, date, chart_id, time_of_day, mood_score, energy_level, stress_level, tags, note, wins, challenges,
          moon_sign, moon_house, sun_house, transit_events, lunar_phase, retrogrades, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          checkIn.id,
          checkIn.date,
          checkIn.chartId,
          checkIn.timeOfDay,
          checkIn.moodScore,
          checkIn.energyLevel,
          checkIn.stressLevel,
          JSON.stringify(checkIn.tags),
          encNote,
          encWins,
          encChallenges,
          checkIn.moonSign,
          checkIn.moonHouse,
          checkIn.sunHouse,
          JSON.stringify(checkIn.transitEvents),
          checkIn.lunarPhase,
          JSON.stringify(checkIn.retrogrades),
          checkIn.createdAt,
          checkIn.updatedAt,
        ]
      );
    }
  }

  async getCheckInByDate(date: string, chartId: string): Promise<DailyCheckIn | null> {
    const db = await this.ensureReady();

    const row = await db.getFirstAsync(
      'SELECT * FROM daily_check_ins WHERE date = ? AND chart_id = ? ORDER BY created_at DESC LIMIT 1',
      [date, chartId]
    );

    if (!row) return null;
    return this.mapCheckInRow(row);
  }

  async getCheckInsByDate(date: string, chartId: string): Promise<DailyCheckIn[]> {
    const db = await this.ensureReady();

    const rows = await db.getAllAsync(
      'SELECT * FROM daily_check_ins WHERE date = ? AND chart_id = ? ORDER BY created_at ASC',
      [date, chartId]
    );

    return Promise.all((rows as any[]).map((row: any) => this.mapCheckInRow(row)));
  }

  async getCheckInByDateAndTime(date: string, chartId: string, timeOfDay: string): Promise<DailyCheckIn | null> {
    const db = await this.ensureReady();

    const row = await db.getFirstAsync(
      'SELECT * FROM daily_check_ins WHERE date = ? AND chart_id = ? AND time_of_day = ?',
      [date, chartId, timeOfDay]
    );

    if (!row) return null;
    return this.mapCheckInRow(row);
  }

  async getCheckIns(chartId: string, limit?: number): Promise<DailyCheckIn[]> {
    const db = await this.ensureReady();

    let query = 'SELECT * FROM daily_check_ins WHERE chart_id = ? ORDER BY date DESC, created_at DESC';
    const params: any[] = [chartId];

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const rows = await db.getAllAsync(query, params);
    return Promise.all((rows as any[]).map((row: any) => this.mapCheckInRow(row)));
  }

  private async mapCheckInRow(row: any): Promise<DailyCheckIn> {
    return {
      id: row.id,
      date: row.date,
      chartId: row.chart_id,
      timeOfDay: row.time_of_day || 'morning',
      moodScore: row.mood_score,
      energyLevel: row.energy_level,
      stressLevel: row.stress_level,
      tags: JSON.parse(row.tags || '[]'),
      note: row.note ? await FieldEncryptionService.decryptField(row.note) : row.note,
      wins: row.wins ? await FieldEncryptionService.decryptField(row.wins) : row.wins,
      challenges: row.challenges ? await FieldEncryptionService.decryptField(row.challenges) : row.challenges,
      moonSign: row.moon_sign,
      moonHouse: row.moon_house,
      sunHouse: row.sun_house,
      transitEvents: JSON.parse(row.transit_events || '[]'),
      lunarPhase: row.lunar_phase,
      retrogrades: JSON.parse(row.retrogrades || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const localDb = new LocalDatabase();
