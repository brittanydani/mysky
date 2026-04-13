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
import { type AppTheme } from '../../constants/theme';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

// ── Icons ────────────────────────────────────────────────────────────────────

function SkiaPholusIcon({ x, y, size = 24, color = '#D4AF37' }: { x: number, y: number, size?: number, color?: string }) {
  const s = size / 24;
  const path = Skia.Path.Make();
  path.moveTo(x + 4 * s, y + 20 * s);
  path.lineTo(x + 20 * s, y + 4 * s);
  const dotCx = x + 6.5 * s, dotCy = y + 17.5 * s, dotR = 2.2 * s;
  return (
    <Group>
      <Path path={path} style="stroke" strokeWidth={1.2 * s} color={color} strokeCap="round" />
      <Circle cx={dotCx} cy={dotCy} r={dotR} color={color} />
    </Group>
  );
}

function SkiaLilithIcon({ x, y, size = 24, color = '#D4AF37' }: { x: number, y: number, size?: number, color?: string }) {
  const s = size / 24;
  const cx = x + 12 * s;
  const cresR = 4 * s;
  const cresCY = (y + 12 * s) - 5 * s;
  const stemTop = cresCY;
  const stemBot = (y + 12 * s) + 4 * s;
  const cresPath = Skia.Path.Make();
  cresPath.addArc({ x: cx - cresR, y: cresCY - cresR, width: cresR * 2, height: cresR * 2 }, 180, 180);
  const stemPath = Skia.Path.Make();
  stemPath.moveTo(cx, stemTop);
  stemPath.lineTo(cx, stemBot);
  stemPath.moveTo(cx - 4 * s, stemBot);
  stemPath.lineTo(cx + 4 * s, stemBot);
  return (
    <Group>
      <Path path={cresPath} style="stroke" strokeWidth={0.9 * s} color={color} strokeCap="round" />
      <Path path={stemPath} style="stroke" strokeWidth={0.9 * s} color={color} strokeCap="round" />
    </Group>
  );
}

function SkiaPartOfFortuneIcon({ x, y, size = 24, color = '#D4AF37' }: { x: number, y: number, size?: number, color?: string }) {
  const s = size / 24;
  const cx = x + 12 * s, cy = y + 12 * s;
  const r = 5 * s;
  const path = Skia.Path.Make();
  path.addCircle(cx, cy, r);
  const d = r * 0.65;
  path.moveTo(cx - d, cy - d);
  path.lineTo(cx + d, cy + d);
  path.moveTo(cx + d, cy - d);
  path.lineTo(cx - d, cy + d);
  return <Path path={path} style="stroke" strokeWidth={0.9 * s} color={color} strokeCap="round" />;
}

function SkiaVertexIcon({ x, y, size = 24, color = '#D4AF37' }: { x: number, y: number, size?: number, color?: string }) {
  const s = size / 24;
  const vPath = Skia.Path.Make();
  vPath.moveTo(x + 5 * s, y + 6 * s);
  vPath.lineTo(x + 10.5 * s, y + 18 * s);
  vPath.lineTo(x + 14.5 * s, y + 9.5 * s);
  const x1 = Skia.Path.Make();
  x1.moveTo(x + 13 * s, y + 12 * s);
  x1.lineTo(x + 19 * s, y + 18 * s);
  const x2 = Skia.Path.Make();
  x2.moveTo(x + 13 * s, y + 18 * s);
  x2.lineTo(x + 19 * s, y + 12 * s);
  return (
    <Group>
      <Path path={vPath} style="stroke" strokeWidth={1.1 * s} color={color} strokeCap="round" />
      <Path path={x1} style="stroke" strokeWidth={1.1 * s} color={color} strokeCap="round" />
      <Path path={x2} style="stroke" strokeWidth={1.1 * s} color={color} strokeCap="round" />
    </Group>
  );
}

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
const PLANET_R = 13.5;

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
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  'North Node': '☊', 'South Node': '☋', Chiron: '⚷', Lilith: '⚸', Vertex: 'Vx', 'Part of Fortune': '⊗', Pholus: '⯰', Ascendant: 'AC', Midheaven: 'MC',
};

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D4AF37', Moon: '#A2C2E1', Mercury: '#86BCEC', Venus: '#D4A3B3', Mars: '#DC5050', Jupiter: '#D4AF37', Saturn: '#8484A0',
  Uranus: '#6CBEC4', Neptune: '#7C8CD0', Pluto: '#A88BEB', 'North Node': '#A0A0B0', 'South Node': '#A0A0B0', Chiron: '#6EBF8B', Ascendant: '#D4AF37', Midheaven: '#D4AF37',
};

const OVERLAY_PLANET_COLORS: Record<string, string> = {
  Sun: '#8C7CCF', Moon: '#7C70C0', Mercury: '#7080C4', Venus: '#9878C8', Mars: '#9870B8', Jupiter: '#8C7CCF', Saturn: '#6864A8',
  Uranus: '#7090C8', Neptune: '#6878C0', Pluto: '#8068C0', 'North Node': '#808090', 'South Node': '#808090', Chiron: '#80C080', Ascendant: '#8C7CCF', Midheaven: '#8C7CCF',
};

