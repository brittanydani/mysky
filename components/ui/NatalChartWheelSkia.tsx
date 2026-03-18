// File: components/ui/NatalChartWheelSkia.tsx
//
// Cinematic Skia re-implementation of the natal chart wheel.
// Drop-in replacement for the SVG version.
//
// Requires: @shopify/react-native-skia 2.x
// Notes:
// - Text in Skia requires a loaded font. This file uses Inter + Playfair as defaults.
//   If your font paths differ, update FONT_* requires below.
// - Film grain uses RuntimeEffect; if unsupported on a device/build, it silently disables.

import React, { useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  matchFont,
  RadialGradient,
  SweepGradient,
  Text as SkiaText,
  useFont,
  vec,
  BlurMask,
  Path,
  Skia,
} from '@shopify/react-native-skia';

import { NatalChart, Aspect, HouseCusp } from '../../services/astrology/types';
import { theme } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Configuration ──
const SIZE = Math.min(SCREEN_WIDTH - 90, 310);
const SIZE_CANVAS = SIZE + 100; // extra room for sign tiles outside the rim
const CX = SIZE_CANVAS / 2;
const CY = SIZE_CANVAS / 2;

// Ring radii (from outside in)
const R_OUTER = SIZE / 2 - 4;          // outermost edge (gold rim)
const R_HOUSE_OUTER = R_OUTER;          // house ring outer — extends to the rim
const R_HOUSE_INNER = R_OUTER - 28;     // house numbers
const R_PLANET_RING = R_HOUSE_INNER - 16;  // planet glyphs orbit
const R_ASPECT_RING = R_PLANET_RING - 24;  // aspect lines live inside this
const R_INNER = 42;                     // inner circle — slightly larger for watch-face presence

// Dotted astronomy diagram rings
const R_DOT_RING_1 = R_PLANET_RING - 18;
const R_DOT_RING_2 = R_ASPECT_RING + 10;

// Polish constants
const RIM_W = 3.5;
const RIM_INSET = 2;

const PLANET_R = 13.5;
const HILITE_R = 1.8;

// Glass reflection helpers
function makeArcPath(
  cx: number, cy: number, r: number,
  startDeg: number, sweepDeg: number,
): ReturnType<typeof Skia.Path.Make> {
  const path = Skia.Path.Make();
  const rect = { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
  path.addArc(rect, startDeg, sweepDeg);
  return path;
}

const MAX_ASPECTS = 100;
const MAX_CROSS_ASPECTS = 100;

// ── System font families ──
const SERIF_FAMILY = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' })!;
const SANS_FAMILY = Platform.select({ ios: 'Helvetica Neue', android: 'sans-serif-medium', default: 'sans-serif' })!;

// Zodiac glyphs — use serif/sans (NOT Apple Color Emoji) so glyphs render as
// monochrome text and respect the Skia color prop. Append \uFE0E to each symbol
// as the text-presentation variation selector to prevent emoji substitution.
const ZODIAC_FAMILY = Platform.select({
  ios: 'Apple Symbols',
  android: 'Noto Sans Symbols2',
  default: 'sans-serif',
})!;

// ── Zodiac Data ──
// \uFE0E = text-presentation selector — prevents iOS from substituting color emoji
const ZODIAC_SIGNS = [
  { name: 'Aries',       symbol: '♈\uFE0E', element: 'Fire' },
  { name: 'Taurus',      symbol: '♉\uFE0E', element: 'Earth' },
  { name: 'Gemini',      symbol: '♊\uFE0E', element: 'Air' },
  { name: 'Cancer',      symbol: '♋\uFE0E', element: 'Water' },
  { name: 'Leo',         symbol: '♌\uFE0E', element: 'Fire' },
  { name: 'Virgo',       symbol: '♍\uFE0E', element: 'Earth' },
  { name: 'Libra',       symbol: '♎\uFE0E', element: 'Air' },
  { name: 'Scorpio',     symbol: '♏\uFE0E', element: 'Water' },
  { name: 'Sagittarius', symbol: '♐\uFE0E', element: 'Fire' },
  { name: 'Capricorn',   symbol: '♑\uFE0E', element: 'Earth' },
  { name: 'Aquarius',    symbol: '♒\uFE0E', element: 'Air' },
  { name: 'Pisces',      symbol: '♓\uFE0E', element: 'Water' },
];

// ── Planet display symbols ──
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
  'North Node': '☊',
  'South Node': '☋',
  Chiron: '⚷',
  Lilith: '⚸',
  Vertex: 'Vx',
  'Part of Fortune': '⊗',
  Pholus: '⯰',
  Ascendant: 'AC',
  Midheaven: 'MC',
};

// ── User Color Palette ──
const USER_COLORS = [
  '#C9AE78', // User0 (Owner) - Champagne Gold
  '#C8CCD4', // User1 - Silver / Platinum
  '#D4B26A', // User2 - Warm Gold
  '#D2B6A4', // User3 - Rose Gold
];

const PLANET_COLORS: Record<string, string> = {
  Sun: '#C9AE78',
  Moon: '#B8C2D0',
  Mercury: '#86BCEC',
  Venus: '#D07E9E',
  Mars: '#D07E7E',
  Jupiter: '#C9AE78',
  Saturn: '#8484A0',
  Uranus: '#6CBEC4',
  Neptune: '#7C8CD0',
  Pluto: '#9068BC',
  'North Node': '#A0A0B0',
  'South Node': '#A0A0B0',
  Chiron: '#98FB98',
  Ascendant: '#C9AE78',
  Midheaven: '#C9AE78',
};

const OVERLAY_PLANET_COLORS: Record<string, string> = {
  Sun: '#8C7CCF',
  Moon: '#7C70C0',
  Mercury: '#7080C4',
  Venus: '#9878C8',
  Mars: '#9870B8',
  Jupiter: '#8C7CCF',
  Saturn: '#6864A8',
  Uranus: '#7090C8',
  Neptune: '#6878C0',
  Pluto: '#8068C0',
  'North Node': '#808090',
  'South Node': '#808090',
  Chiron: '#80C080',
  Ascendant: '#8C7CCF',
  Midheaven: '#8C7CCF',
};


