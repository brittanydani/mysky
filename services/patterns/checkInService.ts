/**
 * Daily Check-In Service
 * 
 * Handles saving/loading check-ins and auto-capturing the sky snapshot.
 * Every check-in becomes: User signals + Astrology context.
 */

import { DailyCheckIn, TransitEvent, ThemeTag, EnergyLevel, StressLevel } from './types';
import { localDb } from '../storage/localDb';
import { NatalChart } from '../astrology/types';
import { getTransitingLongitudes, computeTransitAspectsToNatal } from '../astrology/transits';
import { generateId } from '../storage/models';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';

const { Origin, Horoscope } = require('circular-natal-horoscope-js');

// ─────────────────────────────────────────────────────────────────────────────
// Zodiac helpers
// ─────────────────────────────────────────────────────────────────────────────

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function degreeToSign(deg: number): string {
  const idx = Math.floor((deg % 360) / 30);
  return SIGNS[idx] || 'Aries';
}

function degreeToHouse(deg: number, houseCusps: number[]): number {
  if (!houseCusps || houseCusps.length < 12) return 1;
  for (let i = 0; i < 12; i++) {
    const next = (i + 1) % 12;
    let start = houseCusps[i];
    let end = houseCusps[next];
    if (end < start) end += 360;
    let testDeg = deg;
    if (testDeg < start) testDeg += 360;
    if (testDeg >= start && testDeg < end) return i + 1;
  }
  return 1;
}

