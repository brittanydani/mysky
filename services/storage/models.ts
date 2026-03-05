import { HouseSystem } from '../astrology/types';
import * as Crypto from 'expo-crypto';

export interface SavedChart {
  id: string;
  name?: string;

  birthDate: string;      // YYYY-MM-DD
  birthTime?: string;     // HH:MM (optional)
  hasUnknownTime: boolean;

  birthPlace: string;
  latitude: number;
  longitude: number;

  timezone?: string;      // ✅ IANA timezone (America/Detroit)
  houseSystem?: HouseSystem;

  createdAt: string;
  updatedAt: string;

  isDeleted: boolean;
  deletedAt?: string;     // ✅ optional, recommended
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD

  mood: 'calm' | 'soft' | 'okay' | 'heavy' | 'stormy';
  moonPhase: 'new' | 'waxing' | 'full' | 'waning';

  title?: string;
  content: string; // consider encrypting at rest

  // v8 — chart linkage + transit context (not encrypted; no PII)
  chartId?: string;           // references saved_charts.id
  transitSnapshot?: string;   // JSON-serialized TransitSnapshot

  // v10 — journal NLP summaries (encrypted at rest)
  contentKeywords?: string;     // encrypted JSON: { keywords, top, tokenCount }
  contentEmotions?: string;     // encrypted JSON: { counts, rates }
  contentSentiment?: string;    // encrypted JSON: { sentiment }
  contentWordCount?: number;    // plaintext word count
  contentReadingMinutes?: number; // estimated reading time

  createdAt: string;
  updatedAt: string;

  isDeleted: boolean;
  deletedAt?: string; // ✅ optional, recommended
}

export interface AppSettings {
  id: string;

  cloudSyncEnabled: boolean;
  lastSyncAt?: string;

  lastBackupAt?: string;  // you already use this in SettingsScreen
  userId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CachedInterpretation {
  id: string;
  chartId: string;

  type: 'sun_sign' | 'moon_sign' | 'rising_sign' | 'full_chart';
  content: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Relationship Chart - For partner, ex, child, friend comparisons
 */
export interface RelationshipChart {
  id: string;
  
  // The person this relationship is with
  name: string;
  relationship: 'partner' | 'ex' | 'child' | 'parent' | 'friend' | 'sibling' | 'other';
  
  // Their birth data
  birthDate: string;      // YYYY-MM-DD
  birthTime?: string;     // HH:MM (optional)
  hasUnknownTime: boolean;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  
  // Reference to user's chart
  userChartId: string;
  
  createdAt: string;
  updatedAt: string;
  
  isDeleted: boolean;
  deletedAt?: string;
}

/**
 * Sleep entry — tracks nightly rest quality, duration, and dream journal.
 * dream_text and notes are encrypted at rest.
 */
export interface SleepEntry {
  id: string;
  chartId: string;

  date: string;              // YYYY-MM-DD (the night being logged)
  durationHours?: number;    // e.g. 7.5
  quality?: number;          // 1–5 (moons)
  dreamText?: string;        // encrypted — dream journal
  dreamMood?: string;        // how the dream felt (legacy — kept for migration compat)
  dreamFeelings?: string;    // JSON: SelectedFeeling[] — encrypted at rest
  dreamMetadata?: string;    // JSON: DreamMetadata — encrypted at rest
  notes?: string;            // encrypted — legacy general sleep notes (no longer shown in UI)

  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

/**
 * ✅ Cryptographically strong UUID (Expo)
 */
export function generateId(): string {
  return Crypto.randomUUID();
}
