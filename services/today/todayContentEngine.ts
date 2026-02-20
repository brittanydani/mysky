// ─────────────────────────────────────────────────────────────
// MySky — Today Content Engine
// Deterministic-but-varied daily content selection.
// Maps user chart data + date + transit context → specific content.
// Anti-repetition: 30-day tracking via SQLite.
// ─────────────────────────────────────────────────────────────

import { NatalChart } from '../astrology/types';
import { getTransitingLongitudes } from '../astrology/transits';
import { getMoonPhaseTag as getPreciseMoonPhaseTag } from '../../utils/moonPhase';
import {
  signNameFromLongitude as signFromLongitude,
  extractSignName as getSignName,
  SIGN_TO_ELEMENT,
  SIGN_TO_MODALITY,
  ZODIAC_SIGN_NAMES as ZODIAC_SIGNS,
} from '../astrology/sharedHelpers';
import { dayOfYear, toLocalDateString } from '../../utils/dateUtils';
import {
  TaggedContent,
  TaggedGreeting,
  ContentTag,
  TimeOfDay,
  AFFIRMATION_LIBRARY,
  REFLECTION_LIBRARY,
  COSMIC_WEATHER_LIBRARY,
  GREETING_LIBRARY,
} from './todayContentLibrary';
import { logger } from '../../utils/logger';

// ═══════════════════════════════════════════════════════════════
// DATABASE HELPER
// ═══════════════════════════════════════════════════════════════

