import { getRemoteAstrologyCalculationUrl } from '../../constants/config';
import { logger } from '../../utils/logger';
import { Ayanamsa, HouseSystem, PlanetPosition } from './types';
import { degreeInSign, normalize360, signFromLongitude } from './sharedHelpers';
import type { SwissEphChartData } from './swissEphemerisEngine';

const REMOTE_SWISS_TIMEOUT_MS = 10000;

export interface RemoteSwissCalculationRequest {
  version: 1;
  engine: 'swiss-ephemeris';
  utc: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
  latitude: number;
  longitude: number;
  houseSystem: HouseSystem;
  includeHouses: boolean;
  includeAsteroids: boolean;
  zodiacSystem: 'tropical' | 'sidereal';
  sidereal: boolean;
  ayanamsa: Ayanamsa;
  lilithMethod: 'mean' | 'true';
}

export function isRemoteSwissEphemerisConfigured(): boolean {
  return getRemoteAstrologyCalculationUrl() !== null;
}

export async function calculateChartRemoteSwiss(
  request: Omit<RemoteSwissCalculationRequest, 'version' | 'engine'>
): Promise<SwissEphChartData> {
  const endpoint = getRemoteAstrologyCalculationUrl();
  if (!endpoint) {
    throw new Error('Remote Swiss Ephemeris endpoint is not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_SWISS_TIMEOUT_MS);
  const body: RemoteSwissCalculationRequest = {
    version: 1,
    engine: 'swiss-ephemeris',
    ...request,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Remote Swiss Ephemeris returned HTTP ${response.status}`);
    }

    const json = await response.json();
    const payload = json?.data ?? json;
    return normalizeRemoteSwissResponse(payload, request.includeHouses);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn('[RemoteSwissEphemeris] Calculation failed:', { message });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeRemoteSwissResponse(payload: any, includeHouses: boolean): SwissEphChartData {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Remote Swiss Ephemeris response is empty or malformed.');
  }

  if (!Array.isArray(payload.planets)) {
    throw new Error('Remote Swiss Ephemeris response is missing planets.');
  }

  const planets = payload.planets.map(normalizeRemotePlanet);
  if (includeHouses) {
    if (!Array.isArray(payload.cusps) || payload.cusps.length !== 12) {
      throw new Error('Remote Swiss Ephemeris response is missing 12 house cusps.');
    }
    if (!Number.isFinite(Number(payload.ascendant)) || !Number.isFinite(Number(payload.mc))) {
      throw new Error('Remote Swiss Ephemeris response is missing Ascendant or Midheaven.');
    }
  }

  const cusps = Array.isArray(payload.cusps)
    ? payload.cusps.map((value: unknown) => normalizeFiniteDegree(value, 'house cusp'))
    : undefined;

  return {
    planets,
    speeds: buildSpeedMap(planets),
    cusps,
    ascendant: maybeNormalizeDegree(payload.ascendant),
    mc: maybeNormalizeDegree(payload.mc),
    vertex: maybeNormalizeDegree(payload.vertex),
    julianDay: Number.isFinite(Number(payload.julianDay)) ? Number(payload.julianDay) : 0,
  };
}

function normalizeRemotePlanet(raw: any): PlanetPosition {
  const planet = typeof raw?.planet === 'string' ? raw.planet : typeof raw?.name === 'string' ? raw.name : null;
  if (!planet) {
    throw new Error('Remote Swiss Ephemeris response includes a planet without a name.');
  }

  const absoluteDegree = normalizeFiniteDegree(raw.absoluteDegree ?? raw.longitude, `${planet} longitude`);
  const sign = typeof raw.sign === 'string' && raw.sign.trim()
    ? raw.sign
    : signFromLongitude(absoluteDegree).name;
  const degree = Number.isFinite(Number(raw.degree))
    ? Number(raw.degree)
    : Number(degreeInSign(absoluteDegree).toFixed(2));
  const speed = Number.isFinite(Number(raw.speed ?? raw.longitudeSpeed))
    ? Number(raw.speed ?? raw.longitudeSpeed)
    : undefined;
  const isRetrograde = typeof raw.isRetrograde === 'boolean'
    ? raw.isRetrograde
    : typeof raw.retrograde === 'boolean'
      ? raw.retrograde
      : Boolean(speed && speed < 0);

  return {
    planet,
    sign,
    degree,
    absoluteDegree,
    isRetrograde,
    retrograde: isRetrograde,
    speed,
  };
}

function buildSpeedMap(planets: PlanetPosition[]): Map<string, number> {
  const speeds = new Map<string, number>();
  for (const planet of planets) {
    if (typeof planet.speed === 'number') {
      speeds.set(planet.planet, planet.speed);
    }
  }
  return speeds;
}

function normalizeFiniteDegree(value: unknown, label: string): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`Remote Swiss Ephemeris response has invalid ${label}.`);
  }
  return Number(normalize360(numberValue).toFixed(6));
}

function maybeNormalizeDegree(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Number(normalize360(numberValue).toFixed(6)) : undefined;
}
