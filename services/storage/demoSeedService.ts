/**
 * demoSeedService.ts
 *
 * Seeds demo data for Account B only.
 * Triggers automatically on sign-in for brithornick92@gmail.com if the
 * device has no existing seeded data for this account.
 *
 * This version preserves the storage style visible in the existing code:
 * - localDb for chart, settings, journals, sleep, and daily check-ins
 * - EncryptedAsyncStorage / AccountScopedAsyncStorage for profile-like surfaces
 */

import type { MoonPhaseKeyTag } from '../../utils/moonPhase';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { localDb } from './localDb';
import { EncryptedAsyncStorage } from './encryptedAsyncStorage';
import { AccountScopedAsyncStorage } from './accountScopedStorage';
import { FieldEncryptionService } from './fieldEncryption';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';
import { ACCOUNT_B_DEMO_SEED } from './demoAccountBSeed';

const DEMO_EMAIL = 'brithornick92@gmail.com';
const SEED_FLAG_KEY = '@mysky:demo_seeded_account_b_v1';
const DAILY_SEED_KEY = '@mysky:demo_last_seeded_account_b';

const CHART_ID = 'account-b-demo-chart';
const CHART_CREATED = new Date('2026-01-01T09:00:00.000Z').toISOString();
const SEED_DAYS = ACCOUNT_B_DEMO_SEED.dailyEntries.length;

const MOON_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const LUNAR_PHASES: MoonPhaseKeyTag[] = [
  'waxing_crescent',
  'first_quarter',
  'waxing_gibbous',
  'full',
  'waning_gibbous',
  'last_quarter',
  'waning_crescent',
  'new',
];

const SIMPLE_PHASES: ('new' | 'waxing' | 'full' | 'waning')[] = [
  'waxing', 'waxing', 'full', 'waning', 'waning', 'new',
];

function uid(): string {
  return Crypto.randomUUID();
}

function isoDate(d: Date): string {
  return toLocalDateString(d);
}

