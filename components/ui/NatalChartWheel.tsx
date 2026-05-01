// components/ui/NatalChartWheelSkia.tsx
// MySky — The Skia Chart Engine
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Linked Skia palette to global theme tokens for perfect synchronization.
// 2. Implemented "Machined Bezel" logic with high-contrast metallic gradients.
// 3. Tightened specularity on the glass spheres and center hub.
// 4. Unified the "Atmosphere Blue" outer rings with the global theme.

import React, { memo, useMemo, useState, useEffect } from 'react';
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
  vec,
  BlurMask,
  Path,
  Skia,
} from '@shopify/react-native-skia';

import { NatalChart, Aspect, HouseCusp } from '../../services/astrology/types';
import { AstrologySettingsService, ChartOrientation } from '../../services/astrology/astrologySettingsService';
import {
  ChartWheelAngleOptions,
  normalizeChartOrientation,
  zodiacLongitudeToWheelAngleRadians,
} from '../../services/astrology/chartWheelMath';
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

// ── Configuration ────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIZE = Math.min(SCREEN_WIDTH - 90, 310);
const SIZE_CANVAS = SIZE + 100;
const CX = SIZE_CANVAS / 2;
const CY = SIZE_CANVAS / 2;

const R_OUTER = SIZE / 2 - 4;
const R_HOUSE_OUTER = R_OUTER;
const R_HOUSE_INNER = R_OUTER - 28;
const R_PLANET_RING = R_OUTER - 20;
const R_INNER = 42;
const R_ASPECT_RING = R_INNER + 22;

const R_DOT_RING_1 = R_PLANET_RING - 18;
const R_DOT_RING_2 = R_ASPECT_RING + 10;
const PLANET_R = 12.5;

function makeArcPath(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number): ReturnType<typeof Skia.Path.Make> {
  const path = Skia.Path.Make();
  const rect = { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
  path.addArc(rect, startDeg, sweepDeg);
  return path;
}

const MAX_ASPECTS = 100;
const MAX_CROSS_ASPECTS = 100;

const SERIF_FAMILY = Platform.select({ ios: 'Georgia', default: 'serif' })!;
const SANS_FAMILY = Platform.select({ ios: 'Helvetica Neue', default: 'sans-serif' })!;
const ZODIAC_FAMILY = Platform.select({ ios: 'Apple Symbols', default: 'sans-serif' })!;

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
  Ceres: '⚳',
  Pallas: '⚴',
  Juno: '⚵',
  Vesta: '⚶',
  Vertex: '✶',
  'Part of Fortune': '⊗',
  Pholus: '⯰',
  Ascendant: 'AC',
  Midheaven: 'MC',
};

const INNER_POINT_LABELS = new Set(['Vertex', 'Part of Fortune']);
const MAJOR_BODY_LABELS = new Set(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']);
const VECTOR_GLYPH_LABELS = new Set([
  'Chiron',
  'Lilith',
  'Ceres',
  'Pallas',
  'Juno',
  'Vesta',
  'Vertex',
  'Part of Fortune',
  'Pholus',
]);

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D4AF37', Moon: '#A2C2E1', Mercury: '#86BCEC', Venus: '#D4A3B3', Mars: '#DC5050', Jupiter: '#D4AF37', Saturn: '#8484A0',
  Uranus: '#6CBEC4', Neptune: '#7C8CD0', Pluto: '#A88BEB', 'North Node': '#A0A0B0', 'South Node': '#A0A0B0', Chiron: '#6EBF8B', Lilith: '#C9AE78',
  Ceres: '#8BBF9F', Pallas: '#8DA8D8', Juno: '#D4A3B3', Vesta: '#E0B36D', Pholus: '#B9A0E8', Ascendant: '#D4AF37', Midheaven: '#D4AF37',
};

const CROSS_ASPECT_COLORS: Record<string, { tight: string; loose: string }> = {
  Harmonious: { tight: 'rgba(162,194,225,0.40)', loose: 'rgba(162,194,225,0.20)' },
  Challenging: { tight: 'rgba(212,163,179,0.40)', loose: 'rgba(212,163,179,0.20)' },
  Neutral: { tight: 'rgba(212,175,55,0.40)', loose: 'rgba(212,175,55,0.20)' },
};

// ── Math Helpers ─────────────────────────────────────────────────────────────

function astroToAngle(longitude: number, options: ChartWheelAngleOptions): number {
  return zodiacLongitudeToWheelAngleRadians(longitude, options);
}

function polarToXY(angle: number, radius: number): { x: number; y: number } {
  return { x: CX + radius * Math.cos(angle), y: CY - radius * Math.sin(angle) };
}

function normalize360(deg: number): number { const x = deg % 360; return x < 0 ? x + 360 : x; }

function normalizeRadians(rad: number): number {
  const full = Math.PI * 2;
  const x = rad % full;
  return x < 0 ? x + full : x;
}

function radiansApart(a: number, b: number): number {
  let d = Math.abs(a - b) % (Math.PI * 2);
  if (d > Math.PI) d = Math.PI * 2 - d;
  return d;
}

function makeGlyphPath(draw: (path: ReturnType<typeof Skia.Path.Make>) => void): ReturnType<typeof Skia.Path.Make> {
  const path = Skia.Path.Make();
  draw(path);
  return path;
}

