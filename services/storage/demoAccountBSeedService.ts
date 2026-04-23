/**
 * demoAccountBSeedService.ts
 *
 * Demo seeding logic for the real Account B user.
 */

import type { MoonPhaseKeyTag } from '../../utils/moonPhase';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabaseDb } from './supabaseDb';
import { EncryptedAsyncStorage } from './encryptedAsyncStorage';
import { AccountScopedAsyncStorage } from './accountScopedStorage';
import { FieldEncryptionService } from './fieldEncryption';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';
import { ACCOUNT_B_DEMO_SEED } from './demoAccountBSeed';
import {
  VALUES_QUESTIONS,
  ARCHETYPE_QUESTIONS,
  COGNITIVE_QUESTIONS,
  INTELLIGENCE_QUESTIONS,
} from '../../constants/dailyReflectionQuestions';

const DEMO_EMAIL = 'brithornick92@gmail.com';
const SEED_FLAG_KEY = '@mysky:demo_seeded_account_b_v2';
const DAILY_SEED_KEY = '@mysky:demo_last_seeded_account_b';

const CHART_SEED_KEY = 'account-b-demo-chart';
const CHART_ID = stableUuidFromString(CHART_SEED_KEY);
const SETTINGS_ID = stableUuidFromString('account-b-demo-settings');
const CHART_CREATED = new Date('2026-01-01T09:00:00.000Z').toISOString();

const MOON_SIGNS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
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
  'waxing',
  'waxing',
  'full',
  'waning',
  'waning',
  'new',
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

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Deterministic UUID-shaped id from a string seed.
 * This keeps demo ids stable without sending raw strings like
 * "demo-checkin-2026-01-22-morning" into uuid-backed columns.
 */
function stableUuidFromString(seed: string): string {
  const hex =
    fnv1a32(`a:${seed}`) +
    fnv1a32(`b:${seed}`) +
    fnv1a32(`c:${seed}`) +
    fnv1a32(`d:${seed}`);

  const chars = hex.slice(0, 32).split('');

  chars[12] = '4';
  const variantNibble = parseInt(chars[16], 16);
  chars[16] = ((variantNibble & 0x3) | 0x8).toString(16);

  const normalized = chars.join('');
  return [
    normalized.slice(0, 8),
    normalized.slice(8, 12),
    normalized.slice(12, 16),
    normalized.slice(16, 20),
    normalized.slice(20, 32),
  ].join('-');
}

function journalIdForDate(date: string): string {
  return stableUuidFromString(`demo-journal:${date}`);
}

function sleepIdForDate(date: string): string {
  return stableUuidFromString(`demo-sleep:${date}`);
}

function morningCheckInIdForDate(date: string): string {
  return stableUuidFromString(`demo-checkin:${date}:morning`);
}

function eveningCheckInIdForDate(date: string): string {
  return stableUuidFromString(`demo-checkin:${date}:evening`);
}

type ExistingChart = { id: string };