function getUserSpherePalette(userIndex: number): string[] {
  const palettes = [
    // Champagne Gold Metallic — pearl peak → warm gold → deep shadow
    ['#FEFAF0', '#F0DFA0', '#E8C97A', '#C9A84C', '#7A5010', '#3D2809'],
    // Platinum Champagne — silver-warm specular for overlay
    ['#FDFCF8', '#EDE8DC', '#D6C99A', '#B0976A', '#6B5330', '#2E2010'],
    ['#F7E5EB', '#E6C0CD', '#D4A3B3', '#B07D8F', '#8C5A6B'],           // Rose Gold
    ['#EBE4F9', '#CDBCF4', '#A88BEB', '#8365C8', '#5E42A6'],           // Nebula Purple
  ];
  return palettes[userIndex % 4] ?? palettes[0];
}

const CROSS_ASPECT_COLORS: Record<string, { tight: string; loose: string }> = {
  Harmonious: { tight: 'rgba(162,194,225,0.40)', loose: 'rgba(162,194,225,0.20)' },
  Challenging: { tight: 'rgba(212,163,179,0.40)', loose: 'rgba(212,163,179,0.20)' },
  Neutral: { tight: 'rgba(212,175,55,0.40)', loose: 'rgba(212,175,55,0.20)' },
};

// ── Math Helpers ─────────────────────────────────────────────────────────────

function astroToAngle(longitude: number, ascLongitude: number): number {
  const offset = ascLongitude;
  const adjusted = longitude - offset;
  return (adjusted * Math.PI) / 180;
}

function polarToXY(angle: number, radius: number): { x: number; y: number } {
  return { x: CX + radius * Math.cos(angle), y: CY - radius * Math.sin(angle) };
}

function normalize360(deg: number): number { const x = deg % 360; return x < 0 ? x + 360 : x; }

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

