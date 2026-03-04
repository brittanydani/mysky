// File: components/ui/NatalChartWheel.tsx
//
// Cinematic Skia re-implementation of the natal chart wheel.
// Drop-in replacement for the SVG version.
//
// Requires: @shopify/react-native-skia 2.x
// Notes:
// - Text in Skia requires a loaded font. This file uses Inter + Playfair as defaults.
//   If your font paths differ, update FONT_* requires below.
// - Film grain uses RuntimeEffect; if unsupported on a device/build, it silently disables.

import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Line,
  Paint,
  Path,
  RadialGradient,
  Rect,
  Skia,
  SweepGradient,
  Text as SkiaText,
  useFont,
  vec,
  BlurMask,
  RuntimeShader,
} from '@shopify/react-native-skia';

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
const R_INNER = 36; // inner circle — expanded for watch-face presence

// Phase 3 polish constants
const RIM_W = 3.5;
const RIM_INSET = 2;

const PLANET_R = 10.5;
const HILITE_R = 2.2;

const ASPECT_GLOW_MULT = 1.9;
const ASPECT_GLOW_ALPHA = 0.20;
const ASPECT_GLOW_BLUR = 6;

const MAX_ASPECTS = 18;
const MAX_CROSS_ASPECTS = 22;
const GRAIN_OPACITY = 0.20;

// ── Fonts (update paths if needed) ──
// These are common in MySky-style projects; change to match your repo.
const FONT_SERIF = require('../../assets/fonts/PlayfairDisplay-SemiBold.ttf');
const FONT_SANS = require('../../assets/fonts/Inter-SemiBold.ttf');
const FONT_MONO = require('../../assets/fonts/JetBrainsMono-SemiBold.ttf');

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

// Desaturated element colors — restrained luxury
const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#C07878',
  Earth: '#6AAE82',
  Air: '#86B4D8',
  Water: '#7480C4',
};

const ELEMENT_BG: Record<string, string> = {
  Fire: 'rgba(192,120,120,0.09)',
  Earth: 'rgba(106,174,130,0.09)',
  Air: 'rgba(134,180,216,0.09)',
  Water: 'rgba(116,128,196,0.09)',
};

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

// Champagne metal palette — #C2A65A core
const PLANET_COLORS: Record<string, string> = {
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
const PLANET_GRADIENT_INNER: Record<string, string> = {
  Sun: '#E8D7A6',
  Jupiter: '#E8D7A6',
  Ascendant: '#E8D7A6',
  Midheaven: '#E8D7A6',
  Moon: '#D4DDE8',
  Mercury: '#B8D4F0',
  Venus: '#EAB8C8',
  Mars: '#E8B4B4',
  Saturn: '#B0B0C8',
  Uranus: '#A8DAE0',
  Neptune: '#B0BCEC',
  Pluto: '#C8B4E4',
};

// Gradient shadow (outer sphere depth)
const PLANET_GRADIENT_OUTER: Record<string, string> = {
  Sun: '#7E6330',
  Jupiter: '#7E6330',
  Ascendant: '#7E6330',
  Midheaven: '#7E6330',
  Moon: '#748098',
  Mercury: '#44849C',
  Venus: '#9C4C6C',
  Mars: '#9C4C4C',
  Saturn: '#505070',
  Uranus: '#348490',
  Neptune: '#44549C',
  Pluto: '#5E4088',
};

// Velvet indigo-violet palette for overlay/partner planets
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
  Ascendant: '#8C7CCF',
  Midheaven: '#8C7CCF',
};

const OVERLAY_GRADIENT_INNER: Record<string, string> = {
  Sun: '#C4B8F0',
  Moon: '#B8ACEC',
  Mercury: '#B0BCEC',
  Venus: '#C8B0F0',
  Mars: '#C4ACEC',
  Jupiter: '#C4B8F0',
  Saturn: '#A8A4DC',
  Uranus: '#B0C0EC',
  Neptune: '#A8B8E8',
  Pluto: '#C0AEE8',
  Ascendant: '#C4B8F0',
  Midheaven: '#C4B8F0',
};

