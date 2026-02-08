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
  Stop,
} from 'react-native-svg';

import { NatalChart, Aspect, HouseCusp } from '../../services/astrology/types';
import { theme } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Configuration ──
const SIZE = Math.min(SCREEN_WIDTH - 32, 380);
const CX = SIZE / 2;
const CY = SIZE / 2;

// Ring radii (from outside in)
const R_OUTER = SIZE / 2 - 4; // outermost edge
const R_ZODIAC_OUTER = R_OUTER; // zodiac band outer
const R_ZODIAC_INNER = R_OUTER - 36; // zodiac band inner (sign glyphs live here)
const R_HOUSE_OUTER = R_ZODIAC_INNER; // house ring outer
const R_HOUSE_INNER = R_ZODIAC_INNER - 28; // house numbers
const R_PLANET_RING = R_HOUSE_INNER - 16; // planet glyphs orbit
const R_ASPECT_RING = R_PLANET_RING - 24; // aspect lines live inside this
const R_INNER = 30; // inner circle

// ── Zodiac Data ──
const ZODIAC_SIGNS = [
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
];

const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#E07A7A',
  Earth: '#6EBF8B',
  Air: '#8BC4E8',
  Water: '#7A8BE0',
};

const ELEMENT_BG: Record<string, string> = {
  Fire: 'rgba(224,122,122,0.12)',
  Earth: 'rgba(110,191,139,0.12)',
  Air: 'rgba(139,196,232,0.12)',
  Water: 'rgba(122,139,224,0.12)',
};

// ── Planet display symbols (shorter for tight space) ──
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

const PLANET_COLORS: Record<string, string> = {
  Sun: '#C9A962',
  Moon: '#B8C4D8',
  Mercury: '#8BC4E8',
  Venus: '#E07A98',
  Mars: '#E07A7A',
  Jupiter: '#E0B07A',
  Saturn: '#8B8BA8',
  Uranus: '#6EBFBF',
  Neptune: '#7A8BE0',
  Pluto: '#9B6EBF',
  Ascendant: '#C9A962',
  Midheaven: '#C9A962',
};

// ── Overlay planet colors (distinguishable from natal) ──
const OVERLAY_PLANET_COLORS: Record<string, string> = {
  Sun: '#F2D86D',
  Moon: '#D4A0E0',
  Mercury: '#A3D8F4',
  Venus: '#F4A0C8',
  Mars: '#F4A0A0',
  Jupiter: '#F4C89E',
  Saturn: '#B0B0C8',
  Uranus: '#9EE0E0',
  Neptune: '#A0A8F4',
  Pluto: '#C09EE0',
  Ascendant: '#F2D86D',
  Midheaven: '#F2D86D',
};

// ── Aspect colors ──
const ASPECT_LINE_COLORS: Record<string, string> = {
  Harmonious: 'rgba(110,191,139,0.4)',
  Challenging: 'rgba(224,122,122,0.4)',
  Neutral: 'rgba(201,169,98,0.5)',
};

const ASPECT_STRONG_COLORS: Record<string, string> = {
  Harmonious: 'rgba(110,191,139,0.7)',
  Challenging: 'rgba(224,122,122,0.7)',
  Neutral: 'rgba(201,169,98,0.8)',
};

// ══════════════════════════════════════════════════
// MATH HELPERS
// ══════════════════════════════════════════════════

/**
 * Convert ecliptic longitude (0° Aries = 0) to canvas angle.
 * We rotate the wheel so the Ascendant sits at 9 o'clock (left).
 */
function astroToAngle(longitude: number, ascLongitude: number): number {
  const offset = ascLongitude; // Asc placed at left by subtracting its longitude
  const adjusted = longitude - offset;
  const angleDeg = -adjusted; // astrology CCW, canvas CW
  return (angleDeg * Math.PI) / 180;
}

function polarToXY(angle: number, radius: number): { x: number; y: number } {
  return {
    x: CX + radius * Math.cos(angle),
    y: CY - radius * Math.sin(angle), // SVG Y is inverted
  };
}

