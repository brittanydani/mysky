// File: components/ui/NatalChartWheel.tsx
import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Circle,
  Line,
  Text as SvgText,
  G,
  Path,
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

import { NatalChart, Aspect, HouseCusp } from '../../services/astrology/types';
import { theme } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Configuration ──
export const SIZE = Math.min(SCREEN_WIDTH - 32, 380);
export const CX = SIZE / 2;
export const CY = SIZE / 2;

// Ring radii (from outside in)
export const R_OUTER = SIZE / 2 - 4; // outermost edge
export const R_ZODIAC_OUTER = R_OUTER; // zodiac band outer
export const R_ZODIAC_INNER = R_OUTER - 36; // zodiac band inner (sign glyphs live here)
export const R_HOUSE_OUTER = R_ZODIAC_INNER; // house ring outer
export const R_HOUSE_INNER = R_ZODIAC_INNER - 28; // house numbers
export const R_PLANET_RING = R_HOUSE_INNER - 16; // planet glyphs orbit
export const R_ASPECT_RING = R_PLANET_RING - 24; // aspect lines live inside this
export const R_INNER = 36; // inner circle — expanded for watch-face presence

// ── Zodiac Data ──
export const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', element: 'Fire' },
  { name: 'Taurus', symbol: '♉', element: 'Earth' },
  { name: 'Gemini', symbol: '♊', element: 'Air' },
  { name: 'Cancer', symbol: '♋', element: 'Water' },
  { name: 'Leo', symbol: '♌', element: 'Fire' },
  { name: 'Virgo', symbol: '♍', element: 'Earth' },
  { name: 'Libra', symbol: '♎', element: 'Air' },
  { name: 'Scorpio', symbol: '♏', element: 'Water' },
  { name: 'Sagittarius', symbol: '♐', element: 'Fire' },
  { name: 'Capricorn', symbol: '♑', element: 'Earth' },
  { name: 'Aquarius', symbol: '♒', element: 'Air' },
  { name: 'Pisces', symbol: '♓', element: 'Water' },
] as const;

// Desaturated element colors — restrained luxury
export const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#C07878',
  Earth: '#6AAE82',
  Air: '#86B4D8',
  Water: '#7480C4',
};

export const ELEMENT_BG: Record<string, string> = {
  Fire: 'rgba(192,120,120,0.09)',
  Earth: 'rgba(106,174,130,0.09)',
  Air: 'rgba(134,180,216,0.09)',
  Water: 'rgba(116,128,196,0.09)',
};

// ── Planet display symbols ──
export const PLANET_LABELS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'] as const;
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
  Ascendant: 'AC',
  Midheaven: 'MC',
};

// Champagne metal palette — #C2A65A core
export const PLANET_COLORS: Record<string, string> = {
  Sun: '#C2A65A',
  Moon: '#B8C2D0',
  Mercury: '#86BCEC',
  Venus: '#D07E9E',
  Mars: '#D07E7E',
  Jupiter: '#C2A65A',
  Saturn: '#8484A0',
  Uranus: '#6CBEC4',
  Neptune: '#7C8CD0',
  Pluto: '#9068BC',
  Ascendant: '#C2A65A',
  Midheaven: '#C2A65A',
};

// Gradient highlight (inner sphere catch-light)
export const PLANET_GRADIENT_INNER: Record<string, string> = {
  Sun: '#E8D7A6', Jupiter: '#E8D7A6', Ascendant: '#E8D7A6', Midheaven: '#E8D7A6',
  Moon: '#D4DDE8', Mercury: '#B8D4F0', Venus: '#EAB8C8', Mars: '#E8B4B4',
  Saturn: '#B0B0C8', Uranus: '#A8DAE0', Neptune: '#B0BCEC', Pluto: '#C8B4E4',
};

// Gradient shadow (outer sphere depth)
export const PLANET_GRADIENT_OUTER: Record<string, string> = {
  Sun: '#7E6330', Jupiter: '#7E6330', Ascendant: '#7E6330', Midheaven: '#7E6330',
  Moon: '#748098', Mercury: '#44849C', Venus: '#9C4C6C', Mars: '#9C4C4C',
  Saturn: '#505070', Uranus: '#348490', Neptune: '#44549C', Pluto: '#5E4088',
};