// Moon phase calculation
function getMoonPhase(date: Date): string {
  // Simple synodic month approximation
  const KNOWN_NEW_MOON = new Date('2024-01-11T11:57:00Z').getTime();
  const SYNODIC_MONTH = 29.53058770576;
  const daysSinceNew = (date.getTime() - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const phase = ((daysSinceNew % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const fraction = phase / SYNODIC_MONTH;

  if (fraction < 0.0625) return 'new';
  if (fraction < 0.1875) return 'waxing_crescent';
  if (fraction < 0.3125) return 'first_quarter';
  if (fraction < 0.4375) return 'waxing_gibbous';
  if (fraction < 0.5625) return 'full';
  if (fraction < 0.6875) return 'waning_gibbous';
  if (fraction < 0.8125) return 'last_quarter';
  if (fraction < 0.9375) return 'waning_crescent';
  return 'new';
}

// Retrograde detection (approximate)
function getRetrogradePlanets(date: Date): string[] {
  // In a real app you'd compute this from ephemeris.
  // For now, use known retrograde periods for 2025-2026.
  const retrogrades: string[] = [];
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // Mercury retrogrades ~3x/year
  if (year === 2026) {
    if ((month >= 1 && month <= 1) || (month >= 5 && month <= 5) || (month >= 9 && month <= 9)) {
      retrogrades.push('Mercury');
    }
  }
  // Saturn retrogrades ~4.5 months/year (roughly June–October)
  if (month >= 6 && month <= 10) retrogrades.push('Saturn');
  // Jupiter retrogrades ~4 months/year (varies)
  if (month >= 7 && month <= 11) retrogrades.push('Jupiter');

  return retrogrades;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sky Snapshot Capture
// ─────────────────────────────────────────────────────────────────────────────

export interface SkySnapshot {
  moonSign: string;
  moonHouse: number;
  sunHouse: number;
  transitEvents: TransitEvent[];
  lunarPhase: string;
  retrogrades: string[];
}

export function captureSkySnapshot(chart: NatalChart, date: Date = new Date()): SkySnapshot {
  try {
    // Get transiting planet positions
    const lat = chart.birthData?.latitude ?? 42.33;
    const lng = chart.birthData?.longitude ?? -83.05;
    const transits = getTransitingLongitudes(date, lat, lng);

    // Get house cusps from chart
    const houseCusps = chart.houseCusps?.map(h => h.longitude) ?? [];

    // Moon sign + house
    const moonDeg = transits['Moon'] ?? 0;
    const moonSign = degreeToSign(moonDeg);
    const moonHouse = degreeToHouse(moonDeg, houseCusps);

    // Sun house
    const sunDeg = transits['Sun'] ?? 0;
    const sunHouse = degreeToHouse(sunDeg, houseCusps);

    // Compute transit aspects to natal
    const aspects = computeTransitAspectsToNatal(chart, transits);
    const transitEvents: TransitEvent[] = aspects.map(a => ({
      transitPlanet: a.pointA,
      natalPlanet: a.pointB,
      aspect: a.type,
      orb: a.orb,
      isApplying: true, // simplified
    }));

    // Moon phase
    const lunarPhase = getMoonPhase(date);

    // Retrogrades
    const retrogrades = getRetrogradePlanets(date);

    return {
      moonSign,
      moonHouse,
      sunHouse,
      transitEvents,
      lunarPhase,
      retrogrades,
    };
  } catch (error) {
    logger.error('[CheckIn] Failed to capture sky snapshot:', error);
    return {
      moonSign: 'Unknown',
      moonHouse: 1,
      sunHouse: 1,
      transitEvents: [],
      lunarPhase: 'unknown',
      retrogrades: [],
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check-In CRUD
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckInInput {
  moodScore: number;
  energyLevel: EnergyLevel;
  stressLevel: StressLevel;
  tags: ThemeTag[];
  note?: string;
  wins?: string;
  challenges?: string;
}

export class CheckInService {

  /**
   * Save a daily check-in with auto sky snapshot
   */
  static async saveCheckIn(
    input: CheckInInput,
    chart: NatalChart,
    chartId: string,
  ): Promise<DailyCheckIn> {
    const now = new Date();
    const date = toLocalDateString(now);
    const sky = captureSkySnapshot(chart, now);

    const checkIn: DailyCheckIn = {
      id: generateId(),
      date,
      chartId,
      moodScore: input.moodScore,
      energyLevel: input.energyLevel,
      stressLevel: input.stressLevel,
      tags: input.tags,
      note: input.note,
      wins: input.wins,
      challenges: input.challenges,
      moonSign: sky.moonSign,
      moonHouse: sky.moonHouse,
      sunHouse: sky.sunHouse,
      transitEvents: sky.transitEvents,
      lunarPhase: sky.lunarPhase,
      retrogrades: sky.retrogrades,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await localDb.saveCheckIn(checkIn);
    logger.info(`[CheckIn] Saved check-in for ${date}, mood: ${input.moodScore}, tags: ${input.tags.join(',')}`);
    return checkIn;
  }

  /**
   * Get today's check-in (if it exists)
   */
  static async getTodayCheckIn(chartId: string): Promise<DailyCheckIn | null> {
    const today = toLocalDateString(new Date());
    return localDb.getCheckInByDate(today, chartId);
  }

  /**
   * Get all check-ins for a chart (for pattern analysis)
   */
  static async getAllCheckIns(chartId: string, limit?: number): Promise<DailyCheckIn[]> {
    return localDb.getCheckIns(chartId, limit);
  }

  /**
   * Get check-in count for streak tracking
   */
  static async getCheckInCount(chartId: string): Promise<number> {
    const all = await localDb.getCheckIns(chartId);
    return all.length;
  }

  /**
   * Get current streak (consecutive days)
   */
  static async getCurrentStreak(chartId: string): Promise<number> {
    const all = await localDb.getCheckIns(chartId, 90); // last 90 days max
    if (all.length === 0) return 0;

    // Sort by date descending
    const sorted = all.sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < sorted.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedDate = toLocalDateString(expected);
      
      if (sorted.find(c => c.date === expectedDate)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get check-ins for a date range (for pattern reports)
   */
  static async getCheckInsInRange(
    chartId: string,
    startDate: string,
    endDate: string,
  ): Promise<DailyCheckIn[]> {
    const all = await localDb.getCheckIns(chartId);
    return all.filter(c => c.date >= startDate && c.date <= endDate);
  }
}