// ── Per-user metallic sphere palettes (high-contrast for 3D pop) ──
// 0: Champagne Gold, 1: Silver, 2: Rose Gold, 3: Purple Metallic
function getUserSpherePalette(userIndex: number): string[] {
  const palettes = [
    ['#FFFBF0', '#F0E0B0', '#C9AE78', '#8A6A30', '#3A2810'], // Champagne Gold
    ['#FFFFFF', '#E8EAED', '#C0C4CC', '#707880', '#282C34'], // Silver / Platinum
    ['#FFF0EC', '#EDDAC8', '#D4A898', '#9A6858', '#3A1C10'], // Rose Gold
    ['#F4EEFF', '#DACAF0', '#A880D4', '#6040A0', '#201030'], // Purple Metallic
  ];
  return palettes[userIndex % 4] ?? palettes[0];
}

// Muted, jewel-tone aspect colors matching reference palette
const ASPECT_COLOR: Record<string, string> = {
  conjunction: '#C89030',  // warm amber gold
  sextile:     '#4E90C0',  // steel blue
  trine:       '#4EAA84',  // muted emerald
  square:      '#B85C58',  // dusty rose
  opposition:  '#B87840',  // burnt amber
};

// Pale silk-thread aspect colors (fallback for minor/other aspects)
const ASPECT_LINE_COLORS: Record<string, string> = {
  Harmonious: 'rgba(170,210,185,0.20)',
  Challenging: 'rgba(210,170,160,0.20)',
  Neutral: 'rgba(203,184,146,0.22)',
};

const ASPECT_STRONG_COLORS: Record<string, string> = {
  Harmonious: 'rgba(170,210,185,0.38)',
  Challenging: 'rgba(210,170,160,0.38)',
  Neutral: 'rgba(203,184,146,0.40)',
};

// Warm platinum cross-aspect threads
const CROSS_ASPECT_COLORS: Record<string, { tight: string; loose: string }> = {
  Harmonious: { tight: 'rgba(195,202,214,0.40)', loose: 'rgba(195,202,214,0.20)' },
  Challenging: { tight: 'rgba(205,195,210,0.40)', loose: 'rgba(205,195,210,0.20)' },
  Neutral: { tight: 'rgba(195,202,214,0.40)', loose: 'rgba(195,202,214,0.20)' },
};


// ══════════════════════════════════════════════════
// MATH HELPERS
// ══════════════════════════════════════════════════

/**
 * Convert ecliptic longitude (0° Aries = 0) to canvas angle.
 * We rotate the wheel so the Ascendant sits at 9 o'clock (left).
 */
function astroToAngle(longitude: number, ascLongitude: number): number {
  const offset = ascLongitude;
  const adjusted = longitude - offset;
  const angleDeg = -adjusted;
  return (angleDeg * Math.PI) / 180;
}

function polarToXY(angle: number, radius: number): { x: number; y: number } {
  return {
    x: CX + radius * Math.cos(angle),
    y: CY - radius * Math.sin(angle),
  };
}

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
  if (low === 'chiron') return 'Chiron';
  if (low === 'north node' || low === 'northnode' || low === 'true node') return 'North Node';
  if (low === 'south node' || low === 'southnode') return 'South Node';

  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getChartPlanet(chart: NatalChart, name: string): any | null {
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
  filterMode?: { person1: boolean; person2: boolean; cross: boolean };
}