// Velvet indigo-violet palette for overlay/partner planets
export const OVERLAY_PLANET_COLORS: Record<string, string> = {
  Sun: '#8C7CCF', Moon: '#7C70C0', Mercury: '#7080C4', Venus: '#9878C8',
  Mars: '#9870B8', Jupiter: '#8C7CCF', Saturn: '#6864A8', Uranus: '#7090C8',
  Neptune: '#6878C0', Pluto: '#8068C0', Ascendant: '#8C7CCF', Midheaven: '#8C7CCF',
};

export const OVERLAY_GRADIENT_INNER: Record<string, string> = {
  Sun: '#C4B8F0', Moon: '#B8ACEC', Mercury: '#B0BCEC', Venus: '#C8B0F0',
  Mars: '#C4ACEC', Jupiter: '#C4B8F0', Saturn: '#A8A4DC', Uranus: '#B0C0EC',
  Neptune: '#A8B8E8', Pluto: '#C0AEE8', Ascendant: '#C4B8F0', Midheaven: '#C4B8F0',
};

export const OVERLAY_GRADIENT_OUTER: Record<string, string> = {
  Sun: '#2E2550', Moon: '#28205C', Mercury: '#243060', Venus: '#38285C',
  Mars: '#3C2858', Jupiter: '#2E2550', Saturn: '#20205C', Uranus: '#243060',
  Neptune: '#202858', Pluto: '#2E2060', Ascendant: '#2E2550', Midheaven: '#2E2550',
};

// Restrained aspect colors — glow without noise
export const ASPECT_LINE_COLORS: Record<string, string> = {
  Harmonious: 'rgba(110,191,139,0.28)',
  Challenging: 'rgba(224,122,122,0.28)',
  Neutral: 'rgba(194,166,90,0.32)',
};

export const ASPECT_STRONG_COLORS: Record<string, string> = {
  Harmonious: 'rgba(110,191,139,0.52)',
  Challenging: 'rgba(224,122,122,0.52)',
  Neutral: 'rgba(194,166,90,0.58)',
};

// Platinum silk thread for cross/synastry aspects
export const CROSS_ASPECT_COLORS: Record<string, { tight: string; loose: string }> = {
  Harmonious: { tight: 'rgba(159,168,184,0.42)', loose: 'rgba(159,168,184,0.22)' },
  Challenging: { tight: 'rgba(175,162,178,0.42)', loose: 'rgba(175,162,178,0.22)' },
  Neutral: { tight: 'rgba(159,168,184,0.42)', loose: 'rgba(159,168,184,0.22)' },
};

// ══════════════════════════════════════════════════
// MATH HELPERS
// ══════════════════════════════════════════════════

/**
 * Convert ecliptic longitude (0° Aries = 0) to canvas angle.
 * We rotate the wheel so the Ascendant sits at 9 o'clock (left).
 */
export function astroToAngle(longitude: number, ascLongitude: number): number {
  const offset = ascLongitude;
  const adjusted = longitude - offset;
  const angleDeg = -adjusted;
  return (angleDeg * Math.PI) / 180;
}

export function polarToXY(angle: number, radius: number): { x: number; y: number } {
  return {
    x: CX + radius * Math.cos(angle),
    y: CY - radius * Math.sin(angle),
  };
}

/** Create an SVG arc path between two angles at a given radius. */
export function arcPath(startAngle: number, endAngle: number, outerR: number, innerR: number): string {
  const s1 = polarToXY(startAngle, outerR);
  const e1 = polarToXY(endAngle, outerR);
  const s2 = polarToXY(endAngle, innerR);
  const e2 = polarToXY(startAngle, innerR);

  let sweep = startAngle - endAngle;
  if (sweep < 0) sweep += 2 * Math.PI;
  const largeArc = sweep > Math.PI ? 1 : 0;

  return [
    `M ${s1.x} ${s1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${e1.x} ${e1.y}`,
    `L ${s2.x} ${s2.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${e2.x} ${e2.y}`,
    'Z',
  ].join(' ');
}

