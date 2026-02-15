/**
 * Daily Check-In Service
 * 
 * Handles saving/loading check-ins and auto-capturing the sky snapshot.
 * Every check-in becomes: User signals + Astrology context.
 */

import { DailyCheckIn, TransitEvent, ThemeTag, EnergyLevel, StressLevel } from './types';
import { localDb } from '../storage/localDb';
import { NatalChart } from '../astrology/types';
import { getTransitInfo, getTransitingLongitudes, computeTransitAspectsToNatal } from '../astrology/transits';
import { generateId } from '../storage/models';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';
import { getMoonPhaseKey } from '../../utils/moonPhase';

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

// Moon phase calculation (precise, via astronomy-engine)
function getMoonPhase(date: Date): string {
  return getMoonPhaseKey(date);
}

// Retrograde detection — uses real ephemeris via transits module
function getRetrogradePlanets(date: Date, latitude: number, longitude: number): string[] {
  try {
    const info = getTransitInfo(date, latitude, longitude);
    return info.retrogrades;
  } catch {
    return [];
  }
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
      isApplying: a.orb < 2, // tighter orbs are more likely applying; exact would need velocity data
    }));

    // Moon phase
    const lunarPhase = getMoonPhase(date);

    // Retrogrades — real ephemeris-based detection
    const retrogrades = getRetrogradePlanets(date, lat, lng);

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