const OVERLAY_GRADIENT_OUTER: Record<string, string> = {
  Sun: '#2E2550',
  Moon: '#28205C',
  Mercury: '#243060',
  Venus: '#38285C',
  Mars: '#3C2858',
  Jupiter: '#2E2550',
  Saturn: '#20205C',
  Uranus: '#243060',
  Neptune: '#202858',
  Pluto: '#2E2060',
  Ascendant: '#2E2550',
  Midheaven: '#2E2550',
};

// Restrained aspect colors — glow without noise
const ASPECT_LINE_COLORS: Record<string, string> = {
  Harmonious: 'rgba(110,191,139,0.28)',
  Challenging: 'rgba(224,122,122,0.28)',
  Neutral: 'rgba(194,166,90,0.32)',
};

const ASPECT_STRONG_COLORS: Record<string, string> = {
  Harmonious: 'rgba(110,191,139,0.52)',
  Challenging: 'rgba(224,122,122,0.52)',
  Neutral: 'rgba(194,166,90,0.58)',
};

// Platinum silk thread for cross/synastry aspects
const CROSS_ASPECT_COLORS: Record<string, { tight: string; loose: string }> = {
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

// Donut segment path (Skia)
function ringSegmentPath(startAngle: number, endAngle: number, outerR: number, innerR: number) {
  const path = Skia.Path.Make();

  const sOuter = polarToXY(startAngle, outerR);
  const eOuter = polarToXY(endAngle, outerR);
  const sInner = polarToXY(endAngle, innerR);
  const eInner = polarToXY(startAngle, innerR);

  // Determine large arc (Skia arcTo uses sweep angle; easiest is build with addArc)
  // We'll approximate by building an oval arc with addArc and careful sweep sign.
  const outerOval = Skia.XYWHRect(CX - outerR, CY - outerR, outerR * 2, outerR * 2);
  const innerOval = Skia.XYWHRect(CX - innerR, CY - innerR, innerR * 2, innerR * 2);

  // Convert radians to degrees; Skia uses degrees where 0° is at 3 o’clock and positive is clockwise.
  // Our polar uses 0 rad at 3 o’clock and increases CCW. We also invert y in polarToXY.
  // Map: skDeg = -rad * 180/pi
  const toSkDeg = (rad: number) => (-rad * 180) / Math.PI;

  const a0 = toSkDeg(startAngle);
  const a1 = toSkDeg(endAngle);

  // Sweep from start to end in Skia clockwise degrees
  // Compute minimal sweep consistent with our wheel direction.
  let sweep = a1 - a0;
  while (sweep > 180) sweep -= 360;
  while (sweep < -180) sweep += 360;

  path.moveTo(sOuter.x, sOuter.y);
  path.addArc(outerOval, a0, sweep);
  path.lineTo(sInner.x, sInner.y);

  // Inner arc back
  path.addArc(innerOval, a0 + sweep, -sweep);
  path.close();

  return path;
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
// Film grain (RuntimeEffect)
// ══════════════════════════════════════════════════

const makeGrainEffect = () => {
  try {
    return Skia.RuntimeEffect.Make(`
      uniform float2 uResolution;
      uniform float uTime;

      float hash(float2 p) {
        p = fract(p * float2(123.34, 345.45));
        p += dot(p, p + 34.345);
        return fract(p.x * p.y);
      }

      half4 main(float2 fragCoord) {
        float2 uv = fragCoord / uResolution;
        float n = hash(uv * uResolution + uTime * 60.0);
        float g = (n - 0.5) * 0.08;
        return half4(g, g, g, 1.0);
      }
    `);
  } catch {
    return null;
  }
};

const GRAIN_EFFECT = makeGrainEffect();

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
  const ascLongitude = getLongitude((chart as any).ascendant) ?? 0;

  // Fonts (skip text if not loaded)
  const serif14 = useFont(FONT_SERIF, 14);
  const serif12 = useFont(FONT_SERIF, 12);
  const serif10 = useFont(FONT_SERIF, 10);

  const sans11 = useFont(FONT_SANS, 11);
  const sans9 = useFont(FONT_SANS, 9);
  const sans8 = useFont(FONT_SANS, 8);

  const mono10 = useFont(FONT_MONO, 10);

  // Film grain time tick (very light)
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const loop = () => {
      const now = Date.now();
      setT(((now - start) % 100000) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

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
      color: OVERLAY_PLANET_COLORS[p.label] || '#8C7CCF',
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
      const nature = ((asp as any)?.type?.nature ?? 'Neutral') as string;
      const color = isTight
        ? ASPECT_STRONG_COLORS[nature] ?? ASPECT_STRONG_COLORS.Neutral
        : ASPECT_LINE_COLORS[nature] ?? ASPECT_LINE_COLORS.Neutral;

      lines.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        color,
        strokeWidth: isTight ? 1.2 : 0.6,
        dashed: nature !== 'Harmonious',
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

  // ── Accessibility summary (kept, but View wrapper handles it) ──
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

  // ── Background gradients ──
  const bgGradC = vec(CX, CY);

  return (
    <View style={styles.container} accessible accessibilityRole="image" accessibilityLabel={accessibilitySummary}>
      <Canvas style={{ width: SIZE, height: SIZE }}>
        {/* ── Background base: deep radial navy ── */}
        <Circle cx={CX} cy={CY} r={R_OUTER}>
          <RadialGradient
            c={bgGradC}
            r={R_OUTER}
            colors={['#0C1C2E', '#0A1626', '#0F2238']}
            positions={[0, 0.65, 1]}
          />
        </Circle>

        {/* ── Nebula vignette overlay ── */}
        <Circle cx={CX} cy={CY} r={R_OUTER} opacity={1}>
          <RadialGradient
            c={bgGradC}
            r={R_OUTER}
            colors={['rgba(61,41,82,0.18)', 'rgba(45,58,92,0.08)', 'rgba(10,22,38,0)']}
            positions={[0, 0.4, 1]}
          />
        </Circle>

        {/* ── Metal rim (Phase 3) ── */}
        <Group>
          <Circle
            cx={CX}
            cy={CY}
            r={R_OUTER - RIM_INSET}
            style="stroke"
            strokeWidth={RIM_W}
            color="rgba(194,166,90,0.20)"
          />
          <Circle cx={CX} cy={CY} r={R_OUTER - RIM_INSET} style="stroke" strokeWidth={RIM_W}>
            <SweepGradient
              c={vec(CX, CY)}
              colors={[
                'rgba(255,255,255,0.00)',
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.00)',
                'rgba(255,255,255,0.00)',
                'rgba(255,255,255,0.10)',
                'rgba(255,255,255,0.00)',
              ]}
              positions={[0.0, 0.1, 0.18, 0.55, 0.62, 1.0]}
            />
          </Circle>
        </Group>

        {/* ── Zodiac ring (12 sign segments) ── */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const startLon = i * 30;
          const endLon = (i + 1) * 30;

          const startAngle = astroToAngle(startLon, ascLongitude);
          const endAngle = astroToAngle(endLon, ascLongitude);
          const midAngle = astroToAngle(startLon + 15, ascLongitude);

          const p = ringSegmentPath(startAngle, endAngle, R_ZODIAC_OUTER, R_ZODIAC_INNER);
          const labelPos = polarToXY(midAngle, (R_ZODIAC_OUTER + R_ZODIAC_INNER) / 2);

          const elColor = ELEMENT_COLORS[sign.element];

          return (
            <Group key={sign.name}>
              <Path path={p} color={ELEMENT_BG[sign.element]} />
              {/* subtle segment stroke */}
              <Path path={p} style="stroke" strokeWidth={0.5} color="rgba(194,166,90,0.10)" />

              {/* Sign glyph */}
              {serif14 && (
                <SkiaText
                  x={labelPos.x - 6.5}
                  y={labelPos.y + 5.5}
                  text={sign.symbol}
                  font={serif14}
                  color={elColor}
                />
              )}
            </Group>
          );
        })}

        {/* ── Zodiac ring borders ── */}
        <Circle cx={CX} cy={CY} r={R_ZODIAC_OUTER} style="stroke" strokeWidth={0.8} color="rgba(194,166,90,0.18)" />
        <Circle cx={CX} cy={CY} r={R_ZODIAC_INNER} style="stroke" strokeWidth={0.6} color="rgba(194,166,90,0.14)" />

        {/* ── Frosted glass over zodiac band (Phase 3) ── */}
        <Circle
          cx={CX}
          cy={CY}
          r={(R_ZODIAC_OUTER + R_ZODIAC_INNER) / 2}
          style="stroke"
          strokeWidth={R_ZODIAC_OUTER - R_ZODIAC_INNER}
          color="rgba(255,255,255,0.07)"
        />
        <Circle
          cx={CX}
          cy={CY}
          r={(R_ZODIAC_OUTER + R_ZODIAC_INNER) / 2}
          style="stroke"
          strokeWidth={R_ZODIAC_OUTER - R_ZODIAC_INNER}
        >
          <SweepGradient
            c={vec(CX, CY)}
            colors={['rgba(255,255,255,0.00)', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0.00)']}
            positions={[0.12, 0.2, 0.28]}
          />
        </Circle>

        {/* ── Sign division lines ── */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = astroToAngle(i * 30, ascLongitude);
          const outer = polarToXY(angle, R_ZODIAC_OUTER);
          const inner = polarToXY(angle, R_ZODIAC_INNER);
          return (
            <Line
              key={`sign-div-${i}`}
              p1={vec(outer.x, outer.y)}
              p2={vec(inner.x, inner.y)}
              color="rgba(194,166,90,0.14)"
              strokeWidth={0.6}
            />
          );
        })}

        {/* ── House cusps ── */}
        {(chart.houseCusps ?? []).map((cusp: HouseCusp) => {
          const angle = astroToAngle((cusp as any).longitude, ascLongitude);
          const outer = polarToXY(angle, R_ZODIAC_INNER);
          const inner = polarToXY(angle, R_INNER);

          const isAngular = (cusp as any).house === 1 || (cusp as any).house === 4 || (cusp as any).house === 7 || (cusp as any).house === 10;
          const strokeW = isAngular ? 1.2 : 0.5;
          const strokeColor = isAngular ? 'rgba(194,166,90,0.35)' : 'rgba(255,255,255,0.07)';

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
                  color="rgba(255,255,255,0.20)"
                />
              )}
            </Group>
          );
        })}

        {/* ── Aspect lines (Phase 3: glow + crisp) ── */}
        {showAspects && aspectLines.length > 0 && (
          <>
            {/* Glow pass */}
            <Group>
              <Paint opacity={ASPECT_GLOW_ALPHA}>
                <BlurMask blur={ASPECT_GLOW_BLUR} style="normal" />
              </Paint>
              {aspectLines.map((a, i) => (
                <Line
                  key={`asp-glow-${i}`}
                  p1={vec(a.x1, a.y1)}
                  p2={vec(a.x2, a.y2)}
                  color={a.color}
                  strokeWidth={a.strokeWidth * ASPECT_GLOW_MULT}
                />
              ))}
            </Group>

            {/* Crisp pass */}
            <Group>
              {aspectLines.map((a, i) => (
                <Line
                  key={`asp-${i}`}
                  p1={vec(a.x1, a.y1)}
                  p2={vec(a.x2, a.y2)}
                  color={a.color}
                  strokeWidth={a.strokeWidth}
                >
                  {a.dashed ? <DashPathEffect intervals={[4, 3]} /> : null}
                </Line>
              ))}
            </Group>
          </>
        )}

        {/* ── Cross-chart synastry aspects (platinum silk) ── */}
        {showAspects && crossLines.length > 0 && (
          <Group>
            {crossLines.map((l, i) => (
              <Group key={`cross-${i}`}>
                {/* Diffuse glow */}
                <Line
                  p1={vec(l.x1, l.y1)}
                  p2={vec(l.x2, l.y2)}
                  color="rgba(159,168,184,1)"
                  strokeWidth={l.tight ? 2.0 : 1.5}
                  opacity={0.08}
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

        {/* ── House ring border ── */}
        <Circle cx={CX} cy={CY} r={R_HOUSE_OUTER} style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.05)" />

        {/* ── Natal planet glyphs (Phase 3: spheres + highlight) ── */}
        {placedPlanets.map((planet) => {
          const glyphPos = polarToXY(planet.displayAngle, R_PLANET_RING);
          const tickOuter = polarToXY(planet.originalAngle, R_ZODIAC_INNER - 1);
          const tickInner = polarToXY(planet.originalAngle, R_PLANET_RING + 10);

          const baseColor = PLANET_COLORS[planet.label] || '#C2A65A';
          const innerColor = PLANET_GRADIENT_INNER[planet.label] || baseColor;
          const outerColor = PLANET_GRADIENT_OUTER[planet.label] || baseColor;

          const glyph = planet.symbol;
          const glyphFont = glyph.length > 1 ? sans8 : serif12;
          const glyphOffsetX = glyph.length > 1 ? 5.0 : 4.5; // approximate centering
          const glyphOffsetY = glyph.length > 1 ? 3.0 : 4.0;

          return (
            <Group key={`p-${planet.label}`}>
              {/* Position tick */}
              <Line
                p1={vec(tickOuter.x, tickOuter.y)}
                p2={vec(tickInner.x, tickInner.y)}
                color={baseColor}
                strokeWidth={0.8}
                opacity={0.45}
              />

              {/* Glow halo */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={15} color={baseColor} opacity={0.10} />
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={12} color={baseColor} opacity={0.06} />

              {/* Sphere */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R} style="stroke" strokeWidth={0.8} color={baseColor} opacity={0.95} />
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R}>
                <RadialGradient
                  c={vec(glyphPos.x - PLANET_R * 0.35, glyphPos.y - PLANET_R * 0.45)}
                  r={PLANET_R * 1.2}
                  colors={[innerColor, outerColor]}
                />
              </Circle>

              {/* Specular catch-light */}
              <Circle
                cx={glyphPos.x - PLANET_R * 0.38}
                cy={glyphPos.y - PLANET_R * 0.42}
                r={HILITE_R}
                color="rgba(255,255,255,0.28)"
              />

              {/* Glyph */}
              {glyphFont && (
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

        {/* ── Overlay planets (Phase 3: velvet spheres, lower hierarchy) ── */}
        {placedOverlayPlanets.map((planet) => {
          const glyphPos = polarToXY(planet.displayAngle, R_OVERLAY_RING);
          const tickOuter = polarToXY(planet.originalAngle, R_ZODIAC_INNER - 1);
          const tickInner = polarToXY(planet.originalAngle, R_OVERLAY_RING + 10);

          const baseColor = planet.color;
          const innerColor = OVERLAY_GRADIENT_INNER[planet.label] || baseColor;
          const outerColor = OVERLAY_GRADIENT_OUTER[planet.label] || baseColor;

          const glyph = planet.symbol;
          const glyphFont = glyph.length > 1 ? sans8 : serif10;
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
                opacity={0.35}
              >
                <DashPathEffect intervals={[2, 2]} />
              </Line>

              {/* Glow halo */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={13} color={baseColor} opacity={0.07} />
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={10} color={baseColor} opacity={0.05} />

              {/* Sphere (dashed border) */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={9} style="stroke" strokeWidth={1.2} color={baseColor} opacity={0.88}>
                <DashPathEffect intervals={[3, 2]} />
              </Circle>
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={9}>
                <RadialGradient
                  c={vec(glyphPos.x - 9 * 0.35, glyphPos.y - 9 * 0.45)}
                  r={9 * 1.2}
                  colors={[innerColor, outerColor]}
                />
              </Circle>

              {/* Specular catch-light */}
              <Circle cx={glyphPos.x - 9 * 0.38} cy={glyphPos.y - 9 * 0.42} r={1.9} color="rgba(255,255,255,0.20)" />

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
            const pos = polarToXY(ang, R_ZODIAC_INNER - 12);
            return sans8 ? <SkiaText x={pos.x - 7} y={pos.y + 3} text="ASC" font={sans8} color={theme.primary} /> : null;
          })()}

        {(chart as any).midheaven &&
          (() => {
            const lon = getLongitude((chart as any).midheaven);
            if (lon === null) return null;
            const ang = astroToAngle(lon, ascLongitude);
            const pos = polarToXY(ang, R_ZODIAC_INNER - 12);
            return sans8 ? <SkiaText x={pos.x - 6} y={pos.y + 3} text="MC" font={sans8} color={theme.primary} /> : null;
          })()}

        {/* ── Center hub — watch-face core ── */}
        <Circle cx={CX} cy={CY} r={R_INNER + 18} opacity={1}>
          <RadialGradient
            c={vec(CX, CY)}
            r={R_INNER + 18}
            colors={['rgba(194,166,90,0.10)', 'rgba(194,166,90,0.04)', 'rgba(194,166,90,0.00)']}
            positions={[0, 0.55, 1]}
          />
        </Circle>

        {/* Navy shadow halo */}
        <Circle cx={CX} cy={CY} r={R_INNER + 4} style="stroke" strokeWidth={6} color="rgba(10,22,38,0.60)" />

        {/* Glass face */}
        <Circle cx={CX} cy={CY} r={R_INNER}>
          <RadialGradient c={vec(CX - 8, CY - 10)} r={R_INNER * 1.6} colors={['#1A3050', '#080F1A']} positions={[0, 1]} />
        </Circle>

        {/* Metallic ring */}
        <Circle cx={CX} cy={CY} r={R_INNER + 0.5} style="stroke" strokeWidth={1.2} color="#3A4A63" opacity={0.7} />
        {/* Champagne rim highlight */}
        <Circle cx={CX} cy={CY} r={R_INNER} style="stroke" strokeWidth={0.7} color="rgba(194,166,90,0.22)" />
        {/* Inner shadow */}
        <Circle cx={CX} cy={CY} r={R_INNER - 2} style="stroke" strokeWidth={1.5} color="rgba(0,0,0,0.20)" />

        {/* ── Synastry label inside center hub ── */}
        {overlayChart && overlayName && (
          <Group>
            {sans8 && (
              <SkiaText
                x={CX - 26}
                y={CY - 6}
                text="SYNASTRY"
                font={sans8}
                color="rgba(255,255,255,0.60)"
              />
            )}
            {serif10 && (
              <SkiaText
                x={CX - 20}
                y={CY + 10}
                text={overlayName.length > 9 ? overlayName.slice(0, 9) + '…' : overlayName}
                font={serif10}
                color="rgba(194,166,90,0.80)"
              />
            )}
          </Group>
        )}

        {/* ── Film grain overlay (Phase 3, Skia RuntimeShader) ── */}
        {GRAIN_EFFECT && (
          <Rect x={0} y={0} width={SIZE} height={SIZE} opacity={GRAIN_OPACITY}>
            <Paint>
              <RuntimeShader source={GRAIN_EFFECT} uniforms={{ uResolution: [SIZE, SIZE], uTime: t }} />
            </Paint>
          </Rect>
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