export const DemoAccountBSeedService = {
  isDemoAccount(email: string | null | undefined): boolean {
    return email?.toLowerCase() === DEMO_EMAIL;
  },

  async sendDemoDataToSupabase(email: string | null | undefined): Promise<void> {
    if (!DemoAccountBSeedService.isDemoAccount(email)) {
      throw new Error('Demo data send is only available for the Account B demo user.');
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    const user = session?.user;
    if (!user) throw new Error('You must be signed in to send demo data.');

    const checkInRows = ACCOUNT_B_DEMO_SEED.dailyEntries.flatMap((entry) => [
      {
        user_id: user.id,
        mood_value: entry.morningMood,
        log_date: entry.date,
        time_of_day: 'morning',
        created_at: new Date(`${entry.date}T09:00:00.000Z`).toISOString(),
        updated_at: new Date(`${entry.date}T09:00:00.000Z`).toISOString(),
      },
      {
        user_id: user.id,
        mood_value: entry.eveningMood,
        log_date: entry.date,
        time_of_day: 'evening',
        created_at: new Date(`${entry.date}T20:00:00.000Z`).toISOString(),
        updated_at: new Date(`${entry.date}T20:00:00.000Z`).toISOString(),
      },
    ]);

    const dailyLogRows = ACCOUNT_B_DEMO_SEED.dailyEntries.map((entry) => ({
      user_id: user.id,
      log_date: entry.date,
      created_at: new Date(`${entry.date}T20:30:00.000Z`).toISOString(),
      stress: DemoAccountBSeedService._stressLevelToNumber(entry.eveningStress),
      anxiety: DemoAccountBSeedService._stressLevelToNumber(entry.morningStress),
      dream_symbols: Array.from(
        new Set([...entry.morningTags, ...entry.eveningTags]),
      ).slice(0, 12),
    }));

    const { error: checkInError } = await supabase
      .from('daily_check_ins')
      .upsert(checkInRows, { onConflict: 'user_id,log_date,time_of_day' });

    if (checkInError) {
      throw new Error(checkInError.message || 'Failed to upload demo check-ins.');
    }

    const { error: dailyLogError } = await supabase
      .from('daily_logs')
      .upsert(dailyLogRows, { onConflict: 'user_id,log_date' });

    if (dailyLogError) {
      throw new Error(dailyLogError.message || 'Failed to upload demo daily logs.');
    }

    logger.info(
      `[DemoSeed] Uploaded ${checkInRows.length} demo check-ins and ${dailyLogRows.length} daily logs to Supabase.`,
    );
  },

  async seedIfNeeded(email: string | null | undefined): Promise<void> {
    if (!DemoAccountBSeedService.isDemoAccount(email)) return;

    try {
      const alreadySeeded = await AsyncStorage.getItem(SEED_FLAG_KEY);

      if (alreadySeeded !== 'true') {
        logger.info('[DemoSeed] Seeding Account B demo data…');
        await DemoAccountBSeedService._seed();
        await AsyncStorage.setItem(SEED_FLAG_KEY, 'true');
        await AsyncStorage.setItem(DAILY_SEED_KEY, isoDate(new Date()));
        logger.info('[DemoSeed] Account B demo seed complete.');
        return;
      }

      const repaired = await DemoAccountBSeedService._repairUnreadableDemoSeedData();
      if (repaired) {
        await AsyncStorage.setItem(DAILY_SEED_KEY, isoDate(new Date()));
        return;
      }

      await DemoAccountBSeedService._restoreLocalDemoDataIfMissing();
      await DemoAccountBSeedService._dailyTopUp();
    } catch (e) {
      logger.error('[DemoSeed] Seed failed:', e);
    }
  },

  async cleanupStaleDemoArtifacts(email: string | null | undefined = null): Promise<void> {
    try {
      if (!DemoAccountBSeedService.isDemoAccount(email)) {
        logger.info('[DemoSeed] Cleanup skipped for non-demo account.');
        return;
      }

      const repaired = await DemoAccountBSeedService._repairUnreadableDemoSeedData();
      if (!repaired) {
        await DemoAccountBSeedService._restoreLocalDemoDataIfMissing();
      }

      logger.info('[DemoSeed] Cleanup complete.');
    } catch (e) {
      logger.error('[DemoSeed] Failed to clean demo artifacts:', e);
    }
  },

  async _seed(): Promise<void> {
    await DemoAccountBSeedService._ensureChart();
    await DemoAccountBSeedService._seedHistoricalEntries();
    await DemoAccountBSeedService._seedSettingsAndStorage();
    await AsyncStorage.setItem(SEED_FLAG_KEY, 'true');
    await AsyncStorage.setItem(DAILY_SEED_KEY, isoDate(new Date()));
  },

  async _ensureChart(): Promise<void> {
    const existingCharts = (await supabaseDb.getCharts()) as ExistingChart[];
    const alreadyThere = existingCharts.find((c) => c.id === CHART_ID);
    if (alreadyThere) return;

    await supabaseDb.saveChart({
      id: CHART_ID,
      name: ACCOUNT_B_DEMO_SEED.profile.displayName,
      birthDate: ACCOUNT_B_DEMO_SEED.profile.birthDate,
      birthTime: ACCOUNT_B_DEMO_SEED.profile.birthTime,
      hasUnknownTime: ACCOUNT_B_DEMO_SEED.profile.hasUnknownTime,
      birthPlace: ACCOUNT_B_DEMO_SEED.profile.birthPlace,
      latitude: ACCOUNT_B_DEMO_SEED.profile.latitude,
      longitude: ACCOUNT_B_DEMO_SEED.profile.longitude,
      timezone: ACCOUNT_B_DEMO_SEED.profile.timezone,
      houseSystem:
        ACCOUNT_B_DEMO_SEED.profile.houseSystem as import('../astrology/types').HouseSystem,
      createdAt: CHART_CREATED,
      updatedAt: CHART_CREATED,
      isDeleted: false,
    });
  },

  async _seedHistoricalEntries(): Promise<void> {
    for (let i = 0; i < ACCOUNT_B_DEMO_SEED.dailyEntries.length; i += 1) {
      const entry = ACCOUNT_B_DEMO_SEED.dailyEntries[i];
      const d = dateFromISODateString(entry.date);
      const idx = dayNumber(d);

      await supabaseDb.saveJournalEntry({
        id: journalIdForDate(entry.date),
        date: entry.date,
        mood: DemoAccountBSeedService._journalMoodFromScore(entry.eveningMood),
        moonPhase: simpleMoonPhaseForIndex(i),
        title: entry.journalTitle,
        content: entry.promptResponse,
        chartId: CHART_ID,
        tags: entry.journalTags,
        contentWordCount: entry.promptResponse.trim().split(/\s+/).length,
        contentReadingMinutes: 2,
        createdAt: new Date(`${entry.date}T15:00:00.000Z`).toISOString(),
        updatedAt: new Date(`${entry.date}T15:00:00.000Z`).toISOString(),
        isDeleted: false,
      });

      await supabaseDb.saveSleepEntry({
        id: sleepIdForDate(entry.date),
        chartId: CHART_ID,
        date: entry.date,
        durationHours: entry.sleepHours,
        quality: DemoAccountBSeedService._sleepQualityFromHours(entry.sleepHours),
        dreamText: entry.dreamText || '',
        dreamFeelings: JSON.stringify(entry.dreamFeelings || []),
        dreamMetadata: JSON.stringify(entry.dreamMetadata || {}),
        createdAt: new Date(`${entry.date}T08:00:00.000Z`).toISOString(),
        updatedAt: new Date(`${entry.date}T08:00:00.000Z`).toISOString(),
        isDeleted: false,
      });

      await supabaseDb.saveCheckIn({
        id: morningCheckInIdForDate(entry.date),
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

      await supabaseDb.saveCheckIn({
        id: eveningCheckInIdForDate(entry.date),
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

      await DemoAccountBSeedService._seedSupabaseDay(entry.date, idx);
    }
  },

  async _seedSettingsAndStorage(): Promise<void> {
    await supabaseDb.saveSettings({
      id: SETTINGS_ID,
      cloudSyncEnabled: false,
      createdAt: CHART_CREATED,
      updatedAt: CHART_CREATED,
    });

    await EncryptedAsyncStorage.setItem(
      'msky_user_name',
      ACCOUNT_B_DEMO_SEED.profile.displayName,
    );
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
          id: stableUuidFromString(
            `somatic:${entry.date}:${entry.region}:${entry.emotion}:${entry.note}`,
          ),
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
          id: stableUuidFromString(
            `trigger:${entry.date}:${entry.mode}:${entry.event}:${entry.note}`,
          ),
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
          id: stableUuidFromString(
            `relationship-pattern:${entry.date}:${entry.note}`,
          ),
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
          id: stableUuidFromString(
            `relationship-chart:${entry.name}:${entry.relationship}:${entry.birthDate}`,
          ),
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

    const SCALES: Record<string, number> = {
      'Not True': 0,
      Somewhat: 1,
      True: 2,
      'Very True': 3,
    };

    const validAnswers = ACCOUNT_B_DEMO_SEED.reflectionsFlat;

    if (validAnswers.length > 0) {
      const answersToSave = validAnswers.map((r) => {
        let bank;

        if (r.category === 'values') bank = VALUES_QUESTIONS;
        else if (r.category === 'archetypes') bank = ARCHETYPE_QUESTIONS;
        else if (r.category === 'cognitive') bank = COGNITIVE_QUESTIONS;
        else bank = INTELLIGENCE_QUESTIONS;

        const foundQ = bank.find((q) => q.text === r.questionText);

        return {
          questionId: foundQ ? foundQ.id : 0,
          category: r.category,
          questionText: r.questionText,
          answer: r.answer,
          scaleValue: SCALES[r.answer] ?? 1,
          date: r.date,
          sealedAt: new Date(`${r.date}T21:00:00.000Z`).toISOString(),
        };
      });

      const firstDateStr = `${validAnswers[0].date}T12:00:00.000Z`;
      const lastDateStr =
        `${validAnswers[validAnswers.length - 1].date}T12:00:00.000Z`;

      await EncryptedAsyncStorage.setItem(
        '@mysky:daily_reflections',
        JSON.stringify({
          answers: answersToSave,
          totalDaysCompleted: Math.max(
            1,
            dayNumber(new Date(lastDateStr)) - dayNumber(new Date(firstDateStr)) + 1,
          ),
          startedAt: new Date(firstDateStr).toISOString(),
        }),
      );
    }
  },

  async _restoreLocalDemoDataIfMissing(): Promise<void> {
    const existingCharts = (await supabaseDb.getCharts()) as ExistingChart[];
    const demoChart = existingCharts.find((c) => c.id === CHART_ID);

    if (demoChart) return;

    logger.info('[DemoSeed] Restoring missing Account B local demo content.');
    await DemoAccountBSeedService._seed();
  },

  async _dailyTopUp(): Promise<void> {
    const charts = (await supabaseDb.getCharts()) as ExistingChart[];
    if (!charts.length) return;

    const demoChart = charts.find((c) => c.id === CHART_ID);
    if (!demoChart) return;

    const chartId = demoChart.id;
    const lastStr = await AsyncStorage.getItem(DAILY_SEED_KEY);
    const today = isoDate(new Date());

    if (lastStr === today) return;

    const todayRow =
      ACCOUNT_B_DEMO_SEED.dailyEntries[ACCOUNT_B_DEMO_SEED.dailyEntries.length - 1];
    if (!todayRow) return;

    await supabaseDb.saveSleepEntry({
      id: sleepIdForDate(today),
      chartId,
      date: today,
      durationHours: todayRow.sleepHours,
      quality: DemoAccountBSeedService._sleepQualityFromHours(todayRow.sleepHours),
      dreamText: '',
      dreamFeelings: '[]',
      dreamMetadata: '{}',
      createdAt: new Date(`${today}T08:00:00.000Z`).toISOString(),
      updatedAt: new Date(`${today}T08:00:00.000Z`).toISOString(),
      isDeleted: false,
    });

    await supabaseDb.saveCheckIn({
      id: morningCheckInIdForDate(today),
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

    await supabaseDb.saveCheckIn({
      id: eveningCheckInIdForDate(today),
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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    if (!userId) return false;

    const { data: rows, error } = await supabase
      .from('journal_entries')
      .select('id, chart_id, title_enc, content_enc')
      .eq('user_id', userId)
      .eq('chart_id', CHART_ID);

    if (error) {
      logger.warn('[DemoSeed] Unable to scan demo journals for repair:', error);
      return false;
    }

    const typedRows = (rows ?? []) as Array<{
      id: string;
      chart_id: string | null;
      title_enc: string | null;
      content_enc: string | null;
    }>;

    const unreadableIds: string[] = [];

    for (const row of typedRows) {
      const titleResult = row.title_enc
        ? await FieldEncryptionService.tryDecryptField(row.title_enc)
        : { ok: true as const, value: '' };

      const contentResult = row.content_enc
        ? await FieldEncryptionService.tryDecryptField(row.content_enc)
        : { ok: true as const, value: '' };

      if (!titleResult.ok || !contentResult.ok) {
        unreadableIds.push(row.id);
      }
    }

    if (unreadableIds.length === 0) return false;

    logger.warn(
      `[DemoSeed] Found ${unreadableIds.length} unreadable demo journal entr${
        unreadableIds.length === 1 ? 'y' : 'ies'
      }; reseeding Account B.`,
      unreadableIds.slice(0, 5),
    );

    await DemoAccountBSeedService._seed();
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

  _stressLevelToNumber(level: 'low' | 'medium' | 'high'): number {
    if (level === 'high') return 8;
    if (level === 'medium') return 5;
    return 2;
  },

  async _seedSupabaseDay(_dateStr: string, _idx: number): Promise<void> {
    void _dateStr;
    void _idx;
    return;
  },
};

// Alias for backward-compatible imports
export const DemoSeedService = DemoAccountBSeedService;
