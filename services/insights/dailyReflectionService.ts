/**
 * Daily Reflection Service
 *
 * The foundational logic engine for the "Inner World" dossier. 
 * Handles deterministic daily question rotation and persistent state
 * management for the Identity Blueprint system, with Supabase as the
 * canonical store and local cache for drafts/offline UX.
 * * Aesthetic: Lunar Sky / Deep Space Logic
 * - 2–3 questions per category per day (3 on days divisible by 3).
 * - Deterministic rotation: Uses Fisher-Yates yearly shuffles seeded by user identity.
 * - Sealed States: Once a category is "sealed," it is committed to the psychological dossier.
 */

import {
  QUESTION_BANKS,
  ReflectionCategory,
  ReflectionQuestion,
} from '../../constants/dailyReflectionQuestions';
import {
  loadDailyReflectionData,
  loadPlainAccountScopedJson,
  persistDailyReflectionData,
  savePlainAccountScopedJson,
} from '../storage/selfKnowledgeStore';

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
  notes?: string;          // Optional free-text reflection note for the category dossier
}

export type ReflectionDraftAnswer = Omit<ReflectionAnswer, 'sealedAt'>;

export interface DailyReflectionData {
  answers: ReflectionAnswer[];
  /** Total number of unique days where at least one identity category was sealed */
  totalDaysCompleted: number;
  /** Initial timestamp of the user's first reflection (ISO string) */
  startedAt: string | null;
}

export interface DayQuestions {
  category: ReflectionCategory;
  questions: ReflectionQuestion[];
}

