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
 * ✅ Cryptographically strong UUID (Expo)
 */
export function generateId(): string {
  return Crypto.randomUUID();
}