async function getDb() {
  const SQLite = require('expo-sqlite');
  const db = await SQLite.openDatabaseAsync('mysky.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS content_shown_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      shown_date TEXT NOT NULL
    );
  `);
  return db;
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface TodayContent {
  greeting: string;
  affirmation: string;
  reflection: string;
  cosmicWeather: string;
  // Source attribution (what drove the selection)
  affirmationSource: string;
  reflectionSource: string;
}

interface ContentSelection {
  id: number;
  score: number;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS — Chart-to-Tag mapping
// signFromLongitude, getSignName, SIGN_TO_ELEMENT, SIGN_TO_MODALITY,
// ZODIAC_SIGNS, dayOfYear → imported from sharedHelpers and dateUtils
// ═══════════════════════════════════════════════════════════════

const SIGN_ELEMENTS: Record<string, ContentTag> = {
  Aries: 'fire', Taurus: 'earth', Gemini: 'air', Cancer: 'water',
  Leo: 'fire', Virgo: 'earth', Libra: 'air', Scorpio: 'water',
  Sagittarius: 'fire', Capricorn: 'earth', Aquarius: 'air', Pisces: 'water',
};

const SIGN_MODALITIES: Record<string, ContentTag> = {
  Aries: 'cardinal', Taurus: 'fixed', Gemini: 'mutable', Cancer: 'cardinal',
  Leo: 'fixed', Virgo: 'mutable', Libra: 'cardinal', Scorpio: 'fixed',
  Sagittarius: 'mutable', Capricorn: 'cardinal', Aquarius: 'fixed', Pisces: 'mutable',
};

function getMoonPhaseTag(date: Date): ContentTag {
  return getPreciseMoonPhaseTag(date) as ContentTag;
}

function getSeasonTag(date: Date): ContentTag {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'season-spring';
  if (month >= 5 && month <= 7) return 'season-summer';
  if (month >= 8 && month <= 10) return 'season-autumn';
  return 'season-winter';
}

function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// ═══════════════════════════════════════════════════════════════
// TAG PROFILE — Build from chart + transits
// ═══════════════════════════════════════════════════════════════

interface TagProfile {
  tags: Map<ContentTag, number>;  // tag → weight
}

function buildTagProfile(
  chart: NatalChart,
  date: Date,
  intensity?: 'calm' | 'moderate' | 'intense',
  dominantDomain?: string,
  hasRetrograde?: boolean,
): TagProfile {
  const tags = new Map<ContentTag, number>();

  // Sun element & modality (weight 3)
  const sunSign = getSignName(chart.sun?.sign) || getSignName(chart.planets?.find(p => p.planet === 'Sun')?.sign);
  if (sunSign) {
    const el = SIGN_ELEMENTS[sunSign];
    if (el) tags.set(el, (tags.get(el) || 0) + 3);
    const mod = SIGN_MODALITIES[sunSign];
    if (mod) tags.set(mod, (tags.get(mod) || 0) + 2);
  }

  // Moon element (weight 3)
  const moonSign = getSignName(chart.moon?.sign) || getSignName(chart.planets?.find(p => p.planet === 'Moon')?.sign);
  if (moonSign) {
    const el = SIGN_ELEMENTS[moonSign];
    if (el) tags.set(el, (tags.get(el) || 0) + 3);
  }

  // Rising/Ascendant element (weight 2)
  const risingSign = getSignName(chart.ascendant?.sign) ||
    (chart.houses?.[0] ? signFromLongitude(chart.houses[0].absoluteDegree) : '');
  if (risingSign) {
    const el = SIGN_ELEMENTS[risingSign];
    if (el) tags.set(el, (tags.get(el) || 0) + 2);
  }

  // Transiting Moon sign (weight 5 — strongest, because it changes daily)
  try {
    const lat = chart.birthData?.latitude || 0;
    const lng = chart.birthData?.longitude || 0;
    const transits = getTransitingLongitudes(date, lat, lng);
    const transitMoonSign = signFromLongitude(transits.Moon);
    const transitTag = `transit-${transitMoonSign.toLowerCase()}` as ContentTag;
    tags.set(transitTag, (tags.get(transitTag) || 0) + 5);
  } catch {
    // Transits unavailable
  }

  // Moon phase (weight 4)
  const phaseTag = getMoonPhaseTag(date);
  tags.set(phaseTag, (tags.get(phaseTag) || 0) + 4);

  // Season (weight 1)
  const seasonTag = getSeasonTag(date);
  tags.set(seasonTag, (tags.get(seasonTag) || 0) + 1);

  // Intensity (weight 3)
  if (intensity) {
    const intensityTag = `intensity-${intensity}` as ContentTag;
    tags.set(intensityTag, (tags.get(intensityTag) || 0) + 3);
  }

  // Dominant domain (weight 2)
  if (dominantDomain) {
    const domainTag = `${dominantDomain}-active` as ContentTag;
    if (['love-active', 'energy-active', 'growth-active', 'focus-active', 'mood-active'].includes(domainTag)) {
      tags.set(domainTag as ContentTag, (tags.get(domainTag as ContentTag) || 0) + 2);
    }
  }

  // Retrograde (weight 2)
  if (hasRetrograde) {
    tags.set('retrograde-active', (tags.get('retrograde-active') || 0) + 2);
  }

  // Universal always has base weight
  tags.set('universal', 1);

  return { tags };
}

// ═══════════════════════════════════════════════════════════════
// SCORING — Tag overlap between content and profile
// ═══════════════════════════════════════════════════════════════

function scoreContent(content: TaggedContent, profile: TagProfile): number {
  let score = 0;
  for (const tag of content.tags) {
    const weight = profile.tags.get(tag) || 0;
    score += weight;
  }
  return score;
}

// ═══════════════════════════════════════════════════════════════
// DETERMINISTIC SELECTION — With anti-repetition
// Uses date hash + chart hash to pick from top candidates.
// Never repeats within a 30-day window.
// ═══════════════════════════════════════════════════════════════

function dateHash(date: Date, salt: number = 0): number {
  const year = date.getFullYear();
  const doy = dayOfYear(date);
  // Simple deterministic hash — produces different value each day
  return ((doy * 31 + year * 17 + salt * 7) % 2147483647);
}

function chartHash(chart: NatalChart): number {
  // Use planet positions to create chart-specific seed
  let hash = 0;
  const planets = chart.planets || [];
  for (const planet of planets) {
    if (planet.absoluteDegree) {
      hash = (hash * 31 + Math.floor(planet.absoluteDegree * 100)) % 2147483647;
    }
  }
  return hash || 1;
}

async function getRecentlyShownIds(category: string, days: number = 30): Promise<Set<number>> {
  try {
    const db = await getDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = toLocalDateString(cutoffDate);

    const rows: any[] = await db.getAllAsync(
      `SELECT content_id FROM content_shown_history WHERE category = ? AND shown_date > ?`,
      [category, cutoffStr]
    );

    return new Set(rows.map((r: any) => r.content_id));
  } catch {
    return new Set();
  }
}

async function recordShown(category: string, contentId: number, date: Date): Promise<void> {
  try {
    const db = await getDb();
    const dateStr = toLocalDateString(date);
    
    // Check if already recorded for today
    const existing = await db.getAllAsync(
      `SELECT id FROM content_shown_history WHERE category = ? AND shown_date = ?`,
      [category, dateStr]
    );
    
    if (existing.length === 0) {
      await db.runAsync(
        `INSERT INTO content_shown_history (category, content_id, shown_date) VALUES (?, ?, ?)`,
        [category, contentId, dateStr]
      );
    }

    // Cleanup: remove entries older than 60 days
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - 60);
    await db.runAsync(
      `DELETE FROM content_shown_history WHERE shown_date < ?`,
      [toLocalDateString(cleanupDate)]
    );
  } catch {
    // Non-critical
  }
}

function selectFromCandidates(
  scoredItems: ContentSelection[],
  recentlyShown: Set<number>,
  dayHashValue: number,
  chartHashValue: number,
): ContentSelection | null {
  if (scoredItems.length === 0) return null;

  // Sort by score descending
  scoredItems.sort((a, b) => b.score - a.score);

  // Take top tier (score >= 60% of best)
  const bestScore = scoredItems[0].score;
  const threshold = Math.max(bestScore * 0.6, 1);
  const topTier = scoredItems.filter(s => s.score >= threshold);

  // Filter out recently shown from top tier
  const fresh = topTier.filter(s => !recentlyShown.has(s.id));

  // If all top-tier are recently shown, widen the pool
  const pool = fresh.length > 0
    ? fresh
    : scoredItems.filter(s => !recentlyShown.has(s.id));

  // If literally everything has been shown (very unlikely with 350+ items),
  // fall back to the full top tier
  const finalPool = pool.length > 0 ? pool : topTier;

  // Deterministic pick using combined hash
  const combinedHash = Math.abs(dayHashValue + chartHashValue);
  const index = combinedHash % finalPool.length;

  return finalPool[index];
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export class TodayContentEngine {
  /**
   * Generate all today-screen content for a user's chart.
   * Returns one affirmation, one reflection, one cosmic weather, one greeting.
   * Each is personalized, deterministic per day, and minimizes repeats.
   */
  static async generateTodayContent(
    chart: NatalChart,
    date: Date = new Date(),
    intensity?: 'calm' | 'moderate' | 'intense',
    dominantDomain?: string,
    hasRetrograde?: boolean,
  ): Promise<TodayContent> {
    const profile = buildTagProfile(chart, date, intensity, dominantDomain, hasRetrograde);
    const dHash = dateHash(date);
    const cHash = chartHash(chart);
    const timeOfDay = getTimeOfDay(date);

    // ─── Select Affirmation ───
    const affirmationRecentIds = await getRecentlyShownIds('affirmation');
    const affirmationScored: ContentSelection[] = AFFIRMATION_LIBRARY.map(item => ({
      id: item.id,
      score: scoreContent(item, profile),
    }));

    const selectedAffirmation = selectFromCandidates(
      affirmationScored, affirmationRecentIds, dHash, cHash,
    );

    let affirmation = 'I trust my own timing.';
    let affirmationSource = 'universal';
    if (selectedAffirmation) {
      const item = AFFIRMATION_LIBRARY.find(a => a.id === selectedAffirmation.id);
      if (item) {
        affirmation = item.text;
        affirmationSource = buildSourceDescription(item.tags, profile);
        await recordShown('affirmation', item.id, date);
      }
    }

    // ─── Select Reflection ───
    const reflectionRecentIds = await getRecentlyShownIds('reflection');
    const reflectionScored: ContentSelection[] = REFLECTION_LIBRARY.map(item => ({
      id: item.id,
      score: scoreContent(item, profile),
    }));

    const selectedReflection = selectFromCandidates(
      reflectionScored, reflectionRecentIds, dateHash(date, 1), cHash,
    );

    let reflection = 'What is one thing I can do today that my future self will be grateful for?';
    let reflectionSource = 'universal';
    if (selectedReflection) {
      const item = REFLECTION_LIBRARY.find(r => r.id === selectedReflection.id);
      if (item) {
        reflection = item.text;
        reflectionSource = buildSourceDescription(item.tags, profile);
        await recordShown('reflection', item.id, date);
      }
    }

    // ─── Select Cosmic Weather ───
    const weatherRecentIds = await getRecentlyShownIds('cosmic_weather');
    const weatherScored: ContentSelection[] = COSMIC_WEATHER_LIBRARY.map(item => ({
      id: item.id,
      score: scoreContent(item, profile),
    }));

    const selectedWeather = selectFromCandidates(
      weatherScored, weatherRecentIds, dateHash(date, 2), cHash,
    );

    let cosmicWeather = 'Follow your own rhythm today. Trust what feels right.';
    if (selectedWeather) {
      const item = COSMIC_WEATHER_LIBRARY.find(w => w.id === selectedWeather.id);
      if (item) {
        cosmicWeather = item.text;
        await recordShown('cosmic_weather', item.id, date);
      }
    }

    // ─── Select Greeting ───
    const greetingRecentIds = await getRecentlyShownIds('greeting');
    const filteredGreetings = GREETING_LIBRARY.filter(g => g.timeOfDay === timeOfDay);
    const greetingScored: ContentSelection[] = filteredGreetings.map(item => ({
      id: item.id,
      score: scoreContent(item as unknown as TaggedContent, profile),
    }));

    const selectedGreeting = selectFromCandidates(
      greetingScored, greetingRecentIds, dateHash(date, 3), cHash,
    );

    let greeting = timeOfDay === 'morning'
      ? 'Good morning. Here\u2019s what the sky is saying today.'
      : timeOfDay === 'afternoon'
        ? 'Here\u2019s your cosmic weather for today.'
        : 'Settling into evening. Here\u2019s what\u2019s been in the air.';
    if (selectedGreeting) {
      const item = GREETING_LIBRARY.find(g => g.id === selectedGreeting.id);
      if (item) {
        greeting = item.text;
        await recordShown('greeting', item.id, date);
      }
    }

    return {
      greeting,
      affirmation,
      reflection,
      cosmicWeather,
      affirmationSource,
      reflectionSource,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// SOURCE DESCRIPTION — Human-readable "why this was chosen"
// ═══════════════════════════════════════════════════════════════

function buildSourceDescription(contentTags: ContentTag[], profile: TagProfile): string {
  const parts: string[] = [];

  for (const tag of contentTags) {
    if (tag === 'universal') continue;
    const weight = profile.tags.get(tag) || 0;
    if (weight > 0) {
      parts.push(formatTagForDisplay(tag));
    }
  }

  if (parts.length === 0) return 'Your cosmic blueprint';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} × ${parts[1]}`;
  return `${parts[0]} × ${parts[1]} + more`;
}