function renderVectorGlyph(label: string, x: number, y: number, size: number, color: string): React.ReactNode {
  if (!VECTOR_GLYPH_LABELS.has(label)) return null;

  const s = size / 24;
  const stroke = Math.max(0.85, 1.35 * s);
  const cx = x;
  const cy = y;

  if (label === 'Chiron') {
    const path = makeGlyphPath((p) => {
      p.addCircle(cx, cy - 6 * s, 2.6 * s);
      p.moveTo(cx, cy - 3.5 * s);
      p.lineTo(cx, cy + 8 * s);
      p.moveTo(cx, cy + 1 * s);
      p.lineTo(cx + 6 * s, cy - 5 * s);
      p.moveTo(cx, cy + 1 * s);
      p.lineTo(cx + 6 * s, cy + 7 * s);
    });
    return <Path path={path} style="stroke" strokeWidth={stroke} color={color} strokeCap="round" strokeJoin="round" />;
  }

  if (label === 'Lilith') {
    const crescent = makeGlyphPath((p) => {
      p.addArc({ x: cx - 5 * s, y: cy - 10 * s, width: 10 * s, height: 10 * s }, 115, 250);
    });
    const stem = makeGlyphPath((p) => {
      p.moveTo(cx, cy - 1 * s);
      p.lineTo(cx, cy + 8 * s);
      p.moveTo(cx - 5 * s, cy + 4 * s);
      p.lineTo(cx + 5 * s, cy + 4 * s);
    });
    return (
      <Group>
        <Path path={crescent} style="stroke" strokeWidth={stroke} color={color} strokeCap="round" />
        <Path path={stem} style="stroke" strokeWidth={stroke} color={color} strokeCap="round" />
      </Group>
    );
  }

  if (label === 'Ceres') {
    const path = makeGlyphPath((p) => {
      p.addArc({ x: cx - 7 * s, y: cy - 9 * s, width: 14 * s, height: 14 * s }, 70, 250);
      p.moveTo(cx, cy + 3 * s);
      p.lineTo(cx, cy + 9 * s);
      p.moveTo(cx - 4 * s, cy + 6 * s);
      p.lineTo(cx + 4 * s, cy + 6 * s);
    });
    return <Path path={path} style="stroke" strokeWidth={stroke} color={color} strokeCap="round" />;
  }

  if (label === 'Pallas') {
    const path = makeGlyphPath((p) => {
      p.moveTo(cx, cy - 9 * s);
      p.lineTo(cx + 6 * s, cy - 3 * s);
      p.lineTo(cx, cy + 3 * s);
      p.lineTo(cx - 6 * s, cy - 3 * s);
      p.close();
      p.moveTo(cx, cy + 3 * s);
      p.lineTo(cx, cy + 9 * s);
      p.moveTo(cx - 5 * s, cy + 6 * s);
      p.lineTo(cx + 5 * s, cy + 6 * s);
    });
    return <Path path={path} style="stroke" strokeWidth={stroke} color={color} strokeCap="round" strokeJoin="round" />;
  }

  if (label === 'Juno') {
    const path = makeGlyphPath((p) => {
      p.moveTo(cx, cy - 9 * s);
      p.lineTo(cx, cy + 9 * s);
      p.moveTo(cx - 5 * s, cy - 4 * s);
      p.lineTo(cx + 5 * s, cy - 4 * s);
      p.moveTo(cx - 4 * s, cy - 8 * s);
      p.lineTo(cx + 4 * s, cy);
      p.moveTo(cx + 4 * s, cy - 8 * s);
      p.lineTo(cx - 4 * s, cy);
    });
    return <Path path={path} style="stroke" strokeWidth={stroke} color={color} strokeCap="round" />;
  }

  if (label === 'Vesta') {
    const path = makeGlyphPath((p) => {
      p.moveTo(cx - 6 * s, cy - 6 * s);
      p.lineTo(cx, cy - 10 * s);
      p.lineTo(cx + 6 * s, cy - 6 * s);
      p.lineTo(cx + 3 * s, cy - 1 * s);
      p.lineTo(cx, cy - 4 * s);
      p.lineTo(cx - 3 * s, cy - 1 * s);
      p.close();
      p.moveTo(cx, cy - 1 * s);
      p.lineTo(cx, cy + 9 * s);
      p.moveTo(cx - 5 * s, cy + 5 * s);
      p.lineTo(cx + 5 * s, cy + 5 * s);
    });
    return <Path path={path} style="stroke" strokeWidth={stroke} color={color} strokeCap="round" strokeJoin="round" />;
  }

  if (label === 'Vertex') {
    const path = makeGlyphPath((p) => {
      for (let i = 0; i < 6; i++) {
        const angle = (-Math.PI / 2) + i * (Math.PI / 3);
        p.moveTo(cx, cy);
        p.lineTo(cx + Math.cos(angle) * 8 * s, cy + Math.sin(angle) * 8 * s);
      }
    });
    return <Path path={path} style="stroke" strokeWidth={stroke} color={color} strokeCap="round" strokeJoin="round" />;
  }

  if (label === 'Part of Fortune') {
    const path = makeGlyphPath((p) => {
      p.addCircle(cx, cy, 7 * s);
      p.moveTo(cx - 4.5 * s, cy - 4.5 * s);
      p.lineTo(cx + 4.5 * s, cy + 4.5 * s);
      p.moveTo(cx + 4.5 * s, cy - 4.5 * s);
      p.lineTo(cx - 4.5 * s, cy + 4.5 * s);
    });
    return <Path path={path} style="stroke" strokeWidth={stroke} color={color} strokeCap="round" />;
  }

  if (label === 'Pholus') {
    const path = makeGlyphPath((p) => {
      p.moveTo(cx - 7 * s, cy + 7 * s);
      p.lineTo(cx + 7 * s, cy - 7 * s);
    });
    return (
      <Group>
        <Path path={path} style="stroke" strokeWidth={stroke} color={color} strokeCap="round" />
        <Circle cx={cx - 5 * s} cy={cy + 5 * s} r={2.1 * s} color={color} />
      </Group>
    );
  }

  return null;
}

function getLongitude(obj: any): number | null {
  if (!obj) return null;
  const candidates = [obj.longitude, obj.absoluteDegree, obj.absoluteDegrees, obj.absDegree, obj.ChartPosition?.Ecliptic?.DecimalDegrees, obj.chartPosition?.ecliptic?.decimal];
  for (const v of candidates) { if (typeof v === 'number' && Number.isFinite(v)) return normalize360(v); }
  return null;
}

function getRetrograde(obj: any): boolean {
  if (!obj) return false;
  return !!(obj.isRetrograde ?? obj.retrograde ?? obj.is_retrograde ?? obj.Retrograde ?? obj?.ChartPosition?.Retrograde ?? obj?.chartPosition?.retrograde);
}

