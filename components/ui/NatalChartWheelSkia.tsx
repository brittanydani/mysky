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
  Shadow,
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

const PLANET_R = 8.5;
const HILITE_R = 1.8;

const MAX_ASPECTS = 30;
const MAX_CROSS_ASPECTS = 28;

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
  Ascendant: 'AC',
  Midheaven: 'MC',
};

// Champagne / antique gold palette
const PLANET_COLORS: Record<string, string> = {
  Sun: '#B89B6A',
  Moon: '#B6BDC8',
  Mercury: '#AEB7C5',
  Venus: '#B89B6A',
  Mars: '#A46A54',
  Jupiter: '#B89B6A',
  Saturn: '#9BA3B2',
  Uranus: '#8FA7B4',
  Neptune: '#8C9DB8',
  Pluto: '#8D7AA8',
  Ascendant: '#B89B6A',
  Midheaven: '#B89B6A',
};

// Gradient highlight (inner sphere catch-light)
const PLANET_GRADIENT_INNER: Record<string, string> = {
  Sun: '#E2D0A8',
  Jupiter: '#E2D0A8',
  Ascendant: '#E2D0A8',
  Midheaven: '#E2D0A8',
  Moon: '#D0D8E4',
  Mercury: '#C8D4E0',
  Venus: '#E2D0A8',
  Mars: '#D4A090',
  Saturn: '#C0C8D4',
  Uranus: '#B8CED8',
  Neptune: '#B4C4D8',
  Pluto: '#C0B4D4',
};

// Gradient shadow (outer sphere depth)
const PLANET_GRADIENT_OUTER: Record<string, string> = {
  Sun: '#6C5428',
  Jupiter: '#6C5428',
  Ascendant: '#6C5428',
  Midheaven: '#6C5428',
  Moon: '#686E7A',
  Mercury: '#606874',
  Venus: '#6C5428',
  Mars: '#6A3828',
  Saturn: '#585E6A',
  Uranus: '#4A6070',
  Neptune: '#485870',
  Pluto: '#504468',
};

// Cooler soft indigo-violet for overlay/partner planets
const OVERLAY_PLANET_COLORS: Record<string, string> = {
  Sun: '#9C8FD2',
  Moon: '#8D86C8',
  Mercury: '#8290C7',
  Venus: '#A08BD0',
  Mars: '#9A82BE',
  Jupiter: '#9C8FD2',
  Saturn: '#7F7BB4',
  Uranus: '#7F93C8',
  Neptune: '#7887BE',
  Pluto: '#8B79C4',
  Ascendant: '#9C8FD2',
  Midheaven: '#9C8FD2',
};

const OVERLAY_GRADIENT_INNER: Record<string, string> = {
  Sun: '#C8C0F0',
  Moon: '#BCB6EC',
  Mercury: '#B8C4EC',
  Venus: '#CCC0F4',
  Mars: '#C8B8EC',
  Jupiter: '#C8C0F0',
  Saturn: '#B0B0E0',
  Uranus: '#B8C8EC',
  Neptune: '#B0C0E8',
  Pluto: '#C4B8EC',
  Ascendant: '#C8C0F0',
  Midheaven: '#C8C0F0',
};