/** Create an SVG arc path between two angles at a given radius. */
function arcPath(startAngle: number, endAngle: number, outerR: number, innerR: number): string {
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
// DATA NORMALIZATION (handles retrograde vs isRetrograde + different planet shapes)
// ══════════════════════════════════════════════════

function normalize360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

function getLongitude(obj: any): number | null {
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

function getRetrograde(obj: any): boolean {
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

function normalizePlanetName(name: unknown): string {
  const s = String(name ?? '').trim();
  if (!s) return '';
  const low = s.toLowerCase();

  if (low === 'asc' || low.includes('ascendant') || low.includes('rising')) return 'Ascendant';
  if (low === 'mc' || low.includes('midheaven')) return 'Midheaven';

  // common planet aliases
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

  // Title-case fallback
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getChartPlanet(chart: NatalChart, name: string): any | null {
  // Prefer structured fields (your chart.tsx uses these)
  const direct = (chart as any)[name.toLowerCase()] ?? (chart as any)[name];
  if (direct) return direct;

  // Fallback: search chart.planets array (if present)
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
interface PlacedPlanet {
  label: string;
  symbol: string;
  color: string;
  originalAngle: number;
  displayAngle: number;
  longitude: number;
  isRetrograde: boolean;
}

function spreadPlanets(
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
  // If ascendant missing, default to 0 so wheel still renders
  const ascLongitude = getLongitude(chart.ascendant) ?? 0;

  // ── Prepare planets ──
  const placedPlanets = useMemo(() => {
    const labels = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [];

    for (const label of labels) {
      const obj = getChartPlanet(chart, label);
      const lon = getLongitude(obj);
      if (lon === null) continue;
      raw.push({ label, longitude: lon, isRetrograde: getRetrograde(obj) });
    }

    // Optional: include AC / MC glyphs on ring if you want (commented by default)
    // const ascLon = getLongitude(chart.ascendant);
    // if (ascLon !== null) raw.push({ label: 'Ascendant', longitude: ascLon, isRetrograde: false });
    // const mcLon = getLongitude(chart.midheaven);
    // if (mcLon !== null) raw.push({ label: 'Midheaven', longitude: mcLon, isRetrograde: false });

    return spreadPlanets(raw, ascLongitude);
  }, [chart, ascLongitude]);

  // ── Planet longitude map for aspects ──
  const planetLongitudes = useMemo(() => {
    const map: Record<string, number> = {};
    placedPlanets.forEach((p) => {
      map[p.label] = p.longitude;
    });
    return map;
  }, [placedPlanets]);

  // ── Overlay planets (second person) ──
  const R_OVERLAY_RING = R_PLANET_RING - 8; // slightly inside natal ring
  const placedOverlayPlanets = useMemo(() => {
    if (!overlayChart) return [];
    const labels = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [];
    for (const label of labels) {
      const obj = getChartPlanet(overlayChart, label);
      const lon = getLongitude(obj);
      if (lon === null) continue;
      raw.push({ label, longitude: lon, isRetrograde: getRetrograde(obj) });
    }
    // Use overlay colors
    const placed = spreadPlanets(raw, ascLongitude, 8);
    return placed.map(p => ({
      ...p,
      color: OVERLAY_PLANET_COLORS[p.label] || '#D4A0E0',
    }));
  }, [overlayChart, ascLongitude]);

  // ── Cross-chart (synastry) aspect lines ──
  const crossAspects = useMemo(() => {
    if (!overlayChart || !showAspects) return [];
    const ASPECT_ORBS: { name: string; angle: number; orb: number; nature: string }[] = [
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
            break; // only tightest aspect per pair
          }
        }
      }
    }
    return results.sort((a, b) => a.orb - b.orb).slice(0, 25);
  }, [placedPlanets, placedOverlayPlanets, overlayChart, showAspects]);

  // ── Filtered aspects (only major, reasonably tight) ──
  const visibleAspects = useMemo(() => {
    if (!showAspects) return [];
    return (chart.aspects ?? [])
      .filter((a: Aspect) => a?.orb < 8 && ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile'].includes(a?.type?.name))
      .sort((a: Aspect, b: Aspect) => (a.orb ?? 99) - (b.orb ?? 99))
      .slice(0, 20);
  }, [chart.aspects, showAspects]);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* ── Background ── */}
        <Defs>
          <RadialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#1E2D47" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#0D1421" stopOpacity="0.9" />
          </RadialGradient>
        </Defs>
        <Circle cx={CX} cy={CY} r={R_OUTER} fill="url(#bgGrad)" />

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
                stroke="rgba(201,169,98,0.15)"
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

        {/* ── Zodiac ring borders ── */}
        <Circle cx={CX} cy={CY} r={R_ZODIAC_OUTER} fill="none" stroke="rgba(201,169,98,0.25)" strokeWidth={1} />
        <Circle cx={CX} cy={CY} r={R_ZODIAC_INNER} fill="none" stroke="rgba(201,169,98,0.2)" strokeWidth={0.8} />

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
              stroke="rgba(201,169,98,0.2)"
              strokeWidth={0.8}
            />
          );
        })}

        {/* ── House cusps ── */}
        {(chart.houseCusps ?? []).map((cusp: HouseCusp) => {
          const angle = astroToAngle(cusp.longitude, ascLongitude);
          const outer = polarToXY(angle, R_ZODIAC_INNER);
          const inner = polarToXY(angle, R_INNER);

          const isAngular = cusp.house === 1 || cusp.house === 4 || cusp.house === 7 || cusp.house === 10;
          const strokeW = isAngular ? 1.5 : 0.6;
          const strokeColor = isAngular ? 'rgba(201,169,98,0.5)' : 'rgba(255,255,255,0.12)';

          // House number at midpoint
          const nextHouse = (chart.houseCusps ?? []).find((c: HouseCusp) => c.house === (cusp.house % 12) + 1);
          let midLon = cusp.longitude;
          if (nextHouse) {
            let diff = nextHouse.longitude - cusp.longitude;
            if (diff < 0) diff += 360;
            midLon = cusp.longitude + diff / 2;
            if (midLon >= 360) midLon -= 360;
          }
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
                fill="rgba(255,255,255,0.35)"
                fontWeight="600"
              >
                {cusp.house}
              </SvgText>
            </G>
          );
        })}

        {/* ── Aspect lines ── */}
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
              strokeDasharray={nature === 'Harmonious' ? undefined : '4,3'}
            />
          );
        })}

        {/* ── Cross-chart synastry aspect lines (overlay) ── */}
        {crossAspects.map((ca, idx) => {
          const angle1 = astroToAngle(ca.lon1, ascLongitude);
          const angle2 = astroToAngle(ca.lon2, ascLongitude);
          const p1 = polarToXY(angle1, R_ASPECT_RING);
          const p2 = polarToXY(angle2, R_ASPECT_RING);
          const isTight = ca.orb < 3;
          const color = isTight
            ? (ca.nature === 'Harmonious' ? 'rgba(160,110,220,0.7)' : ca.nature === 'Challenging' ? 'rgba(220,130,160,0.7)' : 'rgba(200,180,120,0.7)')
            : (ca.nature === 'Harmonious' ? 'rgba(160,110,220,0.35)' : ca.nature === 'Challenging' ? 'rgba(220,130,160,0.35)' : 'rgba(200,180,120,0.4)');
          return (
            <Line
              key={`cross-asp-${idx}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={color}
              strokeWidth={isTight ? 1.0 : 0.5}
              strokeDasharray="2,4"
            />
          );
        })}

        {/* ── Planet glyphs ── */}
        {placedPlanets.map((planet) => {
          const glyphPos = polarToXY(planet.displayAngle, R_PLANET_RING);

          const tickOuter = polarToXY(planet.originalAngle, R_ZODIAC_INNER - 1);
          const tickInner = polarToXY(planet.originalAngle, R_PLANET_RING + 10);

          return (
            <G key={planet.label}>
              <Line
                x1={tickOuter.x}
                y1={tickOuter.y}
                x2={tickInner.x}
                y2={tickInner.y}
                stroke={planet.color}
                strokeWidth={0.8}
                opacity={0.5}
              />

              <Circle
                cx={glyphPos.x}
                cy={glyphPos.y}
                r={11}
                fill="rgba(13,20,33,0.85)"
                stroke={planet.color}
                strokeWidth={1}
                opacity={0.9}
              />

              <SvgText
                x={glyphPos.x}
                y={glyphPos.y + 1}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize={planet.symbol.length > 1 ? 8 : 13}
                fill={planet.color}
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

        {/* ── Overlay planet glyphs (second person) ── */}
        {placedOverlayPlanets.map((planet) => {
          const glyphPos = polarToXY(planet.displayAngle, R_OVERLAY_RING);

          const tickOuter = polarToXY(planet.originalAngle, R_ZODIAC_INNER - 1);
          const tickInner = polarToXY(planet.originalAngle, R_OVERLAY_RING + 10);

          return (
            <G key={`overlay-${planet.label}`}>
              <Line
                x1={tickOuter.x}
                y1={tickOuter.y}
                x2={tickInner.x}
                y2={tickInner.y}
                stroke={planet.color}
                strokeWidth={0.6}
                opacity={0.4}
                strokeDasharray="2,2"
              />

              <Circle
                cx={glyphPos.x}
                cy={glyphPos.y}
                r={9}
                fill="rgba(30,20,50,0.85)"
                stroke={planet.color}
                strokeWidth={1.2}
                opacity={0.9}
                strokeDasharray="3,2"
              />

              <SvgText
                x={glyphPos.x}
                y={glyphPos.y + 1}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize={planet.symbol.length > 1 ? 7 : 11}
                fill={planet.color}
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

        {/* ── ASC / MC labels (inside zodiac ring, in house area) ── */}
        {chart.ascendant && (() => {
          const lon = getLongitude(chart.ascendant);
          if (lon === null) return null;
          const ang = astroToAngle(lon, ascLongitude);
          const pos = polarToXY(ang, R_ZODIAC_INNER - 12);
          return (
            <G>
              <SvgText
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize={7}
                fill={theme.primary}
                fontWeight="700"
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
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize={7}
                fill={theme.primary}
                fontWeight="700"
              >
                MC
              </SvgText>
            </G>
          );
        })()}

        {/* ── Inner circle ── */}
        <Circle
          cx={CX}
          cy={CY}
          r={R_INNER}
          fill="rgba(13,20,33,0.6)"
          stroke="rgba(201,169,98,0.15)"
          strokeWidth={0.8}
        />

        {/* ── Overlay label (inside center) ── */}
        {overlayChart && overlayName && (
          <G>
            <SvgText
              x={CX}
              y={CY - 6}
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize={7}
              fill="rgba(255,255,255,0.5)"
              fontWeight="600"
            >
              Synastry
            </SvgText>
            <SvgText
              x={CX}
              y={CY + 6}
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize={6}
              fill="rgba(212,160,224,0.8)"
              fontWeight="700"
            >
              {overlayName.length > 8 ? overlayName.slice(0, 8) + '…' : overlayName}
            </SvgText>
          </G>
        )}

        {/* ── House ring border ── */}
        <Circle cx={CX} cy={CY} r={R_HOUSE_OUTER} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
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
