/**
 * Daily Reflection Service
 *
 * Handles deterministic daily question rotation, encrypted answer storage,
 * and progress tracking for the Inner World daily reflection system.
 *
 * - 2–3 questions per category per day (3 questions on days divisible by 3, else 2)
 * - Uses day-of-year for deterministic rotation (everyone sees same questions same day)
 * - Answers are stored encrypted since they contain deeply personal data
 * - Progress is tracked per-category for the insights engine
 */

import { EncryptedAsyncStorage } from '../storage/encryptedAsyncStorage';
import {
  QUESTION_BANKS,
  ReflectionCategory,
  ReflectionQuestion,
} from '../../constants/dailyReflectionQuestions';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ReflectionAnswer {
  questionId: number;
  category: ReflectionCategory;
  questionText: string;
  answer: string;
  date: string;          // YYYY-MM-DD
  sealedAt: string;      // ISO timestamp
}

export interface DailyReflectionData {
  answers: ReflectionAnswer[];
  /** Total number of days where at least one answer was sealed */
  totalDaysCompleted: number;
  /** First day a reflection was answered (ISO string) */
  startedAt: string | null;
}

export interface DayQuestions {
  category: ReflectionCategory;
  questions: ReflectionQuestion[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@mysky:daily_reflections';
const QUESTIONS_PER_CATEGORY = 365;

// ─────────────────────────────────────────────────────────────────────────────
// Question selection — deterministic by day
// ─────────────────────────────────────────────────────────────────────────────

/** Get 0-indexed day of year (0–365). */
function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Get today as YYYY-MM-DD in local time. */
export function getTodayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Select today's questions for a given category.
 * Returns 3 questions on every 3rd day, 2 otherwise.
 * Uses a staggered offset per category so questions don't repeat across categories.
 */
export function getTodayQuestions(
  category: ReflectionCategory,
  date: Date = new Date(),
): ReflectionQuestion[] {
  const dayOfYear = getDayOfYear(date);
  const bank = QUESTION_BANKS[category];
  const count = dayOfYear % 3 === 0 ? 3 : 2;

  // Offset per category so questions don't overlap in index space
  const categoryOffset: Record<ReflectionCategory, number> = {
    values: 0,
    archetypes: 7,
    cognitive: 13,
  };
  const offset = categoryOffset[category];

  const questions: ReflectionQuestion[] = [];
  for (let i = 0; i < count; i++) {
    // Spread picks across the bank using golden-ratio-like spacing
    const idx = (dayOfYear * 3 + i * 127 + offset) % QUESTIONS_PER_CATEGORY;
    questions.push(bank[idx]);
  }

  return questions;
}

/**
 * Get today's questions for all three categories.
 */
export function getAllTodayQuestions(date: Date = new Date()): DayQuestions[] {
  const categories: ReflectionCategory[] = ['values', 'archetypes', 'cognitive'];
  return categories.map(category => ({
    category,
    questions: getTodayQuestions(category, date),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage — read / write
// ─────────────────────────────────────────────────────────────────────────────

/** Load all reflection data from encrypted storage. */
export async function loadReflections(): Promise<DailyReflectionData> {
  try {
    const raw = await EncryptedAsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DailyReflectionData;
  } catch {
    // Graceful fallback
  }
  return { answers: [], totalDaysCompleted: 0, startedAt: null };
}

/** Save reflection data to encrypted storage. */
async function saveReflections(data: DailyReflectionData): Promise<void> {
  await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Seal a batch of answers for today. Merges with existing data,
 * deduplicates by (date + questionId + category), and increments
 * the day counter if this is a new day.
 */
export async function sealTodayAnswers(
  newAnswers: Omit<ReflectionAnswer, 'sealedAt'>[],
): Promise<DailyReflectionData> {
  const data = await loadReflections();
  const now = new Date().toISOString();

  // Check if this is the first answer ever
  if (!data.startedAt) {
    data.startedAt = now;
  }

  // Add answers, deduplicating by (date + questionId + category)
  for (const ans of newAnswers) {
    if (!ans.answer.trim()) continue;

    const existing = data.answers.findIndex(
      a => a.date === ans.date && a.questionId === ans.questionId && a.category === ans.category,
    );

    const sealed: ReflectionAnswer = { ...ans, sealedAt: now };

    if (existing >= 0) {
      data.answers[existing] = sealed;
    } else {
      data.answers.push(sealed);
    }
  }

  // Always derive totalDaysCompleted from actual data — avoids counter drift
  data.totalDaysCompleted = new Set(data.answers.map(a => a.date)).size;

  await saveReflections(data);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress & stats
// ─────────────────────────────────────────────────────────────────────────────

/** Check whether today's reflections have already been sealed. */
export async function isTodaySealed(date: Date = new Date()): Promise<boolean> {
  const data = await loadReflections();
  const today = getTodayKey(date);
  return data.answers.some(a => a.date === today);
}

/** Get total unique days completed (derived from actual data). */
export async function getTotalDaysCompleted(): Promise<number> {
  const data = await loadReflections();
  return new Set(data.answers.map(a => a.date)).size;
}

/** Get answers for a specific category across all time. */
export async function getAnswersByCategory(
  category: ReflectionCategory,
): Promise<ReflectionAnswer[]> {
  const data = await loadReflections();
  return data.answers.filter(a => a.category === category);
}

/**
 * Pure streak computation — no I/O.
 * Counts consecutive days with at least one answer, working backward
 * from today (or yesterday if today has no answers yet).
 */
function computeStreakFromAnswers(answers: ReflectionAnswer[]): number {
  if (answers.length === 0) return 0;

  const daySet = new Set(answers.map(a => a.date));
  const today = getTodayKey();

  let streak = 0;
  let checkDate = new Date();

  // Allow streak to start from today or yesterday
  if (!daySet.has(today)) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (!daySet.has(getTodayKey(yesterday))) return 0;
    checkDate = yesterday;
  }

  for (let i = 0; i < 400; i++) {
    const key = getTodayKey(checkDate);
    if (daySet.has(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/** Get the current streak (consecutive days with at least one answer). */
export async function getCurrentStreak(): Promise<number> {
  const data = await loadReflections();
  return computeStreakFromAnswers(data.answers);
}

/**
 * Get a summary object useful for the insights engine.
 * Returns category-level answer counts and recent answers.
 */
export async function getReflectionSummary(): Promise<{
  totalAnswers: number;
  totalDays: number;
  streak: number;
  byCategory: Record<ReflectionCategory, number>;
  recentAnswers: ReflectionAnswer[];
  reflectionDates: string[];
}> {
  const data = await loadReflections();
  // Use pure function — no redundant storage read
  const streak = computeStreakFromAnswers(data.answers);

  const byCategory: Record<ReflectionCategory, number> = {
    values: 0,
    archetypes: 0,
    cognitive: 0,
  };

  for (const answer of data.answers) {
    byCategory[answer.category]++;
  }

  // All unique reflection dates (for mood cross-ref in the insights engine)
  const reflectionDates = [...new Set(data.answers.map(a => a.date))];

  // Most recent 30 answers for context display
  const recentAnswers = [...data.answers]
    .sort((a, b) => b.sealedAt.localeCompare(a.sealedAt))
    .slice(0, 30);

  return {
    totalAnswers: data.answers.length,
    // Derived from actual data — not the stored counter
    totalDays: reflectionDates.length,
    streak,
    byCategory,
    recentAnswers,
    reflectionDates,
  };
}
