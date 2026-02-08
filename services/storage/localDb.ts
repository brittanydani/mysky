import * as SQLite from 'expo-sqlite';
import { SavedChart, JournalEntry, AppSettings, CachedInterpretation, RelationshipChart } from './models';
import { SavedInsight } from './insightHistory';
import { DailyCheckIn } from '../patterns/types';
import { logger } from '../../utils/logger';

const CURRENT_DB_VERSION = 6;

class LocalDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await SQLite.openDatabaseAsync('mysky.db');
    await this.handleMigrations();
  }

  private async handleMigrations(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Get current version
    const result = await this.db.getFirstAsync('PRAGMA user_version');
    const currentVersion = (result as any)?.user_version || 0;

    logger.info(`[LocalDB] Current version: ${currentVersion}, Target version: ${CURRENT_DB_VERSION}`);

    if (currentVersion < CURRENT_DB_VERSION) {
      await this.runMigrations(currentVersion);
      await this.db.execAsync(`PRAGMA user_version = ${CURRENT_DB_VERSION}`);
      logger.info(`[LocalDB] Migrated to version ${CURRENT_DB_VERSION}`);
    }
  }

  private async runMigrations(fromVersion: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Migration from version 0 to 1 (initial schema)
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
  }

  private async createInitialSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    logger.info('[LocalDB] Creating initial schema...');

    // Create saved_charts table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS saved_charts (
        id TEXT PRIMARY KEY,
        name TEXT,
        birth_date TEXT NOT NULL,
        birth_time TEXT,
        has_unknown_time INTEGER NOT NULL DEFAULT 0,
        birth_place TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        house_system TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Create journal_entries table
    await this.db.execAsync(`
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

    // Create app_settings table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        cloud_sync_enabled INTEGER NOT NULL DEFAULT 0,
        last_sync_at TEXT,
        user_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Create migration_markers table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS migration_markers (
        key TEXT PRIMARY KEY,
        completed_at TEXT NOT NULL
      );
    `);

    // Create cached_interpretations table
    await this.db.execAsync(`
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

    // Create indexes for performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_saved_charts_updated_at ON saved_charts(updated_at);
      CREATE INDEX IF NOT EXISTS idx_saved_charts_is_deleted ON saved_charts(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_updated_at ON journal_entries(updated_at);
      CREATE INDEX IF NOT EXISTS idx_journal_entries_is_deleted ON journal_entries(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_cached_interpretations_chart_id ON cached_interpretations(chart_id);
    `);

    // Insert default settings if not exists
    const settings = await this.getSettings();
    if (!settings) {
      await this.updateSettings({
        id: 'default',
        cloudSyncEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    logger.info('[LocalDB] Initial schema created successfully');
  }

  private async migrateToVersion2(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    logger.info('[LocalDB] Migrating to version 2...');

    // Check if house_system column already exists (it's in the initial schema now)
    try {
      const tableInfo = await this.db.getAllAsync('PRAGMA table_info(saved_charts)');
      const hasHouseSystem = (tableInfo as any[]).some(col => col.name === 'house_system');
      
      if (!hasHouseSystem) {
        await this.db.execAsync(`
          ALTER TABLE saved_charts ADD COLUMN house_system TEXT;
        `);
        logger.info('[LocalDB] Added house_system column');
      } else {
        logger.info('[LocalDB] house_system column already exists, skipping');
      }
    } catch (error) {
      logger.warn('[LocalDB] Version 2 migration skipped - column may already exist', error);
    }
  }

  private async migrateToVersion3(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    logger.info('[LocalDB] Migrating to version 3 (insight history)...');

    // Create insight_history table
    await this.db.execAsync(`
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

    // Create indexes for performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_insight_history_date ON insight_history(date);
      CREATE INDEX IF NOT EXISTS idx_insight_history_chart_id ON insight_history(chart_id);
      CREATE INDEX IF NOT EXISTS idx_insight_history_favorite ON insight_history(is_favorite);
    `);

    logger.info('[LocalDB] Version 3 migration complete');
  }

  private async migrateToVersion4(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    logger.info('[LocalDB] Migrating to version 4 (relationship charts)...');

    // Create relationship_charts table
    await this.db.execAsync(`
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

    // Create indexes for performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_relationship_charts_user ON relationship_charts(user_chart_id);
      CREATE INDEX IF NOT EXISTS idx_relationship_charts_deleted ON relationship_charts(is_deleted);
    `);

    logger.info('[LocalDB] Version 4 migration complete');
  }

  // Chart operations
  async upsertChart(chart: SavedChart): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO saved_charts 
       (id, name, birth_date, birth_time, has_unknown_time, birth_place, latitude, longitude, house_system, created_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chart.id,
        chart.name || null,
        chart.birthDate,
        chart.birthTime || null,
        chart.hasUnknownTime ? 1 : 0,
        chart.birthPlace,
        chart.latitude,
        chart.longitude,
        chart.houseSystem || null,
        chart.createdAt,
        chart.updatedAt,
        chart.isDeleted ? 1 : 0,
      ]
    );
  }

  async getCharts(): Promise<SavedChart[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM saved_charts WHERE is_deleted = 0 ORDER BY created_at DESC'
    );

    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      birthDate: row.birth_date,
      birthTime: row.birth_time,
      hasUnknownTime: row.has_unknown_time === 1,
      birthPlace: row.birth_place,
      latitude: row.latitude,
      longitude: row.longitude,
      houseSystem: row.house_system || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted === 1,
    }));
  }

  async updateAllChartsHouseSystem(houseSystem: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE saved_charts SET house_system = ?, updated_at = ? WHERE is_deleted = 0',
      [houseSystem, now]
    );
  }

  async deleteChart(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE saved_charts SET is_deleted = 1, updated_at = ? WHERE id = ?',
      [now, id]
    );
  }

  async hardDeleteChart(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM saved_charts WHERE id = ?', [id]);
  }

  // Journal operations
  async addJournalEntry(entry: JournalEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT INTO journal_entries 
       (id, date, mood, moon_phase, title, content, created_at, updated_at, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.date,
        entry.mood,
        entry.moonPhase,
        entry.title || null,
        entry.content,
        entry.createdAt,
        entry.updatedAt,
        entry.isDeleted ? 1 : 0,
      ]
    );
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM journal_entries WHERE is_deleted = 0 ORDER BY date DESC, created_at DESC'
    );

    return result.map((row: any) => ({
      id: row.id,
      date: row.date,
      mood: row.mood,
      moonPhase: row.moon_phase,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted === 1,
    }));
  }

  async updateJournalEntry(entry: JournalEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE journal_entries 
       SET mood = ?, moon_phase = ?, title = ?, content = ?, updated_at = ?
       WHERE id = ?`,
      [entry.mood, entry.moonPhase, entry.title || null, entry.content, entry.updatedAt, entry.id]
    );
  }

  async deleteJournalEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE journal_entries SET is_deleted = 1, updated_at = ? WHERE id = ?',
      [now, id]
    );
  }

  async hardDeleteJournalEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
  }

  // Settings operations
  async getSettings(): Promise<AppSettings | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM app_settings WHERE id = ?',
      ['default']
    );

    if (!result) return null;

    return {
      id: (result as any).id,
      cloudSyncEnabled: (result as any).cloud_sync_enabled === 1,
      lastSyncAt: (result as any).last_sync_at,
      userId: (result as any).user_id,
      createdAt: (result as any).created_at,
      updatedAt: (result as any).updated_at,
    };
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO app_settings 
       (id, cloud_sync_enabled, last_sync_at, user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        settings.id,
        settings.cloudSyncEnabled ? 1 : 0,
        settings.lastSyncAt || null,
        settings.userId || null,
        settings.createdAt,
        settings.updatedAt,
      ]
    );
  }

  // Get entries modified since timestamp (for sync)
  async getChartsModifiedSince(timestamp: string): Promise<SavedChart[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM saved_charts WHERE updated_at > ? ORDER BY updated_at ASC',
      [timestamp]
    );

    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      birthDate: row.birth_date,
      birthTime: row.birth_time,
      hasUnknownTime: row.has_unknown_time === 1,
      birthPlace: row.birth_place,
      latitude: row.latitude,
      longitude: row.longitude,
      houseSystem: row.house_system || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted === 1,
    }));
  }

  async getJournalEntriesModifiedSince(timestamp: string): Promise<JournalEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM journal_entries WHERE updated_at > ? ORDER BY updated_at ASC',
      [timestamp]
    );

    return result.map((row: any) => ({
      id: row.id,
      date: row.date,
      mood: row.mood,
      moonPhase: row.moon_phase,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted === 1,
    }));
  }

  async hardDeleteAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DELETE FROM saved_charts;
      DELETE FROM journal_entries;
      DELETE FROM cached_interpretations;
      DELETE FROM app_settings;
      VACUUM;
    `);
    // Note: migration_markers is intentionally preserved
  }

  // Alias methods for consistency with other parts of the app
  async saveChart(chart: SavedChart): Promise<void> {
    return this.upsertChart(chart);
  }

  async saveJournalEntry(entry: JournalEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const exists = await this.db.getFirstAsync(
      'SELECT id FROM journal_entries WHERE id = ?',
      [entry.id]
    );
    
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
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.getFirstAsync(
      'SELECT key FROM migration_markers WHERE key = ?',
      [key]
    );
    return result != null;
  }

  async setMigrationMarker(key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'INSERT OR REPLACE INTO migration_markers (key, completed_at) VALUES (?, ?)',
      [key, new Date().toISOString()]
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Insight History Operations
  // ─────────────────────────────────────────────────────────────────────────────

  async saveInsight(insight: SavedInsight): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO insight_history 
       (id, date, chart_id, greeting, love_headline, love_message, energy_headline, 
        energy_message, growth_headline, growth_message, gentle_reminder, journal_prompt,
        moon_sign, moon_phase, signals, is_favorite, viewed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        insight.id,
        insight.date,
        insight.chartId,
        insight.greeting,
        insight.loveHeadline,
        insight.loveMessage,
        insight.energyHeadline,
        insight.energyMessage,
        insight.growthHeadline,
        insight.growthMessage,
        insight.gentleReminder,
        insight.journalPrompt,
        insight.moonSign || null,
        insight.moonPhase || null,
        insight.signals || null,
        insight.isFavorite ? 1 : 0,
        insight.viewedAt || null,
        insight.createdAt,
        insight.updatedAt,
      ]
    );
  }

  async getInsightByDate(date: string, chartId: string): Promise<SavedInsight | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM insight_history WHERE date = ? AND chart_id = ?',
      [date, chartId]
    );

    if (!result) return null;
    return this.mapInsightRow(result);
  }

  async getInsightById(id: string): Promise<SavedInsight | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM insight_history WHERE id = ?',
      [id]
    );

    if (!result) return null;
    return this.mapInsightRow(result);
  }

  async getInsightHistory(
    chartId: string,
    options?: {
      limit?: number;
      startDate?: string;
      endDate?: string;
      favoritesOnly?: boolean;
    }
  ): Promise<SavedInsight[]> {
    if (!this.db) throw new Error('Database not initialized');

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

    const result = await this.db.getAllAsync(query, params);
    return result.map((row: any) => this.mapInsightRow(row));
  }

  async updateInsightFavorite(id: string, isFavorite: boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE insight_history SET is_favorite = ?, updated_at = ? WHERE id = ?',
      [isFavorite ? 1 : 0, now, id]
    );
  }

  async updateInsightViewedAt(id: string, viewedAt: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE insight_history SET viewed_at = ? WHERE id = ?',
      [viewedAt, id]
    );
  }

  private mapInsightRow(row: any): SavedInsight {
    return {
      id: row.id,
      date: row.date,
      chartId: row.chart_id,
      greeting: row.greeting,
      loveHeadline: row.love_headline,
      loveMessage: row.love_message,
      energyHeadline: row.energy_headline,
      energyMessage: row.energy_message,
      growthHeadline: row.growth_headline,
      growthMessage: row.growth_message,
      gentleReminder: row.gentle_reminder,
      journalPrompt: row.journal_prompt,
      moonSign: row.moon_sign,
      moonPhase: row.moon_phase,
      signals: row.signals,
      isFavorite: row.is_favorite === 1,
      viewedAt: row.viewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Relationship chart operations
  async saveRelationshipChart(chart: RelationshipChart): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO relationship_charts 
       (id, name, relationship, birth_date, birth_time, has_unknown_time, birth_place, 
        latitude, longitude, timezone, user_chart_id, created_at, updated_at, is_deleted, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        chart.id,
        chart.name,
        chart.relationship,
        chart.birthDate,
        chart.birthTime || null,
        chart.hasUnknownTime ? 1 : 0,
        chart.birthPlace,
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
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM relationship_charts WHERE is_deleted = 0';
    const params: any[] = [];

    if (userChartId) {
      query += ' AND user_chart_id = ?';
      params.push(userChartId);
    }

    query += ' ORDER BY updated_at DESC';

    const result = await this.db.getAllAsync(query, params);
    return result.map((row: any) => this.mapRelationshipRow(row));
  }

  async getRelationshipChartById(id: string): Promise<RelationshipChart | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync(
      'SELECT * FROM relationship_charts WHERE id = ? AND is_deleted = 0',
      [id]
    );

    return result ? this.mapRelationshipRow(result) : null;
  }

  async deleteRelationshipChart(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    await this.db.runAsync(
      'UPDATE relationship_charts SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?',
      [now, now, id]
    );
  }

  async getRelationshipChartCount(userChartId?: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT COUNT(*) as count FROM relationship_charts WHERE is_deleted = 0';
    const params: any[] = [];

    if (userChartId) {
      query += ' AND user_chart_id = ?';
      params.push(userChartId);
    }

    const result = await this.db.getFirstAsync(query, params) as any;
    return result?.count ?? 0;
  }

  private mapRelationshipRow(row: any): RelationshipChart {
    return {
      id: row.id,
      name: row.name,
      relationship: row.relationship,
      birthDate: row.birth_date,
      birthTime: row.birth_time,
      hasUnknownTime: row.has_unknown_time === 1,
      birthPlace: row.birth_place,
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

  // ═══════════════════════════════════════════════════
  // Migration v5: Daily Check-Ins (Pattern Tracking)
  // ═══════════════════════════════════════════════════

  private async migrateToVersion5(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    logger.info('[LocalDB] Migrating to version 5 (daily check-ins)...');

    await this.db.execAsync(`
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

    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_check_ins_date ON daily_check_ins(date);
      CREATE INDEX IF NOT EXISTS idx_check_ins_chart ON daily_check_ins(chart_id);
      CREATE INDEX IF NOT EXISTS idx_check_ins_mood ON daily_check_ins(mood_score);
    `);

    logger.info('[LocalDB] Version 5 migration complete');
  }

  private async migrateToVersion6(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    logger.info('[LocalDB] Migrating to version 6 (migration markers)...');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS migration_markers (
        key TEXT PRIMARY KEY,
        completed_at TEXT NOT NULL
      );
    `);

    logger.info('[LocalDB] Version 6 migration complete');
  }

  // ═══════════════════════════════════════════════════
  // Check-In CRUD
  // ═══════════════════════════════════════════════════

  async saveCheckIn(checkIn: DailyCheckIn): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `INSERT OR REPLACE INTO daily_check_ins
       (id, date, chart_id, mood_score, energy_level, stress_level, tags, note, wins, challenges,
        moon_sign, moon_house, sun_house, transit_events, lunar_phase, retrogrades, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        checkIn.id,
        checkIn.date,
        checkIn.chartId,
        checkIn.moodScore,
        checkIn.energyLevel,
        checkIn.stressLevel,
        JSON.stringify(checkIn.tags),
        checkIn.note || null,
        checkIn.wins || null,
        checkIn.challenges || null,
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
    if (!this.db) throw new Error('Database not initialized');

    const row = await this.db.getFirstAsync(
      'SELECT * FROM daily_check_ins WHERE date = ? AND chart_id = ?',
      [date, chartId]
    );

    if (!row) return null;
    return this.mapCheckInRow(row);
  }

  async getCheckIns(chartId: string, limit?: number): Promise<DailyCheckIn[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM daily_check_ins WHERE chart_id = ? ORDER BY date DESC';
    const params: any[] = [chartId];

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const rows = await this.db.getAllAsync(query, params);
    return (rows as any[]).map(row => this.mapCheckInRow(row));
  }

  private mapCheckInRow(row: any): DailyCheckIn {
    return {
      id: row.id,
      date: row.date,
      chartId: row.chart_id,
      moodScore: row.mood_score,
      energyLevel: row.energy_level,
      stressLevel: row.stress_level,
      tags: JSON.parse(row.tags || '[]'),
      note: row.note,
      wins: row.wins,
      challenges: row.challenges,
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