function spreadPlanets(planets: { label: string; longitude: number; isRetrograde: boolean }[], ascLongitude: number, minSeparationDeg: number = 8, radialStepPx: number = 14, baseRadius: number = R_PLANET_RING, fallbackColor: string = '#FFFFFF'): PlacedPlanet[] {
  const items: PlacedPlanet[] = planets.map((p) => {
    const angle = astroToAngle(p.longitude, ascLongitude);
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
  const lanePattern = [0, -1, 1, -2, 2, -3, 3];
  for (const cluster of clusters) {
    if (cluster.length <= 1) continue;
    for (let i = 0; i < cluster.length; i++) { const lane = lanePattern[i % lanePattern.length] ?? 0; cluster[i].radialOffset = lane * radialStepPx; }
  }
  return items;
}

// ── Main Component ───────────────────────────────────────────────────────────

interface Props { chart: NatalChart; showAspects?: boolean; overlayChart?: NatalChart; overlayName?: string; filterMode?: { person1: boolean; person2: boolean; cross: boolean }; orientation?: ChartOrientation; }

function NatalChartWheel({ chart, showAspects = true, overlayChart, overlayName, filterMode, orientation: orientationProp }: Props) {
  const theme = useAppTheme();
  
  const {
    slateMid = theme.isDark ? '#1C1608' : '#F7F5EE',
    slateDeep = theme.isDark ? '#0A0904' : '#FFFFFF',
    goldLight = '#FEFAF0',
    goldMain = '#E8C97A',
    goldDark = '#7A5010',
    textInk = theme.isDark ? '#FDF6E3' : '#1A1510'
  } = theme as any;

  const styles = useThemedStyles(createStyles);
  const rawAscLongitude = getLongitude((chart as any).ascendant) ?? 0;
  
  const wheelPalette = useMemo(() => {
    return {
      rimGlow: 'rgba(232, 201, 122, 0.22)',
      divider: 'rgba(254, 250, 240, 0.10)',
      zodiacInk: 'rgba(254, 250, 240, 0.80)',
      houseInk: 'rgba(254, 250, 240, 0.75)',
      angularLine: 'rgba(232, 201, 122, 0.70)',
      regularLine: 'rgba(254, 250, 240, 0.20)',
      ringStroke: [
        'rgba(122, 80, 16, 0.30)',
        'rgba(254, 250, 240, 0.95)',
        'rgba(122, 80, 16, 0.20)',
        'rgba(232, 201, 122, 0.80)',
        'rgba(122, 80, 16, 0.30)',
      ],
      specularSoft: 'rgba(254,250,240,0.30)',
      specularMuted: 'rgba(254,250,240,0.15)',
      specularStrong: 'rgba(254,250,240,0.60)',
      specularPeak: 'rgba(254,250,240,0.90)',
      bounce: 'rgba(232,201,122,0.20)',
      dottedRing: [
        'rgba(201,168,76,0.18)',
        'rgba(254,250,240,0.90)',
        'rgba(122,80,16,0.25)',
        'rgba(232,201,122,0.75)',
        'rgba(201,168,76,0.18)',
      ],
      pointText: '#FFFFFF',
      glyphText: '#0A0A0F',
      angleLabel: 'rgba(255,255,255,0.85)',
      centerHalo: ['rgba(232, 201, 122, 0.14)', 'rgba(232, 201, 122, 0.05)', 'transparent'],
      centerHaloStroke: 'rgba(28, 22, 8, 0.90)',
      centerFill: [slateMid, slateDeep, slateDeep],
      centerSparkle: 'rgba(254,250,240,0.55)',
      centerRing: [
        'rgba(122, 80, 16, 0.35)',
        'rgba(254, 250, 240, 0.98)',
        'rgba(122, 80, 16, 0.20)',
        'rgba(232, 201, 122, 0.80)',
        'rgba(122, 80, 16, 0.35)',
      ],
      synastryLabel: 'rgba(254,250,240,0.50)',
      synastryName: 'rgba(232,201,122,0.95)',
      aspectColor: (alpha: number) => `rgba(232, 201, 122, ${alpha})`,
      aspectGlow: (alpha: number) => `rgba(254, 248, 228, ${alpha})`,
    };
  }, [theme]);

  const [settingsOrientation, setSettingsOrientation] = useState<ChartOrientation>('standard-natal');
  useEffect(() => { AstrologySettingsService.getSettings().then((s) => setSettingsOrientation(s.chartOrientation)).catch(() => {}); }, []);

  const orientation = orientationProp ?? settingsOrientation;

  const ascLongitude = useMemo(() => {
    if (orientation === 'midheaven-top') {
      const mc = getLongitude(getChartPlanet(chart, 'Midheaven')); const mcLon = mc ?? rawAscLongitude; return normalize360(mcLon - 90);
    }
    if (orientation === 'aries-rising') { return 180; }
    return normalize360(rawAscLongitude + 180);
  }, [orientation, rawAscLongitude, chart]);

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
  const sans11Heavy = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 11, fontWeight: '900' }), []);
  const sans9Heavy = useMemo(() => matchFont({ fontFamily: SANS_FAMILY, fontSize: 9, fontWeight: '900' }), []);
  const zodiacMain = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 24, fontWeight: '900' }), []);
  const zodiacOverlay = useMemo(() => matchFont({ fontFamily: ZODIAC_FAMILY, fontSize: 18, fontWeight: '900' }), []);
  
  const placedPlanets = useMemo(() => {
    const labels = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron', 'North Node', 'South Node', 'Lilith', 'Vertex', 'Part of Fortune', 'Pholus'];
    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [];
    for (const label of labels) {
      const obj = getChartPlanet(chart, label); const lon = getLongitude(obj);
      if (lon === null) continue; raw.push({ label, longitude: lon, isRetrograde: getRetrograde(obj) });
    }
    return spreadPlanets(raw, ascLongitude, 10, 14, R_PLANET_RING, theme.textPrimary);
  }, [chart, ascLongitude, theme.textPrimary]);

  const planetLongitudes = useMemo(() => {
    const map: Record<string, number> = {};
    placedPlanets.forEach((p) => { map[p.label] = p.longitude; });
    const asc = getLongitude(getChartPlanet(chart, 'Ascendant')); if (asc !== null) map['Ascendant'] = asc;
    const mc = getLongitude(getChartPlanet(chart, 'Midheaven')); if (mc !== null) map['Midheaven'] = mc;
    return map;
  }, [placedPlanets, chart]);

  const R_OVERLAY_RING = R_PLANET_RING - 8;
  const placedOverlayPlanets = useMemo(() => {
    if (!overlayChart) return [];
    const labels = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Chiron', 'North Node', 'South Node'];
    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [];
    for (const label of labels) {
      const obj = getChartPlanet(overlayChart, label); const lon = getLongitude(obj);
      if (lon === null) continue; raw.push({ label, longitude: lon, isRetrograde: getRetrograde(obj) });
    }
    const placed = spreadPlanets(raw, ascLongitude, 10, 12, R_OVERLAY_RING, theme.textPrimary);
    return placed.map((p) => ({ ...p, color: OVERLAY_PLANET_COLORS[p.label] || '#9C8FD2' }));
  }, [overlayChart, ascLongitude, R_OVERLAY_RING, theme.textPrimary]);

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
    return (chart.aspects ?? []).filter((a: Aspect) => (a?.orb ?? 99) < 8 && ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile'].includes((a as any)?.type?.name)).sort((a: Aspect, b: Aspect) => (a.orb ?? 99) - (b.orb ?? 99)).slice(0, MAX_ASPECTS);
  }, [chart.aspects, showAspects]);

  const aspectLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string; glowColor: string; strokeWidth: number; dashed: boolean; }[] = [];
      for (const asp of visibleAspects) {
        const p1Name = normalizePlanetName((asp as any)?.planet1?.name); const p2Name = normalizePlanetName((asp as any)?.planet2?.name);
        const lon1 = planetLongitudes[p1Name]; const lon2 = planetLongitudes[p2Name];
        if (lon1 === undefined || lon2 === undefined) continue;
        const angle1 = astroToAngle(lon1, ascLongitude); const angle2 = astroToAngle(lon2, ascLongitude);
        const p1 = polarToXY(angle1, R_ASPECT_RING); const p2 = polarToXY(angle2, R_ASPECT_RING);
        const orb = asp.orb ?? 99; const typeName = ((asp as any)?.type?.name ?? '').toLowerCase();
        let topAlpha = 0.35; let glowAlpha = 0.15;
        if (orb < 3) { topAlpha = 0.55; glowAlpha = 0.25; } else if (orb >= 6) { topAlpha = 0.18; glowAlpha = 0.08; }
        lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, color: wheelPalette.aspectColor(topAlpha), glowColor: wheelPalette.aspectGlow(glowAlpha), strokeWidth: 1.0, dashed: typeName !== 'trine' && typeName !== 'sextile' && typeName !== 'conjunction' });
      }
      return lines;
    }, [visibleAspects, planetLongitudes, ascLongitude, wheelPalette]);
    
  const crossLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; thread: string; tight: boolean; }[] = [];
    for (const ca of crossAspects) {
      const angle1 = astroToAngle(ca.lon1, ascLongitude); const angle2 = astroToAngle(ca.lon2, ascLongitude);
      const p1 = polarToXY(angle1, R_ASPECT_RING); const p2 = polarToXY(angle2, R_ASPECT_RING);
      const tight = ca.orb < 3; const colors = CROSS_ASPECT_COLORS[ca.nature] ?? CROSS_ASPECT_COLORS.Neutral;
      lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, thread: tight ? colors.tight : colors.loose, tight });
    }
    return lines;
  }, [crossAspects, ascLongitude]);

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
          <Circle cx={CX} cy={CY} r={R_OUTER + 44} style="stroke" strokeWidth={4} color={wheelPalette.rimGlow}>
            <BlurMask blur={4} style="normal" />
          </Circle>
          <Circle cx={CX} cy={CY} r={R_OUTER + 45} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient c={vec(CX, CY)} colors={[slateDeep, goldMain, goldLight, '#FEFAF0', goldMain, slateDeep, goldDark, goldMain, goldLight, slateDeep]} positions={[0.0, 0.10, 0.22, 0.28, 0.38, 0.50, 0.62, 0.75, 0.88, 1.0]} transform={[{ rotate: -0.1 }]} />
          </Circle>
          <Circle cx={CX} cy={CY} r={R_OUTER + 43} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient c={vec(CX, CY)} colors={[goldDark, goldLight, '#FEFAF0', goldMain, goldDark, slateDeep, goldMain, '#FEFAF0', goldDark, goldDark]} positions={[0.0, 0.08, 0.18, 0.32, 0.45, 0.55, 0.68, 0.80, 0.92, 1.0]} transform={[{ rotate: 0.15 }]} />
          </Circle>
        </Group>

        {/* ── Main Rim: Double Bezel Ring ── */}
        <Group>
          <Circle cx={CX} cy={CY} r={R_OUTER + 2} style="stroke" strokeWidth={4} color={wheelPalette.rimGlow}><BlurMask blur={3} style="normal" /></Circle>
          <Circle cx={CX} cy={CY} r={R_OUTER + 3} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient c={vec(CX, CY)} colors={[slateDeep, '#FEFAF0', goldMain, goldDark, slateDeep, goldMain, '#FEFAF0', goldDark, slateDeep, slateDeep]} positions={[0.0, 0.10, 0.22, 0.35, 0.48, 0.60, 0.72, 0.85, 0.94, 1.0]} transform={[{ rotate: -0.05 }]} />
          </Circle>
          <Circle cx={CX} cy={CY} r={R_OUTER + 1} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient c={vec(CX, CY)} colors={[goldDark, goldMain, '#FEFAF0', goldDark, slateDeep, goldMain, '#FEFAF0', goldDark, goldMain, goldDark]} positions={[0.0, 0.10, 0.20, 0.32, 0.45, 0.58, 0.70, 0.82, 0.92, 1.0]} transform={[{ rotate: 0.2 }]} />
          </Circle>
          <Circle cx={CX} cy={CY} r={R_OUTER - 2} style="stroke" strokeWidth={0.8} opacity={0.95}>
             <SweepGradient c={vec(CX, CY)} colors={[slateDeep, '#FEFAF0', goldMain, goldDark, slateDeep, '#FEFAF0', goldDark]} positions={[0.0, 0.12, 0.28, 0.45, 0.60, 0.78, 1.0]} transform={[{ rotate: -0.3 }]} />
          </Circle>
        </Group>

        {/* ── Zodiac sign medallions ── */}
        {ZODIAC_SIGNS.map((sign, i) => {
          const midAngle = astroToAngle(i * 30 + 15, ascLongitude); const tc = polarToXY(midAngle, R_OUTER + 24);
          const startAngle = astroToAngle(i * 30, ascLongitude); const pInner = polarToXY(startAngle, R_OUTER + 2); const pOuter = polarToXY(startAngle, R_OUTER + 44);
          return (
            <Group key={sign.name}>
              <Line p1={vec(pInner.x, pInner.y)} p2={vec(pOuter.x, pOuter.y)} color={wheelPalette.divider} strokeWidth={0.8} />
              {zodiac24 && <SkiaText x={tc.x - 10} y={tc.y + 8} text={sign.symbol} font={zodiac24} color={wheelPalette.zodiacInk} />}
            </Group>
          );
        })}

        {/* ── House cusps ── */}
        {(chart.houseCusps ?? []).map((cusp: HouseCusp) => {
          const angle = astroToAngle((cusp as any).longitude, ascLongitude);
          const outer = polarToXY(angle, R_OUTER); const inner = polarToXY(angle, R_INNER);
          const isAngular = (cusp as any).house === 1 || (cusp as any).house === 4 || (cusp as any).house === 7 || (cusp as any).house === 10;
          const strokeW = isAngular ? 1.0 : 0.8; const strokeColor = isAngular ? wheelPalette.angularLine : wheelPalette.regularLine;
          const cusps = chart.houseCusps ?? []; const nextHouse = cusps.find((c: HouseCusp) => (c as any).house === (((cusp as any).house % 12) + 1));
          let midLon = (cusp as any).longitude + 15;
          if (nextHouse) { let diff = (nextHouse as any).longitude - (cusp as any).longitude; if (diff < 0) diff += 360; midLon = (cusp as any).longitude + diff / 2; if (midLon >= 360) midLon -= 360; }
          const midAngle = astroToAngle(midLon, ascLongitude); const numPos = polarToXY(midAngle, R_INNER + 24);
          const houseText = String((cusp as any).house); const tw = sans9 ? sans9.getTextWidth(houseText) : 7;
          return (
            <Group key={`house-${(cusp as any).house}`}>
              <Line p1={vec(outer.x, outer.y)} p2={vec(inner.x, inner.y)} color={strokeColor} strokeWidth={strokeW} />
              {sans9 && <SkiaText x={numPos.x - tw / 2} y={numPos.y + 3.5} text={houseText} font={sans9} color={wheelPalette.houseInk} />}
            </Group>
          );
        })}

        {/* ── House ring border ── */}
        <Group>
          <Circle cx={CX} cy={CY} r={R_HOUSE_OUTER} style="stroke" strokeWidth={0.8} opacity={0.90}>
            <SweepGradient c={vec(CX, CY)} colors={wheelPalette.ringStroke} positions={[0, 0.25, 0.5, 0.75, 1]} transform={[{rotate: -0.3}]} />
          </Circle>
          <Path path={makeArcPath(CX, CY, R_HOUSE_OUTER, -130, 55)} style="stroke" strokeWidth={1.6} strokeCap="round" color={wheelPalette.specularSoft}><BlurMask blur={1.5} style="normal" /></Path>
          <Path path={makeArcPath(CX, CY, R_HOUSE_INNER, -125, 40)} style="stroke" strokeWidth={1.2} strokeCap="round" color={wheelPalette.specularSoft}><BlurMask blur={1.5} style="normal" /></Path>
        </Group>

        <Path path={makeArcPath(CX, CY, R_OUTER - 1, -140, 100)} style="stroke" strokeWidth={1.8} strokeCap="round" color={wheelPalette.specularMuted}><BlurMask blur={2} style="normal" /></Path>
        <Path path={makeArcPath(CX, CY, R_OUTER - 1, -128, 32)} style="stroke" strokeWidth={3.0} strokeCap="round" color={wheelPalette.specularStrong}><BlurMask blur={1.2} style="normal" /></Path>
        <Path path={makeArcPath(CX, CY, R_OUTER - 1, -118, 10)} style="stroke" strokeWidth={4.0} strokeCap="round" color={wheelPalette.specularPeak}><BlurMask blur={0.8} style="normal" /></Path>
        <Path path={makeArcPath(CX, CY, R_OUTER - 1, 40, 60)} style="stroke" strokeWidth={1.0} strokeCap="round" color={wheelPalette.specularMuted}><BlurMask blur={1.5} style="normal" /></Path>
        <Path path={makeArcPath(CX, CY, R_OUTER - 1, 50, 28)} style="stroke" strokeWidth={1.8} strokeCap="round" color={wheelPalette.bounce}><BlurMask blur={2} style="normal" /></Path>

        {/* ── Dotted astronomy diagram rings ── */}
        <Circle cx={CX} cy={CY} r={R_DOT_RING_1} style="stroke" strokeWidth={0.8} opacity={0.85}>
          <SweepGradient c={vec(CX, CY)} colors={wheelPalette.dottedRing} positions={[0, 0.25, 0.5, 0.75, 1]} transform={[{rotate: -0.3}]} />
          <DashPathEffect intervals={[1, 8]} />
        </Circle>
        <Path path={makeArcPath(CX, CY, R_DOT_RING_1, -120, 30)} style="stroke" strokeWidth={1.4} strokeCap="round" color={wheelPalette.specularStrong}><BlurMask blur={1} style="normal" /></Path>
        <Circle cx={CX} cy={CY} r={R_DOT_RING_2} style="stroke" strokeWidth={0.8} opacity={0.85}>
          <SweepGradient c={vec(CX, CY)} colors={wheelPalette.dottedRing} positions={[0, 0.25, 0.5, 0.75, 1]} transform={[{rotate: -0.3}]} />
          <DashPathEffect intervals={[1, 8]} />
        </Circle>
        <Path path={makeArcPath(CX, CY, R_DOT_RING_2, -115, 30)} style="stroke" strokeWidth={1.4} strokeCap="round" color={wheelPalette.specularSoft}><BlurMask blur={1} style="normal" /></Path>

        {/* ── Natal aspect lines ── */}
        {showAspects && showPerson1 && aspectLines.length > 0 && (
          <>
            {aspectLines.map((a, i) => ( <Line key={`asp-glow-${i}`} p1={vec(a.x1, a.y1)} p2={vec(a.x2, a.y2)} color={a.glowColor} strokeWidth={2}><BlurMask blur={2} style="normal" /></Line> ))}
            {aspectLines.map((a, i) => ( <Line key={`asp-${i}`} p1={vec(a.x1, a.y1)} p2={vec(a.x2, a.y2)} color={a.color} strokeWidth={a.strokeWidth}>{a.dashed ? <DashPathEffect intervals={[2, 5]} /> : null}</Line> ))}
          </>
        )}

        {/* ── Cross-chart synastry aspects ── */}
        {showAspects && showCross && crossLines.length > 0 && (
          <Group>
            {crossLines.map((l, i) => (
              <Group key={`cross-${i}`}>
                <Line p1={vec(l.x1, l.y1)} p2={vec(l.x2, l.y2)} color="rgba(162,194,225,1)" strokeWidth={l.tight ? 1.8 : 1.2} opacity={0.06} />
                <Line p1={vec(l.x1, l.y1)} p2={vec(l.x2, l.y2)} color={l.thread} strokeWidth={l.tight ? 0.5 : 0.3}><DashPathEffect intervals={[2, 4]} /></Line>
              </Group>
            ))}
          </Group>
        )}

        {/* ── Natal planet glyphs ── */}
        {showPerson1 && placedPlanets.map((planet) => {
          const nonPlanetPoints = ['Chiron', 'North Node', 'South Node', 'Lilith', 'Vertex', 'Part of Fortune', 'Pholus', 'Ascendant', 'Midheaven', 'ASC', 'MC'];
          const iconOnlyPoints = ['Lilith', 'Vertex', 'Part of Fortune', 'Pholus'];
          const isPoint = nonPlanetPoints.includes(planet.label);
          const isIconOnly = iconOnlyPoints.includes(planet.label);
          const baseRadius = isPoint ? R_INNER + 20 : R_PLANET_RING;
          const actualRadius = baseRadius + planet.radialOffset;
          const glyphPos = polarToXY(planet.originalAngle, actualRadius);
          const tickOuter = polarToXY(planet.originalAngle, R_OUTER - 1);
          const tickInner = polarToXY(planet.originalAngle, isPoint ? actualRadius + 15 : actualRadius + PLANET_R + 2);
          const textColor = isPoint ? wheelPalette.pointText : wheelPalette.glyphText;
          const textOpacity = 1.0; const textStyle = isPoint ? "fill" : "stroke"; const strokeWidthVal = isPoint ? 0 : 1.5;
          const baseColor = PLANET_COLORS[planet.label] || '#D4AF37';
          const glyph = planet.symbol; const glyphFont = glyph.length > 1 ? sans11Heavy : zodiacMain;
          const glyphWidth = glyphFont ? glyphFont.getTextWidth(glyph) : 12; const fontSize = glyphFont ? glyphFont.getSize() : 12;
          const glyphOffsetX = glyphWidth / 2; const glyphOffsetY = fontSize * 0.35;

          return (
            <Group key={`p-${planet.label}`}>
              <Line p1={vec(tickOuter.x, tickOuter.y)} p2={vec(tickInner.x, tickInner.y)} color={baseColor} strokeWidth={0.8} opacity={0.40} />
              {!isPoint && (
                <>
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R + 4} color={baseColor} opacity={0.18} />
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R + 2} color={baseColor} opacity={0.10} />
                  <Circle cx={glyphPos.x + 1.5} cy={glyphPos.y + 2} r={PLANET_R} color="rgba(0,0,0,0.45)"><BlurMask blur={4} style="normal" /></Circle>
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R}>
                    <RadialGradient c={vec(glyphPos.x - PLANET_R * 0.28, glyphPos.y - PLANET_R * 0.28)} r={PLANET_R * 1.6} colors={getUserSpherePalette(0)} positions={[0, 0.12, 0.30, 0.52, 0.78, 1]} />
                  </Circle>
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R}>
                    <RadialGradient c={vec(glyphPos.x + PLANET_R * 0.45, glyphPos.y + PLANET_R * 0.45)} r={PLANET_R * 1.2} colors={['rgba(30,18,4,0.70)', 'rgba(30,18,4,0.25)', 'rgba(0,0,0,0)']} positions={[0, 0.5, 1]} />
                  </Circle>
                  <Circle cx={glyphPos.x - PLANET_R * 0.32} cy={glyphPos.y - PLANET_R * 0.32} r={PLANET_R * 0.18} color="#FEFAF0" />
                  <Circle cx={glyphPos.x - PLANET_R * 0.26} cy={glyphPos.y - PLANET_R * 0.26} r={PLANET_R * 0.46} color="rgba(254,250,240,0.35)"><BlurMask blur={2.5} style="normal" /></Circle>
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R - 0.4} style="stroke" strokeWidth={1.4} color="rgba(232,201,122,0.65)" />
                </>
              )}
              {isIconOnly && (
                planet.label === 'Pholus' ? <Group><SkiaPholusIcon x={glyphPos.x - 12} y={glyphPos.y - 12} size={24} color={textColor} /></Group> :
                planet.label === 'Vertex' ? <Group><SkiaVertexIcon x={glyphPos.x - 12} y={glyphPos.y - 12} size={24} color={textColor} /></Group> :
                planet.label === 'Lilith' ? <Group><SkiaLilithIcon x={glyphPos.x - 12} y={glyphPos.y - 12} size={24} color={textColor} /></Group> :
                planet.label === 'Part of Fortune' ? <Group><SkiaPartOfFortuneIcon x={glyphPos.x - 12} y={glyphPos.y - 12} size={24} color={textColor} /></Group> :
                glyphFont ? <SkiaText x={glyphPos.x - glyphOffsetX} y={glyphPos.y + glyphOffsetY} text={glyph} font={glyphFont} color={textColor} style={"fill"} strokeWidth={0} opacity={1.0} /> : null
              )}
              {isPoint && planet.label === 'Chiron' ? (
                (() => {
                  const path = Skia.Path.Make(); const cx = glyphPos.x, cy = glyphPos.y;
                  path.addCircle(cx, cy - 5, 3); path.moveTo(cx, cy - 2); path.lineTo(cx, cy + 5); path.moveTo(cx, cy + 1); path.lineTo(cx + 4.5, cy - 3.5); path.moveTo(cx, cy + 1); path.lineTo(cx + 4.5, cy + 5);
                  return <Path path={path} style="stroke" strokeWidth={0.8} color={wheelPalette.pointText} strokeCap="round" />;
                })()
              ) : glyphFont && !isIconOnly && (
                <SkiaText x={glyphPos.x - glyphOffsetX} y={glyphPos.y + glyphOffsetY} text={glyph} font={glyphFont} color={textColor} style={textStyle as "stroke" | "fill"} strokeWidth={strokeWidthVal} opacity={textOpacity} />
              )}
              {planet.isRetrograde && sans8 && <SkiaText x={glyphPos.x + 7.5} y={glyphPos.y - 6.5} text="R" font={sans8} color="#DC5050" />}
            </Group>
          );
        })}

        {/* ── Overlay planets (velvet spheres, secondary hierarchy) ── */}
        {showPerson2 && placedOverlayPlanets.map((planet) => {
          const isPoint = ['Ascendant', 'Midheaven', 'North Node', 'South Node', 'Chiron', 'ASC', 'MC'].includes(planet.label);
          const baseRadius = isPoint ? R_INNER + 36 : R_OVERLAY_RING;
          const actualRadius = baseRadius + planet.radialOffset;
          const glyphPos = polarToXY(planet.originalAngle, actualRadius);
          const tickOuter = polarToXY(planet.originalAngle, R_OUTER - 1);
          const tickInner = polarToXY(planet.originalAngle, isPoint ? actualRadius + 15 : actualRadius + (PLANET_R * 0.75) + 2);
          const baseColor = planet.color;
          const glyph = planet.symbol; const glyphFont = glyph.length > 1 ? sans9Heavy : zodiacOverlay;
          const glyphWidth = glyphFont ? glyphFont.getTextWidth(glyph) : 10; const fontSize = glyphFont ? glyphFont.getSize() : 10;
          const glyphOffsetX = glyphWidth / 2; const glyphOffsetY = fontSize * 0.35;

          return (
            <Group key={`op-${planet.label}`}>
              <Line p1={vec(tickOuter.x, tickOuter.y)} p2={vec(tickInner.x, tickInner.y)} color={baseColor} strokeWidth={0.6} opacity={0.30}><DashPathEffect intervals={[2, 2]} /></Line>
              {!isPoint && (
                <>
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R * 0.75 + 4} color={baseColor} opacity={0.18} />
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R * 0.75 + 2} color={baseColor} opacity={0.10} />
                  <Circle cx={glyphPos.x + 1.2} cy={glyphPos.y + 1.5} r={PLANET_R * 0.75} color="rgba(0,0,0,0.45)"><BlurMask blur={3} style="normal" /></Circle>
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R * 0.75}>
                    <RadialGradient c={vec(glyphPos.x - (PLANET_R * 0.75) * 0.28, glyphPos.y - (PLANET_R * 0.75) * 0.28)} r={(PLANET_R * 0.75) * 1.6} colors={getUserSpherePalette(1)} positions={[0, 0.12, 0.30, 0.52, 0.78, 1]} />
                  </Circle>
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R * 0.75}>
                    <RadialGradient c={vec(glyphPos.x + (PLANET_R * 0.75) * 0.45, glyphPos.y + (PLANET_R * 0.75) * 0.45)} r={(PLANET_R * 0.75) * 1.2} colors={['rgba(30,18,4,0.65)', 'rgba(30,18,4,0.22)', 'rgba(0,0,0,0)']} positions={[0, 0.5, 1]} />
                  </Circle>
                  <Circle cx={glyphPos.x - (PLANET_R * 0.75) * 0.32} cy={glyphPos.y - (PLANET_R * 0.75) * 0.32} r={(PLANET_R * 0.75) * 0.18} color="#FEFAF0" />
                  <Circle cx={glyphPos.x - (PLANET_R * 0.75) * 0.26} cy={glyphPos.y - (PLANET_R * 0.75) * 0.26} r={(PLANET_R * 0.75) * 0.44} color="rgba(254,250,240,0.32)"><BlurMask blur={2} style="normal" /></Circle>
                  <Circle cx={glyphPos.x} cy={glyphPos.y} r={PLANET_R * 0.75 - 0.4} style="stroke" strokeWidth={1.2} color="rgba(232,201,122,0.55)" />
                </>
              )}
              {isPoint && planet.label === 'Chiron' ? (
                (() => {
                  const path = Skia.Path.Make(); const cx = glyphPos.x, cy = glyphPos.y;
                  path.addCircle(cx, cy - 4, 2.4); path.moveTo(cx, cy - 1.6); path.lineTo(cx, cy + 4); path.moveTo(cx, cy + 0.8); path.lineTo(cx + 3.6, cy - 2.8); path.moveTo(cx, cy + 0.8); path.lineTo(cx + 3.6, cy + 4);
                  return <Path path={path} style="stroke" strokeWidth={0.7} color={wheelPalette.pointText} strokeCap="round" />;
                })()
              ) : glyphFont && (
                <SkiaText x={glyphPos.x - glyphOffsetX} y={glyphPos.y + glyphOffsetY} text={glyph} font={glyphFont} color={wheelPalette.glyphText} style="stroke" strokeWidth={1.2} />
              )}
              {planet.isRetrograde && sans8 && <SkiaText x={glyphPos.x + 6.0} y={glyphPos.y - 5.5} text="R" font={sans8} color="#DC5050" />}
            </Group>
          );
        })}

        {/* ── ASC / MC axis labels ── */}
        {(chart as any).ascendant && (() => {
          const lon = getLongitude((chart as any).ascendant); if (lon === null) return null;
          const ascAng = astroToAngle(lon, ascLongitude); const dcAng  = astroToAngle(lon + 180, ascLongitude);
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
          const mcAng = astroToAngle(lon, ascLongitude); const icAng = astroToAngle(lon + 180, ascLongitude);
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

        {/* Glass face (deeper, cosmic) */}
        <Circle cx={CX} cy={CY} r={R_INNER}>
          <RadialGradient c={vec(CX - 10, CY - 12)} r={R_INNER * 1.8} colors={wheelPalette.centerFill} positions={[0, 0.55, 1]} />
        </Circle>

        <Circle cx={CX - R_INNER * 0.25} cy={CY - R_INNER * 0.35} r={3} color={wheelPalette.centerSparkle}><BlurMask blur={1.5} style="normal" /></Circle>

        {/* ── Center Hub: Inner Bezel ── */}
        <Group>
          <Circle cx={CX} cy={CY} r={R_INNER} style="stroke" strokeWidth={3} opacity={0.80}>
            <SweepGradient c={vec(CX, CY)} colors={wheelPalette.centerRing} positions={[0, 0.15, 0.5, 0.65, 1]} transform={[{rotate: 0.1}]} />
            <BlurMask blur={2} style="normal" />
          </Circle>
          <Path path={makeArcPath(CX, CY, R_INNER, -125, 38)} style="stroke" strokeWidth={2.5} strokeCap="round" color={wheelPalette.specularStrong}><BlurMask blur={1} style="normal" /></Path>
          
          <Circle cx={CX} cy={CY} r={R_INNER + 1} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient c={vec(CX, CY)} colors={[slateDeep, goldLight, goldDark, textInk, goldMain, goldLight, goldMain, textInk, goldLight, slateDeep]} positions={[0.0, 0.12, 0.25, 0.38, 0.52, 0.62, 0.78, 0.88, 0.95, 1.0]} transform={[{ rotate: -0.15 }]} />
          </Circle>
          <Circle cx={CX} cy={CY} r={R_INNER - 1} style="stroke" strokeWidth={1} opacity={0.95}>
            <SweepGradient c={vec(CX, CY)} colors={[slateMid, goldLight, goldMain, slateDeep, goldMain, goldLight, goldDark, textInk, goldLight, slateMid]} positions={[0.0, 0.1, 0.28, 0.42, 0.55, 0.65, 0.82, 0.9, 0.96, 1.0]} transform={[{ rotate: 0.1 }]} />
          </Circle>
        </Group>

        <Circle cx={CX} cy={CY} r={R_INNER - 3} style="stroke" strokeWidth={0.8} opacity={0.95}>
           <SweepGradient c={vec(CX, CY)} colors={[goldDark, goldLight, slateDeep, goldMain, goldLight, slateDeep, goldDark]} positions={[0.0, 0.15, 0.35, 0.5, 0.68, 0.85, 1.0]} transform={[{ rotate: -0.2 }]} />
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