function formatTagForDisplay(tag: ContentTag): string {
  const map: Partial<Record<ContentTag, string>> = {
    fire: 'Fire element',
    earth: 'Earth element',
    air: 'Air element',
    water: 'Water element',
    cardinal: 'Cardinal energy',
    fixed: 'Fixed energy',
    mutable: 'Mutable energy',
    'phase-new': 'New Moon',
    'phase-waxing-crescent': 'Waxing Crescent',
    'phase-first-quarter': 'First Quarter Moon',
    'phase-waxing-gibbous': 'Waxing Gibbous',
    'phase-full': 'Full Moon',
    'phase-waning-gibbous': 'Waning Gibbous',
    'phase-last-quarter': 'Last Quarter Moon',
    'phase-waning-crescent': 'Waning Crescent',
    'transit-aries': 'Moon in Aries',
    'transit-taurus': 'Moon in Taurus',
    'transit-gemini': 'Moon in Gemini',
    'transit-cancer': 'Moon in Cancer',
    'transit-leo': 'Moon in Leo',
    'transit-virgo': 'Moon in Virgo',
    'transit-libra': 'Moon in Libra',
    'transit-scorpio': 'Moon in Scorpio',
    'transit-sagittarius': 'Moon in Sagittarius',
    'transit-capricorn': 'Moon in Capricorn',
    'transit-aquarius': 'Moon in Aquarius',
    'transit-pisces': 'Moon in Pisces',
    'love-active': 'Love transit',
    'energy-active': 'Energy transit',
    'growth-active': 'Growth transit',
    'focus-active': 'Focus transit',
    'mood-active': 'Mood transit',
    'retrograde-active': 'Retrograde',
    'intensity-calm': 'Calm energy',
    'intensity-moderate': 'Moderate energy',
    'intensity-intense': 'Intense energy',
    'season-spring': 'Spring',
    'season-summer': 'Summer',
    'season-autumn': 'Autumn',
    'season-winter': 'Winter',
  };

  return map[tag] || tag;
}