interface DraftReflectionData {
  answers: ReflectionDraftAnswer[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistence Logic
// ─────────────────────────────────────────────────────────────────────────────

const DRAFT_STORAGE_KEY = '@mysky:cache:daily_reflection_drafts';
const LEGACY_DRAFT_STORAGE_KEY = '@mysky:daily_reflection_drafts';
const PENDING_QUESTIONS_KEY = '@mysky:cache:pending_reflection_questions';
const LEGACY_PENDING_QUESTIONS_KEY = '@mysky:pending_reflection_questions';

interface PendingQuestionSet {
  date: string; // YYYY-MM-DD when these questions were generated
  questions: Record<ReflectionCategory, number[]>; // Persistent IDs per category
}

async function loadPendingQuestions(): Promise<PendingQuestionSet | null> {
  try {
    return await loadPlainAccountScopedJson<PendingQuestionSet | null>(
      PENDING_QUESTIONS_KEY,
      null,
      LEGACY_PENDING_QUESTIONS_KEY,
    );
  } catch { return null; }
}

async function savePendingQuestions(pending: PendingQuestionSet): Promise<void> {
  try {
    await savePlainAccountScopedJson(PENDING_QUESTIONS_KEY, pending);
  } catch {}
}

async function clearPendingQuestions(): Promise<void> {
  try {
    await savePlainAccountScopedJson<PendingQuestionSet | null>(PENDING_QUESTIONS_KEY, null);
  } catch {}
}

/**
 * Retrieves questions for a specific Blueprint category.
 * Questions are persisted (Locked) until all categories are sealed for the day.
 */
export async function getOrCreateTodayQuestions(
  category: ReflectionCategory,
  date: Date = getReflectionDate(),
  userSeed?: string,
): Promise<ReflectionQuestion[]> {
  const todayKey = getTodayKey(date);
  let pending = await loadPendingQuestions();
  const bank = QUESTION_BANKS[category];

  // Discard stale pending questions if the calendar day has shifted
  if (pending && pending.date !== todayKey) {
    await clearPendingQuestions();
    pending = null;
  }

  if (pending && pending.questions[category]) {
    return pending.questions[category].map(id => bank.find(q => q.id === id)!).filter(Boolean);
  }

  // Generate fresh deterministic set and lock it
  const fresh = getTodayQuestions(category, date, userSeed);
  const existingPending = pending ?? { date: todayKey, questions: {} as Record<ReflectionCategory, number[]> };
  existingPending.questions[category] = fresh.map(q => q.id);
  await savePendingQuestions(existingPending as PendingQuestionSet);
  return fresh;
}

/**
 * Wipes pending question cache once the user has sealed all categories.
 */
export async function clearPendingIfAllSealed(): Promise<void> {
  const sealStatus = await getCategorySealStatus();
  if (sealStatus.values && sealStatus.archetypes && sealStatus.cognitive && sealStatus.intelligence) {
    await clearPendingQuestions();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic Rotation Engine
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes the reflection day: 6:00 AM to 5:59 AM.
 * Ensures late-night reflections are anchored to the correct chronological day.
 */
export function getReflectionDate(now: Date = new Date()): Date {
  if (now.getHours() < 6) {
    const prev = new Date(now);
    prev.setDate(prev.getDate() - 1);
    return prev;
  }
  return now;
}

/** 1-indexed day of year (1–366). Leap-year aware. */
function getDayOfYear(date: Date = new Date()): number {
  const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const year = date.getFullYear();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (isLeap) MONTH_DAYS[1] = 29;
  let day = date.getDate();
  for (let m = 0; m < date.getMonth(); m++) day += MONTH_DAYS[m];
  return day;
}

export function getTodayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function seededShuffle(length: number, seed: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  let s = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

/**
 * Selects the questions for a specific category based on the yearly rotation.
 * Incorporates a userSeed (Chart ID) to ensure personal dossier variety.
 */
export function getTodayQuestions(
  category: ReflectionCategory,
  date: Date = new Date(),
  userSeed?: string,
): ReflectionQuestion[] {
  const dayOfYear = getDayOfYear(date);
  const bank = QUESTION_BANKS[category];
  const count = dayOfYear % 3 === 0 ? 3 : 2;

  const categoryOffset: Record<ReflectionCategory, number> = {
    values: 0, archetypes: 31337, cognitive: 98765, intelligence: 142857,
  };

  const userOffset = userSeed ? hashString(userSeed) : 0;
  const seed = (date.getFullYear() * 7919 + categoryOffset[category] + userOffset) >>> 0;

  const bankSize = bank.length;
  const shuffled = seededShuffle(bankSize, seed);

  // Sequential progression logic: 2 questions per day + 1 bonus on every 3rd day
  const d = dayOfYear - 1;
  const startIndex = (2 * d + Math.floor(d / 3)) % bankSize;

  const questions: ReflectionQuestion[] = [];
  for (let i = 0; i < count; i++) {
    questions.push(bank[shuffled[(startIndex + i) % bankSize]]);
  }

  return questions;
}

export function getAllTodayQuestions(date: Date = new Date(), userSeed?: string): DayQuestions[] {
  const categories: ReflectionCategory[] = ['values', 'archetypes', 'cognitive', 'intelligence'];
  return categories.map(category => ({
    category,
    questions: getTodayQuestions(category, date, userSeed),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage & Sealing Logic
// ─────────────────────────────────────────────────────────────────────────────

export async function loadReflections(): Promise<DailyReflectionData> {
  try {
    return await loadDailyReflectionData();
  } catch {}
  return { answers: [], totalDaysCompleted: 0, startedAt: null };
}

async function loadDraftReflectionData(): Promise<DraftReflectionData> {
  try {
    return await loadPlainAccountScopedJson<DraftReflectionData>(
      DRAFT_STORAGE_KEY,
      { answers: [] },
      LEGACY_DRAFT_STORAGE_KEY,
    );
  } catch {}
  return { answers: [] };
}

async function saveDraftReflectionData(data: DraftReflectionData): Promise<void> {
  if (data.answers.length === 0) {
    await savePlainAccountScopedJson(DRAFT_STORAGE_KEY, { answers: [] });
    return;
  }
  await savePlainAccountScopedJson(DRAFT_STORAGE_KEY, data);
}

function buildReflectionAnswerKey(
  answer: Pick<ReflectionDraftAnswer, 'category' | 'date' | 'questionId'>,
): string {
  return `${answer.date}:${answer.category}:${answer.questionId}`;
}

export async function loadReflectionDrafts(): Promise<ReflectionDraftAnswer[]> {
  const data = await loadDraftReflectionData();
  return data.answers;
}

export async function getAnswersByCategory(
  category: ReflectionCategory,
): Promise<ReflectionAnswer[]> {
  const data = await loadReflections();
  return data.answers.filter((answer) => answer.category === category);
}

export async function getDraftAnswersByCategory(
  category: ReflectionCategory,
): Promise<ReflectionDraftAnswer[]> {
  const drafts = await loadReflectionDrafts();
  return drafts.filter((answer) => answer.category === category);
}

export async function upsertDraftAnswer(answer: ReflectionDraftAnswer): Promise<void> {
  if (!answer.answer.trim()) return;
  const data = await loadDraftReflectionData();
  const key = buildReflectionAnswerKey(answer);
  const existingIndex = data.answers.findIndex(d => buildReflectionAnswerKey(d) === key);

  if (existingIndex >= 0) {
    data.answers[existingIndex] = answer;
  } else {
    data.answers.push(answer);
  }
  await saveDraftReflectionData(data);
}

export async function clearDraftAnswers(category?: ReflectionCategory, date?: string): Promise<void> {
  const data = await loadDraftReflectionData();
  const filtered = data.answers.filter((answer) => {
    const categoryMatches = category === undefined || answer.category === category;
    const dateMatches = date === undefined || answer.date === date;
    return !(categoryMatches && dateMatches);
  });

  if (filtered.length === data.answers.length) return;
  await saveDraftReflectionData({ answers: filtered });
}

/**
 * Commits identity answers to the permanent encrypted dossier.
 */
export async function sealCategoryAnswers(
  category: ReflectionCategory,
  newAnswers: Omit<ReflectionAnswer, 'sealedAt'>[],
  notes?: string,
): Promise<DailyReflectionData> {
  const data = await loadReflections();
  const now = new Date().toISOString();

  if (!data.startedAt) data.startedAt = now;

  for (const ans of newAnswers) {
    if (!ans.answer.trim() || ans.category !== category) continue;

    const existing = data.answers.findIndex(
      a => a.date === ans.date && a.questionId === ans.questionId && a.category === ans.category,
    );

    const sealed: ReflectionAnswer = {
      ...ans,
      sealedAt: now,
      ...(notes !== undefined ? { notes } : {}),
    };

    if (existing >= 0) {
      data.answers[existing] = sealed;
    } else {
      data.answers.push(sealed);
    }
  }

  data.totalDaysCompleted = new Set(data.answers.map(a => a.date)).size;
  await persistDailyReflectionData(
    data,
    data.answers.filter(
      (answer) => answer.category === category && answer.date === newAnswers[0]?.date,
    ),
  );
  await clearDraftAnswers(category, newAnswers[0]?.date);

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Insight & Status Engine
// ─────────────────────────────────────────────────────────────────────────────

export async function isCategorySealedToday(
  category: ReflectionCategory,
  date: Date = getReflectionDate(),
): Promise<boolean> {
  const data = await loadReflections();
  const today = getTodayKey(date);
  return data.answers.some(a => a.date === today && a.category === category);
}

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
    intelligence: todayAnswers.some(a => a.category === 'intelligence'),
  };
}

export async function getCurrentStreak(): Promise<number> {
  const data = await loadReflections();
  if (data.answers.length === 0) return 0;

  const daySet = new Set(data.answers.map(a => a.date));
  const effectiveNow = getReflectionDate();
  const today = getTodayKey(effectiveNow);

  let streak = 0;
  let checkDate = effectiveNow;

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

export async function getReflectionSummary(): Promise<{
  totalAnswers: number;
  totalDays: number;
  streak: number;
  byCategory: Record<ReflectionCategory, number>;
  recentAnswers: ReflectionAnswer[];
  reflectionDates: string[];
}> {
  const data = await loadReflections();
  const streak = await getCurrentStreak();

  const byCategory: Record<ReflectionCategory, number> = {
    values: 0, archetypes: 0, cognitive: 0, intelligence: 0,
  };

  for (const answer of data.answers) {
    byCategory[answer.category]++;
  }

  const reflectionDates = [...new Set(data.answers.map(a => a.date))];
  const recentAnswers = [...data.answers]
    .sort((a, b) => b.sealedAt.localeCompare(a.sealedAt))
    .slice(0, 30);

  return {
    totalAnswers: data.answers.length,
    totalDays: reflectionDates.length,
    streak,
    byCategory,
    recentAnswers,
    reflectionDates,
  };
}