function dateFromISODateString(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00.000Z`);
}

function dayNumber(d: Date): number {
  return Math.floor(d.getTime() / 86400000);
}

function simpleMoonPhaseForIndex(i: number): 'new' | 'waxing' | 'full' | 'waning' {
  return SIMPLE_PHASES[i % SIMPLE_PHASES.length];
}

export const DemoSeedService = {
  isDemoAccount(email: string | null | undefined): boolean {
    return email?.toLowerCase() === DEMO_EMAIL;
  },

  async seedIfNeeded(email: string | null | undefined): Promise<void> {
    if (!DemoSeedService.isDemoAccount(email)) return;

    try {
      await localDb.initialize();

      const alreadySeeded = await AsyncStorage.getItem(SEED_FLAG_KEY);
      if (alreadySeeded !== 'true') {
        logger.info('[DemoSeed] Seeding Account B demo data…');
        await DemoSeedService._seed();
        await AsyncStorage.setItem(SEED_FLAG_KEY, 'true');
        await AsyncStorage.setItem(DAILY_SEED_KEY, isoDate(new Date()));
        logger.info('[DemoSeed] Account B demo seed complete.');
      } else {
        const repaired = await DemoSeedService._repairUnreadableDemoSeedData();
        if (repaired) {
          await AsyncStorage.setItem(DAILY_SEED_KEY, isoDate(new Date()));
          return;
        }

        await DemoSeedService._restoreLocalDemoDataIfMissing();
        await DemoSeedService._dailyTopUp();
      }
    } catch (e) {
      logger.error('[DemoSeed] Seed failed:', e);
    }
  },

  async cleanupStaleDemoArtifacts(email: string | null | undefined = null): Promise<void> {
    try {
      await localDb.initialize();

      if (DemoSeedService.isDemoAccount(email)) {
        await DemoSeedService._restoreLocalDemoDataIfMissing();
      }

      const db = await localDb.getDb();
      const result = await db.runAsync("DELETE FROM sync_queue WHERE record_id LIKE 'demo-%'");
      const removed = result?.changes ?? 0;

      if (removed > 0) {
        logger.info(`[DemoSeed] Removed ${removed} queued demo sync item${removed === 1 ? '' : 's'}.`);
      }
    } catch (e) {
      logger.error('[DemoSeed] Failed to clean queued demo sync items:', e);
    }
  },

  async _seed(): Promise<void> {
    const db = await localDb.getDb();

    await Promise.all([
      db.runAsync("DELETE FROM journal_entries WHERE id LIKE 'demo-%'"),
      db.runAsync("DELETE FROM sleep_entries WHERE id LIKE 'demo-%'"),
      db.runAsync("DELETE FROM daily_check_ins WHERE id LIKE 'demo-%'"),
      db.runAsync("DELETE FROM insight_history WHERE id LIKE 'demo-%'"),
      db.runAsync("DELETE FROM sync_queue WHERE record_id LIKE 'demo-%'"),
    ]);

    const allCharts = await localDb.getCharts();
    const chartIds = allCharts.map((c: any) => c.id);
    if (chartIds.length > 0) {
      for (const cid of chartIds) {
        await db.runAsync('DELETE FROM journal_entries WHERE chart_id = ?', [cid]);
        await db.runAsync('DELETE FROM sleep_entries WHERE chart_id = ?', [cid]);
        await db.runAsync('DELETE FROM daily_check_ins WHERE chart_id = ?', [cid]);
        await db.runAsync('DELETE FROM insight_history WHERE chart_id = ?', [cid]);
      }
    }

    await DemoSeedService._ensureChart();
    await DemoSeedService._seedHistoricalEntries();
    await DemoSeedService._seedSettingsAndStorage();

    await AsyncStorage.setItem(SEED_FLAG_KEY, 'true');
    await AsyncStorage.setItem(DAILY_SEED_KEY, isoDate(new Date()));
  },

  async _ensureChart(): Promise<void> {
    const existingCharts = await localDb.getCharts();
    const alreadyThere = existingCharts.find((c: any) => c.id === CHART_ID);
    if (alreadyThere) return;

    await localDb.saveChart({
      id: CHART_ID,
      name: ACCOUNT_B_DEMO_SEED.profile.displayName,
      birthDate: ACCOUNT_B_DEMO_SEED.profile.birthDate,
      birthTime: ACCOUNT_B_DEMO_SEED.profile.birthTime,
      hasUnknownTime: ACCOUNT_B_DEMO_SEED.profile.hasUnknownTime,
      birthPlace: ACCOUNT_B_DEMO_SEED.profile.birthPlace,
      latitude: ACCOUNT_B_DEMO_SEED.profile.latitude,
      longitude: ACCOUNT_B_DEMO_SEED.profile.longitude,
      timezone: ACCOUNT_B_DEMO_SEED.profile.timezone,
      houseSystem: ACCOUNT_B_DEMO_SEED.profile.houseSystem as import('../astrology/types').HouseSystem,
      createdAt: CHART_CREATED,
      updatedAt: CHART_CREATED,
      isDeleted: false,
    });
  },

  async _seedHistoricalEntries(): Promise<void> {
    for (let i = 0; i < ACCOUNT_B_DEMO_SEED.dailyEntries.length; i++) {
      const entry = ACCOUNT_B_DEMO_SEED.dailyEntries[i];
      const d = dateFromISODateString(entry.date);
      const idx = dayNumber(d);

      await localDb.saveJournalEntry({
        id: `demo-journal-${entry.date}`,
        date: entry.date,
        mood: DemoSeedService._journalMoodFromScore(entry.eveningMood),
        moonPhase: simpleMoonPhaseForIndex(i),
        title: DemoSeedService._titleFromPrompt(entry.promptResponse, i),
        content: entry.promptResponse,
        chartId: CHART_ID,
        tags: Array.from(new Set([...entry.morningTags, ...entry.eveningTags])).slice(0, 6),
        contentWordCount: entry.promptResponse.trim().split(/\s+/).length,
        contentReadingMinutes: 1,
        createdAt: new Date(`${entry.date}T15:00:00.000Z`).toISOString(),
        updatedAt: new Date(`${entry.date}T15:00:00.000Z`).toISOString(),
        isDeleted: false,
      });

      await localDb.saveSleepEntry({
        id: `demo-sleep-${entry.date}`,
        chartId: CHART_ID,
        date: entry.date,
        durationHours: entry.sleepHours,
        quality: DemoSeedService._sleepQualityFromHours(entry.sleepHours),
        dreamText: entry.dreamText || '',
        dreamFeelings: JSON.stringify(entry.dreamFeelings || []),
        dreamMetadata: JSON.stringify(entry.dreamMetadata || {}),
        createdAt: new Date(`${entry.date}T08:00:00.000Z`).toISOString(),
        updatedAt: new Date(`${entry.date}T08:00:00.000Z`).toISOString(),
        isDeleted: false,
      });

      await localDb.saveCheckIn({
        id: `demo-checkin-${entry.date}-morning`,
        date: entry.date,
        chartId: CHART_ID,
        timeOfDay: 'morning',
        moodScore: entry.morningMood,
        energyLevel: entry.morningEnergy,
        stressLevel: entry.morningStress,
        tags: entry.morningTags,
        note: entry.morningNote,
        wins: entry.morningWin,
        challenges: entry.morningChallenge,
        moonSign: MOON_SIGNS[i % MOON_SIGNS.length],
        moonHouse: 1 + (i % 12),
        sunHouse: 1 + ((i + 6) % 12),
        transitEvents: [
          {
            transitPlanet: 'Moon',
            natalPlanet: 'Venus',
            aspect: 'trine',
            orb: 1.2,
            isApplying: true,
          },
        ],
        lunarPhase: LUNAR_PHASES[i % LUNAR_PHASES.length],
        retrogrades: i % 5 === 0 ? ['Mercury'] : [],
        createdAt: new Date(`${entry.date}T09:00:00.000Z`).toISOString(),
        updatedAt: new Date(`${entry.date}T09:00:00.000Z`).toISOString(),
      });

      await localDb.saveCheckIn({
        id: `demo-checkin-${entry.date}-evening`,
        date: entry.date,
        chartId: CHART_ID,
        timeOfDay: 'evening',
        moodScore: entry.eveningMood,
        energyLevel: entry.eveningEnergy,
        stressLevel: entry.eveningStress,
        tags: entry.eveningTags,
        note: entry.eveningNote,
        wins: entry.eveningWin,
        challenges: entry.eveningChallenge,
        moonSign: MOON_SIGNS[(i + 2) % MOON_SIGNS.length],
        moonHouse: 1 + ((i + 1) % 12),
        sunHouse: 1 + ((i + 7) % 12),
        transitEvents: [
          {
            transitPlanet: 'Moon',
            natalPlanet: 'Saturn',
            aspect: 'opposition',
            orb: 2.1,
            isApplying: false,
          },
        ],
        lunarPhase: LUNAR_PHASES[(i + 1) % LUNAR_PHASES.length],
        retrogrades: i % 7 === 0 ? ['Mercury'] : [],
        createdAt: new Date(`${entry.date}T19:00:00.000Z`).toISOString(),
        updatedAt: new Date(`${entry.date}T19:00:00.000Z`).toISOString(),
      });

      await DemoSeedService._seedSupabaseDay(entry.date, idx);
    }
  },

  async _seedSettingsAndStorage(): Promise<void> {
    await localDb.saveSettings({
      id: uid(),
      cloudSyncEnabled: false,
      createdAt: CHART_CREATED,
      updatedAt: CHART_CREATED,
    });

    await EncryptedAsyncStorage.setItem('msky_user_name', ACCOUNT_B_DEMO_SEED.profile.displayName);
    await EncryptedAsyncStorage.setItem('@mysky:demo_premium', 'true');

    await EncryptedAsyncStorage.setItem(
      '@mysky:core_values',
      JSON.stringify(ACCOUNT_B_DEMO_SEED.coreValues),
    );

    await AccountScopedAsyncStorage.setItem(
      'mysky_custom_journal_tags',
      JSON.stringify(ACCOUNT_B_DEMO_SEED.customJournalTags),
    );

    await EncryptedAsyncStorage.setItem(
      '@mysky:archetype_profile',
      JSON.stringify(ACCOUNT_B_DEMO_SEED.archetypeProfile),
    );

    await EncryptedAsyncStorage.setItem(
      '@mysky:cognitive_style',
      JSON.stringify(ACCOUNT_B_DEMO_SEED.cognitiveStyle),
    );

    await EncryptedAsyncStorage.setItem(
      '@mysky:somatic_entries',
      JSON.stringify(
        ACCOUNT_B_DEMO_SEED.somaticEntries.map((entry) => ({
          id: uid(),
          date: entry.date,
          region: entry.region,
          emotion: entry.emotion,
          intensity: entry.intensity,
          note: entry.note,
          trigger: entry.trigger ?? '',
          whatHelped: entry.whatHelped ?? '',
        })),
      ),
    );

    await EncryptedAsyncStorage.setItem(
      '@mysky:trigger_events',
      JSON.stringify(
        ACCOUNT_B_DEMO_SEED.triggerEvents.map((entry) => ({
          id: uid(),
          timestamp: new Date(entry.date).getTime(),
          mode: entry.mode,
          event: entry.event,
          nsState: entry.nsState,
          sensations: entry.sensations,
          note: entry.note,
        })),
      ),
    );

    await EncryptedAsyncStorage.setItem(
      '@mysky:relationship_patterns',
      JSON.stringify(
        ACCOUNT_B_DEMO_SEED.relationshipPatterns.map((entry) => ({
          id: uid(),
          date: entry.date,
          note: entry.note,
          tags: entry.tags,
        })),
      ),
    );

    await EncryptedAsyncStorage.setItem(
      '@mysky:relationship_charts',
      JSON.stringify(
        ACCOUNT_B_DEMO_SEED.relationshipCharts.map((entry) => ({
          id: uid(),
          name: entry.name,
          relationship: entry.relationship,
          birthDate: entry.birthDate,
          birthTime: entry.birthTime,
          hasUnknownTime: entry.hasUnknownTime,
          birthPlace: entry.birthPlace,
          latitude: entry.latitude,
          longitude: entry.longitude,
          timezone: entry.timezone,
          dynamicNote: entry.dynamicNote,
        })),
      ),
    );
  },

  async _restoreLocalDemoDataIfMissing(): Promise<void> {
    const db = await localDb.getDb();
    const [journalRow, sleepRow, checkInRow] = await Promise.all([
      db.getFirstAsync("SELECT COUNT(*) as cnt FROM journal_entries WHERE id LIKE 'demo-journal-%'"),
      db.getFirstAsync("SELECT COUNT(*) as cnt FROM sleep_entries WHERE id LIKE 'demo-%'"),
      db.getFirstAsync("SELECT COUNT(*) as cnt FROM daily_check_ins WHERE id LIKE 'demo-checkin-%'"),
    ]);

    const journalCount = Number((journalRow as { cnt?: number } | null)?.cnt ?? 0);
    const sleepCount = Number((sleepRow as { cnt?: number } | null)?.cnt ?? 0);
    const checkInCount = Number((checkInRow as { cnt?: number } | null)?.cnt ?? 0);

    if (journalCount > 0 && sleepCount > 0 && checkInCount > 0) {
      return;
    }

    logger.info('[DemoSeed] Restoring missing Account B local demo content.');
    await DemoSeedService._seed();
  },

  async _dailyTopUp(): Promise<void> {
    const charts = await localDb.getCharts();
    if (!charts.length) return;

    const chartId = charts[0].id;
    const lastStr = await AsyncStorage.getItem(DAILY_SEED_KEY);
    const today = isoDate(new Date());

    if (lastStr === today) return;

    const todayRow = ACCOUNT_B_DEMO_SEED.dailyEntries[ACCOUNT_B_DEMO_SEED.dailyEntries.length - 1];
    if (!todayRow) return;

    await localDb.saveSleepEntry({
      id: `demo-topup-sleep-${today}`,
      chartId,
      date: today,
      durationHours: todayRow.sleepHours,
      quality: DemoSeedService._sleepQualityFromHours(todayRow.sleepHours),
      dreamText: '',
      dreamFeelings: '[]',
      dreamMetadata: '{}',
      createdAt: new Date(`${today}T08:00:00.000Z`).toISOString(),
      updatedAt: new Date(`${today}T08:00:00.000Z`).toISOString(),
      isDeleted: false,
    });

    await localDb.saveCheckIn({
      id: `demo-checkin-${today}-morning`,
      date: today,
      chartId,
      timeOfDay: 'morning',
      moodScore: todayRow.morningMood,
      energyLevel: todayRow.morningEnergy,
      stressLevel: todayRow.morningStress,
      tags: todayRow.morningTags,
      note: todayRow.morningNote,
      wins: todayRow.morningWin,
      challenges: todayRow.morningChallenge,
      moonSign: MOON_SIGNS[0],
      moonHouse: 1,
      sunHouse: 7,
      transitEvents: [],
      lunarPhase: LUNAR_PHASES[0],
      retrogrades: [],
      createdAt: new Date(`${today}T09:00:00.000Z`).toISOString(),
      updatedAt: new Date(`${today}T09:00:00.000Z`).toISOString(),
    });

    await localDb.saveCheckIn({
      id: `demo-checkin-${today}-evening`,
      date: today,
      chartId,
      timeOfDay: 'evening',
      moodScore: todayRow.eveningMood,
      energyLevel: todayRow.eveningEnergy,
      stressLevel: todayRow.eveningStress,
      tags: todayRow.eveningTags,
      note: todayRow.eveningNote,
      wins: todayRow.eveningWin,
      challenges: todayRow.eveningChallenge,
      moonSign: MOON_SIGNS[2],
      moonHouse: 2,
      sunHouse: 8,
      transitEvents: [],
      lunarPhase: LUNAR_PHASES[1],
      retrogrades: [],
      createdAt: new Date(`${today}T19:00:00.000Z`).toISOString(),
      updatedAt: new Date(`${today}T19:00:00.000Z`).toISOString(),
    });

    await AsyncStorage.setItem(DAILY_SEED_KEY, today);
  },

  async _repairUnreadableDemoSeedData(): Promise<boolean> {
    const db = await localDb.getDb();
    const rows = (await db.getAllAsync(
      "SELECT id, title, content FROM journal_entries WHERE id LIKE 'demo-journal-%'",
    )) as Array<{ id: string; title: string | null; content: string | null }>;

    const unreadableIds: string[] = [];

    for (const row of rows) {
      const titleResult = row.title
        ? await FieldEncryptionService.tryDecryptField(row.title)
        : { ok: true as const, value: '' };
      const contentResult = row.content
        ? await FieldEncryptionService.tryDecryptField(row.content)
        : { ok: true as const, value: '' };

      if (!titleResult.ok || !contentResult.ok) {
        unreadableIds.push(row.id);
      }
    }

    if (unreadableIds.length === 0) {
      return false;
    }

    logger.warn(
      `[DemoSeed] Found ${unreadableIds.length} unreadable demo journal entr${unreadableIds.length === 1 ? 'y' : 'ies'}; reseeding Account B.`,
      unreadableIds.slice(0, 5),
    );

    await DemoSeedService._seed();
    logger.info('[DemoSeed] Account B content reseeded after unreadable journal recovery.');
    return true;
  },

  _journalMoodFromScore(score: number): 'calm' | 'soft' | 'okay' | 'heavy' | 'stormy' {
    if (score >= 8) return 'calm';
    if (score === 7) return 'soft';
    if (score >= 5) return 'okay';
    if (score >= 3) return 'heavy';
    return 'stormy';
  },

  _sleepQualityFromHours(hours: number): number {
    if (hours >= 8.5) return 5;
    if (hours >= 7.0) return 4;
    if (hours >= 6.0) return 3;
    if (hours >= 5.0) return 2;
    return 1;
  },

  _titleFromPrompt(promptResponse: string, i: number): string {
    const manualTitles = [
      'Everyone probably hates me',
      'The hearing part people do not see',
      'Raising Lucas while running on empty',
      'Jamie feels safe in a way that matters',
      'Naomi leaving still hurts',
      'Dealing with Sarah is its own strain',
      'I am tired of the system',
      'Wanting Annie to choose me',
      'Angela grief is its own kind',
      'Feeling left out again',
      'Feeling blurry inside',
      'Wishing I were easier to be',
    ];

    void promptResponse;
    return manualTitles[i % manualTitles.length];
  },

  async _seedSupabaseDay(_dateStr: string, _idx: number): Promise<void> {
    void supabase;
    return;
  },
};