export default function NatalChartWheel({ chart, showAspects = true, overlayChart, overlayName, filterMode }: Props) {
  const ascLongitude = getLongitude((chart as any).ascendant) ?? 0;

  const showPerson1 = !filterMode || filterMode.person1;
  const showPerson2 = !filterMode || filterMode.person2;
  const showCross = !filterMode || filterMode.cross;

  // Use system fonts for astrological glyphs (Apple Symbols on iOS, Noto Sans Symbols2 on Android)
  const symbolFont = null; // Removed to rely purely on matchFont fallbacks which are safer than bundled ttf

  // Fonts — system fonts via matchFont (no TTF files required)
  const serif16 = useMemo(() => matchFont({ fontFamily: SERIF_FAMILY, fontSize: 16, fontWeight: '600' }), []);
  const serif14 = useMemo(() => matchFont({ fontFamily: SERIF_FAMILY, fontSize: 14, fontWeight: '600' }), []);
  const serif12 = useMemo(() => matchFont({ fontFamily: SERIF_FAMILY, fontSize: 12, fontWeight: '600' }), []);
  const serif10 = useMemo(() => matchFont({ fontFamily: SERIF_FAMILY, fontSize: 10, fontWeight: '600' }), []);
  const sans10 = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 10, fontWeight: '600' }), []);
  const sans9 = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 9, fontWeight: '600' }), []);
  const sans8 = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 8, fontWeight: '600' }), []);
  const zodiac16 = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 16, fontWeight: '400' }), []);
  const zodiac24 = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 24, fontWeight: '400' }), []);
  const zodiac12 = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 12, fontWeight: '400' }), []);
  const zodiac10 = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 10, fontWeight: '400' }), []);

  const sans11Heavy = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 11, fontWeight: '900' }), []);
  const sans9Heavy = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 9, fontWeight: '900' }), []);
  
  const zodiacMain = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 24, fontWeight: '900' }), []);
  const zodiacOverlay = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 18, fontWeight: '900' }), []);
  
  // ── Prepare natal planets ──
  const placedPlanets = useMemo(() => {
    const labels = [
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
      'Uranus', 'Neptune', 'Pluto', 'Chiron', 'North Node', 'South Node',
      'Lilith', 'Vertex', 'Part of Fortune', 'Pholus'
    ];
    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [];
    for (const label of labels) {
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
    placedPlanets.forEach((p) => {
      map[p.label] = p.longitude;
    });

    const asc = getLongitude(getChartPlanet(chart, 'Ascendant'));
    if (asc !== null) map['Ascendant'] = asc;

    const mc = getLongitude(getChartPlanet(chart, 'Midheaven'));
    if (mc !== null) map['Midheaven'] = mc;

    return map;
  }, [placedPlanets, chart]);

  // ── Overlay planets (second person / synastry) ──
  const R_OVERLAY_RING = R_PLANET_RING - 8;
  const placedOverlayPlanets = useMemo(() => {
    if (!overlayChart) return [];
    const labels = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron', 'North Node', 'South Node'];
    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [];
    for (const label of labels) {
      const obj = getChartPlanet(overlayChart, label);
      const lon = getLongitude(obj);
      if (lon === null) continue;
      raw.push({ label, longitude: lon, isRetrograde: getRetrograde(obj) });
    }
    const placed = spreadPlanets(raw, ascLongitude, 8);
    return placed.map((p) => ({
      ...p,
      color: OVERLAY_PLANET_COLORS[p.label] || '#9C8FD2',
    }));
  }, [overlayChart, ascLongitude]);

  // ── Cross-chart (synastry) aspect lines ──
  const crossAspects = useMemo(() => {
    if (!overlayChart || !showAspects) return [];
    const ASPECT_ORBS = [
      { angle: 0, orb: 8, nature: 'Neutral' },
      { angle: 180, orb: 8, nature: 'Challenging' },
      { angle: 120, orb: 6, nature: 'Harmonious' },
      { angle: 90, orb: 6, nature: 'Challenging' },
      { angle: 60, orb: 4, nature: 'Harmonious' },
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
    return results.sort((a, b) => a.orb - b.orb).slice(0, MAX_CROSS_ASPECTS);
  }, [placedPlanets, placedOverlayPlanets, overlayChart, showAspects]);

  // ── Filtered natal aspects ──
  const visibleAspects = useMemo(() => {
    if (!showAspects) return [];
    return (chart.aspects ?? [])
      .filter(
        (a: Aspect) =>
          (a?.orb ?? 99) < 8 &&
          ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile'].includes((a as any)?.type?.name)
      )
      .sort((a: Aspect, b: Aspect) => (a.orb ?? 99) - (b.orb ?? 99))
      .slice(0, MAX_ASPECTS);
  }, [chart.aspects, showAspects]);

  // ── Precompute drawable aspect lines for Skia ──
  const aspectLines = useMemo(() => {
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
        glowColor: string;
        strokeWidth: number;
        dashed: boolean;
      }[] = [];

      for (const asp of visibleAspects) {
        const p1Name = normalizePlanetName((asp as any)?.planet1?.name);
        const p2Name = normalizePlanetName((asp as any)?.planet2?.name);
        const lon1 = planetLongitudes[p1Name];
        const lon2 = planetLongitudes[p2Name];
        if (lon1 === undefined || lon2 === undefined) continue;

        const angle1 = astroToAngle(lon1, ascLongitude);
        const angle2 = astroToAngle(lon2, ascLongitude);
        const p1 = polarToXY(angle1, R_ASPECT_RING);
        const p2 = polarToXY(angle2, R_ASPECT_RING);

        const orb = asp.orb ?? 99;
        const typeName = ((asp as any)?.type?.name ?? '').toLowerCase();

        // New hierarchy mapping for delicate premium lines
        let topAlpha = 0.35;
        let glowAlpha = 0.15;
        if (orb < 3) {
            topAlpha = 0.55; 
            glowAlpha = 0.25; 
        } else if (orb >= 6) { 
            topAlpha = 0.18; 
            glowAlpha = 0.08; 
        }

        lines.push({
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          color: `rgba(232, 214, 174,${topAlpha})`, // #C5B493 in rgb
          glowColor: `rgba(233,217,184,${glowAlpha})`, // #e9d9b8 in rgb
          strokeWidth: 1.0,
          dashed: typeName !== 'trine' && typeName !== 'sextile' && typeName !== 'conjunction',
        });
      }

      return lines;
    }, [visibleAspects, planetLongitudes, ascLongitude]);
  const crossLines = useMemo(() => {
    const lines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      thread: string;
      tight: boolean;
    }[] = [];
    for (const ca of crossAspects) {
      const angle1 = astroToAngle(ca.lon1, ascLongitude);
      const angle2 = astroToAngle(ca.lon2, ascLongitude);
      const p1 = polarToXY(angle1, R_ASPECT_RING);
      const p2 = polarToXY(angle2, R_ASPECT_RING);
      const tight = ca.orb < 3;
      const colors = CROSS_ASPECT_COLORS[ca.nature] ?? CROSS_ASPECT_COLORS.Neutral;
      lines.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        thread: tight ? colors.tight : colors.loose,
        tight,
      });
    }
    return lines;
  }, [crossAspects, ascLongitude]);

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
    <View style={styles.container} accessible accessibilityRole="image" accessibilityLabel={accessibilitySummary}>
      <Canvas style={{ width: SIZE_CANVAS, height: SIZE_CANVAS, backgroundColor: 'transparent' }}>

        {/* ── Outer Zodiac Border (Major Ring) ── */}
        <Group>
          {/* Underglow */}
          <Circle cx={CX} cy={CY} r={R_OUTER + 44} style="stroke" strokeWidth={4} color="rgba(232, 214, 174,0.28)">
            <BlurMask blur={4} style="normal" />
          </Circle>
          
          {/* Outer edge of bezel */}
          <Circle cx={CX} cy={CY} r={R_OUTER + 45} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient
              c={vec(CX, CY)}
              colors={[
                '#3A2E1C', '#FFFFFF', '#8A734D', '#2A1F14', 
                '#B39D7D', '#FFFFFF', '#D4C4A3', '#1A1208', 
                '#F8E8C9', '#3A2E1C'
              ]}
              positions={[0.0, 0.12, 0.25, 0.38, 0.52, 0.62, 0.78, 0.88, 0.95, 1.0]}
              transform={[{ rotate: -0.1 }]}
            />
          </Circle>

          {/* Inner edge of bezel */}
          <Circle cx={CX} cy={CY} r={R_OUTER + 43} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient
              c={vec(CX, CY)}
              colors={[
                '#4A3728', '#FDF5E6', '#A8926F', '#3A2E1C', 
                '#C9AE78', '#FFFFFF', '#8A734D', '#2A1F14', 
                '#FFF4D6', '#4A3728'
              ]}
              positions={[0.0, 0.1, 0.28, 0.42, 0.55, 0.65, 0.82, 0.9, 0.96, 1.0]}
              transform={[{ rotate: 0.15 }]}
            />
          </Circle>
        </Group>

        {/* ── Main Rim: Double Bezel Ring ── */}
        <Group>
          {/* 1. Outer Gold Bezel */}
          {/* Glow layer */}
          <Circle cx={CX} cy={CY} r={R_OUTER + 2} style="stroke" strokeWidth={4} color="rgba(232, 214, 174,0.28)">
            <BlurMask blur={3} style="normal" />
          </Circle>
          
          {/* Outer edge */}
          <Circle cx={CX} cy={CY} r={R_OUTER + 3} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient
              c={vec(CX, CY)}
              colors={[
                '#3A2E1C', '#FFFFFF', '#8A734D', '#2A1F14', 
                '#B39D7D', '#FFFFFF', '#D4C4A3', '#1A1208', 
                '#F8E8C9', '#3A2E1C'
              ]}
              positions={[0.0, 0.12, 0.25, 0.38, 0.52, 0.62, 0.78, 0.88, 0.95, 1.0]}
              transform={[{ rotate: -0.05 }]}
            />
          </Circle>

          {/* Inner edge */}
          <Circle cx={CX} cy={CY} r={R_OUTER + 1} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient
              c={vec(CX, CY)}
              colors={[
                '#4A3728', '#FDF5E6', '#A8926F', '#3A2E1C', 
                '#C9AE78', '#FFFFFF', '#8A734D', '#2A1F14', 
                '#FFF4D6', '#4A3728'
              ]}
              positions={[0.0, 0.1, 0.28, 0.42, 0.55, 0.65, 0.82, 0.9, 0.96, 1.0]}
              transform={[{ rotate: 0.2 }]}
            />
          </Circle>

          {/* 2. Inner Soft Gold Ring */}
          <Circle cx={CX} cy={CY} r={R_OUTER - 2} style="stroke" strokeWidth={0.8} opacity={0.95}>
             <SweepGradient
              c={vec(CX, CY)}
              colors={['#8A734D', '#FDF5E6', '#4A3728', '#C9AE78', '#FFFFFF', '#3A2E1C', '#8A734D']}
              positions={[0.0, 0.15, 0.35, 0.5, 0.68, 0.85, 1.0]}
              transform={[{ rotate: -0.3 }]}
            />
          </Circle>
        </Group>

        {/* ── Zodiac sign medallions (outside the rim, double-circle border) ── */}
        
        {ZODIAC_SIGNS.map((sign, i) => {
          const midAngle = astroToAngle(i * 30 + 15, ascLongitude);
          const tc = polarToXY(midAngle, R_OUTER + 24);
          
          // Draw dividing lines for each sign segment
          const startAngle = astroToAngle(i * 30, ascLongitude);
          const pInner = polarToXY(startAngle, R_OUTER + 2);
          const pOuter = polarToXY(startAngle, R_OUTER + 44);

          return (
            <Group key={sign.name}>
              {/* Segment dividing line */}
              <Line 
                p1={vec(pInner.x, pInner.y)} 
                p2={vec(pOuter.x, pOuter.y)} 
                color="rgba(184,155,106,0.25)" 
                strokeWidth={0.8} 
              />
              
              {/* Sign glyph */}
              {zodiac24 && (
                <SkiaText
                  x={tc.x - 10}
                  y={tc.y + 8}
                  text={sign.symbol}
                  font={zodiac24}
                  color="rgba(240, 234, 214,0.7)"
                />
              )}
            </Group>
          );
        })}


        {/* ── House cusps ── */}
        {(chart.houseCusps ?? []).map((cusp: HouseCusp) => {
          const angle = astroToAngle((cusp as any).longitude, ascLongitude);
          const outer = polarToXY(angle, R_OUTER);
          const inner = polarToXY(angle, R_INNER);

          const isAngular = (cusp as any).house === 1 || (cusp as any).house === 4 || (cusp as any).house === 7 || (cusp as any).house === 10;
          const strokeW = isAngular ? 1.0 : 0.8;
          const strokeColor = isAngular ? 'rgba(232, 214, 174,0.7)' : 'rgba(232, 214, 174,0.45)';

          const cusps = chart.houseCusps ?? [];
          const nextHouse = cusps.find((c: HouseCusp) => (c as any).house === (((cusp as any).house % 12) + 1));
          let midLon = (cusp as any).longitude + 15; // default fallback
          if (nextHouse) {
            let diff = (nextHouse as any).longitude - (cusp as any).longitude;
            if (diff < 0) diff += 360; // handle wrap around 360 to 0 (Aries point)
            midLon = (cusp as any).longitude + diff / 2;
            if (midLon >= 360) midLon -= 360; // Normalize back to 0-359
          }
          const midAngle = astroToAngle(midLon, ascLongitude);
          const numPos = polarToXY(midAngle, R_HOUSE_INNER);
          const houseText = String((cusp as any).house);
          const tw = sans9 ? sans9.getTextWidth(houseText) : 7;

          return (
            <Group key={`house-${(cusp as any).house}`}>
              <Line p1={vec(outer.x, outer.y)} p2={vec(inner.x, inner.y)} color={strokeColor} strokeWidth={strokeW} />
              {sans9 && (
                <SkiaText
                  x={numPos.x - tw / 2}
                  y={numPos.y + 3.5}
                  text={houseText}
                  font={sans9}
                  color="rgba(240, 234, 214,0.7)"
                />
              )}
            </Group>
          );
        })}

        {/* ── House ring border ── */}
        <Group>
          <Circle cx={CX} cy={CY} r={R_HOUSE_OUTER} style="stroke" strokeWidth={0.8} opacity={0.90}>
            <SweepGradient
              c={vec(CX, CY)}
              colors={[
                'rgba(232, 214, 174, 0.12)',
                'rgba(255, 255, 255, 1.0)',
                'rgba(232, 214, 174, 0.12)',
                'rgba(255, 255, 255, 0.80)',
                'rgba(232, 214, 174, 0.12)'
              ]}
              positions={[0, 0.25, 0.5, 0.75, 1]}
              transform={[{rotate: -0.3}]}
            />
          </Circle>

          {/* Specular arc — house ring upper-left catchlight */}
          <Path
            path={makeArcPath(CX, CY, R_HOUSE_OUTER, -130, 55)}
            style="stroke"
            strokeWidth={1.6}
            strokeCap="round"
            color="rgba(255,255,255,0.35)"
          >
            <BlurMask blur={1.5} style="normal" />
          </Path>

          {/* Specular arc — house inner ring catchlight */}
          <Path
            path={makeArcPath(CX, CY, R_HOUSE_INNER, -125, 40)}
            style="stroke"
            strokeWidth={1.2}
            strokeCap="round"
            color="rgba(255,255,255,0.28)"
          >
            <BlurMask blur={1.5} style="normal" />
          </Path>
        </Group>

        {/* Thin specular edge catch — top of wheel */}
        <Path
          path={makeArcPath(CX, CY, R_OUTER - 1, -140, 100)}
          style="stroke"
          strokeWidth={1.8}
          strokeCap="round"
          color="rgba(255,255,255,0.22)"
        >
          <BlurMask blur={2} style="normal" />
        </Path>

        {/* Sharp specular flash — brightest catchlight at upper-left */}
        <Path
          path={makeArcPath(CX, CY, R_OUTER - 1, -128, 32)}
          style="stroke"
          strokeWidth={3.0}
          strokeCap="round"
          color="rgba(255,255,255,0.55)"
        >
          <BlurMask blur={1.2} style="normal" />
        </Path>

        {/* Pinpoint specular flare — peak of reflection */}
        <Path
          path={makeArcPath(CX, CY, R_OUTER - 1, -118, 10)}
          style="stroke"
          strokeWidth={4.0}
          strokeCap="round"
          color="rgba(255,255,255,0.75)"
        >
          <BlurMask blur={0.8} style="normal" />
        </Path>

        {/* Secondary specular — bottom-right of wheel */}
        <Path
          path={makeArcPath(CX, CY, R_OUTER - 1, 40, 60)}
          style="stroke"
          strokeWidth={1.0}
          strokeCap="round"
          color="rgba(255,255,255,0.10)"
        >
          <BlurMask blur={1.5} style="normal" />
        </Path>

        {/* Subtle ambient bounce — lower-right rim */}
        <Path
          path={makeArcPath(CX, CY, R_OUTER - 1, 50, 28)}
          style="stroke"
          strokeWidth={1.8}
          strokeCap="round"
          color="rgba(255,245,220,0.22)"
        >
          <BlurMask blur={2} style="normal" />
        </Path>

        {/* ── Dotted astronomy diagram rings ── */}
        <Circle cx={CX} cy={CY} r={R_DOT_RING_1} style="stroke" strokeWidth={0.8} opacity={0.85}>
          <SweepGradient
              c={vec(CX, CY)}
              colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,1.0)', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.90)', 'rgba(255,255,255,0.10)']}
              positions={[0, 0.25, 0.5, 0.75, 1]}
              transform={[{rotate: -0.3}]}
            />
          <DashPathEffect intervals={[1, 8]} />
        </Circle>
        {/* Specular flash on inner dotted ring */}
        <Path
          path={makeArcPath(CX, CY, R_DOT_RING_1, -120, 30)}
          style="stroke"
          strokeWidth={1.4}
          strokeCap="round"
          color="rgba(255,255,255,0.40)"
        >
          <BlurMask blur={1} style="normal" />
        </Path>
        <Circle cx={CX} cy={CY} r={R_DOT_RING_2} style="stroke" strokeWidth={0.8} opacity={0.85}>
          <SweepGradient
              c={vec(CX, CY)}
              colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,1.0)', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.90)', 'rgba(255,255,255,0.10)']}
              positions={[0, 0.25, 0.5, 0.75, 1]}
              transform={[{rotate: -0.3}]}
            />
          <DashPathEffect intervals={[1, 8]} />
        </Circle>
        {/* Specular flash on outer dotted ring */}
        <Path
          path={makeArcPath(CX, CY, R_DOT_RING_2, -115, 30)}
          style="stroke"
          strokeWidth={1.4}
          strokeCap="round"
          color="rgba(255,255,255,0.35)"
        >
          <BlurMask blur={1} style="normal" />
        </Path>

        {/* ── Natal aspect lines (constellation threads) ── */}
        {showAspects && showPerson1 && aspectLines.length > 0 && (
          <>
            {/* Glow line behind each aspect */}
            {aspectLines.map((a, i) => (
              <Line
                key={`asp-glow-${i}`}
                p1={vec(a.x1, a.y1)}
                p2={vec(a.x2, a.y2)}
                color={a.glowColor}
                strokeWidth={2}
              >
                <BlurMask blur={2} style="normal" />
              </Line>
            ))}
            {/* Main aspect line */}
            {aspectLines.map((a, i) => (
              <Line
                key={`asp-${i}`}
                p1={vec(a.x1, a.y1)}
                p2={vec(a.x2, a.y2)}
                color={a.color}
                strokeWidth={a.strokeWidth}
              >
                {a.dashed ? <DashPathEffect intervals={[2, 5]} /> : null}
              </Line>
            ))}
          </>
        )}

        {/* ── Cross-chart synastry aspects (platinum silk) ── */}
        {showAspects && showCross && crossLines.length > 0 && (
          <Group>
            {crossLines.map((l, i) => (
              <Group key={`cross-${i}`}>
                {/* Diffuse glow */}
                <Line
                  p1={vec(l.x1, l.y1)}
                  p2={vec(l.x2, l.y2)}
                  color="rgba(195,202,214,1)"
                  strokeWidth={l.tight ? 1.8 : 1.2}
                  opacity={0.06}
                />
                {/* Silk thread */}
                <Line
                  p1={vec(l.x1, l.y1)}
                  p2={vec(l.x2, l.y2)}
                  color={l.thread}
                  strokeWidth={l.tight ? 0.5 : 0.3}
                >
                  <DashPathEffect intervals={[2, 4]} />
                </Line>
              </Group>
            ))}
          </Group>
        )}

        {/* ── Natal planet glyphs (glassy spheres) ── */}
        {showPerson1 && placedPlanets.map((planet) => {
          const nonPlanetPoints = ['Chiron', 'North Node', 'South Node', 'Lilith', 'Vertex', 'Part of Fortune', 'Pholus', 'Ascendant', 'Midheaven', 'ASC', 'MC'];
          const iconOnlyPoints = ['Lilith', 'Vertex', 'Part of Fortune', 'Pholus'];
          const isPoint = nonPlanetPoints.includes(planet.label);
          const isIconOnly = iconOnlyPoints.includes(planet.label);
          const actualRadius = isPoint ? R_INNER + 20 : R_PLANET_RING;
          const glyphPos = polarToXY(planet.displayAngle, actualRadius);
          const tickOuter = polarToXY(planet.originalAngle, R_OUTER - 1);
          const tickInner = polarToXY(planet.originalAngle, isPoint ? actualRadius + 15 : R_PLANET_RING + 10);
          const textColor = isPoint ? "#FFFFFF" : "#000000";
          const textOpacity = 1.0;
          const textStyle = isPoint ? "fill" : "stroke";
          const strokeWidthVal = isPoint ? 0 : 1.5;

          const baseColor = PLANET_COLORS[planet.label] || '#B89B6A';

          const glyph = planet.symbol;
          const glyphFont = glyph.length > 1 ? sans11Heavy : zodiacMain;
          const glyphWidth = glyphFont ? glyphFont.getTextWidth(glyph) : 12;
          const fontSize = glyphFont ? glyphFont.getSize() : 12;
          const glyphOffsetX = glyphWidth / 2;
          const glyphOffsetY = fontSize * 0.35; // visually center baseline


          return (
            <Group key={`p-${planet.label}`}>
              {/* Position tick */}
              <Line
                p1={vec(tickOuter.x, tickOuter.y)}
                p2={vec(tickInner.x, tickInner.y)}
                color={baseColor}
                strokeWidth={0.8}
                opacity={0.40}
              />

              {/* Sphere rendering — planets only, not icon-only points */}
              {!isPoint && (
                <>
                  {/* Outer glow halo */}
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R + 4} color={baseColor} opacity={0.18} />
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R + 2} color={baseColor} opacity={0.10} />
                  {/* Drop shadow for depth */}
                  <Circle cx={glyphPos.x + 1.5} cy={glyphPos.y + 2} r={PLANET_R} color="rgba(0,0,0,0.45)"><BlurMask blur={4} style="normal" /></Circle>
                  {/* Base sphere — lit from upper-left */}
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R}>
                    <RadialGradient c={vec(glyphPos.x - PLANET_R * 0.25, glyphPos.y - PLANET_R * 0.25)} r={PLANET_R * 1.6} colors={getUserSpherePalette(0)} positions={[0, 0.2, 0.5, 0.78, 1]} />
                  </Circle>
                  {/* Shadow hemisphere — darkens lower-right */}
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R}>
                    <RadialGradient c={vec(glyphPos.x + PLANET_R * 0.45, glyphPos.y + PLANET_R * 0.45)} r={PLANET_R * 1.2} colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0)']} positions={[0, 0.5, 1]} />
                  </Circle>
                  {/* Sharp specular dot — pure white point light */}
                  <Circle cx={glyphPos.x - PLANET_R * 0.32} cy={glyphPos.y - PLANET_R * 0.32} r={PLANET_R * 0.16} color="rgba(255,255,255,1.0)" />
                  {/* Soft halo around specular */}
                  <Circle cx={glyphPos.x - PLANET_R * 0.26} cy={glyphPos.y - PLANET_R * 0.26} r={PLANET_R * 0.42} color="rgba(255,255,255,0.30)"><BlurMask blur={2.5} style="normal" /></Circle>
                  {/* Rim highlight — bright edge catch */}
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R - 0.4} style="stroke" strokeWidth={1.4} color="rgba(255,255,255,0.55)" />
                </>
              )}
              {/* Icon-only points: just draw the symbol, no sphere */}
              {isIconOnly && glyphFont && (
                <SkiaText
                  x={glyphPos.x - glyphOffsetX}
                  y={glyphPos.y + glyphOffsetY}
                  text={glyph}
                  font={glyphFont}
                  color={textColor}
                  style={"fill"}
                  strokeWidth={0}
                  opacity={1.0}
                />
              )}

              {/* Glyph */}
              {isPoint && planet.label === 'Chiron' ? (
                (() => {
                  const path = Skia.Path.Make();
                  const cx = glyphPos.x, cy = glyphPos.y;
                  // Circle at top of vertical stroke
                  path.addCircle(cx, cy - 5, 3);
                  // Vertical stem from below circle down
                  path.moveTo(cx, cy - 2);
                  path.lineTo(cx, cy + 5);
                  // K upper arm: from mid-stem going upper-right
                  path.moveTo(cx, cy + 1);
                  path.lineTo(cx + 4.5, cy - 3.5);
                  // K lower arm: from mid-stem going lower-right
                  path.moveTo(cx, cy + 1);
                  path.lineTo(cx + 4.5, cy + 5);
                  return <Path path={path} style="stroke" strokeWidth={1.3} color="#FFFFFF" strokeCap="round" />;
                })()
              ) : symbolFont ? (
                <SkiaText
                  x={glyphPos.x - 9}
                  y={glyphPos.y + 6}
                  text={glyph}
                  font={symbolFont}
                  color={textColor} style={textStyle as "stroke" | "fill"} strokeWidth={strokeWidthVal} opacity={textOpacity}
                />
              ) : glyphFont && (
                <SkiaText
                  x={glyphPos.x - glyphOffsetX}
                  y={glyphPos.y + glyphOffsetY}
                  text={glyph}
                  font={glyphFont}
                  color={textColor} style={textStyle as "stroke" | "fill"} strokeWidth={strokeWidthVal} opacity={textOpacity}
                />
              )}

              {/* Retrograde mark */}
              {planet.isRetrograde && sans8 && (
                <SkiaText
                  x={glyphPos.x + 7.5}
                  y={glyphPos.y - 6.5}
                  text="R"
                  font={sans8}
                  color={theme.warning}
                />
              )}
            </Group>
          );
        })}

        {/* ── Overlay planets (velvet spheres, secondary hierarchy) ── */}
        {showPerson2 && placedOverlayPlanets.map((planet) => {
          const isPoint = ['Ascendant', 'Midheaven', 'North Node', 'South Node', 'Chiron', 'ASC', 'MC'].includes(planet.label);
          const actualRadius = isPoint ? R_INNER + 36 : R_OVERLAY_RING;
          const glyphPos = polarToXY(planet.displayAngle, actualRadius);
          const tickOuter = polarToXY(planet.originalAngle, R_OUTER - 1);
          const tickInner = polarToXY(planet.originalAngle, isPoint ? actualRadius + 15 : R_OVERLAY_RING + 10);
          const textColor = isPoint ? "#FFFFFF" : "#000000";
          const textOpacity = 1.0;
          const textStyle = isPoint ? "fill" : "stroke";
          const strokeWidthVal = isPoint ? 0 : 1.5;

          const baseColor = planet.color;

          const glyph = planet.symbol;
          const glyphFont = glyph.length > 1 ? sans9Heavy : zodiacOverlay;
          const glyphWidth = glyphFont ? glyphFont.getTextWidth(glyph) : 10;
          const fontSize = glyphFont ? glyphFont.getSize() : 10;
          const glyphOffsetX = glyphWidth / 2;
          const glyphOffsetY = fontSize * 0.35; // visually center baseline


          return (
            <Group key={`op-${planet.label}`}>
              {/* Position tick — dashed */}
              <Line
                p1={vec(tickOuter.x, tickOuter.y)}
                p2={vec(tickInner.x, tickInner.y)}
                color={baseColor}
                strokeWidth={0.6}
                opacity={0.30}
              >
                <DashPathEffect intervals={[2, 2]} />
              </Line>

              {/* Sphere rendering — planets only, not chart points */}
              {!isPoint && (
                <>
                  {/* Outer glow halo */}
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R * 0.75 + 4} color={baseColor} opacity={0.18} />
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R * 0.75 + 2} color={baseColor} opacity={0.10} />

                  {/* Drop shadow for depth */}
                  <Circle cx={glyphPos.x + 1.2} cy={glyphPos.y + 1.5} r={PLANET_R * 0.75} color="rgba(0,0,0,0.45)">
                    <BlurMask blur={3} style="normal" />
                  </Circle>

                  {/* Base sphere — lit from upper-left */}
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R * 0.75}>
                    <RadialGradient
                      c={vec(glyphPos.x - (PLANET_R * 0.75) * 0.25, glyphPos.y - (PLANET_R * 0.75) * 0.25)}
                      r={(PLANET_R * 0.75) * 1.6}
                      colors={getUserSpherePalette(1)}
                      positions={[0, 0.2, 0.5, 0.78, 1]}
                    />
                  </Circle>

                  {/* Shadow hemisphere — darkens lower-right */}
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R * 0.75}>
                    <RadialGradient
                      c={vec(glyphPos.x + (PLANET_R * 0.75) * 0.45, glyphPos.y + (PLANET_R * 0.75) * 0.45)}
                      r={(PLANET_R * 0.75) * 1.2}
                      colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0)']}
                      positions={[0, 0.5, 1]}
                    />
                  </Circle>

                  {/* Sharp specular dot */}
                  <Circle
                    cx={glyphPos.x - (PLANET_R * 0.75) * 0.32}
                    cy={glyphPos.y - (PLANET_R * 0.75) * 0.32}
                    r={(PLANET_R * 0.75) * 0.16}
                    color="rgba(255,255,255,1.0)"
                  />

                  {/* Soft halo around specular */}
                  <Circle
                    cx={glyphPos.x - (PLANET_R * 0.75) * 0.26}
                    cy={glyphPos.y - (PLANET_R * 0.75) * 0.26}
                    r={(PLANET_R * 0.75) * 0.42}
                    color="rgba(255,255,255,0.28)"
                  >
                    <BlurMask blur={2} style="normal" />
                  </Circle>

                  {/* Rim highlight */}
                  <Circle
                    cx={glyphPos.x}
                    cy={glyphPos.y}
                    r={PLANET_R * 0.75 - 0.4}
                    style="stroke"
                    strokeWidth={1.2}
                    color="rgba(255,255,255,0.50)"
                  />
                </>
              )}

              {/* Glyph */}
              {isPoint && planet.label === 'Chiron' ? (
                (() => {
                  const path = Skia.Path.Make();
                  const cx = glyphPos.x, cy = glyphPos.y;
                  // Circle at top of vertical stroke (scaled down for overlay)
                  path.addCircle(cx, cy - 4, 2.4);
                  // Vertical stem
                  path.moveTo(cx, cy - 1.6);
                  path.lineTo(cx, cy + 4);
                  // K upper arm
                  path.moveTo(cx, cy + 0.8);
                  path.lineTo(cx + 3.6, cy - 2.8);
                  // K lower arm
                  path.moveTo(cx, cy + 0.8);
                  path.lineTo(cx + 3.6, cy + 4);
                  return <Path path={path} style="stroke" strokeWidth={1.1} color="#FFFFFF" strokeCap="round" />;
                })()
              ) : glyphFont && (
                <SkiaText x={glyphPos.x - glyphOffsetX} y={glyphPos.y + glyphOffsetY} text={glyph} font={glyphFont} color="#000000" style="stroke" strokeWidth={1.2} />
              )}

              {/* Retrograde mark */}
              {planet.isRetrograde && sans8 && (
                <SkiaText x={glyphPos.x + 6.0} y={glyphPos.y - 5.5} text="R" font={sans8} color={theme.warning} />
              )}
            </Group>
          );
        })}

        {/* ── ASC / MC axis labels (Strictly Inside text) ── */}
        {(chart as any).ascendant &&
          (() => {
            const lon = getLongitude((chart as any).ascendant);
            if (lon === null) return null;
            const ang = astroToAngle(lon, ascLongitude);
            
            // Inner text position (just inside the inner rim where house numbers are)
            const textPosInner = polarToXY(ang, R_INNER + 20); 
            
            return (
              <Group key="asc-label">
                {sans8 && (
                   <SkiaText 
                     x={textPosInner.x - 8} 
                     y={textPosInner.y + 3} 
                     text="ASC" 
                     font={sans8} 
                     color="#FFFFFF"
                   />
                )}
              </Group>
            );
          })()}

        {(chart as any).midheaven &&
          (() => {
            const lon = getLongitude((chart as any).midheaven);
            if (lon === null) return null;
            const ang = astroToAngle(lon, ascLongitude);
            
            const textPosInner = polarToXY(ang, R_INNER + 20);

            return (
              <Group key="mc-label">
                {sans8 && (
                   <SkiaText 
                     x={textPosInner.x - 6} 
                     y={textPosInner.y + 3} 
                     text="MC" 
                     font={sans8} 
                     color="#FFFFFF"
                   />
                )}
              </Group>
            );
          })()}

        {/* ── Center hub — deep navy core ── */}
        <Circle cx={CX} cy={CY} r={R_INNER + 24} opacity={1}>
          <RadialGradient
            c={vec(CX, CY)}
            r={R_INNER + 24}
            colors={['rgba(184,155,106,0.10)', 'rgba(184,155,106,0.04)', 'rgba(184,155,106,0.00)']}
            positions={[0, 0.55, 1]}
          />
        </Circle>

        {/* Navy shadow halo */}
        <Circle cx={CX} cy={CY} r={R_INNER + 4} style="stroke" strokeWidth={6} color="rgba(2,8,23,0.70)" />

        {/* Glass face (deeper, cosmic) */}
        <Circle cx={CX} cy={CY} r={R_INNER}>
          <RadialGradient
            c={vec(CX - 10, CY - 12)}
            r={R_INNER * 1.8}
            colors={[
              '#020817',   // match background
              '#020817',   // match background
              '#020817'    // match background
            ]}
            positions={[0, 0.55, 1]}
          />
        </Circle>

        {/* Tiny specular dot on center hub — point light catch */}
        <Circle cx={CX - R_INNER * 0.25} cy={CY - R_INNER * 0.35} r={3} color="rgba(255,255,255,0.30)">
          <BlurMask blur={1.5} style="normal" />
        </Circle>

        {/* ── Center Hub: Inner Bezel ── */}
        <Group>
          <Circle cx={CX} cy={CY} r={R_INNER} style="stroke" strokeWidth={3} opacity={0.80}>
            <SweepGradient
              c={vec(CX, CY)}
              colors={[
                'rgba(232, 214, 174, 0.15)', 
                'rgba(255, 255, 255, 1.0)', 
                'rgba(232, 214, 174, 0.15)', 
                'rgba(255, 255, 255, 0.60)', 
                'rgba(232, 214, 174, 0.15)'
              ]}
              positions={[0, 0.15, 0.5, 0.65, 1]}
              transform={[{rotate: 0.1}]}
            />
            <BlurMask blur={2} style="normal" />
          </Circle>

          {/* Sharp specular flash on inner hub bezel */}
          <Path
            path={makeArcPath(CX, CY, R_INNER, -125, 38)}
            style="stroke"
            strokeWidth={2.5}
            strokeCap="round"
            color="rgba(255,255,255,0.60)"
          >
            <BlurMask blur={1} style="normal" />
          </Path>
          
          {/* Outer edge of inner hub */}
          <Circle cx={CX} cy={CY} r={R_INNER + 1} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient
              c={vec(CX, CY)}
              colors={[
                '#3A2E1C', '#FFFFFF', '#8A734D', '#2A1F14', 
                '#B39D7D', '#FFFFFF', '#D4C4A3', '#1A1208', 
                '#F8E8C9', '#3A2E1C'
              ]}
              positions={[0.0, 0.12, 0.25, 0.38, 0.52, 0.62, 0.78, 0.88, 0.95, 1.0]}
              transform={[{ rotate: -0.15 }]}
            />
          </Circle>

          {/* Inner edge of inner hub */}
          <Circle cx={CX} cy={CY} r={R_INNER - 1} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient
              c={vec(CX, CY)}
              colors={[
                '#4A3728', '#FDF5E6', '#A8926F', '#3A2E1C', 
                '#C9AE78', '#FFFFFF', '#8A734D', '#2A1F14', 
                '#FFF4D6', '#4A3728'
              ]}
              positions={[0.0, 0.1, 0.28, 0.42, 0.55, 0.65, 0.82, 0.9, 0.96, 1.0]}
              transform={[{ rotate: 0.1 }]}
            />
          </Circle>
        </Group>

        <Circle cx={CX} cy={CY} r={R_INNER - 3} style="stroke" strokeWidth={0.8} opacity={0.95}>
           <SweepGradient
              c={vec(CX, CY)}
              colors={['#8A734D', '#FDF5E6', '#4A3728', '#C9AE78', '#FFFFFF', '#3A2E1C', '#8A734D']}
              positions={[0.0, 0.15, 0.35, 0.5, 0.68, 0.85, 1.0]}
              transform={[{ rotate: -0.2 }]}
            />
        </Circle>

        {/* ── Synastry label inside center hub ── */}
        {overlayChart && overlayName && (
          <Group>
            {sans10 && (() => {
              const text = "SYNASTRY";
              const tw = sans10.getTextWidth(text);
              return (
                <SkiaText
                  x={CX - tw / 2}
                  y={CY - 10}
                  text={text}
                  font={sans10}
                  color="rgba(255,255,255,0.7)"
                />
              );
            })()}
            {serif16 && serif14 && serif12 && (() => {
               // dynamically choose smaller font if name is very long
              let useFont = serif16;
              if (overlayName.length > 8) useFont = serif14;
              if (overlayName.length > 12) useFont = serif12;
              const text = overlayName.length > 16 ? overlayName.slice(0, 15) + '…' : overlayName;
              const tw = useFont.getTextWidth(text);
              return (
                <SkiaText
                  x={CX - tw / 2}
                  y={CY + 14}
                  text={text}
                  font={useFont}
                  color="rgba(184,155,106,0.95)"
                />
              );
            })()}
          </Group>
        )}


      </Canvas>
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