function normalizePlanetName(name: unknown): string {
  const s = String(name ?? '').trim(); if (!s) return ''; const low = s.toLowerCase();
  if (low === 'asc' || low.includes('ascendant') || low.includes('rising')) return 'Ascendant';
  if (low === 'mc' || low.includes('midheaven')) return 'Midheaven';
  if (low === 'sun') return 'Sun'; if (low === 'moon') return 'Moon'; if (low === 'mercury') return 'Mercury';
  if (low === 'venus') return 'Venus'; if (low === 'mars') return 'Mars'; if (low === 'jupiter') return 'Jupiter';
  if (low === 'saturn') return 'Saturn'; if (low === 'uranus') return 'Uranus'; if (low === 'neptune') return 'Neptune';
  if (low === 'pluto') return 'Pluto'; if (low === 'chiron') return 'Chiron';
  if (low === 'north node' || low === 'northnode' || low === 'true node') return 'North Node';
  if (low === 'south node' || low === 'southnode') return 'South Node';
  if (low === 'lilith' || low === 'black moon lilith' || low === 'mean lilith') return 'Lilith';
  if (low === 'ceres') return 'Ceres'; if (low === 'pallas') return 'Pallas';
  if (low === 'juno') return 'Juno'; if (low === 'vesta') return 'Vesta';
  if (low === 'pholus') return 'Pholus'; if (low === 'vertex') return 'Vertex';
  if (low === 'part of fortune' || low === 'partoffortune') return 'Part of Fortune';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getChartPlanet(chart: NatalChart, name: string): any | null {
  const direct = (chart as any)[name.toLowerCase()] ?? (chart as any)[name]; if (direct) return direct;
  if (name === 'Part of Fortune' && (chart as any).partOfFortune) return (chart as any).partOfFortune;
  if (name === 'Vertex' && Array.isArray((chart as any).angles)) { const found = (chart as any).angles.find((a: any) => a?.name === 'Vertex'); if (found) return found; }
  const list = (chart as any).planets;
  if (Array.isArray(list)) { const found = list.find((p: any) => normalizePlanetName(p?.planet ?? p?.name ?? p?.key) === name); return found ?? null; }
  const placements = (chart as any).placements;
  if (Array.isArray(placements)) { const found = placements.find((p: any) => normalizePlanetName(p?.planet?.name ?? p?.name ?? p?.key) === name); return found ?? null; }
  return null;
}

interface PlacedPlanet { label: string; symbol: string; color: string; originalAngle: number; displayAngle: number; radialOffset: number; longitude: number; isRetrograde: boolean; }

function spreadPlanets(planets: { label: string; longitude: number; isRetrograde: boolean }[], wheelOptions: ChartWheelAngleOptions, minSeparationDeg: number = 8, radialStepPx: number = 18, _baseRadius: number = R_PLANET_RING, fallbackColor: string = '#FFFFFF'): PlacedPlanet[] {
  const items: PlacedPlanet[] = planets.map((p) => {
    const angle = astroToAngle(p.longitude, wheelOptions);
    return { label: p.label, symbol: PLANET_SYMBOLS[p.label] || '?', color: PLANET_COLORS[p.label] || fallbackColor, originalAngle: angle, displayAngle: angle, radialOffset: 0, longitude: p.longitude, isRetrograde: p.isRetrograde };
  });
  items.sort((a, b) => a.originalAngle - b.originalAngle);
  const minSepRad = (minSeparationDeg * Math.PI) / 180;
  const circularGap = (a: number, b: number): number => { let d = Math.abs(a - b) % (2 * Math.PI); if (d > Math.PI) d = 2 * Math.PI - d; return d; };
  const clusters: PlacedPlanet[][] = []; let currentCluster: PlacedPlanet[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (currentCluster.length === 0) { currentCluster.push(item); continue; }
    const prev = items[i - 1]; const gap = circularGap(item.originalAngle, prev.originalAngle);
    if (gap <= minSepRad) { currentCluster.push(item); } else { clusters.push(currentCluster); currentCluster = [item]; }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);
  if (clusters.length > 1) {
    const firstItem = clusters[0][0]; const lastItem = clusters[clusters.length - 1][clusters[clusters.length - 1].length - 1];
    if (circularGap(firstItem.originalAngle, lastItem.originalAngle) <= minSepRad) { clusters[0] = [...clusters[clusters.length - 1], ...clusters[0]]; clusters.pop(); }
  }
  for (const cluster of clusters) {
    if (cluster.length <= 1) continue;
    const laneCount = cluster.length <= 2 ? 2 : cluster.length <= 5 ? 3 : 4;
    const angleStep = Math.min(minSepRad * 0.38, (6 * Math.PI) / 180);
    const centerIndex = (cluster.length - 1) / 2;

    for (let i = 0; i < cluster.length; i++) {
      const lane = i % laneCount;
      const extraCycle = Math.floor(i / laneCount);
      cluster[i].displayAngle = normalizeRadians(cluster[i].originalAngle + (i - centerIndex) * angleStep);
      cluster[i].radialOffset = lane * radialStepPx + extraCycle * radialStepPx * 0.45;
    }
  }
  return items;
}

// ── Main Component ───────────────────────────────────────────────────────────

interface Props { chart: NatalChart; showAspects?: boolean; overlayChart?: NatalChart; overlayName?: string; filterMode?: { person1: boolean; person2: boolean; cross: boolean }; orientation?: ChartOrientation; }

function NatalChartWheel({ chart, showAspects = true, overlayChart, overlayName, filterMode, orientation: orientationProp }: Props) {
  const theme = useAppTheme();
  
  const {
    slateMid = theme.background,
    slateDeep = theme.background,
    goldLight = '#F9DF9F',
    goldDark = '#936B16',
    textInk = theme.isDark ? '#FFFFFF' : '#1A1815'
  } = theme as any;

  const styles = useThemedStyles(createStyles);
  const rawAscLongitude = getLongitude((chart as any).ascendant) ?? 0;
  
  const wheelPalette = useMemo(() => {
    return {
      rimGlow: 'rgba(246, 236, 205, 0.16)',
      divider: 'rgba(255, 255, 255, 0.08)',
      zodiacInk: 'rgba(255, 252, 244, 0.80)',
      houseInk: 'rgba(255, 248, 232, 0.52)',
      angularLine: 'rgba(232, 209, 154, 0.32)',
      regularLine: 'rgba(255, 255, 255, 0.09)',
      ringStroke: [
        'rgba(255, 255, 255, 0.05)',
        'rgba(255, 255, 255, 0.85)',
        'rgba(255, 255, 255, 0.05)',
        'rgba(255, 255, 255, 0.65)',
        'rgba(255, 255, 255, 0.05)',
      ],
      specularSoft: 'rgba(255,248,232,0.22)',
      specularMuted: 'rgba(255,246,224,0.12)',
      specularStrong: 'rgba(255,252,242,0.48)',
      specularPeak: 'rgba(255,255,250,0.72)',
      bounce: 'rgba(236,214,156,0.14)',
      dottedRing: [
        'rgba(214,224,242,0.04)',
        'rgba(224,232,248,0.40)',
        'rgba(214,224,242,0.05)',
        'rgba(224,232,248,0.28)',
        'rgba(214,224,242,0.04)',
      ],
      pointText: '#FFFFFF',
      glyphText: '#0A0A0F',
      angleLabel: 'rgba(255,255,255,0.85)',
      centerHalo: ['rgba(162, 194, 225, 0.10)', 'rgba(162, 194, 225, 0.04)', 'transparent'],
      centerHaloStroke: theme.background,
      centerFill: [slateMid, slateDeep, slateDeep],
      centerSparkle: 'rgba(255,255,255,0.35)',
      centerRing: [
        'rgba(212, 175, 55, 0.15)',
        'rgba(255, 255, 255, 0.95)',
        'rgba(212, 175, 55, 0.15)',
        'rgba(255, 255, 255, 0.55)',
        'rgba(212, 175, 55, 0.15)',
      ],
      synastryLabel: 'rgba(255,255,255,0.45)',
      synastryName: '#E8D6AE',
      aspectColor: (alpha: number) => `rgba(212, 175, 55, ${alpha})`,
      aspectGlow: (alpha: number) => `rgba(244, 235, 208, ${alpha})`,
    };
  }, [slateDeep, slateMid, theme.background]);

  const [settingsOrientation, setSettingsOrientation] = useState<ChartOrientation>('standard-natal');
  useEffect(() => {
    let mounted = true;

    AstrologySettingsService.getSettings().then((s) => {
      if (mounted) setSettingsOrientation(s.chartOrientation);
    }).catch(() => {});

    const unsubscribe = AstrologySettingsService.subscribe((settings) => {
      if (mounted) setSettingsOrientation(settings.chartOrientation);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const orientation = orientationProp ?? settingsOrientation;

  const wheelOptions = useMemo<ChartWheelAngleOptions>(() => ({
    orientation: normalizeChartOrientation(orientation),
    ascendantLongitude: rawAscLongitude,
    midheavenLongitude: getLongitude(getChartPlanet(chart, 'Midheaven')),
  }), [orientation, rawAscLongitude, chart]);

  const showPerson1 = !filterMode || filterMode.person1;
  const showPerson2 = !filterMode || filterMode.person2;
  const showCross = !filterMode || filterMode.cross;

  const serif16 = useMemo(() => matchFont({ fontFamily: SERIF_FAMILY, fontSize: 16, fontWeight: '600' }), []);
  const serif14 = useMemo(() => matchFont({ fontFamily: SERIF_FAMILY, fontSize: 14, fontWeight: '600' }), []);
  const serif12 = useMemo(() => matchFont({ fontFamily: SERIF_FAMILY, fontSize: 12, fontWeight: '600' }), []);
  const sans10 = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 10, fontWeight: '600' }), []);
  const sans9 = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 9, fontWeight: '600' }), []);
  const sans8 = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 8, fontWeight: '600' }), []);
  const zodiac24 = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 24, fontWeight: '400' }), []);
  const sans9Heavy = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 9, fontWeight: '900' }), []);
  const zodiacMain = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 22, fontWeight: '900' }), []);
  const zodiacOverlay = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 16, fontWeight: '900' }), []);
  
  const placedPlanets = useMemo(() => {
    const labels = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron', 'North Node', 'South Node', 'Lilith', 'Ceres', 'Pallas', 'Juno', 'Vesta', 'Vertex', 'Part of Fortune', 'Pholus'];
    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [];
    for (const label of labels) {
      const obj = getChartPlanet(chart, label); const lon = getLongitude(obj);
      if (lon === null) continue; raw.push({ label, longitude: lon, isRetrograde: getRetrograde(obj) });
    }
    return spreadPlanets(raw, wheelOptions, 18, 20, R_PLANET_RING, theme.textPrimary);
  }, [chart, wheelOptions, theme.textPrimary]);

  const planetDisplayAngles = useMemo(() => {
    const map: Record<string, number> = {};
    placedPlanets.forEach((p) => { map[p.label] = p.displayAngle; });
    const asc = getLongitude(getChartPlanet(chart, 'Ascendant')); if (asc !== null) map['Ascendant'] = astroToAngle(asc, wheelOptions);
    const mc = getLongitude(getChartPlanet(chart, 'Midheaven')); if (mc !== null) map['Midheaven'] = astroToAngle(mc, wheelOptions);
    return map;
  }, [placedPlanets, chart, wheelOptions]);

  const R_OVERLAY_RING = R_PLANET_RING - 30;
  const placedOverlayPlanets = useMemo(() => {
    if (!overlayChart) return [];
    const labels = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron', 'North Node', 'South Node'];
    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [];
    for (const label of labels) {
      const obj = getChartPlanet(overlayChart, label); const lon = getLongitude(obj);
      if (lon === null) continue; raw.push({ label, longitude: lon, isRetrograde: getRetrograde(obj) });
    }
    const placed = spreadPlanets(raw, wheelOptions, 16, 14, R_OVERLAY_RING, theme.textPrimary);
    return placed.map((p) => ({ ...p, color: '#E5E7EB' }));
  }, [overlayChart, wheelOptions, R_OVERLAY_RING, theme.textPrimary]);

  const crossAspects = useMemo(() => {
    if (!overlayChart || !showAspects) return [];
    const ASPECT_ORBS = [{ angle: 0, orb: 8, nature: 'Neutral' }, { angle: 180, orb: 8, nature: 'Challenging' }, { angle: 120, orb: 6, nature: 'Harmonious' }, { angle: 90, orb: 6, nature: 'Challenging' }, { angle: 60, orb: 4, nature: 'Harmonious' }];
    const results: { lon1: number; lon2: number; nature: string; orb: number }[] = [];
    for (const pp of placedPlanets) {
      for (const op of placedOverlayPlanets) {
        for (const asp of ASPECT_ORBS) {
          let diff = Math.abs(pp.longitude - op.longitude); if (diff > 180) diff = 360 - diff;
          const orbVal = Math.abs(diff - asp.angle);
          if (orbVal <= asp.orb) { results.push({ lon1: pp.longitude, lon2: op.longitude, nature: asp.nature, orb: orbVal }); break; }
        }
      }
    }
    return results.sort((a, b) => a.orb - b.orb).slice(0, MAX_CROSS_ASPECTS);
  }, [placedPlanets, placedOverlayPlanets, overlayChart, showAspects]);

  const visibleAspects = useMemo(() => {
    if (!showAspects) return [];
    // Conjunctions are excluded because they create messy short chords around the chart hub
    return (chart.aspects ?? []).filter((a: Aspect) => {
      const typeName = ((a as any)?.type?.name ?? '').toLowerCase();
      return typeName !== 'conjunction';
    }).sort((a: Aspect, b: Aspect) => (a.orb ?? 99) - (b.orb ?? 99)).slice(0, MAX_ASPECTS);
  }, [chart.aspects, showAspects]);

  const aspectLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string; glowColor: string; strokeWidth: number; dashed: boolean; }[] = [];
      for (const asp of visibleAspects) {
        const p1Name = normalizePlanetName((asp as any)?.planet1?.name); const p2Name = normalizePlanetName((asp as any)?.planet2?.name);
        const angle1 = planetDisplayAngles[p1Name]; const angle2 = planetDisplayAngles[p2Name];
        if (angle1 === undefined || angle2 === undefined) continue;
        const p1 = polarToXY(angle1, R_ASPECT_RING); const p2 = polarToXY(angle2, R_ASPECT_RING);
        const orb = asp.orb ?? 99; const typeName = ((asp as any)?.type?.name ?? '').toLowerCase();
        let topAlpha = 0.15; let glowAlpha = 0.05;
        if (orb < 3) { topAlpha = 0.25; glowAlpha = 0.10; } else if (orb >= 6) { topAlpha = 0.08; glowAlpha = 0.03; }
        
        let aspectRgb = '212, 175, 55'; // Neutral/Gold
        if (['trine', 'sextile', 'semisextile', 'quintile', 'biquintile'].includes(typeName)) aspectRgb = '162, 194, 225'; // Harmonious (Blue)
        if (['square', 'opposition', 'quincunx', 'semisquare', 'sesquiquadrate'].includes(typeName)) aspectRgb = '220, 80, 80'; // Challenging (Red)
        
        lines.push({ 
          x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, 
          color: `rgba(${aspectRgb}, ${topAlpha})`, 
          glowColor: `rgba(${aspectRgb}, ${glowAlpha})`, 
          strokeWidth: 0.8, 
          dashed: ['square', 'opposition', 'quincunx', 'semisquare', 'sesquiquadrate'].includes(typeName)
        });
      }
      return lines;
    }, [visibleAspects, planetDisplayAngles]);
    
  const crossLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; thread: string; tight: boolean; }[] = [];
    
    // Instead of using original longitude and strictly calculating, use the display angles if they are available
    const getDispAngle1 = (lon: number) => {
        const p = placedPlanets.find(x => x.longitude === lon);
        return p ? p.displayAngle : astroToAngle(lon, wheelOptions);
    };
    const getDispAngle2 = (lon: number) => {
        const p = placedOverlayPlanets.find(x => x.longitude === lon);
        return p ? p.displayAngle : astroToAngle(lon, wheelOptions);
    };

    for (const ca of crossAspects) {
      const angle1 = getDispAngle1(ca.lon1); const angle2 = getDispAngle2(ca.lon2);
      const p1 = polarToXY(angle1, R_ASPECT_RING); const p2 = polarToXY(angle2, R_ASPECT_RING);
      const tight = ca.orb < 3; const colors = CROSS_ASPECT_COLORS[ca.nature] ?? CROSS_ASPECT_COLORS.Neutral;
      lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, thread: tight ? colors.tight : colors.loose, tight });
    }
    return lines;
  }, [crossAspects, wheelOptions, placedPlanets, placedOverlayPlanets]);

  const accessibilitySummary = useMemo(() => {
    const parts: string[] = ['Natal chart wheel'];
    for (const label of ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars']) {
      const obj = getChartPlanet(chart, label); const sign = (obj as any)?.sign?.name ?? (obj as any)?.Sign?.label;
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
          <Circle cx={CX} cy={CY} r={R_OUTER + 44} style="stroke" strokeWidth={2.2} color={wheelPalette.rimGlow}>
            <BlurMask blur={2.4} style="normal" />
          </Circle>
          <Circle cx={CX} cy={CY} r={R_OUTER + 45} style="stroke" strokeWidth={0.85} opacity={0.98}>
            <SweepGradient c={vec(CX, CY)} colors={['rgba(255,247,226,0.92)', 'rgba(255,255,250,0.98)', goldLight, 'rgba(233,214,169,0.92)', slateDeep, goldDark, 'rgba(255,249,235,0.95)', textInk, 'rgba(255,255,248,0.96)', 'rgba(255,247,226,0.92)']} positions={[0.0, 0.08, 0.18, 0.30, 0.44, 0.56, 0.72, 0.86, 0.94, 1.0]} transform={[{ rotate: -0.1 }]} />
          </Circle>
          <Circle cx={CX} cy={CY} r={R_OUTER + 43} style="stroke" strokeWidth={0.7} opacity={0.84}>
            <SweepGradient c={vec(CX, CY)} colors={['rgba(126,96,34,0.90)', 'rgba(244,226,183,0.92)', 'rgba(255,249,235,0.90)', slateDeep, 'rgba(223,197,139,0.86)', 'rgba(255,246,220,0.88)', 'rgba(121,91,30,0.86)', textInk, 'rgba(245,229,190,0.88)', 'rgba(126,96,34,0.90)']} positions={[0.0, 0.10, 0.22, 0.38, 0.52, 0.64, 0.78, 0.88, 0.95, 1.0]} transform={[{ rotate: 0.15 }]} />
          </Circle>

          {/* ── Precision Degree Astrolabe Ticks ── */}
          {Array.from({ length: 72 }).map((_, i) => {
            const angle = astroToAngle(i * 5, wheelOptions);
            const isTen = i % 2 === 0;
            const pOuter = polarToXY(angle, R_OUTER + 44);
            const pInner = polarToXY(angle, isTen ? R_OUTER + 38 : R_OUTER + 40);
            return (
              <Line key={`dtick-${i}`} p1={vec(pOuter.x, pOuter.y)} p2={vec(pInner.x, pInner.y)} color={isTen ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.15)"} strokeWidth={isTen ? 0.7 : 0.4} />
            );
          })}
        </Group>

        {/* ── Main Rim: Double Bezel Ring ── */}
        <Group>
          <Circle cx={CX} cy={CY} r={R_OUTER + 2} style="stroke" strokeWidth={2} color={wheelPalette.rimGlow}><BlurMask blur={1.8} style="normal" /></Circle>
          <Circle cx={CX} cy={CY} r={R_OUTER + 3} style="stroke" strokeWidth={0.85} opacity={0.96}>
            <SweepGradient c={vec(CX, CY)} colors={['rgba(255,248,228,0.90)', 'rgba(255,255,250,0.98)', goldLight, 'rgba(228,204,146,0.88)', slateDeep, goldDark, 'rgba(251,239,209,0.94)', 'rgba(255,255,248,0.92)', 'rgba(242,223,175,0.90)', 'rgba(255,248,228,0.90)']} positions={[0.0, 0.10, 0.20, 0.32, 0.46, 0.58, 0.72, 0.84, 0.94, 1.0]} transform={[{ rotate: -0.05 }]} />
          </Circle>
          <Circle cx={CX} cy={CY} r={R_OUTER + 1} style="stroke" strokeWidth={0.7} opacity={0.82}>
            <SweepGradient c={vec(CX, CY)} colors={['rgba(120,93,35,0.88)', 'rgba(245,226,182,0.88)', 'rgba(255,248,228,0.94)', slateDeep, 'rgba(226,199,138,0.86)', 'rgba(255,246,220,0.86)', 'rgba(118,89,29,0.84)', textInk, 'rgba(243,225,181,0.86)', 'rgba(120,93,35,0.88)']} positions={[0.0, 0.12, 0.24, 0.40, 0.54, 0.64, 0.78, 0.88, 0.95, 1.0]} transform={[{ rotate: 0.2 }]} />
          </Circle>
          <Circle cx={CX} cy={CY} r={R_OUTER - 2} style="stroke" strokeWidth={0.55} opacity={0.74}>
             <SweepGradient c={vec(CX, CY)} colors={['rgba(117,86,25,0.82)', 'rgba(247,231,191,0.88)', 'rgba(255,251,241,0.90)', slateDeep, 'rgba(242,221,171,0.84)', 'rgba(255,249,233,0.84)', 'rgba(117,86,25,0.82)']} positions={[0.0, 0.14, 0.28, 0.50, 0.70, 0.86, 1.0]} transform={[{ rotate: -0.3 }]} />
          </Circle>
        </Group>

        {/* ── Zodiac sign medallions ── */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const midAngle = astroToAngle(i * 30 + 15, wheelOptions); const tc = polarToXY(midAngle, R_OUTER + 24);
          const startAngle = astroToAngle(i * 30, wheelOptions); const pInner = polarToXY(startAngle, R_OUTER + 2); const pOuter = polarToXY(startAngle, R_OUTER + 44);
          return (
            <Group key={sign.name}>
              <Line p1={vec(pInner.x, pInner.y)} p2={vec(pOuter.x, pOuter.y)} color={wheelPalette.divider} strokeWidth={0.5} />
              {zodiac24 && <SkiaText x={tc.x - 10} y={tc.y + 8} text={sign.symbol} font={zodiac24} color={wheelPalette.zodiacInk} />}
            </Group>
          );
        })}

        {/* ── House cusps ── */}
        {(chart.houseCusps ?? []).map((cusp: HouseCusp) => {
          const angle = astroToAngle((cusp as any).longitude, wheelOptions);
          const outer = polarToXY(angle, R_OUTER); const inner = polarToXY(angle, R_INNER);
          const isAngular = (cusp as any).house === 1 || (cusp as any).house === 4 || (cusp as any).house === 7 || (cusp as any).house === 10;
          const strokeW = isAngular ? 0.75 : 0.45; const strokeColor = isAngular ? wheelPalette.angularLine : wheelPalette.regularLine;
          const cusps = chart.houseCusps ?? []; const nextHouse = cusps.find((c: HouseCusp) => (c as any).house === (((cusp as any).house % 12) + 1));
          let midLon = (cusp as any).longitude + 15;
          if (nextHouse) { let diff = (nextHouse as any).longitude - (cusp as any).longitude; if (diff < 0) diff += 360; midLon = (cusp as any).longitude + diff / 2; if (midLon >= 360) midLon -= 360; }
          const midAngle = astroToAngle(midLon, wheelOptions); const numPos = polarToXY(midAngle, R_INNER + 24);
          const houseText = String((cusp as any).house); const tw = sans9 ? sans9.getTextWidth(houseText) : 7;
          return (
            <Group key={`house-${(cusp as any).house}`}>
              <Line p1={vec(outer.x, outer.y)} p2={vec(inner.x, inner.y)} color={strokeColor} strokeWidth={strokeW} />
              {sans9 && <SkiaText x={numPos.x - tw / 2} y={numPos.y + 3.5} text={houseText} font={sans9} color={wheelPalette.houseInk} opacity={0.8} />}
            </Group>
          );
        })}

        {/* ── House ring border ── */}
        <Group>
          <Circle cx={CX} cy={CY} r={R_HOUSE_OUTER} style="stroke" strokeWidth={0.55} opacity={0.72}>
            <SweepGradient c={vec(CX, CY)} colors={wheelPalette.ringStroke} positions={[0, 0.25, 0.5, 0.75, 1]} transform={[{rotate: -0.3}]} />
          </Circle>
          <Path path={makeArcPath(CX, CY, R_HOUSE_OUTER, -132, 42)} style="stroke" strokeWidth={0.95} strokeCap="round" color={wheelPalette.specularSoft}><BlurMask blur={1.1} style="normal" /></Path>
          <Path path={makeArcPath(CX, CY, R_HOUSE_INNER, -126, 30)} style="stroke" strokeWidth={0.8} strokeCap="round" color={wheelPalette.specularSoft}><BlurMask blur={1} style="normal" /></Path>
        </Group>

        <Path path={makeArcPath(CX, CY, R_OUTER - 1, -140, 76)} style="stroke" strokeWidth={1.0} strokeCap="round" color={wheelPalette.specularMuted}><BlurMask blur={1.3} style="normal" /></Path>
        <Path path={makeArcPath(CX, CY, R_OUTER - 1, -128, 20)} style="stroke" strokeWidth={1.6} strokeCap="round" color={wheelPalette.specularStrong}><BlurMask blur={1} style="normal" /></Path>
        <Path path={makeArcPath(CX, CY, R_OUTER - 1, -120, 7)} style="stroke" strokeWidth={2.2} strokeCap="round" color={wheelPalette.specularPeak}><BlurMask blur={0.7} style="normal" /></Path>
        <Path path={makeArcPath(CX, CY, R_OUTER - 1, 42, 36)} style="stroke" strokeWidth={0.75} strokeCap="round" color={wheelPalette.specularMuted}><BlurMask blur={1.1} style="normal" /></Path>
        <Path path={makeArcPath(CX, CY, R_OUTER - 1, 52, 18)} style="stroke" strokeWidth={1.0} strokeCap="round" color={wheelPalette.bounce}><BlurMask blur={1.4} style="normal" /></Path>

        {/* ── Dotted astronomy diagram rings ── */}
        <Circle cx={CX} cy={CY} r={R_DOT_RING_1} style="stroke" strokeWidth={0.5} opacity={0.34}>
          <SweepGradient c={vec(CX, CY)} colors={wheelPalette.dottedRing} positions={[0, 0.25, 0.5, 0.75, 1]} transform={[{rotate: -0.3}]} />
          <DashPathEffect intervals={[0.7, 13]} />
        </Circle>
        <Path path={makeArcPath(CX, CY, R_DOT_RING_1, -120, 18)} style="stroke" strokeWidth={0.7} strokeCap="round" color="rgba(244,236,214,0.16)"><BlurMask blur={0.8} style="normal" /></Path>
        <Circle cx={CX} cy={CY} r={R_DOT_RING_2} style="stroke" strokeWidth={0.45} opacity={0.28}>
          <SweepGradient c={vec(CX, CY)} colors={wheelPalette.dottedRing} positions={[0, 0.25, 0.5, 0.75, 1]} transform={[{rotate: -0.3}]} />
          <DashPathEffect intervals={[0.7, 13]} />
        </Circle>
        <Path path={makeArcPath(CX, CY, R_DOT_RING_2, -115, 16)} style="stroke" strokeWidth={0.6} strokeCap="round" color="rgba(232,226,212,0.12)"><BlurMask blur={0.8} style="normal" /></Path>

        {/* ── Natal aspect lines ── */}
        {showAspects && showPerson1 && aspectLines.length > 0 && (
          <>
            {aspectLines.map((a, i) => ( <Line key={`asp-${i}`} p1={vec(a.x1, a.y1)} p2={vec(a.x2, a.y2)} color={a.color} strokeWidth={a.strokeWidth}>{a.dashed ? <DashPathEffect intervals={[2, 5]} /> : null}</Line> ))}
          </>
        )}

        {/* ── Cross-chart synastry aspects ── */}
        {showAspects && showCross && crossLines.length > 0 && (
          <Group>
            {crossLines.map((l, i) => (
              <Group key={`cross-${i}`}>
                <Line p1={vec(l.x1, l.y1)} p2={vec(l.x2, l.y2)} color={l.thread} strokeWidth={l.tight ? 0.5 : 0.3}><DashPathEffect intervals={[2, 4]} /></Line>
              </Group>
            ))}
          </Group>
        )}

        {/* ── Natal planet glyphs ── */}
        {showPerson1 && placedPlanets.map((planet) => {
          const isPoint = INNER_POINT_LABELS.has(planet.label);
          const baseRadius = isPoint ? R_INNER + 20 : R_PLANET_RING;
          const actualRadius = baseRadius + planet.radialOffset * (isPoint ? 1 : -1);
          const glyphPos = polarToXY(planet.displayAngle, actualRadius);
          const tickOuter = polarToXY(planet.originalAngle, R_OUTER - 1);
          const tickInner = polarToXY(planet.displayAngle, isPoint ? actualRadius + 15 : actualRadius + PLANET_R + 2);
          const textColor = isPoint ? wheelPalette.pointText : wheelPalette.glyphText;
          const textStyle = isPoint ? "fill" : "stroke";
          const strokeWidthVal = isPoint ? 0 : 1.5;
          const baseColor = PLANET_COLORS[planet.label] || '#D4AF37';
          const glyph = planet.symbol;
          const vectorGlyph = renderVectorGlyph(planet.label, glyphPos.x, glyphPos.y, isPoint ? 18 : 20, textColor);
          const glyphFont = glyph.length > 1 ? sans9Heavy : zodiacMain;
          const glyphWidth = glyphFont ? glyphFont.getTextWidth(glyph) : 12; const fontSize = glyphFont ? glyphFont.getSize() : 12;
          const glyphOffsetX = glyphWidth / 2; const glyphOffsetY = fontSize * 0.35;
          const showDegreeReadout = MAJOR_BODY_LABELS.has(planet.label) && planet.radialOffset === 0;
          const isDisplaced = planet.radialOffset > 0 || radiansApart(planet.displayAngle, planet.originalAngle) > 0.01;

          return (
            <Group key={`p-${planet.label}`}>
              {isDisplaced && (
                <Line p1={vec(tickOuter.x, tickOuter.y)} p2={vec(tickInner.x, tickInner.y)} color={baseColor} strokeWidth={0.55} opacity={0.24} />
              )}
              {!isPoint && (
                <>
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R + 2} color={baseColor} opacity={0.15} />
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R - 0.5} style="stroke" strokeWidth={1} color="rgba(212,175,55,0.7)" />
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R}>
                    <RadialGradient c={vec(glyphPos.x - PLANET_R * 0.2, glyphPos.y - PLANET_R * 0.2)} r={PLANET_R * 1.5} colors={['#FFFFFF', '#FDF8E7', '#E8D6AE', '#C5AB72', slateDeep]} positions={[0, 0.15, 0.4, 0.7, 1]} />
                  </Circle>
                </>
              )}
              {vectorGlyph ?? (glyphFont && (
                <SkiaText x={glyphPos.x - glyphOffsetX} y={glyphPos.y + glyphOffsetY} text={glyph} font={glyphFont} color={textColor} style={textStyle as "stroke" | "fill"} strokeWidth={strokeWidthVal} opacity={1.0} />
              ))}
              {planet.isRetrograde && sans8 && <SkiaText x={glyphPos.x + 7.5} y={glyphPos.y - 6.5} text="R" font={sans8} color="#DC5050" />}
              {/* Inner degree readout for planets */}
              {!isPoint && showDegreeReadout && sans8 && (
                <SkiaText x={glyphPos.x + 8.5} y={glyphPos.y + 6.5} text={`${Math.floor(planet.longitude % 30)}°`} font={sans8} color="rgba(255,255,255,0.4)" />
              )}
            </Group>
          );
        })}

        {/* ── Overlay planets (velvet spheres, secondary hierarchy) ── */}
        {showPerson2 && placedOverlayPlanets.map((planet) => {
          const isPoint = INNER_POINT_LABELS.has(planet.label);
          const baseRadius = isPoint ? R_INNER + 36 : R_OVERLAY_RING;
          const actualRadius = baseRadius + planet.radialOffset * (isPoint ? 1 : -1);
          const glyphPos = polarToXY(planet.displayAngle, actualRadius);
          const tickOuter = polarToXY(planet.originalAngle, R_OUTER - 1);
          const O_PLANET_R = PLANET_R * 0.75;
          const tickInner = polarToXY(planet.displayAngle, isPoint ? actualRadius + 15 : actualRadius + O_PLANET_R + 2);
          const baseColor = planet.color;
          const glyph = planet.symbol;
          const vectorGlyph = renderVectorGlyph(planet.label, glyphPos.x, glyphPos.y, isPoint ? 15 : 16, isPoint ? wheelPalette.pointText : wheelPalette.glyphText);
          const glyphFont = glyph.length > 1 ? sans8 : zodiacOverlay;
          const glyphWidth = glyphFont ? glyphFont.getTextWidth(glyph) : 10; const fontSize = glyphFont ? glyphFont.getSize() : 10;
          const glyphOffsetX = glyphWidth / 2; const glyphOffsetY = fontSize * 0.35;
          const textStyle = isPoint ? "fill" : "stroke";
          const strokeWidthVal = isPoint ? 0 : 1.2;
          const isDisplaced = planet.radialOffset > 0 || radiansApart(planet.displayAngle, planet.originalAngle) > 0.01;

          return (
            <Group key={`op-${planet.label}`}>
              {isDisplaced && (
                <Line p1={vec(tickOuter.x, tickOuter.y)} p2={vec(tickInner.x, tickInner.y)} color={baseColor} strokeWidth={0.6} opacity={0.30}><DashPathEffect intervals={[2, 2]} /></Line>
              )}
              {!isPoint && (
                <>
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={O_PLANET_R + 2.5} color={baseColor} opacity={0.2} />
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={O_PLANET_R} />
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={O_PLANET_R - 0.5} style="stroke" strokeWidth={1} color="rgba(192,192,192,0.8)" />
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={O_PLANET_R}>
                    <RadialGradient c={vec(glyphPos.x - O_PLANET_R * 0.2, glyphPos.y - O_PLANET_R * 0.2)} r={O_PLANET_R * 1.5} colors={['rgba(255,255,255,0.98)', '#E5E7EB', '#9CA3AF', slateDeep]} positions={[0, 0.4, 0.7, 1]} />
                  </Circle>
                </>
              )}
              {vectorGlyph ?? (glyphFont && (
                <SkiaText x={glyphPos.x - glyphOffsetX} y={glyphPos.y + glyphOffsetY} text={glyph} font={glyphFont} color={isPoint ? wheelPalette.pointText : wheelPalette.glyphText} style={textStyle as "stroke" | "fill"} strokeWidth={strokeWidthVal} />
              ))}
              {planet.isRetrograde && sans8 && <SkiaText x={glyphPos.x + 6.0} y={glyphPos.y - 5.5} text="R" font={sans8} color="#DC5050" />}
            </Group>
          );
        })}

        {/* ── ASC / MC axis labels ── */}
        {(chart as any).ascendant && (() => {
          const lon = getLongitude((chart as any).ascendant); if (lon === null) return null;
          const ascAng = astroToAngle(lon, wheelOptions); const dcAng  = astroToAngle(lon + 180, wheelOptions);
          const R_ANGLE_LABEL = R_HOUSE_INNER - 8;
          const acPos = polarToXY(ascAng, R_ANGLE_LABEL); const dcPos = polarToXY(dcAng,  R_ANGLE_LABEL);
          const labelW = sans8 ? sans8.getTextWidth('AC') : 12;
          return (
            <Group key="asc-dc-labels">
              {sans8 && (
                <>
                  <SkiaText x={acPos.x - labelW / 2} y={acPos.y + 4} text="AC" font={sans8} color={wheelPalette.angleLabel} />
                  <SkiaText x={dcPos.x - labelW / 2} y={dcPos.y + 4} text="DC" font={sans8} color={wheelPalette.angleLabel} />
                </>
              )}
            </Group>
          );
        })()}

        {(chart as any).midheaven && (() => {
          const lon = getLongitude((chart as any).midheaven); if (lon === null) return null;
          const mcAng = astroToAngle(lon, wheelOptions); const icAng = astroToAngle(lon + 180, wheelOptions);
          const R_ANGLE_LABEL = R_HOUSE_INNER - 8;
          const mcPos = polarToXY(mcAng, R_ANGLE_LABEL); const icPos = polarToXY(icAng, R_ANGLE_LABEL);
          const mcW = sans8 ? sans8.getTextWidth('MC') : 12; const icW = sans8 ? sans8.getTextWidth('IC') : 10;
          return (
            <Group key="mc-ic-labels">
              {sans8 && (
                <>
                  <SkiaText x={mcPos.x - mcW / 2} y={mcPos.y + 4} text="MC" font={sans8} color={wheelPalette.angleLabel} />
                  <SkiaText x={icPos.x - icW / 2} y={icPos.y + 4} text="IC" font={sans8} color={wheelPalette.angleLabel} />
                </>
              )}
            </Group>
          );
        })()}

        {/* ── Center hub — deep navy core ── */}
        <Circle cx={CX} cy={CY} r={R_INNER + 24} opacity={1}>
          <RadialGradient c={vec(CX, CY)} r={R_INNER + 24} colors={wheelPalette.centerHalo} positions={[0, 0.55, 1]} />
        </Circle>

        {/* Navy shadow halo */}
        <Circle cx={CX} cy={CY} r={R_INNER + 4} style="stroke" strokeWidth={6} color={wheelPalette.centerHaloStroke} />

        {/* Glass face (matched to background) */}
        <Circle cx={CX} cy={CY} r={R_INNER} color={slateDeep} />

        {/* ── Center Hub: Inner Bezel ── */}
        <Group>
          <Circle cx={CX} cy={CY} r={R_INNER} style="stroke" strokeWidth={3} color={wheelPalette.rimGlow}>
            <BlurMask blur={2} style="normal" />
          </Circle>
          <Path path={makeArcPath(CX, CY, R_INNER, -125, 38)} style="stroke" strokeWidth={2.5} strokeCap="round" color={wheelPalette.specularStrong}><BlurMask blur={1} style="normal" /></Path>
          
          <Circle cx={CX} cy={CY} r={R_INNER + 1} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient c={vec(CX, CY)} colors={['rgba(255,248,228,0.90)', 'rgba(255,255,250,0.98)', goldLight, 'rgba(228,204,146,0.88)', slateDeep, goldDark, 'rgba(251,239,209,0.94)', 'rgba(255,255,248,0.92)', 'rgba(242,223,175,0.90)', 'rgba(255,248,228,0.90)']} positions={[0.0, 0.10, 0.20, 0.32, 0.46, 0.58, 0.72, 0.84, 0.94, 1.0]} transform={[{ rotate: -0.15 }]} />
          </Circle>
          <Circle cx={CX} cy={CY} r={R_INNER - 1} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient c={vec(CX, CY)} colors={['rgba(120,93,35,0.88)', 'rgba(245,226,182,0.88)', 'rgba(255,248,228,0.94)', slateDeep, 'rgba(226,199,138,0.86)', 'rgba(255,246,220,0.86)', 'rgba(118,89,29,0.84)', textInk, 'rgba(243,225,181,0.86)', 'rgba(120,93,35,0.88)']} positions={[0.0, 0.12, 0.24, 0.40, 0.54, 0.64, 0.78, 0.88, 0.95, 1.0]} transform={[{ rotate: 0.1 }]} />
          </Circle>
        </Group>

        <Circle cx={CX} cy={CY} r={R_INNER - 3} style="stroke" strokeWidth={0.8} opacity={0.95}>
           <SweepGradient c={vec(CX, CY)} colors={['rgba(117,86,25,0.82)', 'rgba(247,231,191,0.88)', 'rgba(255,251,241,0.90)', slateDeep, 'rgba(242,221,171,0.84)', 'rgba(255,249,233,0.84)', 'rgba(117,86,25,0.82)']} positions={[0.0, 0.14, 0.28, 0.50, 0.70, 0.86, 1.0]} transform={[{ rotate: -0.2 }]} />
        </Circle>

        {/* ── Synastry label inside center hub ── */}
        {overlayChart && overlayName && (
          <Group>
            {sans10 && (() => {
              const text = "SYNASTRY"; const tw = sans10.getTextWidth(text);
              return <SkiaText x={CX - tw / 2} y={CY - 10} text={text} font={sans10} color={wheelPalette.synastryLabel} />;
            })()}
            {serif16 && serif14 && serif12 && (() => {
              let useFont = serif16; if (overlayName.length > 8) useFont = serif14; if (overlayName.length > 12) useFont = serif12;
              const text = overlayName.length > 16 ? overlayName.slice(0, 15) + '…' : overlayName; const tw = useFont.getTextWidth(text);
              return <SkiaText x={CX - tw / 2} y={CY + 14} text={text} font={useFont} color={wheelPalette.synastryName} />;
            })()}
          </Group>
        )}

      </Canvas>
    </View>
  );
}

export default memo(NatalChartWheel);

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '100%',
    display: 'flex',
  },
});
