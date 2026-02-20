// File: services/astrology/types.ts
// Astronomical and astrological data types
// ✅ Backward-compatible unions for sign typing and retrograde naming.
// ✅ Optional angles/house cusps when birth time unknown (so UI won’t crash)
// ✅ Part of Fortune included as PointPlacement

export type HouseSystem =
  | 'placidus'
  | 'whole-sign'
  | 'equal-house'
  | 'koch'
  | 'campanus'
  | 'regiomontanus'
  | 'topocentric';

export type AspectTypeName = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface BirthData {
  date: string; // ISO date string (YYYY-MM-DD)
  time?: string; // HH:MM format (optional for unknown time)
  hasUnknownTime: boolean;
  place: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  houseSystem?: HouseSystem;
  orbPreset?: string;
  accuracyLevel?: 'exact' | 'approximate' | 'unknown-time';
}

export interface SimpleAspect {
  type: AspectTypeName;
  pointA: string;
  pointB: string;
  orb: number;
  exactAngle: number;
}

/**
 * Some parts of the app store sign as string (legacy),
 * while newer code prefers full ZodiacSign (element/modality).
 * Keep both to avoid breaking older builders.
 */
export type SignLike = ZodiacSign | string;

export interface AnglePosition {
  name: 'Ascendant' | 'Midheaven';
  sign: SignLike; // ✅ string | ZodiacSign
  degree: number; // 0–29
  absoluteDegree: number; // 0–360
}

export interface SimpleHouseCusp {
  house: number; // 1–12
  sign: SignLike; // ✅ string | ZodiacSign
  degree: number; // 0–29
  absoluteDegree: number; // 0–360
}

export interface PlanetaryPosition {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  isRetrograde: boolean;
}

export interface Planet {
  name: string;
  symbol: string;
  type: 'Luminary' | 'Personal' | 'Social' | 'Transpersonal' | 'Asteroid' | 'Point';
}

export interface ZodiacSign {
  name: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  ruler: Planet;
  number: number; // 1–12 Aries..Pisces
}

export interface PlanetPlacement {
  planet: Planet;
  longitude: number; // 0–360
  sign: ZodiacSign; // ✅ canonical as full ZodiacSign
  house: number; // 1–12 (or 0 when unknown-time; UI can show "—")
  degree: number; // 0–29
  minute: number; // 0–59
  isRetrograde: boolean;
  speed: number;
}

export interface HouseCusp {
  house: number; // 1–12
  longitude: number; // 0–360
  sign: ZodiacSign;
}

export interface AspectType {
  name: string; // e.g. "Trine" (UI) or "trine" (some legacy code) — callers should normalize casing
  symbol: string;
  degrees: number;
  orb: number;
  nature: 'Harmonious' | 'Challenging' | 'Neutral';
}

export interface Aspect {
  planet1: Planet;
  planet2: Planet;
  type: AspectType;
  orb: number;
  isApplying: boolean;
  strength: number;
}

// Legacy / UI type (your older emotional system)
export interface AstrologySign {
  name: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  quality: 'Cardinal' | 'Fixed' | 'Mutable';
  rulingPlanet: string;
  dates: string;
}

/**
 * Normalized output used for calculations.
 * ✅ Canonical retrograde name: isRetrograde
 * ✅ Legacy alias: retrograde (optional)
 */
export interface PlanetPosition {
  planet: string; // e.g. "Sun"
  sign: string; // e.g. "Leo"
  degree: number; // 0–29
  absoluteDegree: number; // 0–360
  house?: number; // optional when birth time unknown
  isRetrograde: boolean; // ✅ canonical
  retrograde?: boolean; // ✅ legacy alias
  speed?: number; // degrees per day (negative when retrograde)
}

/**
 * Generic sensitive / calculated point (e.g. Part of Fortune)
 */
export interface PointPlacement {
  name: 'Part of Fortune';
  longitude: number; // 0–360
  sign: ZodiacSign;
  degree: number; // 0–29
  minute: number; // 0–59
  house?: number;
}

/**
 * Complete natal chart
 */
export interface NatalChart {
  id: string;
  name?: string;
  birthData: BirthData;

  // Legacy emotional system
  sunSign: AstrologySign;
  moonSign: AstrologySign;
  risingSign: AstrologySign | null;

  // Core placements (legacy + UI)
  placements: PlanetPlacement[];
  houseCusps: HouseCusp[];
  aspects: Aspect[];

  // Quick access
  sun: PlanetPlacement;
  moon: PlanetPlacement;
  mercury: PlanetPlacement;
  venus: PlanetPlacement;
  mars: PlanetPlacement;
  jupiter: PlanetPlacement;
  saturn: PlanetPlacement;
  uranus: PlanetPlacement;
  neptune: PlanetPlacement;
  pluto: PlanetPlacement;

  // Angles
  // NOTE: make optional to support unknown-time charts without crashing UI that guards these fields
  ascendant?: PlanetPlacement;
  midheaven?: PlanetPlacement;

  // Enhanced / calculation-friendly
  planets?: PlanetPosition[];
  houseSystem?: HouseSystem;

  // Lightweight consumers
  houses?: SimpleHouseCusp[];
  angles?: AnglePosition[];

  // Calculated points
  partOfFortune?: PointPlacement;

  // Accuracy metadata
  calculationAccuracy?: {
    planetaryPositions: number;
    housePositions: number;
    aspectOrbs: number;
    validationStatus: 'verified' | 'approximate' | 'unverified';
    referenceComparison?: {
      reference: 'ephemeris';
      maxDifference: number;
      isWithinStandards: boolean;
      comparisons: Array<{
        planet: string;
        difference: number;
        threshold: number;
        withinThreshold: boolean;
      }>;
    };
  };

  timeBasedFeaturesAvailable?: {
    risingSign: boolean;
    houses: boolean;
    angles: boolean;
    houseBasedInterpretations: boolean;
    exactBirthTime?: boolean;
  };

  errorCode?: 'ephemeris_unavailable' | 'timezone_unavailable' | 'validation_failed' | 'unknown_error';
  errorDetails?: string;

  createdAt: string;
  updatedAt: string;
}

export interface TransitData {
  date: string;
  placements: PlanetPlacement[];
  aspects: Aspect[];
}

export interface EmotionalPattern {
  id: string;
  name: string;
  description: string;
  triggers: PlacementRule[];
  intensity: number;
  themes: string[];
}

export interface PlacementRule {
  planet?: Planet;
  sign?: ZodiacSign;
  house?: number;
  aspect?: {
    planet: Planet;
    type: AspectType;
    maxOrb?: number;
  };
  weight: number;
}

export interface DailyEmotionalWeather {
  date: string;
  emotionalClimate: string;
  moonInfluence: string;
  energyGuidance: string;
  gentlenessAreas: string[];
  careAction: string;
  intensity: number;
  themes: string[];
}

export interface CompatibilityAnalysis {
  person1Chart: NatalChart;
  person2Chart: NatalChart;
  synastryAspects: Aspect[];
  compositeChart: NatalChart;
  emotionalCompatibility: number;
  communicationStyle: string;
  conflictAreas: string[];
  strengths: string[];
  growthOpportunities: string[];
}