const OVERLAY_GRADIENT_OUTER: Record<string, string> = {
  Sun: '#302060',
  Moon: '#2A2060',
  Mercury: '#263268',
  Venus: '#3A2860',
  Mars: '#382460',
  Jupiter: '#302060',
  Saturn: '#222068',
  Uranus: '#263068',
  Neptune: '#222A60',
  Pluto: '#302068',
  Ascendant: '#302060',
  Midheaven: '#302060',
};


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
  const serif12 = useMemo(() => matchFont({ fontFamily: SERIF_FAMILY, fontSize: 12, fontWeight: '600' }), []);
  const serif10 = useMemo(() => matchFont({ fontFamily: SERIF_FAMILY, fontSize: 10, fontWeight: '600' }), []);
  const sans9 = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 9, fontWeight: '600' }), []);
  const sans8 = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 8, fontWeight: '600' }), []);
  const zodiac16 = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 16, fontWeight: '400' }), []);
  const zodiac24 = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 24, fontWeight: '400' }), []);
  const zodiac12 = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 12, fontWeight: '400' }), []);
  const zodiac10 = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 10, fontWeight: '400' }), []);

  // ── Prepare natal planets ──
  const placedPlanets = useMemo(() => {
    const labels = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
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
    return map;
  }, [placedPlanets]);

  // ── Overlay planets (second person / synastry) ──
  const R_OVERLAY_RING = R_PLANET_RING - 8;
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
    const lines: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      strokeWidth: number;
      dashed: boolean;
    }> = [];

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

      const isTight = (asp.orb ?? 99) < 3;
      // Use major aspect color if available, else fallback to old color
      const typeName = ((asp as any)?.type?.name ?? '').toLowerCase();
      const color = ASPECT_COLOR[typeName] || (
        isTight
          ? ASPECT_STRONG_COLORS[((asp as any)?.type?.nature ?? 'Neutral') as string] ?? ASPECT_STRONG_COLORS.Neutral
          : ASPECT_LINE_COLORS[((asp as any)?.type?.nature ?? 'Neutral') as string] ?? ASPECT_LINE_COLORS.Neutral
      );

      lines.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        color,
        strokeWidth: isTight ? 1.0 : 0.45,
        dashed: typeName !== 'trine' && typeName !== 'sextile' && typeName !== 'conjunction',
      });
    }

    return lines;
  }, [visibleAspects, planetLongitudes, ascLongitude]);

  const crossLines = useMemo(() => {
    const lines: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      thread: string;
      tight: boolean;
    }> = [];
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
        {/* ── Subtle wheel glow (champagne halo) ── */}
        <Circle cx={CX} cy={CY} r={R_OUTER + 26} opacity={1}>
          <RadialGradient
            c={vec(CX, CY)}
            r={R_OUTER + 26}
            colors={[
              'rgba(201,169,98,0.18)',  // champagne glow
              'rgba(201,169,98,0.06)',
              'rgba(201,169,98,0.00)'
            ]}
            positions={[0, 0.55, 1]}
          />
        </Circle>

        {/* ── Metal rim — outer bloom glow + base + specular ── */}
        <Group>
          {/* Outer bloom */}
          <Circle cx={CX} cy={CY} r={R_OUTER} style="stroke" strokeWidth={14} color="rgba(184,155,106,0.06)" />
          {/* Warm gold base */}
          <Circle
            cx={CX}
            cy={CY}
            r={R_OUTER - RIM_INSET}
            style="stroke"
            strokeWidth={RIM_W}
            color="rgba(184,155,106,0.28)"
          />
          {/* Specular sweep — two bright peaks */}
          <Circle cx={CX} cy={CY} r={R_OUTER - RIM_INSET} style="stroke" strokeWidth={RIM_W}>
            <SweepGradient
              c={vec(CX, CY)}
              colors={[
                'rgba(255,244,220,0.00)',
                'rgba(255,236,195,0.35)',
                'rgba(255,244,220,0.05)',
                'rgba(255,244,220,0.00)',
                'rgba(255,236,195,0.28)',
                'rgba(255,244,220,0.00)',
              ]}
              positions={[0.0, 0.08, 0.18, 0.55, 0.62, 1.0]}
            />
          </Circle>
        </Group>

        {/* ── Zodiac sign medallions (outside the rim, double-circle border) ── */}
        
        {/* Outermost rim enclosing the zodiac signs */}
        <Group>
          <Circle
            cx={CX}
            cy={CY}
            r={R_OUTER + 44}
            style="stroke"
            strokeWidth={1}
            color="rgba(184,155,106,0.35)"
          />
          <Circle
            cx={CX}
            cy={CY}
            r={R_OUTER + 44}
            style="stroke"
            strokeWidth={0.5}
            color="rgba(255,255,255,0.15)"
          />
        </Group>

        {/* Inner rim bounding the zodiac signs (just outside the main wheel) */}
        <Group>
          <Circle
            cx={CX}
            cy={CY}
            r={R_OUTER + 2}
            style="stroke"
            strokeWidth={1}
            color="rgba(184,155,106,0.35)"
          />
        </Group>


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
                  color="rgba(220,215,205,0.7)"
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
          const strokeW = isAngular ? 1.0 : 0.4;
          const strokeColor = isAngular ? 'rgba(184,155,106,0.22)' : 'rgba(255,255,255,0.06)';

          const cusps = chart.houseCusps ?? [];
          const nextHouse = cusps.find((c: HouseCusp) => (c as any).house === (((cusp as any).house % 12) + 1));
          let midLon = (cusp as any).longitude;
          if (nextHouse) {
            let diff = (nextHouse as any).longitude - (cusp as any).longitude;
            if (diff < 0) diff += 360;
            midLon = (cusp as any).longitude + diff / 2;
            if (midLon >= 360) midLon -= 360;
          }
          const midAngle = astroToAngle(midLon, ascLongitude);
          const numPos = polarToXY(midAngle, R_HOUSE_INNER);

          return (
            <Group key={`house-${(cusp as any).house}`}>
              <Line p1={vec(outer.x, outer.y)} p2={vec(inner.x, inner.y)} color={strokeColor} strokeWidth={strokeW} />
              {sans9 && (
                <SkiaText
                  x={numPos.x - 3.5}
                  y={numPos.y + 3}
                  text={String((cusp as any).house)}
                  font={sans9}
                  color="rgba(255,255,255,0.18)"
                />
              )}
            </Group>
          );
        })}

        {/* ── House ring border ── */}
        <Circle cx={CX} cy={CY} r={R_HOUSE_OUTER} style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.05)" />

        {/* ── Dotted astronomy diagram rings ── */}
        <Circle cx={CX} cy={CY} r={R_DOT_RING_1} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.08)">
          <DashPathEffect intervals={[1, 8]} />
        </Circle>
        <Circle cx={CX} cy={CY} r={R_DOT_RING_2} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.08)">
          <DashPathEffect intervals={[1, 8]} />
        </Circle>

        {/* ── Natal aspect lines (constellation threads) ── */}
        {showAspects && showPerson1 && aspectLines.length > 0 && (
          <>
            {/* Glow line behind each aspect */}
            {aspectLines.map((a, i) => (
              <Line
                key={`asp-glow-${i}`}
                p1={vec(a.x1, a.y1)}
                p2={vec(a.x2, a.y2)}
                color={a.color}
                strokeWidth={a.strokeWidth * (a.dashed ? 2.2 : 2.6)}
                opacity={0.18}
              />
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
          const glyphPos = polarToXY(planet.displayAngle, R_PLANET_RING);
          const tickOuter = polarToXY(planet.originalAngle, R_OUTER - 1);
          const tickInner = polarToXY(planet.originalAngle, R_PLANET_RING + 10);

          const baseColor = PLANET_COLORS[planet.label] || '#B89B6A';
          const innerColor = PLANET_GRADIENT_INNER[planet.label] || baseColor;
          const outerColor = PLANET_GRADIENT_OUTER[planet.label] || baseColor;

          const glyph = planet.symbol;
          const glyphFont = glyph.length > 1 ? sans8 : zodiac12;
          const glyphOffsetX = glyph.length > 1 ? 5.0 : 4.5;
          const glyphOffsetY = glyph.length > 1 ? 3.0 : 4.0;


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

              {/* Glow halos (stronger) */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={11} color={baseColor} opacity={0.14} />
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={9} color={baseColor} opacity={0.09} />

              {/* Soft shadow ring for dimensional pop */}
              <Shadow dx={0} dy={0} blur={10} color={`${baseColor}44`} />

              {/* Sphere */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R}>
                <RadialGradient
                  c={vec(glyphPos.x - PLANET_R * 0.35, glyphPos.y - PLANET_R * 0.45)}
                  r={PLANET_R * 1.5}
                  colors={["#ffffff", innerColor, outerColor]}
                  positions={[0, 0.4, 1]}
                />
              </Circle>

              {/* Glyph */}
              {symbolFont ? (
                <SkiaText
                  x={glyphPos.x - 9}
                  y={glyphPos.y + 6}
                  text={glyph}
                  font={symbolFont}
                  color="#ffffff"
                />
              ) : glyphFont && (
                <SkiaText
                  x={glyphPos.x - glyphOffsetX}
                  y={glyphPos.y + glyphOffsetY}
                  text={glyph}
                  font={glyphFont}
                  color={baseColor}
                />
              )}

              {/* Retrograde mark */}
              {planet.isRetrograde && sans8 && (
                <SkiaText
                  x={glyphPos.x + 7.5}
                  y={glyphPos.y - 6.5}
                  text="℞"
                  font={sans8}
                  color={theme.warning}
                />
              )}
            </Group>
          );
        })}

        {/* ── Overlay planets (velvet spheres, secondary hierarchy) ── */}
        {showPerson2 && placedOverlayPlanets.map((planet) => {
          const glyphPos = polarToXY(planet.displayAngle, R_OVERLAY_RING);
          const tickOuter = polarToXY(planet.originalAngle, R_OUTER - 1);
          const tickInner = polarToXY(planet.originalAngle, R_OVERLAY_RING + 10);

          const baseColor = planet.color;
          const innerColor = OVERLAY_GRADIENT_INNER[planet.label] || baseColor;
          const outerColor = OVERLAY_GRADIENT_OUTER[planet.label] || baseColor;

          const glyph = planet.symbol;
          const glyphFont = glyph.length > 1 ? sans8 : zodiac10;
          const glyphOffsetX = glyph.length > 1 ? 4.5 : 4.0;
          const glyphOffsetY = glyph.length > 1 ? 3.0 : 3.6;


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

              {/* Glow halos (stronger, matches natal) */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={11} color={baseColor} opacity={0.14} />
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={9} color={baseColor} opacity={0.09} />

              {/* Soft shadow ring for dimensional pop */}
              <Circle
                cx={glyphPos.x}
                cy={glyphPos.y}
                r={PLANET_R + 2.2}
                style="stroke"
                strokeWidth={3.2}
                color="rgba(0,0,0,0.20)"
              />

              {/* Sphere (dashed border, smaller) */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={7.8} style="stroke" strokeWidth={0.9} color={baseColor} opacity={0.85}>
                <DashPathEffect intervals={[3, 2]} />
              </Circle>
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={7.8}>
                <RadialGradient
                  c={vec(glyphPos.x - 7.8 * 0.35, glyphPos.y - 7.8 * 0.45)}
                  r={7.8 * 1.2}
                  colors={[innerColor, outerColor]}
                />
              </Circle>

              {/* Specular catch-light */}
              <Circle cx={glyphPos.x - 7.8 * 0.38} cy={glyphPos.y - 7.8 * 0.42} r={1.6} color="rgba(255,255,255,0.18)" />

              {/* Glyph */}
              {glyphFont && (
                <SkiaText x={glyphPos.x - glyphOffsetX} y={glyphPos.y + glyphOffsetY} text={glyph} font={glyphFont} color={baseColor} />
              )}

              {/* Retrograde mark */}
              {planet.isRetrograde && sans8 && (
                <SkiaText x={glyphPos.x + 6.0} y={glyphPos.y - 5.5} text="℞" font={sans8} color={theme.warning} />
              )}
            </Group>
          );
        })}

        {/* ── ASC / MC axis labels ── */}
        {(chart as any).ascendant &&
          (() => {
            const lon = getLongitude((chart as any).ascendant);
            if (lon === null) return null;
            const ang = astroToAngle(lon, ascLongitude);
            const pos = polarToXY(ang, R_OUTER - 12);
            return sans8 ? <SkiaText x={pos.x - 7} y={pos.y + 3} text="ASC" font={sans8} color={theme.primary} /> : null;
          })()}

        {(chart as any).midheaven &&
          (() => {
            const lon = getLongitude((chart as any).midheaven);
            if (lon === null) return null;
            const ang = astroToAngle(lon, ascLongitude);
            const pos = polarToXY(ang, R_OUTER - 12);
            return sans8 ? <SkiaText x={pos.x - 6} y={pos.y + 3} text="MC" font={sans8} color={theme.primary} /> : null;
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
        <Circle cx={CX} cy={CY} r={R_INNER + 4} style="stroke" strokeWidth={6} color="rgba(5,7,11,0.70)" />

        {/* Glass face (deeper, cosmic) */}
        <Circle cx={CX} cy={CY} r={R_INNER}>
          <RadialGradient
            c={vec(CX - 10, CY - 12)}
            r={R_INNER * 1.8}
            colors={[
              '#1A2740',   // faint inner glow
              '#0D1626',   // mid depth
              '#05080F'    // deep center
            ]}
            positions={[0, 0.55, 1]}
          />
        </Circle>

        {/* Metallic ring */}
        <Circle cx={CX} cy={CY} r={R_INNER + 0.5} style="stroke" strokeWidth={1.2} color="#2A3848" opacity={0.7} />
        {/* Champagne rim highlight */}
        <Circle cx={CX} cy={CY} r={R_INNER} style="stroke" strokeWidth={0.7} color="rgba(184,155,106,0.22)" />
        {/* Inner white rim (subtle) */}
        <Circle cx={CX} cy={CY} r={R_INNER - 1} style="stroke" strokeWidth={1.0} color="rgba(255,255,255,0.08)" />
        {/* Inner shadow */}
        <Circle cx={CX} cy={CY} r={R_INNER - 2} style="stroke" strokeWidth={1.5} color="rgba(0,0,0,0.22)" />

        {/* ── Synastry label inside center hub ── */}
        {overlayChart && overlayName && (
          <Group>
            {sans8 && (
              <SkiaText
                x={CX - 26}
                y={CY - 6}
                text="SYNASTRY"
                font={sans8}
                color="rgba(255,255,255,0.55)"
              />
            )}
            {serif10 && (
              <SkiaText
                x={CX - 20}
                y={CY + 10}
                text={overlayName.length > 9 ? overlayName.slice(0, 9) + '…' : overlayName}
                font={serif10}
                color="rgba(184,155,106,0.85)"
              />
            )}
          </Group>
        )}

        {/* Film grain overlay (RuntimeShader) temporarily disabled for debugging black screen issue */}

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
