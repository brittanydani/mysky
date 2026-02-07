// File: services/astrology/types.ts
// Astronomical and astrological data types (with absoluteDegree added to PlanetPosition)

export type HouseSystem =
  | 'placidus'
  | 'whole-sign'
  | 'equal-house'
  | 'koch'
  | 'campanus'
  | 'regiomontanus'
  | 'topocentric';

export type AspectTypeName =
  | 'conjunction'
  | 'opposition'
  | 'trine'
  | 'square'
  | 'sextile';

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
  timezone?: string; // IANA timezone identifier (library can derive / you can provide)
  houseSystem?: HouseSystem; // house system selection
  accuracyLevel?: 'exact' | 'approximate' | 'unknown-time';
}

export interface SimpleAspect {
  type: AspectTypeName;
  pointA: string; // e.g. "Moon"
  pointB: string; // e.g. "Saturn"
  orb: number; // degrees from exact aspect angle
  exactAngle: number; // 0, 60, 90, 120, 180
}

export interface AnglePosition {
  name: 'Ascendant' | 'Midheaven';
  sign: string;
  degree: number;
  absoluteDegree: number; // 0-360
}

export interface SimpleHouseCusp {
  house: number; // 1..12
  sign: string;
  degree: number; // 0..30 within sign
  absoluteDegree: number; // 0..360
}

// Raw astronomical positions from ephemeris (optional future use)
export interface PlanetaryPosition {
  longitude: number; // 0-360 degrees
  latitude: number;
  distance: number;
  speed: number; // daily motion
  isRetrograde: boolean;
}

// Planet and Zodiac types used by constants + legacy system
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
  number: number; // 1-12
}

// Astrological interpretation of astronomical position (legacy format used across your app)
export interface PlanetPlacement {
  planet: Planet;
  longitude: number; // 0-360 degrees
  sign: ZodiacSign;
  house: number; // 1-12
  degree: number; // 0-29 within sign
  minute: number; // 0-59 within degree
  isRetrograde: boolean;
  speed: number;
}

export interface HouseCusp {
  house: number; // 1-12
  longitude: number; // 0-360 degrees
  sign: ZodiacSign;
}

export interface AspectType {
  name: string;
  symbol: string;
  degrees: number;
  orb: number; // maximum orb allowed
  nature: 'Harmonious' | 'Challenging' | 'Neutral';
}

export interface Aspect {
  planet1: Planet;
  planet2: Planet;
  type: AspectType;
  orb: number; // degrees from exact
  isApplying: boolean;
  strength: number; // 0-1, based on orb tightness
}

// Legacy zodiac sign interface for emotional system + quick display
export interface AstrologySign {
  name: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  quality: 'Cardinal' | 'Fixed' | 'Mutable';
  rulingPlanet: string;
  dates: string;
}

// ✅ Enhanced planet position output (from circular-natal-horoscope-js)
// NOTE: This is your “new” normalized planet output used for calculations and future features.
export interface PlanetPosition {
  planet: string;          // "Sun", "Moon", ...
  sign: string;            // "Aries", ...
  degree: number;          // 0..30 within sign (with decimals)
  absoluteDegree: number;  // ✅ 0..360 (critical for aspects/transits/synastry)
  house?: number;          // 1..12 (only when time known)
  retrograde: boolean;
}

// Complete natal chart with all astronomical data
export interface NatalChart {
  id: string;
  name?: string;
  birthData: BirthData;

  // Legacy format for emotional system compatibility
  sunSign: AstrologySign;
  moonSign: AstrologySign;
  risingSign: AstrologySign | null;

  // Core placements (legacy format)
  placements: PlanetPlacement[];
  houseCusps: HouseCusp[];
  aspects: Aspect[];

  // Quick access to key placements (legacy format)
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
  ascendant: PlanetPlacement;
  midheaven: PlanetPlacement;

  // Enhanced astronomical data
  planets?: PlanetPosition[];
  houseSystem?: HouseSystem;
  houses?: SimpleHouseCusp[];
  angles?: AnglePosition[];

  // Accuracy and validation metadata
  calculationAccuracy?: {
    planetaryPositions: number; // degrees accuracy (summary/target)
    housePositions: number; // degrees accuracy (summary/target)
    aspectOrbs: number; // average orb across found aspects
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

  // Unknown time handling
  timeBasedFeaturesAvailable?: {
    risingSign: boolean;
    houses: boolean;
    angles: boolean;
    houseBasedInterpretations: boolean;
    exactBirthTime?: boolean;
  };

  // Error metadata
  errorCode?: 'ephemeris_unavailable' | 'timezone_unavailable' | 'validation_failed' | 'unknown_error';
  errorDetails?: string;

  // Chart metadata
  createdAt: string;
  updatedAt: string;
}

// Current planetary positions for transits
export interface TransitData {
  date: string;
  placements: PlanetPlacement[];
  aspects: Aspect[]; // aspects to natal chart (computed elsewhere)
}

// Emotional interpretation patterns
export interface EmotionalPattern {
  id: string;
  name: string;
  description: string;
  triggers: PlacementRule[];
  intensity: number; // 0-1
  themes: string[];
}

// Rule-based placement interpretation
export interface PlacementRule {
  planet?: Planet;
  sign?: ZodiacSign;
  house?: number;
  aspect?: {
    planet: Planet;
    type: AspectType;
    maxOrb?: number;
  };
  weight: number; // contribution to pattern
}

// Daily emotional weather based on transits
export interface DailyEmotionalWeather {
  date: string;
  emotionalClimate: string;
  moonInfluence: string;
  energyGuidance: string;
  gentlenessAreas: string[];
  careAction: string;
  intensity: number; // 0-1
  themes: string[];
}

// Relationship compatibility analysis
export interface CompatibilityAnalysis {
  person1Chart: NatalChart;
  person2Chart: NatalChart;
  synastryAspects: Aspect[];
  compositeChart: NatalChart;
  emotionalCompatibility: number; // 0-1
  communicationStyle: string;
  conflictAreas: string[];
  strengths: string[];
  growthOpportunities: string[];
}
