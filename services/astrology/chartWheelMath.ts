import { normalize360 } from './sharedHelpers';

export type ChartWheelOrientation =
  | 'standard-natal'
  | 'midheaven-top'
  | 'aries-first'
  // Legacy persisted value kept for backward compatibility.
  | 'aries-rising';

export type CanonicalChartWheelOrientation = Exclude<ChartWheelOrientation, 'aries-rising'>;

export interface ChartWheelAngleOptions {
  orientation?: ChartWheelOrientation | null;
  ascendantLongitude?: number | null;
  midheavenLongitude?: number | null;
}

export interface ChartWheelPoint {
  x: number;
  y: number;
}

export function normalizeChartOrientation(
  orientation?: string | null
): CanonicalChartWheelOrientation {
  if (orientation === 'midheaven-top') return 'midheaven-top';
  if (orientation === 'aries-first' || orientation === 'aries-rising') return 'aries-first';
  return 'standard-natal';
}

function finiteLongitude(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? normalize360(value) : null;
}

export function zodiacLongitudeToWheelAngleDegrees(
  longitude: number,
  options: ChartWheelAngleOptions
): number {
  const lon = normalize360(longitude);
  const orientation = normalizeChartOrientation(options.orientation);
  const asc = finiteLongitude(options.ascendantLongitude) ?? 0;
  const mc = finiteLongitude(options.midheavenLongitude);

  if (orientation === 'midheaven-top' && mc !== null) {
    return normalize360(lon - mc + 90);
  }

  if (orientation === 'aries-first') {
    return normalize360(lon + 180);
  }

  return normalize360(lon - asc + 180);
}

export function zodiacLongitudeToWheelAngleRadians(
  longitude: number,
  options: ChartWheelAngleOptions
): number {
  return (zodiacLongitudeToWheelAngleDegrees(longitude, options) * Math.PI) / 180;
}

export function wheelAngleToPoint(
  angleRadians: number,
  radius: number,
  centerX: number,
  centerY: number
): ChartWheelPoint {
  return {
    x: centerX + radius * Math.cos(angleRadians),
    y: centerY - radius * Math.sin(angleRadians),
  };
}

export function zodiacLongitudeToWheelPoint(
  longitude: number,
  radius: number,
  centerX: number,
  centerY: number,
  options: ChartWheelAngleOptions
): ChartWheelPoint {
  return wheelAngleToPoint(
    zodiacLongitudeToWheelAngleRadians(longitude, options),
    radius,
    centerX,
    centerY
  );
}