// ══════════════════════════════════════════════════
// DATA NORMALIZATION
// ══════════════════════════════════════════════════

export function normalize360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

export function getLongitude(obj: any): number | null {
  if (!obj) return null;
  const candidates = [
    obj.longitude,
    obj.absoluteDegree,
    obj.absoluteDegrees,
    obj.absDegree,
    obj.ChartPosition?.Ecliptic?.DecimalDegrees,
    obj.chartPosition?.ecliptic?.decimal,
  ];
  for (const v of candidates) {
    if (typeof v === 'number' && Number.isFinite(v)) return normalize360(v);
  }
  return null;
}

export function getRetrograde(obj: any): boolean {
  if (!obj) return false;
  const v =
    obj.isRetrograde ??
    obj.retrograde ??
    obj.is_retrograde ??
    obj.Retrograde ??
    obj?.ChartPosition?.Retrograde ??
    obj?.chartPosition?.retrograde;
  return !!v;
}

export function normalizePlanetName(name: unknown): string {
  const s = String(name ?? '').trim();
  if (!s) return '';
  const low = s.toLowerCase();

  if (low === 'asc' || low.includes('ascendant') || low.includes('rising')) return 'Ascendant';
  if (low === 'mc' || low.includes('midheaven')) return 'Midheaven';

  if (low === 'sun') return 'Sun';
  if (low === 'moon') return 'Moon';
  if (low === 'mercury') return 'Mercury';
  if (low === 'venus') return 'Venus';
  if (low === 'mars') return 'Mars';
  if (low === 'jupiter') return 'Jupiter';
  if (low === 'saturn') return 'Saturn';
  if (low === 'uranus') return 'Uranus';
  if (low === 'neptune') return 'Neptune';
  if (low === 'pluto') return 'Pluto';

  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getChartPlanet(chart: NatalChart, name: string): any | null {
  const direct = (chart as any)[name.toLowerCase()] ?? (chart as any)[name];
  if (direct) return direct;

  const list = (chart as any).planets;
  if (Array.isArray(list)) {
    const found = list.find((p: any) => normalizePlanetName(p?.planet ?? p?.name ?? p?.key) === name);
    return found ?? null;
  }

  return null;
}

// ══════════════════════════════════════════════════
// COLLISION AVOIDANCE for planet glyphs
// ══════════════════════════════════════════════════
export interface PlacedPlanet {
  label: string;
  symbol: string;
  color: string;
  originalAngle: number;
  displayAngle: number;
  longitude: number;
  isRetrograde: boolean;
}

export function spreadPlanets(
  planets: { label: string; longitude: number; isRetrograde: boolean }[],
  ascLongitude: number,
  minSeparationDeg: number = 8
): PlacedPlanet[] {
  const items: PlacedPlanet[] = planets.map((p) => {
    const angle = astroToAngle(p.longitude, ascLongitude);
    return {
      label: p.label,
      symbol: PLANET_SYMBOLS[p.label] || '?',
      color: PLANET_COLORS[p.label] || theme.textPrimary,
      originalAngle: angle,
      displayAngle: angle,
      longitude: p.longitude,
      isRetrograde: p.isRetrograde,
    };
  });

  items.sort((a, b) => a.originalAngle - b.originalAngle);

  const minSepRad = (minSeparationDeg * Math.PI) / 180;
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        let diff = items[j].displayAngle - items[i].displayAngle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;

        if (Math.abs(diff) < minSepRad) {
          const push = (minSepRad - Math.abs(diff)) / 2;
          if (diff >= 0) {
            items[i].displayAngle -= push;
            items[j].displayAngle += push;
          } else {
            items[i].displayAngle += push;
            items[j].displayAngle -= push;
          }
        }
      }
    }
  }

  return items;
}

// ══════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════

interface Props {
  chart: NatalChart;
  showAspects?: boolean;
  overlayChart?: NatalChart;
  overlayName?: string;
}

