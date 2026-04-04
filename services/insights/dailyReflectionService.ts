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
  answer: string;          // Scale label (e.g. "Very True", "Almost Always")
  scaleValue?: number;     // 0–3 numeric scale value
  date: string;            // YYYY-MM-DD
  sealedAt: string;        // ISO timestamp
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
// Pending question persistence — questions stay until all categories are sealed
// ─────────────────────────────────────────────────────────────────────────────

const PENDING_QUESTIONS_KEY = '@mysky:pending_reflection_questions';

interface PendingQuestionSet {
  date: string; // YYYY-MM-DD when these questions were generated
  questions: Record<ReflectionCategory, number[]>; // question IDs per category
}

async function loadPendingQuestions(): Promise<PendingQuestionSet | null> {
  try {
    const raw = await EncryptedAsyncStorage.getItem(PENDING_QUESTIONS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function savePendingQuestions(pending: PendingQuestionSet): Promise<void> {
  try {
    await EncryptedAsyncStorage.setItem(PENDING_QUESTIONS_KEY, JSON.stringify(pending));
  } catch {}
}

async function clearPendingQuestions(): Promise<void> {
  try {
    await EncryptedAsyncStorage.removeItem(PENDING_QUESTIONS_KEY);
  } catch {}
}

/**
 * Get questions for a category, persisting them until all categories are sealed.
 * If pending questions exist (from a previous unseal day), return those.
 * Otherwise generate fresh ones and store them.
 */
export async function getOrCreateTodayQuestions(
  category: ReflectionCategory,
  date: Date = getReflectionDate(),
  userSeed?: string,
): Promise<ReflectionQuestion[]> {
  const todayKey = getTodayKey(date);
  let pending = await loadPendingQuestions();
  const bank = QUESTION_BANKS[category];

  // Discard stale pending questions from a previous day
  if (pending && pending.date !== todayKey) {
    await clearPendingQuestions();
    pending = null;
  }

  if (pending && pending.questions[category]) {
    // Return the persisted questions
    return pending.questions[category].map(id => bank.find(q => q.id === id)!).filter(Boolean);
  }

  // Generate fresh and store
  const fresh = getTodayQuestions(category, date, userSeed);
  const existingPending = pending ?? { date: todayKey, questions: {} as Record<ReflectionCategory, number[]> };
  existingPending.questions[category] = fresh.map(q => q.id);
  await savePendingQuestions(existingPending as PendingQuestionSet);
  return fresh;
}

/**
 * Clear pending questions when all categories have been sealed.
 * Call this after sealing — if all 3 are sealed, pending is wiped
 * so the next session generates fresh questions.
 */
export async function clearPendingIfAllSealed(): Promise<void> {
  const sealStatus = await getCategorySealStatus();
  if (sealStatus.values && sealStatus.archetypes && sealStatus.cognitive) {
    await clearPendingQuestions();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Question selection — deterministic by day
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the effective date for question selection.
 * The reflection day runs from 6:00 AM to 5:59 AM the following morning.
 * Any time before 6:00 AM belongs to the previous calendar day's reflection.
 */
export function getReflectionDate(now: Date = new Date()): Date {
  if (now.getHours() < 6) {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return prev;
  }
  return now;
}

/** Get 1-indexed day of year (1–366). */
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
 * Simple deterministic hash of a string to a positive integer.
 * Used to create per-user offsets so different users see different questions.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministic Fisher-Yates shuffle of an array of indices.
 * Uses a simple LCG seeded by `seed` so the result is reproducible.
 * The shuffle resets each calendar year, ensuring questions cycle annually.
 */
function seededShuffle(length: number, seed: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  let s = seed >>> 0; // treat as unsigned 32-bit
  for (let i = arr.length - 1; i > 0; i--) {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    const j = s % (i + 1);
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

/**
 * Select today's questions for a given category.
 * Returns 3 questions on every 3rd day, 2 otherwise.
 *
 * Questions are drawn sequentially from a deterministic yearly shuffle of the
 * full question bank (seeded by year + category + optional userSeed). Because
 * each day advances the cursor by 2–3 positions through a 365-item permutation,
 * the same question cannot appear twice within ~156 days — well beyond the
 * 90-day no-repeat window.
 *
 * Pass `userSeed` (e.g. chartId or profile hash) to personalise which
 * questions each user receives on a given day.
 */
export function getTodayQuestions(
  category: ReflectionCategory,
  date: Date = new Date(),
  userSeed?: string,
): ReflectionQuestion[] {
  const dayOfYear = getDayOfYear(date);
  const bank = QUESTION_BANKS[category];
  const count = dayOfYear % 3 === 0 ? 3 : 2;

  // Unique per-category prime offset so each category gets its own shuffled deck
  const categoryOffset: Record<ReflectionCategory, number> = {
    values:     0,
    archetypes: 31337,
    cognitive:  98765,
  };

  // Seed encodes year + category + user so the deck reshuffles each year
  // and differs per user while remaining fully deterministic
  const userOffset = userSeed ? hashString(userSeed) : 0;
  const seed = (date.getFullYear() * 7919 + categoryOffset[category] + userOffset) >>> 0;

  const shuffled = seededShuffle(QUESTIONS_PER_CATEGORY, seed);

  // Calculate how many questions have been asked in days 1..(dayOfYear-1).
  // Each day d contributes 3 questions if d%3===0, otherwise 2.
  // Total through day d = 2d + floor(d/3).
  const d = dayOfYear - 1;
  const startIndex = (2 * d + Math.floor(d / 3)) % QUESTIONS_PER_CATEGORY;

  const questions: ReflectionQuestion[] = [];
  for (let i = 0; i < count; i++) {
    questions.push(bank[shuffled[(startIndex + i) % QUESTIONS_PER_CATEGORY]]);
  }

  return questions;
}

/**
 * Get today's questions for all three categories.
 * Pass `userSeed` to personalise the rotation per user.
 */
export function getAllTodayQuestions(date: Date = new Date(), userSeed?: string): DayQuestions[] {
  const categories: ReflectionCategory[] = ['values', 'archetypes', 'cognitive'];
  return categories.map(category => ({
    category,
    questions: getTodayQuestions(category, date, userSeed),
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
    // Accept either scale-based (answer label set) or legacy free-text
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
export async function isTodaySealed(date: Date = getReflectionDate()): Promise<boolean> {
  const data = await loadReflections();
  const today = getTodayKey(date);
  return data.answers.some(a => a.date === today);
}

/** Check whether a specific category has been sealed for a given date. */
export async function isCategorySealedToday(
  category: ReflectionCategory,
  date: Date = getReflectionDate(),
): Promise<boolean> {
  const data = await loadReflections();
  const today = getTodayKey(date);
  return data.answers.some(a => a.date === today && a.category === category);
}

/**
 * Get the sealed status for each category for a given date.
 * Returns a record of category → boolean.
 */
export async function getCategorySealStatus(
  date: Date = getReflectionDate(),
): Promise<Record<ReflectionCategory, boolean>> {
  const data = await loadReflections();
  const today = getTodayKey(date);
  const todayAnswers = data.answers.filter(a => a.date === today);
  return {
    values: todayAnswers.some(a => a.category === 'values'),
    archetypes: todayAnswers.some(a => a.category === 'archetypes'),
    cognitive: todayAnswers.some(a => a.category === 'cognitive'),
  };
}

/**
 * Seal answers for a single category. Independent of other categories
 * so users can seal each category at their own pace throughout the day.
 */
export async function sealCategoryAnswers(
  category: ReflectionCategory,
  newAnswers: Omit<ReflectionAnswer, 'sealedAt'>[],
): Promise<DailyReflectionData> {
  const data = await loadReflections();
  const now = new Date().toISOString();

  if (!data.startedAt) {
    data.startedAt = now;
  }

  for (const ans of newAnswers) {
    if (!ans.answer.trim()) continue;
    if (ans.category !== category) continue;

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

  data.totalDaysCompleted = new Set(data.answers.map(a => a.date)).size;

  await saveReflections(data);
  return data;
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
  const effectiveNow = getReflectionDate();
  const today = getTodayKey(effectiveNow);

  let streak = 0;
  let checkDate = effectiveNow;

  // Allow streak to start from today or yesterday
  if (!daySet.has(today)) {
    const yesterday = new Date(effectiveNow);
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
