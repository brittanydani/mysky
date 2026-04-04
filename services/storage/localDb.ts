// File: services/storage/localDb.ts

import * as SQLite from 'expo-sqlite';
import { SavedChart, JournalEntry, AppSettings, RelationshipChart, SleepEntry } from './models';
import { SavedInsight } from './insightHistory';
import { DailyCheckIn } from '../patterns/types';
import { logger } from '../../utils/logger';
import { FieldEncryptionService, isDecryptionFailure } from './fieldEncryption';

const CURRENT_DB_VERSION = 20;

class LocalDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  // ✅ NEW: tracks in-flight init so multiple callers don't race
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize DB once. Safe to call multiple times.
   * Retries up to 3 times with exponential backoff on transient failures.
   */
  async initialize(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const MAX_RETRIES = 3;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          this.db = await SQLite.openDatabaseAsync('mysky.db');
          // Initialize field encryption DEK (creates key on first run)
          await FieldEncryptionService.initialize();
          await this.handleMigrations();
          return; // success
        } catch (error) {
          this.db = null;
          if (attempt === MAX_RETRIES) {
            this.initPromise = null;
            logger.error(`[LocalDB] Init failed after ${MAX_RETRIES} attempts:`, error);
            throw error;
          }
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
          logger.warn(`[LocalDB] Init attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
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

    // Forward-compatibility guard: refuse to open a database created by a
    // newer version of the app (e.g. TestFlight → App Store downgrade).
    if (currentVersion > CURRENT_DB_VERSION) {
      throw new Error(
        `Database version ${currentVersion} is newer than this app supports (${CURRENT_DB_VERSION}). ` +
        `Please update MySky to the latest version.`
      );
    }

    if (currentVersion < CURRENT_DB_VERSION) {
      await this.runMigrations(currentVersion);
      logger.info(`[LocalDB] All migrations complete (now at version ${CURRENT_DB_VERSION})`);
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
    const db = await this.ensureReady();

    const steps: { version: number; fn: () => Promise<void> }[] = [
      { version: 1, fn: () => this.createInitialSchema() },
      { version: 2, fn: () => this.migrateToVersion2() },
      { version: 3, fn: () => this.migrateToVersion3() },
      { version: 4, fn: () => this.migrateToVersion4() },
      { version: 5, fn: () => this.migrateToVersion5() },
      { version: 6, fn: () => this.migrateToVersion6() },
      { version: 7, fn: () => this.migrateToVersion7() },
      { version: 8, fn: () => this.migrateToVersion8() },
      { version: 9, fn: () => this.migrateToVersion9() },
      { version: 10, fn: () => this.migrateToVersion10() },
      { version: 11, fn: () => this.migrateToVersion11() },
      { version: 12, fn: () => this.migrateToVersion12() },
      { version: 13, fn: () => this.migrateToVersion13() },
      { version: 14, fn: () => this.migrateToVersion14() },
      { version: 15, fn: () => this.migrateToVersion15() },
      { version: 16, fn: () => this.migrateToVersion16() },
      { version: 17, fn: () => this.migrateToVersion17() },
      { version: 18, fn: () => this.migrateToVersion18() },
      { version: 19, fn: () => this.migrateToVersion19() },
      { version: 20, fn: () => this.migrateToVersion20() },
    ];

    for (const step of steps) {
      if (fromVersion < step.version) {
        await step.fn();
        // Bump PRAGMA after each successful step so a crash mid-sequence
        // resumes from the correct point on next launch.
        await db.execAsync(`PRAGMA user_version = ${step.version}`);
      }
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

    // cached_interpretations table removed — it stored derived personal data
    // (interpretation text) in plaintext. If reintroduced, content MUST be
    // encrypted via FieldEncryptionService before writing.

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_saved_charts_updated_at ON saved_charts(updated_at);
      CREATE INDEX IF NOT EXISTS idx_saved_charts_is_deleted ON saved_charts(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_updated_at ON journal_entries(updated_at);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_is_deleted ON journal_entries(is_deleted);
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

    // Pre-read all rows OUTSIDE the transaction (reads are safe without a lock).
    // Encrypt values in JS, then batch-write inside a single transaction so
    // the DB is never left in a half-encrypted state.
    const charts = (await db.getAllAsync(
      'SELECT id, birth_place FROM saved_charts WHERE birth_place IS NOT NULL'
    )) as any[];
    const entries = (await db.getAllAsync(
      'SELECT id, content, title FROM journal_entries WHERE content IS NOT NULL'
    )) as any[];
    const rels = (await db.getAllAsync(
      'SELECT id, birth_place FROM relationship_charts WHERE birth_place IS NOT NULL'
    )) as any[];
    const checkins = (await db.getAllAsync(
      'SELECT id, note, wins, challenges FROM daily_check_ins'
    )) as any[];

    // Pre-compute encrypted values
    type RowUpdate = { id: string; table: string; updates: string[]; params: any[] };
    const pending: RowUpdate[] = [];
    let encrypted = 0;

    for (const row of charts) {
      if (row.birth_place && !FieldEncryptionService.isEncrypted(row.birth_place)) {
        const enc = await FieldEncryptionService.encryptField(row.birth_place);
        pending.push({ id: row.id, table: 'saved_charts', updates: ['birth_place = ?'], params: [enc] });
        encrypted++;
      }
    }
    for (const row of entries) {
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
      if (updates.length > 0) pending.push({ id: row.id, table: 'journal_entries', updates, params });
    }
    for (const row of rels) {
      if (row.birth_place && !FieldEncryptionService.isEncrypted(row.birth_place)) {
        const enc = await FieldEncryptionService.encryptField(row.birth_place);
        pending.push({ id: row.id, table: 'relationship_charts', updates: ['birth_place = ?'], params: [enc] });
        encrypted++;
      }
    }
    for (const row of checkins) {
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
      if (updates.length > 0) pending.push({ id: row.id, table: 'daily_check_ins', updates, params });
    }

    // Write all encrypted values and the idempotency marker in a single transaction.
    // If the app crashes mid-write, all changes are rolled back and no data is lost.
    await db.withTransactionAsync(async () => {
      for (const p of pending) {
        p.params.push(p.id);
        await db.runAsync(`UPDATE ${p.table} SET ${p.updates.join(', ')} WHERE id = ?`, p.params);
      }
      await db.runAsync(
        'INSERT OR REPLACE INTO migration_markers (key, completed_at) VALUES (?, ?)',
        [markerKey, new Date().toISOString()]
      );
    });

    logger.info(`[LocalDB] Version 7 migration complete — encrypted ${encrypted} fields`);
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

    // Pre-read rows outside transaction, pre-compute encrypted values
    const charts = (await db.getAllAsync('SELECT id, name, birth_date, birth_time FROM saved_charts')) as any[];
    const rels = (await db.getAllAsync('SELECT id, name, birth_date, birth_time FROM relationship_charts')) as any[];

    type RowUpdate = { id: string; table: string; updates: string[]; values: any[] };
    const pending: RowUpdate[] = [];

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
      if (updates.length > 0) pending.push({ id: row.id, table: 'saved_charts', updates, values });
    }

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
      if (updates.length > 0) pending.push({ id: row.id, table: 'relationship_charts', updates, values });
    }

    // Write all encrypted values atomically
    await db.withTransactionAsync(async () => {
      for (const p of pending) {
        const params = [...p.values, p.id];
        await db.runAsync(`UPDATE ${p.table} SET ${p.updates.join(', ')} WHERE id = ?`, params);
      }
    });

    logger.info(`[LocalDB] Encrypted PII for ${charts.length} saved charts, ${rels.length} relationship charts`);
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
    `);

    // Atomic swap: wrap DROP + RENAME + INDEX in a transaction to prevent
    // data loss if the app crashes between DROP and RENAME.
    await db.execAsync(`
      BEGIN TRANSACTION;
      DROP TABLE daily_check_ins;
      ALTER TABLE daily_check_ins_v12 RENAME TO daily_check_ins;
      CREATE INDEX IF NOT EXISTS idx_check_ins_date ON daily_check_ins(date);
      CREATE INDEX IF NOT EXISTS idx_check_ins_chart ON daily_check_ins(chart_id);
      CREATE INDEX IF NOT EXISTS idx_check_ins_mood ON daily_check_ins(mood_score);
      COMMIT;
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
    } catch {
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
    `);

    // Atomic swap: wrap DROP + RENAME + INDEX in a transaction
    await db.execAsync(`
      BEGIN TRANSACTION;
      DROP TABLE daily_check_ins;
      ALTER TABLE daily_check_ins_v13 RENAME TO daily_check_ins;
      CREATE INDEX IF NOT EXISTS idx_check_ins_date ON daily_check_ins(date);
      CREATE INDEX IF NOT EXISTS idx_check_ins_chart ON daily_check_ins(chart_id);
      CREATE INDEX IF NOT EXISTS idx_check_ins_mood ON daily_check_ins(mood_score);
      COMMIT;
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

    // Pre-compute encrypted values outside the transaction
    type InsightUpdate = { id: string; params: any[] };
    const pending: InsightUpdate[] = [];

    for (const row of rows) {
      if (FieldEncryptionService.isEncrypted(row.greeting)) continue;

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

      pending.push({
        id: row.id,
        params: [
          encGreeting, encLoveHeadline, encLoveMessage,
          encEnergyHeadline, encEnergyMessage,
          encGrowthHeadline, encGrowthMessage,
          encGentleReminder, encJournalPrompt, encSignals,
          row.id,
        ],
      });
      encrypted++;
    }

    // Write all encrypted values atomically
    await db.withTransactionAsync(async () => {
      for (const p of pending) {
        await db.runAsync(
          `UPDATE insight_history SET
             greeting = ?, love_headline = ?, love_message = ?,
             energy_headline = ?, energy_message = ?,
             growth_headline = ?, growth_message = ?,
             gentle_reminder = ?, journal_prompt = ?, signals = ?
           WHERE id = ?`,
          p.params,
        );
      }
    });

    logger.info(`[LocalDB] Version 14 migration complete — encrypted ${encrypted} insight rows`);
  }

  /**
   * Version 15 — Add sleep_entries table for sleep tracking and dream journaling.
   * dream_text and notes are encrypted at rest (like journal_entries.content).
   */
  private async migrateToVersion15(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 15 (sleep entries)...');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sleep_entries (
        id TEXT PRIMARY KEY,
        chart_id TEXT NOT NULL,
        date TEXT NOT NULL,
        duration_hours REAL,
        quality INTEGER,
        dream_text TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (chart_id) REFERENCES saved_charts(id)
      );

      CREATE INDEX IF NOT EXISTS idx_sleep_entries_date ON sleep_entries(date);
      CREATE INDEX IF NOT EXISTS idx_sleep_entries_chart ON sleep_entries(chart_id);
    `);

    logger.info('[LocalDB] Version 15 migration complete');
  }

  /**
   * Version 16 — Add dream_mood column to sleep_entries.
   * Stores the user's feeling during the dream (e.g. peaceful, anxious, surreal).
   */
  private async migrateToVersion16(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 16 (dream mood)...');

    // Idempotent: check if column already exists before adding
    const info16 = (await db.getAllAsync('PRAGMA table_info(sleep_entries)')) as any[];
    const cols16 = info16.map((col) => col.name);
    if (!cols16.includes('dream_mood')) {
      await db.execAsync(`ALTER TABLE sleep_entries ADD COLUMN dream_mood TEXT;`);
    }

    logger.info('[LocalDB] Version 16 migration complete');
  }

  /**
   * Version 17 — Add dream_feelings and dream_metadata columns to sleep_entries.
   * dream_feelings: JSON string of SelectedFeeling[] (encrypted at rest)
   * dream_metadata: JSON string of DreamMetadata (encrypted at rest)
   */
  private async migrateToVersion17(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 17 (dream feelings & metadata)...');

    // Idempotent: check existing columns before adding
    const info17 = (await db.getAllAsync('PRAGMA table_info(sleep_entries)')) as any[];
    const cols17 = info17.map((col) => col.name);
    if (!cols17.includes('dream_feelings')) {
      await db.execAsync(`ALTER TABLE sleep_entries ADD COLUMN dream_feelings TEXT;`);
    }
    if (!cols17.includes('dream_metadata')) {
      await db.execAsync(`ALTER TABLE sleep_entries ADD COLUMN dream_metadata TEXT;`);
    }

    logger.info('[LocalDB] Version 17 migration complete');
  }

  /**
   * Version 18 — Add compound indexes for common query patterns.
   * Dramatically speeds up filtered + sorted queries at 10k+ rows.
   */
  private async migrateToVersion18(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 18 (compound indexes)...');

    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_journal_entries_active_date
        ON journal_entries(is_deleted, date DESC, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_check_ins_chart_date
        ON daily_check_ins(chart_id, date DESC, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_insight_history_chart_date
        ON insight_history(chart_id, date DESC);
      CREATE INDEX IF NOT EXISTS idx_sleep_entries_chart_date
        ON sleep_entries(chart_id, date DESC);
    `);

    logger.info('[LocalDB] Version 18 migration complete');
  }

  /**
   * Version 19 — Encrypt latitude/longitude in saved_charts and relationship_charts.
   * These are precise birth coordinates (PII when combined with birth date/time).
   * SQLite uses dynamic typing so REAL columns can store TEXT (encrypted) values.
   * Idempotent: skips rows that already have ENC2: prefix.
   */
  private async migrateToVersion19(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Starting version 19 migration — encrypting lat/lng...');

    // Pre-read and pre-encrypt
    type CoordUpdate = { id: string; table: string; encLat: string; encLng: string };
    const pending: CoordUpdate[] = [];

    const charts = (await db.getAllAsync(
      'SELECT id, latitude, longitude FROM saved_charts WHERE latitude IS NOT NULL'
    )) as any[];
    for (const row of charts) {
      const latStr = String(row.latitude);
      if (FieldEncryptionService.isEncrypted(latStr)) continue;
      const encLat = await FieldEncryptionService.encryptField(latStr);
      const encLng = await FieldEncryptionService.encryptField(String(row.longitude));
      pending.push({ id: row.id, table: 'saved_charts', encLat, encLng });
    }

    const rels = (await db.getAllAsync(
      'SELECT id, latitude, longitude FROM relationship_charts WHERE latitude IS NOT NULL'
    )) as any[];
    for (const row of rels) {
      const latStr = String(row.latitude);
      if (FieldEncryptionService.isEncrypted(latStr)) continue;
      const encLat = await FieldEncryptionService.encryptField(latStr);
      const encLng = await FieldEncryptionService.encryptField(String(row.longitude));
      pending.push({ id: row.id, table: 'relationship_charts', encLat, encLng });
    }

    await db.withTransactionAsync(async () => {
      for (const p of pending) {
        await db.runAsync(
          `UPDATE ${p.table} SET latitude = ?, longitude = ? WHERE id = ?`,
          [p.encLat, p.encLng, p.id],
        );
      }
    });

    logger.info(`[LocalDB] Version 19 migration complete — encrypted ${pending.length} coordinate pairs`);
  }

  /**
   * Version 20 — Add tags column to journal_entries.
   * Stores a JSON array of user-selected tag strings (plaintext; not PII).
   */
  private async migrateToVersion20(): Promise<void> {
    const db = await this.ensureReady();
    logger.info('[LocalDB] Migrating to version 20 (journal tags)...');

    const tableInfo = (await db.getAllAsync('PRAGMA table_info(journal_entries)')) as any[];
    const columns = tableInfo.map((col) => col.name);
    if (!columns.includes('tags')) {
      await db.execAsync('ALTER TABLE journal_entries ADD COLUMN tags TEXT;');
      logger.info('[LocalDB] Added tags column to journal_entries');
    }

    logger.info('[LocalDB] Version 20 migration complete');
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
    const encLatitude = await FieldEncryptionService.encryptField(String(chart.latitude));
    const encLongitude = await FieldEncryptionService.encryptField(String(chart.longitude));

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
        encLatitude,
        encLongitude,
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
      (result as any[]).map(async (row: any) => {
        const latStr = row.latitude != null ? await FieldEncryptionService.decryptField(String(row.latitude)) : '0';
        const lngStr = row.longitude != null ? await FieldEncryptionService.decryptField(String(row.longitude)) : '0';
        const decName = row.name ? await FieldEncryptionService.decryptField(row.name) : row.name;
        const decBirthDate = await FieldEncryptionService.decryptField(row.birth_date);
        const decBirthTime = row.birth_time ? await FieldEncryptionService.decryptField(row.birth_time) : row.birth_time;
        const decBirthPlace = await FieldEncryptionService.decryptField(row.birth_place);

        // Guard against DECRYPTION_FAILED_PLACEHOLDER producing NaN coordinates
        const safeLat = isDecryptionFailure(latStr) ? 0 : (parseFloat(latStr) || 0);
        const safeLng = isDecryptionFailure(lngStr) ? 0 : (parseFloat(lngStr) || 0);

        if (isDecryptionFailure(latStr) || isDecryptionFailure(lngStr) || isDecryptionFailure(decBirthPlace)) {
          logger.error(`[LocalDB] Chart ${row.id} has decryption failures — coordinates or birth place unreadable`);
        }

        return {
          id: row.id,
          name: isDecryptionFailure(decName) ? '' : decName,
          birthDate: isDecryptionFailure(decBirthDate) ? '' : decBirthDate,
          birthTime: isDecryptionFailure(decBirthTime) ? undefined : decBirthTime,
          hasUnknownTime: row.has_unknown_time === 1,
          birthPlace: isDecryptionFailure(decBirthPlace) ? '' : decBirthPlace,
          latitude: safeLat,
          longitude: safeLng,
          timezone: row.timezone || undefined,
          houseSystem: row.house_system || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          isDeleted: row.is_deleted === 1,
        };
      })
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
        content_word_count, content_reading_minutes, tags,
        created_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        entry.tags && entry.tags.length > 0 ? JSON.stringify(entry.tags) : null,
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

  /**
   * Paginated journal entries — uses compound index.
   * Returns `pageSize` entries starting after `afterDate`/`afterCreatedAt`.
   * First page: omit cursor args.
   */
  async getJournalEntriesPaginated(
    pageSize = 30,
    afterDate?: string,
    afterCreatedAt?: string,
  ): Promise<JournalEntry[]> {
    const db = await this.ensureReady();

    let query: string;
    let params: any[];

    if (afterDate && afterCreatedAt) {
      // Keyset pagination: fetch next page after the cursor
      query = `SELECT * FROM journal_entries
               WHERE is_deleted = 0
                 AND (date < ? OR (date = ? AND created_at < ?))
               ORDER BY date DESC, created_at DESC
               LIMIT ?`;
      params = [afterDate, afterDate, afterCreatedAt, pageSize];
    } else {
      query = `SELECT * FROM journal_entries
               WHERE is_deleted = 0
               ORDER BY date DESC, created_at DESC
               LIMIT ?`;
      params = [pageSize];
    }

    const result = await db.getAllAsync(query, params);
    return Promise.all((result as any[]).map(async (row: any) => this.mapJournalRow(row)));
  }

  /**
   * Count non-deleted journal entries without decrypting any rows.
   */
  async getJournalEntryCount(): Promise<number> {
    const db = await this.ensureReady();
    const row = await db.getFirstAsync(
      'SELECT COUNT(*) as cnt FROM journal_entries WHERE is_deleted = 0'
    );
    return (row as any)?.cnt ?? 0;
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
      tags: row.tags ? (() => { try { return JSON.parse(row.tags); } catch { return undefined; } })() : undefined,
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
       SET date = ?, mood = ?, moon_phase = ?, title = ?, content = ?, chart_id = ?, transit_snapshot = ?,
           content_keywords_enc = ?, content_emotions_enc = ?, content_sentiment_enc = ?,
           content_word_count = ?, content_reading_minutes = ?, tags = ?,
           updated_at = ?
       WHERE id = ?`,
      [
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
        entry.tags && entry.tags.length > 0 ? JSON.stringify(entry.tags) : null,
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

    // Wrap all DELETEs in a single transaction so deletion is atomic.
    // Either all tables are cleared, or none are (on crash / error).
    await db.execAsync(`
      BEGIN TRANSACTION;
      DELETE FROM saved_charts;
      DELETE FROM journal_entries;
      DELETE FROM app_settings;
      DELETE FROM daily_check_ins;
      DELETE FROM insight_history;
      DELETE FROM relationship_charts;
      DELETE FROM sleep_entries;
      DELETE FROM migration_markers;
      COMMIT;
    `);
    await db.execAsync('VACUUM;');
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
  // Sleep Entry operations
  // ─────────────────────────────────────────────────────────────────────────────

  async saveSleepEntry(entry: SleepEntry): Promise<void> {
    const db = await this.ensureReady();

    const encDreamText = entry.dreamText
      ? await FieldEncryptionService.encryptField(entry.dreamText)
      : null;
    const encNotes = entry.notes
      ? await FieldEncryptionService.encryptField(entry.notes)
      : null;
    const encDreamFeelings = entry.dreamFeelings
      ? await FieldEncryptionService.encryptField(entry.dreamFeelings)
      : null;
    const encDreamMetadata = entry.dreamMetadata
      ? await FieldEncryptionService.encryptField(entry.dreamMetadata)
      : null;

    await db.runAsync(
      `INSERT OR REPLACE INTO sleep_entries
       (id, chart_id, date, duration_hours, quality, dream_text, dream_mood, dream_feelings, dream_metadata, notes, created_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.chartId,
        entry.date,
        entry.durationHours ?? null,
        entry.quality ?? null,
        encDreamText,
        entry.dreamMood ? await FieldEncryptionService.encryptField(entry.dreamMood) : null,
        encDreamFeelings,
        encDreamMetadata,
        encNotes,
        entry.createdAt,
        entry.updatedAt,
        entry.isDeleted ? 1 : 0,
      ]
    );
  }

  async getSleepEntries(chartId: string, limit = 30): Promise<SleepEntry[]> {
    const db = await this.ensureReady();

    const rows = (await db.getAllAsync(
      'SELECT * FROM sleep_entries WHERE chart_id = ? AND is_deleted = 0 ORDER BY date DESC LIMIT ?',
      [chartId, limit]
    )) as any[];

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        chartId: row.chart_id,
        date: row.date,
        durationHours: row.duration_hours ?? undefined,
        quality: row.quality ?? undefined,
        dreamText: row.dream_text
          ? await FieldEncryptionService.decryptField(row.dream_text)
          : undefined,
        dreamMood: row.dream_mood
          ? await FieldEncryptionService.decryptField(row.dream_mood)
          : undefined,
        dreamFeelings: row.dream_feelings
          ? await FieldEncryptionService.decryptField(row.dream_feelings)
          : undefined,
        dreamMetadata: row.dream_metadata
          ? await FieldEncryptionService.decryptField(row.dream_metadata)
          : undefined,
        notes: row.notes
          ? await FieldEncryptionService.decryptField(row.notes)
          : undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isDeleted: row.is_deleted === 1,
      }))
    );
  }

  async deleteSleepEntry(id: string): Promise<void> {
    const db = await this.ensureReady();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE sleep_entries SET is_deleted = 1, updated_at = ? WHERE id = ?',
      [now, id]
    );
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
    const encLatitude = await FieldEncryptionService.encryptField(String(chart.latitude));
    const encLongitude = await FieldEncryptionService.encryptField(String(chart.longitude));

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
        encLatitude,
        encLongitude,
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
    const decName = await FieldEncryptionService.decryptField(row.name);
    const decBirthDate = await FieldEncryptionService.decryptField(row.birth_date);
    const decBirthTime = row.birth_time ? await FieldEncryptionService.decryptField(row.birth_time) : row.birth_time;
    const decBirthPlace = await FieldEncryptionService.decryptField(row.birth_place);
    const latStr = await FieldEncryptionService.decryptField(String(row.latitude));
    const lngStr = await FieldEncryptionService.decryptField(String(row.longitude));

    const safeLat = isDecryptionFailure(latStr) ? 0 : (parseFloat(latStr) || 0);
    const safeLng = isDecryptionFailure(lngStr) ? 0 : (parseFloat(lngStr) || 0);

    if (isDecryptionFailure(latStr) || isDecryptionFailure(lngStr) || isDecryptionFailure(decName)) {
      logger.error(`[LocalDB] Relationship chart ${row.id} has decryption failures`);
    }

    return {
      id: row.id,
      name: isDecryptionFailure(decName) ? '' : decName,
      relationship: row.relationship,
      birthDate: isDecryptionFailure(decBirthDate) ? '' : decBirthDate,
      birthTime: isDecryptionFailure(decBirthTime) ? undefined : decBirthTime,
      hasUnknownTime: row.has_unknown_time === 1,
      birthPlace: isDecryptionFailure(decBirthPlace) ? '' : decBirthPlace,
      latitude: safeLat,
      longitude: safeLng,
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
    // Encrypt mental-health indicators — these are sensitive health data
    const encMoodScore = await FieldEncryptionService.encryptField(String(checkIn.moodScore));
    const encEnergyLevel = await FieldEncryptionService.encryptField(checkIn.energyLevel);
    const encStressLevel = await FieldEncryptionService.encryptField(checkIn.stressLevel);
    const encTags = await FieldEncryptionService.encryptField(JSON.stringify(checkIn.tags));

    // Atomic UPSERT — eliminates the check-then-act race condition.
    // Requires a UNIQUE index on (date, chart_id, time_of_day); the v12/v13
    // migration already rebuilt the table with these columns.
    await db.runAsync(
      `INSERT INTO daily_check_ins
         (id, date, chart_id, time_of_day, mood_score, energy_level, stress_level, tags, note, wins, challenges,
          moon_sign, moon_house, sun_house, transit_events, lunar_phase, retrogrades, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(date, chart_id, time_of_day) DO UPDATE SET
         mood_score = excluded.mood_score,
         energy_level = excluded.energy_level,
         stress_level = excluded.stress_level,
         tags = excluded.tags,
         note = excluded.note,
         wins = excluded.wins,
         challenges = excluded.challenges,
         moon_sign = excluded.moon_sign,
         moon_house = excluded.moon_house,
         sun_house = excluded.sun_house,
         transit_events = excluded.transit_events,
         lunar_phase = excluded.lunar_phase,
         retrogrades = excluded.retrogrades,
         updated_at = excluded.updated_at`,
      [
        checkIn.id,
        checkIn.date,
        checkIn.chartId,
        checkIn.timeOfDay,
        encMoodScore,
        encEnergyLevel,
        encStressLevel,
        encTags,
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

  /**
   * SQL-level date-range filter — avoids loading + decrypting all rows.
   */
  async getCheckInsInRange(
    chartId: string,
    startDate: string,
    endDate: string,
  ): Promise<DailyCheckIn[]> {
    const db = await this.ensureReady();
    const rows = await db.getAllAsync(
      `SELECT * FROM daily_check_ins
       WHERE chart_id = ? AND date >= ? AND date <= ?
       ORDER BY date DESC, created_at DESC`,
      [chartId, startDate, endDate],
    );
    return Promise.all((rows as any[]).map((row: any) => this.mapCheckInRow(row)));
  }

  /**
   * Count check-ins without decrypting any rows.
   */
  async getCheckInCount(chartId: string): Promise<number> {
    const db = await this.ensureReady();
    const row = await db.getFirstAsync(
      'SELECT COUNT(*) as cnt FROM daily_check_ins WHERE chart_id = ?',
      [chartId],
    );
    return (row as any)?.cnt ?? 0;
  }

  private async mapCheckInRow(row: any): Promise<DailyCheckIn> {
    // Safely decrypt each field, guarding against DECRYPTION_FAILED_PLACEHOLDER
    // which would crash Number() / JSON.parse() calls.
    const decMoodScore = row.mood_score ? await FieldEncryptionService.decryptField(row.mood_score) : null;
    const decEnergyLevel = row.energy_level ? await FieldEncryptionService.decryptField(row.energy_level) : null;
    const decStressLevel = row.stress_level ? await FieldEncryptionService.decryptField(row.stress_level) : null;
    const decTags = row.tags ? await FieldEncryptionService.decryptField(row.tags) : null;
    const decNote = row.note ? await FieldEncryptionService.decryptField(row.note) : null;
    const decWins = row.wins ? await FieldEncryptionService.decryptField(row.wins) : null;
    const decChallenges = row.challenges ? await FieldEncryptionService.decryptField(row.challenges) : null;

    const safeParseMood = (val: string | null): number => {
      if (!val || isDecryptionFailure(val)) return 0;
      const n = Number(val);
      return Number.isFinite(n) ? n : 0;
    };

    const safeParseArray = (val: string | null): any[] => {
      if (!val || isDecryptionFailure(val)) return [];
      try { return JSON.parse(val); } catch { return []; }
    };

    return {
      id: row.id,
      date: row.date,
      chartId: row.chart_id,
      timeOfDay: row.time_of_day || 'morning',
      moodScore: safeParseMood(decMoodScore),
      energyLevel: isDecryptionFailure(decEnergyLevel) ? '' : (decEnergyLevel ?? row.energy_level),
      stressLevel: isDecryptionFailure(decStressLevel) ? '' : (decStressLevel ?? row.stress_level),
      tags: safeParseArray(decTags),
      note: isDecryptionFailure(decNote) ? '' : (decNote ?? row.note),
      wins: isDecryptionFailure(decWins) ? '' : (decWins ?? row.wins),
      challenges: isDecryptionFailure(decChallenges) ? '' : (decChallenges ?? row.challenges),
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