export default function NatalChartWheel({ chart, showAspects = true, overlayChart, overlayName }: Props) {
  const ascLongitude = getLongitude(chart.ascendant) ?? 0;

  // Cache house cusps and midpoints for efficient lookup
  const houseCusps = useMemo(() => (chart.houseCusps ?? []).slice(), [chart.houseCusps]);
  const houseMidLongitudeByHouse = useMemo(() => {
    const byHouse = new Map<number, HouseCusp>();
    for (const c of houseCusps) byHouse.set(c.house, c);

    const mid = new Map<number, number>();
    for (const cusp of houseCusps) {
      const next = byHouse.get(((cusp.house % 12) + 1) as number);
      let midLon = cusp.longitude;
      if (next) {
        let diff = next.longitude - cusp.longitude;
        if (diff < 0) diff += 360;
        midLon = cusp.longitude + diff / 2;
        if (midLon >= 360) midLon -= 360;
      }
      mid.set(cusp.house, midLon);
    }
    return mid;
  }, [houseCusps]);

  // ── Prepare natal planets ──
  const placedPlanets = useMemo(() => {
    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [];
    for (const label of PLANET_LABELS) {
      const obj = getChartPlanet(chart, label);
      const lon = getLongitude(obj);
      if (lon === null) continue;
      raw.push({ label, longitude: lon, isRetrograde: getRetrograde(obj) });
    }
    return spreadPlanets(raw, ascLongitude);
  }, [chart, ascLongitude]);

  // ── Planet longitude map for aspect lookups ──
  const planetLongitudes = useMemo(() => {
    const map: Record<string, number> = {};
    placedPlanets.forEach((p) => { map[p.label] = p.longitude; });
    return map;
  }, [placedPlanets]);

  // ── Overlay planets (second person / synastry) ──
  const R_OVERLAY_RING = R_PLANET_RING - 8;
  const placedOverlayPlanets = useMemo(() => {
    if (!overlayChart) return [];
    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [];
    for (const label of PLANET_LABELS) {
      const obj = getChartPlanet(overlayChart, label);
      const lon = getLongitude(obj);
      if (lon === null) continue;
      raw.push({ label, longitude: lon, isRetrograde: getRetrograde(obj) });
    }
    const placed = spreadPlanets(raw, ascLongitude, 8);
    return placed.map(p => ({
      ...p,
      color: OVERLAY_PLANET_COLORS[p.label] || '#8C7CCF',
    }));
  }, [overlayChart, ascLongitude]);

  // ── Cross-chart (synastry) aspect lines ──
  const crossAspects = useMemo(() => {
    if (!overlayChart || !showAspects) return [];
    const ASPECT_ORBS = [
      { name: 'Conjunction', angle: 0, orb: 8, nature: 'Neutral' },
      { name: 'Opposition', angle: 180, orb: 8, nature: 'Challenging' },
      { name: 'Trine', angle: 120, orb: 6, nature: 'Harmonious' },
      { name: 'Square', angle: 90, orb: 6, nature: 'Challenging' },
      { name: 'Sextile', angle: 60, orb: 4, nature: 'Harmonious' },
    ];
    const results: { lon1: number; lon2: number; nature: string; orb: number }[] = [];
    for (const pp of placedPlanets) {
      for (const op of placedOverlayPlanets) {
        for (const asp of ASPECT_ORBS) {
          let diff = Math.abs(pp.longitude - op.longitude);
          if (diff > 180) diff = 360 - diff;
          const orbVal = Math.abs(diff - asp.angle);
          if (orbVal <= asp.orb) {
            results.push({ lon1: pp.longitude, lon2: op.longitude, nature: asp.nature, orb: orbVal });
            break;
          }
        }
      }
    }
    return results.sort((a, b) => a.orb - b.orb).slice(0, 25);
  }, [placedPlanets, placedOverlayPlanets, overlayChart, showAspects]);

  // ── Filtered natal aspects ──
  const visibleAspects = useMemo(() => {
    if (!showAspects) return [];
    return (chart.aspects ?? [])
      .filter((a: Aspect) => a?.orb < 8 && ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile'].includes(a?.type?.name))
      .sort((a: Aspect, b: Aspect) => (a.orb ?? 99) - (b.orb ?? 99))
      .slice(0, 20);
  }, [chart.aspects, showAspects]);

  // ── Accessibility summary ──
  const accessibilitySummary = useMemo(() => {
    const parts: string[] = ['Natal chart wheel'];
    for (const label of ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars']) {
      const obj = getChartPlanet(chart, label);
      const sign = (obj as any)?.sign?.name ?? (obj as any)?.Sign?.label;
      if (sign) parts.push(`${label} in ${sign}`);
    }
    if (overlayChart && overlayName) parts.push(`Synastry overlay with ${overlayName}`);
    return parts.join('. ');
  }, [chart, overlayChart, overlayName]);

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilitySummary}
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>

        {/* ── Gradient Definitions ── */}
        <Defs>
          {/* Deep navy background */}
          <RadialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#0C1C2E" stopOpacity="1" />
            <Stop offset="65%" stopColor="#0A1626" stopOpacity="1" />
            <Stop offset="100%" stopColor="#0F2238" stopOpacity="1" />
          </RadialGradient>

          {/* Soft nebula vignette */}
          <RadialGradient id="nebulaGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#3D2952" stopOpacity="0.18" />
            <Stop offset="40%" stopColor="#2D3A5C" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#0A1626" stopOpacity="0" />
          </RadialGradient>

          {/* Center hub glass face */}
          <RadialGradient id="centerGlassGrad" cx="40%" cy="35%" r="70%">
            <Stop offset="0%" stopColor="#1A3050" stopOpacity="0.95" />
            <Stop offset="100%" stopColor="#080F1A" stopOpacity="1" />
          </RadialGradient>

          {/* Center champagne outer glow */}
          <RadialGradient id="centerOuterGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#C2A65A" stopOpacity="0.10" />
            <Stop offset="55%" stopColor="#C2A65A" stopOpacity="0.04" />
            <Stop offset="100%" stopColor="#C2A65A" stopOpacity="0" />
          </RadialGradient>

          {/* Zodiac ring glass sheen — diagonal sweep */}
          <SvgLinearGradient id="zodiacGlassSheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.07" />
            <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.03" />
            <Stop offset="65%" stopColor="#000000" stopOpacity="0.03" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.04" />
          </SvgLinearGradient>

          {/* Natal planet sphere gradients */}
          {Object.keys(PLANET_GRADIENT_INNER).map((planet) => (
            <RadialGradient key={`pg-${planet}`} id={`pGrad_${planet}`} cx="35%" cy="30%" r="65%">
              <Stop offset="0%" stopColor={PLANET_GRADIENT_INNER[planet]} stopOpacity="1" />
              <Stop offset="100%" stopColor={PLANET_GRADIENT_OUTER[planet]} stopOpacity="1" />
            </RadialGradient>
          ))}

          {/* Overlay planet sphere gradients */}
          {Object.keys(OVERLAY_GRADIENT_INNER).map((planet) => (
            <RadialGradient key={`opg-${planet}`} id={`opGrad_${planet}`} cx="35%" cy="30%" r="65%">
              <Stop offset="0%" stopColor={OVERLAY_GRADIENT_INNER[planet]} stopOpacity="1" />
              <Stop offset="100%" stopColor={OVERLAY_GRADIENT_OUTER[planet]} stopOpacity="1" />
            </RadialGradient>
          ))}
        </Defs>

        {/* ── Background ── */}
        <Circle cx={CX} cy={CY} r={R_OUTER} fill="url(#bgGrad)" />
        <Circle cx={CX} cy={CY} r={R_OUTER} fill="url(#nebulaGrad)" />

        {/* ── Zodiac Ring (12 sign segments) ── */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const startLon = i * 30;
          const endLon = (i + 1) * 30;
          const startAngle = astroToAngle(startLon, ascLongitude);
          const endAngle = astroToAngle(endLon, ascLongitude);
          const midAngle = astroToAngle(startLon + 15, ascLongitude);
          const labelPos = polarToXY(midAngle, (R_ZODIAC_OUTER + R_ZODIAC_INNER) / 2);
          const elColor = ELEMENT_COLORS[sign.element];

          return (
            <G key={sign.name}>
              <Path
                d={arcPath(startAngle, endAngle, R_ZODIAC_OUTER, R_ZODIAC_INNER)}
                fill={ELEMENT_BG[sign.element]}
                stroke="rgba(194,166,90,0.10)"
                strokeWidth={0.5}
              />
              <SvgText
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize={14}
                fill={elColor}
                fontWeight="700"
              >
                {sign.symbol}
              </SvgText>
            </G>
          );
        })}

        {/* ── Zodiac ring borders — polished glass ── */}
        <Circle cx={CX} cy={CY} r={R_ZODIAC_OUTER} fill="none" stroke="rgba(194,166,90,0.18)" strokeWidth={0.8} />
        <Circle cx={CX} cy={CY} r={R_ZODIAC_INNER} fill="none" stroke="rgba(194,166,90,0.14)" strokeWidth={0.6} />

        {/* ── Glass sheen render pass over zodiac ring ── */}
        <Circle
          cx={CX}
          cy={CY}
          r={(R_ZODIAC_OUTER + R_ZODIAC_INNER) / 2}
          fill="none"
          stroke="url(#zodiacGlassSheen)"
          strokeWidth={R_ZODIAC_OUTER - R_ZODIAC_INNER}
        />

        {/* ── Sign division lines ── */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = astroToAngle(i * 30, ascLongitude);
          const outer = polarToXY(angle, R_ZODIAC_OUTER);
          const inner = polarToXY(angle, R_ZODIAC_INNER);
          return (
            <Line
              key={`sign-div-${i}`}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke="rgba(194,166,90,0.14)"
              strokeWidth={0.6}
            />
          );
        })}

        {/* ── House cusps ── */}
        {houseCusps.map((cusp: HouseCusp) => {
          const angle = astroToAngle(cusp.longitude, ascLongitude);
          const outer = polarToXY(angle, R_ZODIAC_INNER);
          const inner = polarToXY(angle, R_INNER);

          const isAngular = cusp.house === 1 || cusp.house === 4 || cusp.house === 7 || cusp.house === 10;
          const strokeW = isAngular ? 1.2 : 0.5;
          const strokeColor = isAngular ? 'rgba(194,166,90,0.35)' : 'rgba(255,255,255,0.07)';

          const midLon = houseMidLongitudeByHouse.get(cusp.house) ?? cusp.longitude;
          const midAngle = astroToAngle(midLon, ascLongitude);
          const numPos = polarToXY(midAngle, R_HOUSE_INNER);

          return (
            <G key={`house-${cusp.house}`}>
              <Line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke={strokeColor} strokeWidth={strokeW} />
              <SvgText
                x={numPos.x}
                y={numPos.y}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize={9}
                fill="rgba(255,255,255,0.20)"
                fontWeight="500"
              >
                {cusp.house}
              </SvgText>
            </G>
          );
        })}

        {/* ── Natal aspect lines ── */}
        {visibleAspects.map((asp: Aspect, idx: number) => {
          const p1Name = normalizePlanetName(asp?.planet1?.name);
          const p2Name = normalizePlanetName(asp?.planet2?.name);
          const lon1 = planetLongitudes[p1Name];
          const lon2 = planetLongitudes[p2Name];
          if (lon1 === undefined || lon2 === undefined) return null;

          const angle1 = astroToAngle(lon1, ascLongitude);
          const angle2 = astroToAngle(lon2, ascLongitude);
          const p1 = polarToXY(angle1, R_ASPECT_RING);
          const p2 = polarToXY(angle2, R_ASPECT_RING);

          const isTight = (asp.orb ?? 99) < 3;
          const nature = asp?.type?.nature ?? 'Neutral';
          const color = isTight ? ASPECT_STRONG_COLORS[nature] : ASPECT_LINE_COLORS[nature];

          return (
            <Line
              key={`asp-${idx}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={color}
              strokeWidth={isTight ? 1.2 : 0.6}
              strokeDasharray={nature === 'Harmonious' ? undefined : [4, 3]}
            />
          );
        })}

        {/* ── Cross-chart synastry aspects — platinum silk thread technique ── */}
        {crossAspects.map((ca, idx) => {
          const angle1 = astroToAngle(ca.lon1, ascLongitude);
          const angle2 = astroToAngle(ca.lon2, ascLongitude);
          const p1 = polarToXY(angle1, R_ASPECT_RING);
          const p2 = polarToXY(angle2, R_ASPECT_RING);
          const isTight = ca.orb < 3;
          const colors = CROSS_ASPECT_COLORS[ca.nature] ?? CROSS_ASPECT_COLORS.Neutral;
          const threadColor = isTight ? colors.tight : colors.loose;

          return (
            <G key={`cross-asp-${idx}`}>
              {/* Diffuse glow layer underneath */}
              <Line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="rgba(159,168,184,1)"
                strokeWidth={isTight ? 2.0 : 1.5}
                opacity={0.08}
              />
              {/* Crisp platinum silk thread */}
              <Line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke={threadColor}
                strokeWidth={isTight ? 0.5 : 0.3}
                strokeDasharray="2,4"
              />
            </G>
          );
        })}

        {/* ── Natal planet glyphs — gradient spheres with glow halos ── */}
        {placedPlanets.map((planet) => {
          const glyphPos = polarToXY(planet.displayAngle, R_PLANET_RING);
          const tickOuter = polarToXY(planet.originalAngle, R_ZODIAC_INNER - 1);
          const tickInner = polarToXY(planet.originalAngle, R_PLANET_RING + 10);
          const baseColor = PLANET_COLORS[planet.label] || '#C2A65A';
          const gradId = PLANET_GRADIENT_INNER[planet.label] ? `url(#pGrad_${planet.label})` : baseColor;

          return (
            <G key={planet.label}>
              {/* Position tick */}
              <Line
                x1={tickOuter.x} y1={tickOuter.y}
                x2={tickInner.x} y2={tickInner.y}
                stroke={baseColor}
                strokeWidth={0.8}
                opacity={0.45}
              />
              {/* Glow halo — natal planets at full hierarchy (100%) */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={15} fill={baseColor} opacity={0.10} />
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={12} fill={baseColor} opacity={0.06} />
              {/* Gradient sphere */}
              <Circle
                cx={glyphPos.x} cy={glyphPos.y} r={11}
                fill={gradId}
                stroke={baseColor}
                strokeWidth={0.8}
                opacity={0.95}
              />
              {/* Glyph symbol */}
              <SvgText
                x={glyphPos.x}
                y={glyphPos.y + 1}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize={planet.symbol.length > 1 ? 8 : 13}
                fill={baseColor}
                fontWeight="700"
              >
                {planet.symbol}
              </SvgText>
              {planet.isRetrograde && (
                <SvgText
                  x={glyphPos.x + 10}
                  y={glyphPos.y - 8}
                  textAnchor="middle"
                  alignmentBaseline="central"
                  fontSize={7}
                  fill={theme.warning}
                  fontWeight="700"
                >
                  ℞
                </SvgText>
              )}
            </G>
          );
        })}

        {/* ── Overlay planet glyphs — velvet indigo spheres (70% glow) ── */}
        {placedOverlayPlanets.map((planet) => {
          const glyphPos = polarToXY(planet.displayAngle, R_OVERLAY_RING);
          const tickOuter = polarToXY(planet.originalAngle, R_ZODIAC_INNER - 1);
          const tickInner = polarToXY(planet.originalAngle, R_OVERLAY_RING + 9);
          const baseColor = planet.color;
          const gradId = OVERLAY_GRADIENT_INNER[planet.label] ? `url(#opGrad_${planet.label})` : baseColor;

          return (
            <G key={`overlay-${planet.label}`}>
              {/* Position tick — dashed for overlay */}
              <Line
                x1={tickOuter.x} y1={tickOuter.y}
                x2={tickInner.x} y2={tickInner.y}
                stroke={baseColor}
                strokeWidth={0.6}
                opacity={0.35}
                strokeDasharray="2,2"
              />
              {/* Glow halo — overlay at 70% hierarchy */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={13} fill={baseColor} opacity={0.07} />
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={10} fill={baseColor} opacity={0.05} />
              {/* Gradient sphere — dashed border to distinguish from natal */}
              <Circle
                cx={glyphPos.x} cy={glyphPos.y} r={9}
                fill={gradId}
                stroke={baseColor}
                strokeWidth={1.2}
                opacity={0.88}
                strokeDasharray="3,2"
              />
              {/* Glyph symbol */}
              <SvgText
                x={glyphPos.x}
                y={glyphPos.y + 1}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize={planet.symbol.length > 1 ? 7 : 11}
                fill={baseColor}
                fontWeight="700"
              >
                {planet.symbol}
              </SvgText>
              {planet.isRetrograde && (
                <SvgText
                  x={glyphPos.x + 8}
                  y={glyphPos.y - 6}
                  textAnchor="middle"
                  alignmentBaseline="central"
                  fontSize={6}
                  fill={theme.warning}
                  fontWeight="700"
                >
                  ℞
                </SvgText>
              )}
            </G>
          );
        })}

        {/* ── ASC / MC axis labels ── */}
        {chart.ascendant && (() => {
          const lon = getLongitude(chart.ascendant);
          if (lon === null) return null;
          const ang = astroToAngle(lon, ascLongitude);
          const pos = polarToXY(ang, R_ZODIAC_INNER - 12);
          return (
            <G>
              <SvgText
                x={pos.x} y={pos.y}
                textAnchor="middle" alignmentBaseline="central"
                fontSize={7} fill={theme.primary} fontWeight="700"
              >
                ASC
              </SvgText>
            </G>
          );
        })()}

        {chart.midheaven && (() => {
          const lon = getLongitude(chart.midheaven);
          if (lon === null) return null;
          const ang = astroToAngle(lon, ascLongitude);
          const pos = polarToXY(ang, R_ZODIAC_INNER - 12);
          return (
            <G>
              <SvgText
                x={pos.x} y={pos.y}
                textAnchor="middle" alignmentBaseline="central"
                fontSize={7} fill={theme.primary} fontWeight="700"
              >
                MC
              </SvgText>
            </G>
          );
        })()}

        {/* ── House ring border ── */}
        <Circle cx={CX} cy={CY} r={R_HOUSE_OUTER} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />

        {/* ── Center hub — watch-face core ── */}
        {/* Champagne outer glow */}
        <Circle cx={CX} cy={CY} r={R_INNER + 18} fill="url(#centerOuterGlow)" />
        {/* Navy shadow halo */}
        <Circle cx={CX} cy={CY} r={R_INNER + 4} fill="none" stroke="rgba(10,22,38,0.60)" strokeWidth={6} />
        {/* Glass face */}
        <Circle cx={CX} cy={CY} r={R_INNER} fill="url(#centerGlassGrad)" />
        {/* Metallic ring */}
        <Circle cx={CX} cy={CY} r={R_INNER + 0.5} fill="none" stroke="#3A4A63" strokeWidth={1.2} opacity={0.7} />
        {/* Champagne rim highlight */}
        <Circle cx={CX} cy={CY} r={R_INNER} fill="none" stroke="rgba(194,166,90,0.22)" strokeWidth={0.7} />
        {/* Inner shadow */}
        <Circle cx={CX} cy={CY} r={R_INNER - 2} fill="none" stroke="rgba(0,0,0,0.20)" strokeWidth={1.5} />

        {/* ── Synastry label inside center hub ── */}
        {overlayChart && overlayName && (
          <G>
            <SvgText
              x={CX}
              y={CY - 8}
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize={7}
              fill="rgba(255,255,255,0.60)"
              fontWeight="600"
              letterSpacing={2.5}
            >
              SYNASTRY
            </SvgText>
            <SvgText
              x={CX}
              y={CY + 8}
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize={8}
              fill="rgba(194,166,90,0.80)"
              fontWeight="600"
              letterSpacing={0.5}
            >
              {overlayName.length > 9 ? overlayName.slice(0, 9) + '…' : overlayName}
            </SvgText>
          </G>
        )}

      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '100%',
    display: 'flex',
  },
});
