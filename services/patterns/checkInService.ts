/**
 * Daily Check-In Service
 * 
 * Handles saving/loading check-ins and auto-capturing the sky snapshot.
 * Every check-in becomes: User signals + Astrology context.
 */

import { DailyCheckIn, TransitEvent, TimeOfDay, CheckInInput, SkySnapshot } from './types';
import { localDb } from '../storage/localDb';
import { NatalChart } from '../astrology/types';
import { getTransitInfo, getTransitingLongitudes, computeTransitAspectsToNatal } from '../astrology/transits';
import { generateId } from '../storage/models';
import { logger } from '../../utils/logger';
import { toLocalDateString } from '../../utils/dateUtils';
import type { MoonPhaseKeyTag } from '../../utils/moonPhase';
import { getMoonPhaseKey } from '../../utils/moonPhase';
import {
  signNameFromLongitude as degreeToSign,
  computeHouseForLongitude as degreeToHouse,
} from '../astrology/sharedHelpers';

// ─────────────────────────────────────────────────────────────────────────────
// Zodiac helpers — imported from sharedHelpers
// ─────────────────────────────────────────────────────────────────────────────

// Moon phase calculation (precise, via astronomy-engine)
function getMoonPhase(date: Date): MoonPhaseKeyTag {
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

export function captureSkySnapshot(chart: NatalChart, date: Date = new Date()): SkySnapshot {
  try {
    // Get transiting planet positions — use chart birth coordinates.
    // Lat/lng affect house cusps only; planetary longitudes are geocentric
    // and do not depend on observer location, so this is mainly relevant
    // for accurate moon-house placement in captureSkySnapshot.
    const lat = chart.birthData?.latitude ?? 0;
    const lng = chart.birthData?.longitude ?? 0;
    if (!chart.birthData?.latitude || !chart.birthData?.longitude) {
      logger.warn('[CheckIn] captureSkySnapshot: chart missing birth coordinates — house placement will be approximate');
    }
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
      moonHouse: moonHouse ?? 0,
      sunHouse: sunHouse ?? 0,
      transitEvents,
      lunarPhase,
      retrogrades,
    };
  } catch (error) {
    logger.error('[CheckIn] Failed to capture sky snapshot:', error);
    return {
      moonSign: 'Unknown',
      moonHouse: 0,
      sunHouse: 0,
      transitEvents: [],
      lunarPhase: 'unknown',
      retrogrades: [],
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check-In CRUD
// ─────────────────────────────────────────────────────────────────────────────

// CheckInInput is now defined in ./types and re-exported here for backward compat
export type { CheckInInput, SkySnapshot } from './types';

/**
 * Determine time-of-day from current hour
 */
function detectTimeOfDay(date: Date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 6  && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night'; // 22:00–23:59 and 00:00–05:59
}

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, { label: string; emoji: string; icon: string; hours: string }> = {
  morning:   { label: 'Morning',   emoji: '🌅', icon: 'sunny-outline',        hours: '6am–12pm' },
  afternoon: { label: 'Afternoon', emoji: '☀️', icon: 'partly-sunny-outline', hours: '12pm–6pm' },
  evening:   { label: 'Evening',   emoji: '🌆', icon: 'moon-outline',         hours: '6pm–10pm' },
  night:     { label: 'Night',     emoji: '🌙', icon: 'cloudy-night-outline', hours: '10pm–6am' },
};

/**
 * The "logical today" for check-ins.
 * Between midnight and 5:59am we're still in the previous day's night window,
 * so editing a night entry before 6am should target yesterday's date.
 */
export function getLogicalToday(): string {
  const now = new Date();
  if (now.getHours() < 6) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return toLocalDateString(yesterday);
  }
  return toLocalDateString(now);
}

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

export class CheckInService {

  /**
   * Save a daily check-in with auto sky snapshot.
   * Supports up to 4 check-ins per day (one per time slot).
   */
  static async saveCheckIn(
    input: CheckInInput,
    chart: NatalChart,
    chartId: string,
  ): Promise<DailyCheckIn> {
    // Input validation — clamp moodScore to valid 1-10 range
    const rawMood = Number(input.moodScore);
    if (!Number.isFinite(rawMood)) {
      throw new Error('Invalid moodScore: value is not a finite number');
    }
    const clampedMood = Math.max(1, Math.min(10, Math.round(rawMood)));

    const now = new Date();
    const date = input.date ?? toLocalDateString(now);
    // When editing a past date, compute the sky snapshot for noon on that date
    const snapshotDate = input.date ? new Date(input.date + 'T12:00:00') : now;
    const timeOfDay = input.timeOfDay ?? detectTimeOfDay(now);
    const sky = captureSkySnapshot(chart, snapshotDate);

    const checkIn: DailyCheckIn = {
      id: generateId(),
      date,
      chartId,
      timeOfDay,
      moodScore: clampedMood,
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
    logger.info(`[CheckIn] Saved check-in for ${date} (${timeOfDay})`);
    return checkIn;
  }

  /**
   * Get today's check-in for a specific time slot (if it exists)
   */
  static async getTodayCheckInForSlot(chartId: string, timeOfDay: TimeOfDay): Promise<DailyCheckIn | null> {
    const today = toLocalDateString(new Date());
    return localDb.getCheckInByDateAndTime(today, chartId, timeOfDay);
  }

  /**
   * Get the check-in for any specific date + time slot
   */
  static async getCheckInForDateAndSlot(chartId: string, date: string, timeOfDay: TimeOfDay): Promise<DailyCheckIn | null> {
    return localDb.getCheckInByDateAndTime(date, chartId, timeOfDay);
  }

  /**
   * Get which time slots have been filled for any given date
   */
  static async getCompletedTimeSlotsForDate(chartId: string, date: string): Promise<TimeOfDay[]> {
    const checkIns = await localDb.getCheckInsByDate(date, chartId);
    return checkIns.map(c => c.timeOfDay);
  }

  /**
   * Get today's most recent check-in (backward compat)
   */
  static async getTodayCheckIn(chartId: string): Promise<DailyCheckIn | null> {
    const today = toLocalDateString(new Date());
    return localDb.getCheckInByDate(today, chartId);
  }

  /**
   * Get all of today's check-ins (up to 4)
   */
  static async getTodayCheckIns(chartId: string): Promise<DailyCheckIn[]> {
    const today = toLocalDateString(new Date());
    return localDb.getCheckInsByDate(today, chartId);
  }

  /**
   * Get which time slots have been filled today
   */
  static async getCompletedTimeSlots(chartId: string): Promise<TimeOfDay[]> {
    const todayCheckIns = await this.getTodayCheckIns(chartId);
    return todayCheckIns.map(c => c.timeOfDay);
  }

  /**
   * Get the current auto-detected time slot
   */
  static getCurrentTimeSlot(): TimeOfDay {
    return detectTimeOfDay(new Date());
  }

  /**
   * Get all check-ins for a chart (for pattern analysis)
   */
  static async getAllCheckIns(chartId: string, limit?: number): Promise<DailyCheckIn[]> {
    return localDb.getCheckIns(chartId, limit);
  }

  /**
   * Get check-in count for streak tracking.
   * Uses COUNT(*) query — does NOT decrypt any rows.
   */
  static async getCheckInCount(chartId: string): Promise<number> {
    return localDb.getCheckInCount(chartId);
  }

  /**
   * Get current streak (consecutive days).
   * O(n) via Set lookup instead of O(n²) via Array.find().
   */
  static async getCurrentStreak(chartId: string): Promise<number> {
    const all = await localDb.getCheckIns(chartId, 90); // last 90 days max
    if (all.length === 0) return 0;

    // Build a Set of unique dates for O(1) lookups
    const dateSet = new Set(all.map(c => c.date));
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 90; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedDate = toLocalDateString(expected);

      if (dateSet.has(expectedDate)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get check-ins for a date range (for pattern reports).
   * Uses SQL-level WHERE instead of loading all rows.
   */
  static async getCheckInsInRange(
    chartId: string,
    startDate: string,
    endDate: string,
  ): Promise<DailyCheckIn[]> {
    return localDb.getCheckInsInRange(chartId, startDate, endDate);
  }
}
