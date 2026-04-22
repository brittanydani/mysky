/**
 * demoSeedService.ts
 *
 * Seeds demo data for Account B only.
 * Triggers automatically on sign-in for brithornick92@gmail.com.
 *
 * This version stores the real daily reflection answers alongside
 * journals, sleep, check-ins, somatic entries, trigger/glimmer events,
 * relationship patterns, and relationship charts.
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
import {
  ARCHETYPE_QUESTIONS,
  COGNITIVE_QUESTIONS,
  INTELLIGENCE_QUESTIONS,
  VALUES_QUESTIONS,
} from '../../constants/dailyReflectionQuestions';

const DEMO_EMAIL = 'brithornick92@gmail.com';
const SEED_FLAG_KEY = '@mysky:demo_seeded_account_b_v2';
const DAILY_SEED_KEY = '@mysky:demo_last_seeded_account_b';

const CHART_ID = 'account-b-demo-chart';
const CHART_CREATED = new Date('2026-01-01T09:00:00.000Z').toISOString();

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
        await DemoSeedService._ensureChart();

        const repaired = await DemoSeedService._repairUnreadableDemoSeedData();
        if (repaired) {
          await AsyncStorage.setItem(DAILY_SEED_KEY, isoDate(new Date()));
          return;
        }

        await DemoSeedService._restoreLocalDemoDataIfMissing();
        await DemoSeedService._restoreEncryptedDemoDataIfMissing();
      }
    } catch (e) {
      logger.error('[DemoSeed] Seed failed:', e);
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

    await DemoSeedService._ensureChart();
    await DemoSeedService._seedHistoricalEntries();
    await DemoSeedService._seedSettingsAndStorage();

    await AsyncStorage.setItem(SEED_FLAG_KEY, 'true');
    await AsyncStorage.setItem(DAILY_SEED_KEY, isoDate(new Date()));
  },

  async _ensureChart(): Promise<void> {
    const existingCharts = await localDb.getCharts();
    const existingDemoChart = existingCharts.find((chart) => chart.id === CHART_ID);

    for (const chart of existingCharts) {
      if (chart.id !== CHART_ID) {
        await localDb.deleteChart(chart.id);
      }
    }

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
      createdAt: existingDemoChart?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    });
  },

  async _seedHistoricalEntries(): Promise<void> {
    for (let i = 0; i < ACCOUNT_B_DEMO_SEED.dailyEntries.length; i++) {
      const entry = ACCOUNT_B_DEMO_SEED.dailyEntries[i];

      await localDb.saveJournalEntry({
        id: `demo-journal-${entry.date}`,
        date: entry.date,
        mood: DemoSeedService._journalMoodFromScore(entry.eveningMood),
        moonPhase: simpleMoonPhaseForIndex(i),
        title: DemoSeedService._titleFromDay(entry.day),
        content: entry.promptResponse,
        chartId: CHART_ID,
        tags: Array.from(new Set([...entry.morningTags, ...entry.eveningTags])).slice(0, 6),
        contentWordCount: entry.promptResponse.trim().split(/\s+/).length,
        contentReadingMinutes: 2,
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

    await EncryptedAsyncStorage.setItem('@mysky:core_values', JSON.stringify(ACCOUNT_B_DEMO_SEED.coreValues));
    await AccountScopedAsyncStorage.setItem('mysky_custom_journal_tags', JSON.stringify(ACCOUNT_B_DEMO_SEED.customJournalTags));
    await EncryptedAsyncStorage.setItem('@mysky:archetype_profile', JSON.stringify(ACCOUNT_B_DEMO_SEED.archetypeProfile));
    await EncryptedAsyncStorage.setItem('@mysky:cognitive_style', JSON.stringify(ACCOUNT_B_DEMO_SEED.cognitiveStyle));

    await EncryptedAsyncStorage.setItem(
      '@mysky:daily_reflections',
      JSON.stringify((() => {
        const scales: Record<string, number> = { 'Not True': 0, 'Somewhat': 1, 'True': 2, 'Very True': 3 };
        const answers = ACCOUNT_B_DEMO_SEED.reflectionsFlat.map((reflection) => {
          const bank = reflection.category === 'values'
            ? VALUES_QUESTIONS
            : reflection.category === 'archetypes'
              ? ARCHETYPE_QUESTIONS
              : reflection.category === 'cognitive'
                ? COGNITIVE_QUESTIONS
                : INTELLIGENCE_QUESTIONS;
          const question = bank.find((item) => item.text === reflection.questionText);

          return {
            questionId: question?.id ?? 0,
            category: reflection.category,
            questionText: reflection.questionText,
            answer: reflection.answer,
            scaleValue: scales[reflection.answer] ?? 1,
            date: reflection.date,
            sealedAt: new Date(`${reflection.date}T21:00:00.000Z`).toISOString(),
          };
        });

        const uniqueDates = Array.from(new Set(answers.map((answer) => answer.date))).sort();
        const startedAt = uniqueDates[0] ? new Date(`${uniqueDates[0]}T12:00:00.000Z`).toISOString() : null;
        const totalDaysCompleted = uniqueDates.length > 0
          ? Math.max(
              1,
              dayNumber(new Date(`${uniqueDates[uniqueDates.length - 1]}T12:00:00.000Z`)) -
                dayNumber(new Date(`${uniqueDates[0]}T12:00:00.000Z`)) +
                1,
            )
          : 0;

        return {
          answers,
          totalDaysCompleted,
          startedAt,
        };
      })()),
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

  async _restoreEncryptedDemoDataIfMissing(): Promise<void> {
    const [userName, coreValues, dailyReflections, somaticEntries, relationshipPatterns] = await Promise.all([
      EncryptedAsyncStorage.getItem('msky_user_name'),
      EncryptedAsyncStorage.getItem('@mysky:core_values'),
      EncryptedAsyncStorage.getItem('@mysky:daily_reflections'),
      EncryptedAsyncStorage.getItem('@mysky:somatic_entries'),
      EncryptedAsyncStorage.getItem('@mysky:relationship_patterns'),
    ]);

    const customJournalTags = await AccountScopedAsyncStorage.getItem('mysky_custom_journal_tags');

    if (userName && coreValues && dailyReflections && somaticEntries && relationshipPatterns && customJournalTags) {
      return;
    }

    logger.info('[DemoSeed] Restoring missing Account B encrypted demo storage.');
    await DemoSeedService._seedSettingsAndStorage();
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

  _titleFromDay(day: number): string {
    const titles = [
      'Quietly overstretched',
      'Trying not to assume rejection',
      'Body first, mind later',
      'Holding too much at once',
      'Socially off again',
      'Comparison spiral',
      'What steadied me',
      'Overstimulated and trying',
      'Messy but still showing up',
      'The thought loop again',
      'Feeling more like myself',
      'Avoidance with a reason',
    ];

    return titles[(day - 1) % titles.length];
  },

  async _seedSupabaseDay(_dateStr: string, _idx: number): Promise<void> {
    void supabase;
    return;
  },
};
