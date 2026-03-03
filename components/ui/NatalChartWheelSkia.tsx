// File: components/ui/NatalChartWheelSkia.tsx
//
// Cinematic Skia re-implementation of the natal chart wheel.
// Replaces react-native-svg with @shopify/react-native-skia 2.x for:
//   - Real blur (BlurMask) for bloom on aspect lines + planet glow
//   - SweepGradient for metal rim lighting
//   - RadialGradient for 3D planet spheres with specular highlights
//   - Turbulence shader for film-grain background texture
//   - Frosted-glass zodiac band via translucent fills + gradient sheens
//
// Props are identical to NatalChartWheel.tsx (drop-in replacement).

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Line,
  Path,
  Rect,
  Text,
  Group,
  Paint,
  BlurMask,
  RadialGradient,
  LinearGradient,
  SweepGradient,
  Turbulence,
  DashPathEffect,
  Fill,
  matchFont,
  Skia,
} from '@shopify/react-native-skia';

import { NatalChart, Aspect, HouseCusp } from '../../services/astrology/types';
import { theme } from '../../constants/theme';

// ─────────────────────────────────────────────────
// SEEDED PRNG (splitmix32) — deterministic star positions
// ─────────────────────────────────────────────────
function splitmix32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s |= 0;
    s = (s + 0x9e3779b9) | 0;
    let t = s ^ (s >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    t = t ^ (t >>> 15);
    return (t >>> 0) / 4294967296;
  };
}

// ─────────────────────────────────────────────────
// RING DIMENSIONS
// ─────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIZE = Math.min(SCREEN_WIDTH - 32, 380);
const CX = SIZE / 2;
const CY = SIZE / 2;

const R_OUTER        = SIZE / 2 - 4;
const R_ZODIAC_OUTER = R_OUTER;
const R_ZODIAC_INNER = R_OUTER - 36;
const R_HOUSE_OUTER  = R_ZODIAC_INNER;
const R_HOUSE_INNER  = R_ZODIAC_INNER - 28;
const R_PLANET_RING  = R_HOUSE_INNER - 16;
const R_ASPECT_RING  = R_PLANET_RING - 24;
const R_INNER        = 36;
const R_OVERLAY_RING = R_PLANET_RING - 8;

// ─────────────────────────────────────────────────
// ZODIAC DATA
// ─────────────────────────────────────────────────
const ZODIAC_SIGNS = [
  { name: 'Aries',       symbol: '♈', element: 'Fire'  },
  { name: 'Taurus',      symbol: '♉', element: 'Earth' },
  { name: 'Gemini',      symbol: '♊', element: 'Air'   },
  { name: 'Cancer',      symbol: '♋', element: 'Water' },
  { name: 'Leo',         symbol: '♌', element: 'Fire'  },
  { name: 'Virgo',       symbol: '♍', element: 'Earth' },
  { name: 'Libra',       symbol: '♎', element: 'Air'   },
  { name: 'Scorpio',     symbol: '♏', element: 'Water' },
  { name: 'Sagittarius', symbol: '♐', element: 'Fire'  },
  { name: 'Capricorn',   symbol: '♑', element: 'Earth' },
  { name: 'Aquarius',    symbol: '♒', element: 'Air'   },
  { name: 'Pisces',      symbol: '♓', element: 'Water' },
];

const ELEMENT_COLORS: Record<string, string> = {
  Fire:  '#C07878',
  Earth: '#6AAE82',
  Air:   '#86B4D8',
  Water: '#7480C4',
};

const ELEMENT_BG: Record<string, string> = {
  Fire:  'rgba(192,120,120,0.09)',
  Earth: 'rgba(106,174,130,0.09)',
  Air:   'rgba(134,180,216,0.09)',
  Water: 'rgba(116,128,196,0.09)',
};

// ─────────────────────────────────────────────────
// PLANET COLORS & GRADIENTS
// ─────────────────────────────────────────────────
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  Ascendant: 'AC', Midheaven: 'MC',
};

const PLANET_COLORS: Record<string, string> = {
  Sun: '#C2A65A', Moon: '#B8C2D0', Mercury: '#86BCEC', Venus: '#D07E9E',
  Mars: '#D07E7E', Jupiter: '#C2A65A', Saturn: '#8484A0', Uranus: '#6CBEC4',
  Neptune: '#7C8CD0', Pluto: '#9068BC', Ascendant: '#C2A65A', Midheaven: '#C2A65A',
};

const PLANET_GRADIENT_INNER: Record<string, string> = {
  Sun: '#E8D7A6', Jupiter: '#E8D7A6', Ascendant: '#E8D7A6', Midheaven: '#E8D7A6',
  Moon: '#D4DDE8', Mercury: '#B8D4F0', Venus: '#EAB8C8', Mars: '#E8B4B4',
  Saturn: '#B0B0C8', Uranus: '#A8DAE0', Neptune: '#B0BCEC', Pluto: '#C8B4E4',
};

const PLANET_GRADIENT_OUTER: Record<string, string> = {
  Sun: '#7E6330', Jupiter: '#7E6330', Ascendant: '#7E6330', Midheaven: '#7E6330',
  Moon: '#748098', Mercury: '#44849C', Venus: '#9C4C6C', Mars: '#9C4C4C',
  Saturn: '#505070', Uranus: '#348490', Neptune: '#44549C', Pluto: '#5E4088',
};

const OVERLAY_PLANET_COLORS: Record<string, string> = {
  Sun: '#8C7CCF', Moon: '#7C70C0', Mercury: '#7080C4', Venus: '#9878C8',
  Mars: '#9870B8', Jupiter: '#8C7CCF', Saturn: '#6864A8', Uranus: '#7090C8',
  Neptune: '#6878C0', Pluto: '#8068C0', Ascendant: '#8C7CCF', Midheaven: '#8C7CCF',
};

const OVERLAY_GRADIENT_INNER: Record<string, string> = {
  Sun: '#C4B8F0', Moon: '#B8ACEC', Mercury: '#B0BCEC', Venus: '#C8B0F0',
  Mars: '#C4ACEC', Jupiter: '#C4B8F0', Saturn: '#A8A4DC', Uranus: '#B0C0EC',
  Neptune: '#A8B8E8', Pluto: '#C0AEE8', Ascendant: '#C4B8F0', Midheaven: '#C4B8F0',
};

const OVERLAY_GRADIENT_OUTER: Record<string, string> = {
  Sun: '#2E2550', Moon: '#28205C', Mercury: '#243060', Venus: '#38285C',
  Mars: '#3C2858', Jupiter: '#2E2550', Saturn: '#20205C', Uranus: '#243060',
  Neptune: '#202858', Pluto: '#2E2060', Ascendant: '#2E2550', Midheaven: '#2E2550',
};

// ─────────────────────────────────────────────────
// ASPECT COLORS
// ─────────────────────────────────────────────────
const ASPECT_LINE_COLORS: Record<string, string> = {
  Harmonious:  'rgba(110,191,139,0.28)',
  Challenging: 'rgba(224,122,122,0.28)',
  Neutral:     'rgba(194,166,90,0.32)',
};

const ASPECT_STRONG_COLORS: Record<string, string> = {
  Harmonious:  'rgba(110,191,139,0.52)',
  Challenging: 'rgba(224,122,122,0.52)',
  Neutral:     'rgba(194,166,90,0.58)',
};

const CROSS_ASPECT_COLORS: Record<string, { tight: string; loose: string }> = {
  Harmonious:  { tight: 'rgba(159,168,184,0.42)', loose: 'rgba(159,168,184,0.22)' },
  Challenging: { tight: 'rgba(175,162,178,0.42)', loose: 'rgba(175,162,178,0.22)' },
  Neutral:     { tight: 'rgba(159,168,184,0.42)', loose: 'rgba(159,168,184,0.22)' },
};

// ─────────────────────────────────────────────────
// MATH HELPERS
// ─────────────────────────────────────────────────
function astroToAngle(longitude: number, ascLongitude: number): number {
  const adjusted = longitude - ascLongitude;
  return (-adjusted * Math.PI) / 180;
}

function polarToXY(angle: number, radius: number): { x: number; y: number } {
  return {
    x: CX + radius * Math.cos(angle),
    y: CY - radius * Math.sin(angle),
  };
}

/** Returns an SVG arc path string (consumed by Skia.Path.MakeFromSVGString). */
function arcPath(startAngle: number, endAngle: number, outerR: number, innerR: number): string {
  const s1 = polarToXY(startAngle, outerR);
  const e1 = polarToXY(endAngle,   outerR);
  const s2 = polarToXY(endAngle,   innerR);
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

// ─────────────────────────────────────────────────
// DATA NORMALIZATION
// ─────────────────────────────────────────────────
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
    obj.isRetrograde ?? obj.retrograde ?? obj.is_retrograde ?? obj.Retrograde ??
    obj?.ChartPosition?.Retrograde ?? obj?.chartPosition?.retrograde;
  return !!v;
}

function normalizePlanetName(name: unknown): string {
  const s = String(name ?? '').trim();
  if (!s) return '';
  const low = s.toLowerCase();
  if (low === 'asc' || low.includes('ascendant') || low.includes('rising')) return 'Ascendant';
  if (low === 'mc'  || low.includes('midheaven'))                            return 'Midheaven';
  if (low === 'sun')     return 'Sun';
  if (low === 'moon')    return 'Moon';
  if (low === 'mercury') return 'Mercury';
  if (low === 'venus')   return 'Venus';
  if (low === 'mars')    return 'Mars';
  if (low === 'jupiter') return 'Jupiter';
  if (low === 'saturn')  return 'Saturn';
  if (low === 'uranus')  return 'Uranus';
  if (low === 'neptune') return 'Neptune';
  if (low === 'pluto')   return 'Pluto';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getChartPlanet(chart: NatalChart, name: string): any | null {
  const direct = (chart as any)[name.toLowerCase()] ?? (chart as any)[name];
  if (direct) return direct;
  const list = (chart as any).planets;
  if (Array.isArray(list)) {
    const found = list.find(
      (p: any) => normalizePlanetName(p?.planet ?? p?.name ?? p?.key) === name,
    );
    return found ?? null;
  }
  return null;
}

// ─────────────────────────────────────────────────
// COLLISION AVOIDANCE
// ─────────────────────────────────────────────────
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
  minSeparationDeg: number = 8,
): PlacedPlanet[] {
  const items: PlacedPlanet[] = planets.map((p) => {
    const angle = astroToAngle(p.longitude, ascLongitude);
    return {
      label: p.label,
      symbol: PLANET_SYMBOLS[p.label] || '?',
      color:  PLANET_COLORS[p.label]  || theme.textPrimary,
      originalAngle: angle,
      displayAngle:  angle,
      longitude:     p.longitude,
      isRetrograde:  p.isRetrograde,
    };
  });

  items.sort((a, b) => a.originalAngle - b.originalAngle);

  const minSepRad = (minSeparationDeg * Math.PI) / 180;
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        let diff = items[j].displayAngle - items[i].displayAngle;
        while (diff >  Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        if (Math.abs(diff) < minSepRad) {
          const push = (minSepRad - Math.abs(diff)) / 2;
          if (diff >= 0) { items[i].displayAngle -= push; items[j].displayAngle += push; }
          else           { items[i].displayAngle += push; items[j].displayAngle -= push; }
        }
      }
    }
  }

  return items;
}

// ─────────────────────────────────────────────────
// TEXT CENTERING HELPERS
// ─────────────────────────────────────────────────
/** Return the x offset so the string is horizontally centered at pos.x */
function textX(pos: { x: number }, str: string, font: ReturnType<typeof matchFont>): number {
  try { return pos.x - font.getTextWidth(str) / 2; } catch { return pos.x; }
}

/** Return the y offset so the string is optically vertically centered at pos.y */
function textY(pos: { y: number }, font: ReturnType<typeof matchFont>): number {
  try {
    const m = font.getMetrics();
    // m.ascent is negative in Skia; use abs. Shift down by ~35% of cap-height.
    return pos.y + Math.abs(m.ascent) * 0.35;
  } catch { return pos.y; }
}

// ─────────────────────────────────────────────────
// COMPONENT PROPS
// ─────────────────────────────────────────────────
interface Props {
  chart: NatalChart;
  showAspects?: boolean;
  overlayChart?: NatalChart;
  overlayName?: string;
}

// ─────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────
export default function NatalChartWheel({
  chart,
  showAspects = true,
  overlayChart,
  overlayName,
}: Props) {
  const ascLongitude = getLongitude(chart.ascendant) ?? 0;

  // ── Fonts (synchronous system font — no async load needed) ──
  const symbolFont = matchFont({ fontFamily: 'System', fontSize: 13, fontWeight: 'bold',   fontStyle: 'normal' });
  const smallFont  = matchFont({ fontFamily: 'System', fontSize: 9,  fontWeight: '500',    fontStyle: 'normal' });
  const tinyFont   = matchFont({ fontFamily: 'System', fontSize: 7,  fontWeight: '700',    fontStyle: 'normal' });
  const microFont  = matchFont({ fontFamily: 'System', fontSize: 6,  fontWeight: '700',    fontStyle: 'normal' });
  const acFont     = matchFont({ fontFamily: 'System', fontSize: 8,  fontWeight: '600',    fontStyle: 'normal' });

  // ── Deterministic star positions (inner-disk area only) ──
  const stars = useMemo(() => {
    const maxR = R_ZODIAC_INNER - R_INNER - 8;
    return Array.from({ length: 60 }, (_, i) => {
      const rand  = splitmix32(i * 2654435761);
      const r     = rand() * maxR * 0.95 + R_INNER + 4;
      const angle = rand() * Math.PI * 2;
      return {
        x:       CX + r * Math.cos(angle),
        y:       CY + r * Math.sin(angle),
        radius:  rand() * 0.8 + 0.3,
        opacity: rand() * 0.4 + 0.1,
      };
    });
  }, []);

  // ── Zodiac arc paths (pre-parse once; reusable SkPath objects) ──
  const zodiacPaths = useMemo(() => {
    return ZODIAC_SIGNS.map((sign, i) => {
      const startLon   = i * 30;
      const startAngle = astroToAngle(startLon,      ascLongitude);
      const endAngle   = astroToAngle(startLon + 30, ascLongitude);
      const midAngle   = astroToAngle(startLon + 15, ascLongitude);
      const svgStr     = arcPath(startAngle, endAngle, R_ZODIAC_OUTER, R_ZODIAC_INNER);
      return {
        sign,
        path:     Skia.Path.MakeFromSVGString(svgStr)!,
        midAngle,
      };
    });
  }, [ascLongitude]);

  // ── Natal planets ──
  const placedPlanets = useMemo(() => {
    const labels = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
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
    placedPlanets.forEach((p) => { map[p.label] = p.longitude; });
    return map;
  }, [placedPlanets]);

  // ── Overlay (synastry) planets ──
  const placedOverlayPlanets = useMemo(() => {
    if (!overlayChart) return [];
    const labels = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [];
    for (const label of labels) {
      const obj = getChartPlanet(overlayChart, label);
      const lon = getLongitude(obj);
      if (lon === null) continue;
      raw.push({ label, longitude: lon, isRetrograde: getRetrograde(obj) });
    }
    const placed = spreadPlanets(raw, ascLongitude, 8);
    return placed.map((p) => ({ ...p, color: OVERLAY_PLANET_COLORS[p.label] || '#8C7CCF' }));
  }, [overlayChart, ascLongitude]);

  // ── Cross-chart synastry aspects ──
  const crossAspects = useMemo(() => {
    if (!overlayChart || !showAspects) return [];
    const ORBS = [
      { angle: 0,   orb: 8, nature: 'Neutral'     },
      { angle: 180, orb: 8, nature: 'Challenging'  },
      { angle: 120, orb: 6, nature: 'Harmonious'   },
      { angle: 90,  orb: 6, nature: 'Challenging'  },
      { angle: 60,  orb: 4, nature: 'Harmonious'   },
    ];
    const results: { lon1: number; lon2: number; nature: string; orb: number }[] = [];
    for (const pp of placedPlanets) {
      for (const op of placedOverlayPlanets) {
        for (const asp of ORBS) {
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
      .filter((a: Aspect) => a?.orb < 8 && ['Conjunction','Opposition','Trine','Square','Sextile'].includes(a?.type?.name))
      .sort((a: Aspect, b: Aspect) => (a.orb ?? 99) - (b.orb ?? 99))
      .slice(0, 20);
  }, [chart.aspects, showAspects]);

  // ── Accessibility ──
  const accessibilitySummary = useMemo(() => {
    const parts: string[] = ['Natal chart wheel'];
    for (const label of ['Sun','Moon','Mercury','Venus','Mars']) {
      const obj  = getChartPlanet(chart, label);
      const sign = (obj as any)?.sign?.name ?? (obj as any)?.Sign?.label;
      if (sign) parts.push(`${label} in ${sign}`);
    }
    if (overlayChart && overlayName) parts.push(`Synastry overlay with ${overlayName}`);
    return parts.join('. ');
  }, [chart, overlayChart, overlayName]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilitySummary}
    >
      <Canvas style={{ width: SIZE, height: SIZE }}>

        {/* ══════════════════════════════════════════
            LAYER 1 — Deep navy radial background
        ══════════════════════════════════════════ */}
        <Circle cx={CX} cy={CY} r={R_OUTER}>
          <RadialGradient
            c={{ x: CX, y: CY }}
            r={R_OUTER}
            colors={['#0C1C2Eff', '#0A1626ff', '#0F2238ff']}
            positions={[0, 0.65, 1]}
          />
        </Circle>

        {/* ══════════════════════════════════════════
            LAYER 2 — Nebula / vignette overlay
        ══════════════════════════════════════════ */}
        <Circle cx={CX} cy={CY} r={R_OUTER}>
          <RadialGradient
            c={{ x: CX, y: CY }}
            r={R_OUTER}
            colors={['rgba(61,41,82,0.18)', 'rgba(45,58,92,0.08)', 'rgba(10,22,38,0)']}
            positions={[0, 0.4, 1]}
          />
        </Circle>

        {/* ══════════════════════════════════════════
            LAYER 3 — Film grain (Turbulence shader)
        ══════════════════════════════════════════ */}
        <Rect x={0} y={0} width={SIZE} height={SIZE} opacity={0.025}>
          <Paint>
            <Turbulence freqX={0.65} freqY={0.65} octaves={8} />
          </Paint>
        </Rect>

        {/* ══════════════════════════════════════════
            LAYER 4 — Deterministic stars
        ══════════════════════════════════════════ */}
        {stars.map((s, i) => (
          <Circle key={`star-${i}`} cx={s.x} cy={s.y} r={s.radius} color="white" opacity={s.opacity} />
        ))}

        {/* ══════════════════════════════════════════
            LAYER 5 — Zodiac ring (frosted glass arcs)
        ══════════════════════════════════════════ */}
        {zodiacPaths.map(({ sign, path, midAngle }) => {
          const labelPos = polarToXY(midAngle, (R_ZODIAC_OUTER + R_ZODIAC_INNER) / 2);
          const elColor  = ELEMENT_COLORS[sign.element];
          return (
            <Group key={sign.name}>
              {/* Frosted fill */}
              <Path path={path} color={ELEMENT_BG[sign.element]} />
              {/* Segment border */}
              <Path path={path} style="stroke" strokeWidth={0.5} color="rgba(194,166,90,0.10)" />
              {/* Sign glyph */}
              <Text
                x={textX(labelPos, sign.symbol, symbolFont)}
                y={textY(labelPos, symbolFont)}
                text={sign.symbol}
                font={symbolFont}
                color={elColor}
              />
            </Group>
          );
        })}

        {/* ══════════════════════════════════════════
            LAYER 6 — Metal outer rim (SweepGradient)
        ══════════════════════════════════════════ */}
        {/* Broad glow behind rim */}
        <Circle cx={CX} cy={CY} r={R_ZODIAC_OUTER} style="stroke" strokeWidth={4} color="#C2A65A" opacity={0.06} />
        {/* Metallic sweep */}
        <Circle cx={CX} cy={CY} r={R_ZODIAC_OUTER} style="stroke" strokeWidth={1.5}>
          <Paint style="stroke" strokeWidth={1.5}>
            <SweepGradient
              c={{ x: CX, y: CY }}
              colors={['#E8D7A6', '#9E7A30', '#C2A65A', '#9E7A30', '#E8D7A6']}
              positions={[0, 0.375, 0.5, 0.625, 1]}
            />
          </Paint>
        </Circle>
        {/* Inner zodiac border — champagne thin */}
        <Circle cx={CX} cy={CY} r={R_ZODIAC_INNER} style="stroke" strokeWidth={0.6} color="rgba(194,166,90,0.14)" />

        {/* ══════════════════════════════════════════
            LAYER 7 — Sign division lines (etched)
        ══════════════════════════════════════════ */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = astroToAngle(i * 30, ascLongitude);
          const outer = polarToXY(angle, R_ZODIAC_OUTER);
          const inner = polarToXY(angle, R_ZODIAC_INNER);
          return (
            <Group key={`sdiv-${i}`}>
              {/* Shadow offset */}
              <Line
                p1={{ x: outer.x + 0.5, y: outer.y + 0.5 }}
                p2={{ x: inner.x + 0.5, y: inner.y + 0.5 }}
                color="rgba(0,0,0,0.22)" strokeWidth={0.8}
              />
              {/* Bright etch */}
              <Line
                p1={{ x: outer.x, y: outer.y }}
                p2={{ x: inner.x, y: inner.y }}
                color="rgba(194,166,90,0.14)" strokeWidth={0.6}
              />
            </Group>
          );
        })}

        {/* ══════════════════════════════════════════
            LAYER 8 — House cusp lines + numbers
        ══════════════════════════════════════════ */}
        {(chart.houseCusps ?? []).map((cusp: HouseCusp) => {
          const angle     = astroToAngle(cusp.longitude, ascLongitude);
          const outer     = polarToXY(angle, R_ZODIAC_INNER);
          const inner     = polarToXY(angle, R_INNER);
          const isAngular = [1, 4, 7, 10].includes(cusp.house);

          // House number midpoint
          const nextCusp = (chart.houseCusps ?? []).find(
            (c: HouseCusp) => c.house === (cusp.house % 12) + 1,
          );
          let midLon = cusp.longitude;
          if (nextCusp) {
            let diff = nextCusp.longitude - cusp.longitude;
            if (diff < 0) diff += 360;
            midLon = cusp.longitude + diff / 2;
            if (midLon >= 360) midLon -= 360;
          }
          const midAngle = astroToAngle(midLon, ascLongitude);
          const numPos   = polarToXY(midAngle, R_HOUSE_INNER);
          const numStr   = String(cusp.house);

          return (
            <Group key={`house-${cusp.house}`}>
              <Line
                p1={{ x: outer.x, y: outer.y }}
                p2={{ x: inner.x, y: inner.y }}
                color={isAngular ? 'rgba(194,166,90,0.35)' : 'rgba(255,255,255,0.07)'}
                strokeWidth={isAngular ? 1.2 : 0.5}
              />
              <Text
                x={textX(numPos, numStr, tinyFont)}
                y={textY(numPos, tinyFont)}
                text={numStr}
                font={tinyFont}
                color="rgba(255,255,255,0.20)"
              />
            </Group>
          );
        })}

        {/* ══════════════════════════════════════════
            LAYERS 9A+9B — Natal aspect lines with bloom
        ══════════════════════════════════════════ */}
        {/* 9A: Glow pass (wide + blurred) */}
        {showAspects && visibleAspects.map((asp: Aspect, idx: number) => {
          const p1Name = normalizePlanetName(asp?.planet1?.name);
          const p2Name = normalizePlanetName(asp?.planet2?.name);
          const lon1   = planetLongitudes[p1Name];
          const lon2   = planetLongitudes[p2Name];
          if (lon1 === undefined || lon2 === undefined) return null;
          const a1 = astroToAngle(lon1, ascLongitude);
          const a2 = astroToAngle(lon2, ascLongitude);
          const p1 = polarToXY(a1, R_ASPECT_RING);
          const p2 = polarToXY(a2, R_ASPECT_RING);
          const nature    = asp?.type?.nature ?? 'Neutral';
          const glowColor = ASPECT_LINE_COLORS[nature];
          return (
            <Line key={`asp-glow-${idx}`} p1={p1} p2={p2} color={glowColor} strokeWidth={4} opacity={0.18}>
              <BlurMask blur={5} style="normal" respectCTM />
            </Line>
          );
        })}

        {/* 9B: Crisp line pass */}
        {showAspects && visibleAspects.map((asp: Aspect, idx: number) => {
          const p1Name = normalizePlanetName(asp?.planet1?.name);
          const p2Name = normalizePlanetName(asp?.planet2?.name);
          const lon1   = planetLongitudes[p1Name];
          const lon2   = planetLongitudes[p2Name];
          if (lon1 === undefined || lon2 === undefined) return null;
          const a1 = astroToAngle(lon1, ascLongitude);
          const a2 = astroToAngle(lon2, ascLongitude);
          const p1 = polarToXY(a1, R_ASPECT_RING);
          const p2 = polarToXY(a2, R_ASPECT_RING);
          const isTight  = (asp.orb ?? 99) < 3;
          const nature   = asp?.type?.nature ?? 'Neutral';
          const color    = isTight ? ASPECT_STRONG_COLORS[nature] : ASPECT_LINE_COLORS[nature];
          const isDashed = nature !== 'Harmonious';
          return (
            <Line key={`asp-${idx}`} p1={p1} p2={p2} color={color} strokeWidth={isTight ? 1.2 : 0.6}>
              {isDashed && <DashPathEffect intervals={[4, 3]} />}
            </Line>
          );
        })}

        {/* ══════════════════════════════════════════
            LAYER 10 — Cross-chart synastry aspects
        ══════════════════════════════════════════ */}
        {crossAspects.map((ca, idx) => {
          const a1 = astroToAngle(ca.lon1, ascLongitude);
          const a2 = astroToAngle(ca.lon2, ascLongitude);
          const p1 = polarToXY(a1, R_ASPECT_RING);
          const p2 = polarToXY(a2, R_ASPECT_RING);
          const isTight = ca.orb < 3;
          const c = CROSS_ASPECT_COLORS[ca.nature] ?? CROSS_ASPECT_COLORS.Neutral;
          return (
            <Group key={`cross-${idx}`}>
              {/* Diffuse glow layer */}
              <Line p1={p1} p2={p2} color="rgba(159,168,184,1)" strokeWidth={isTight ? 2.0 : 1.5} opacity={0.08} />
              {/* Platinum silk thread */}
              <Line p1={p1} p2={p2} color={isTight ? c.tight : c.loose} strokeWidth={isTight ? 0.5 : 0.3}>
                <DashPathEffect intervals={[2, 4]} />
              </Line>
            </Group>
          );
        })}

        {/* ══════════════════════════════════════════
            LAYERS 11–16 — Natal planet glyphs
            (tick → glow halo → sphere → specular → symbol → retrograde)
        ══════════════════════════════════════════ */}
        {placedPlanets.map((planet) => {
          const glyphPos   = polarToXY(planet.displayAngle, R_PLANET_RING);
          const tickOuter  = polarToXY(planet.originalAngle, R_ZODIAC_INNER - 1);
          const tickInner  = polarToXY(planet.originalAngle, R_PLANET_RING + 10);
          const baseColor  = PLANET_COLORS[planet.label]          || '#C2A65A';
          const innerColor = PLANET_GRADIENT_INNER[planet.label]  || baseColor;
          const outerColor = PLANET_GRADIENT_OUTER[planet.label]  || baseColor;
          const sym        = planet.symbol;
          const sFont      = sym.length > 1 ? acFont : symbolFont;

          return (
            <Group key={planet.label}>
              {/* L11: Position tick */}
              <Line
                p1={{ x: tickOuter.x, y: tickOuter.y }}
                p2={{ x: tickInner.x, y: tickInner.y }}
                color={baseColor} strokeWidth={0.8} opacity={0.45}
              />

              {/* L12: Glow halos (blurred wide circles) */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={15} color={baseColor} opacity={0.10}>
                <BlurMask blur={6} style="normal" respectCTM />
              </Circle>
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={12} color={baseColor} opacity={0.06}>
                <BlurMask blur={4} style="normal" respectCTM />
              </Circle>

              {/* L13: Gradient sphere — light source top-left */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={11}>
                <RadialGradient
                  c={{ x: glyphPos.x - 3, y: glyphPos.y - 3 }}
                  r={16}
                  colors={[innerColor, outerColor]}
                  positions={[0, 1]}
                />
              </Circle>
              {/* Sphere rim */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={11} style="stroke" strokeWidth={0.8} color={baseColor} opacity={0.95} />

              {/* L14: Specular highlight */}
              <Circle cx={glyphPos.x - 3.5} cy={glyphPos.y - 3.5} r={3} color="white" opacity={0.35} />

              {/* L15: Planet glyph */}
              <Text
                x={textX(glyphPos, sym, sFont)}
                y={textY(glyphPos, sFont)}
                text={sym}
                font={sFont}
                color={baseColor}
              />

              {/* L16: Retrograde marker */}
              {planet.isRetrograde && (
                <Text
                  x={textX({ x: glyphPos.x + 10 }, '℞', microFont)}
                  y={glyphPos.y - 8}
                  text="℞"
                  font={microFont}
                  color={theme.warning}
                />
              )}
            </Group>
          );
        })}

        {/* ══════════════════════════════════════════
            OVERLAY PLANET GLYPHS (velvet indigo)
        ══════════════════════════════════════════ */}
        {placedOverlayPlanets.map((planet) => {
          const glyphPos   = polarToXY(planet.displayAngle, R_OVERLAY_RING);
          const tickOuter  = polarToXY(planet.originalAngle, R_ZODIAC_INNER - 1);
          const tickInner  = polarToXY(planet.originalAngle, R_OVERLAY_RING + 10);
          const baseColor  = planet.color;
          const innerColor = OVERLAY_GRADIENT_INNER[planet.label] || baseColor;
          const outerColor = OVERLAY_GRADIENT_OUTER[planet.label] || baseColor;
          const sym        = planet.symbol;
          const sFont      = sym.length > 1 ? acFont : symbolFont;

          return (
            <Group key={`ov-${planet.label}`}>
              {/* Dashed tick for overlay */}
              <Line
                p1={{ x: tickOuter.x, y: tickOuter.y }}
                p2={{ x: tickInner.x, y: tickInner.y }}
                color={baseColor} strokeWidth={0.6} opacity={0.35}
              >
                <DashPathEffect intervals={[2, 2]} />
              </Line>

              {/* Glow halo */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={13} color={baseColor} opacity={0.07}>
                <BlurMask blur={5} style="normal" respectCTM />
              </Circle>

              {/* Gradient sphere */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={9}>
                <RadialGradient
                  c={{ x: glyphPos.x - 2.5, y: glyphPos.y - 2.5 }}
                  r={14}
                  colors={[innerColor, outerColor]}
                  positions={[0, 1]}
                />
              </Circle>
              {/* Dashed sphere border (distinguishes overlay from natal) */}
              <Circle cx={glyphPos.x} cy={glyphPos.y} r={9} style="stroke" strokeWidth={1.2} color={baseColor} opacity={0.88}>
                <DashPathEffect intervals={[3, 2]} />
              </Circle>

              {/* Specular */}
              <Circle cx={glyphPos.x - 2.5} cy={glyphPos.y - 2.5} r={2.5} color="white" opacity={0.28} />

              {/* Glyph */}
              <Text
                x={textX(glyphPos, sym, sFont)}
                y={textY(glyphPos, sFont)}
                text={sym}
                font={sFont}
                color={baseColor}
              />

              {planet.isRetrograde && (
                <Text
                  x={textX({ x: glyphPos.x + 8 }, '℞', microFont)}
                  y={glyphPos.y - 6}
                  text="℞"
                  font={microFont}
                  color={theme.warning}
                />
              )}
            </Group>
          );
        })}

        {/* ══════════════════════════════════════════
            LAYER 17 — ASC / MC axis labels
        ══════════════════════════════════════════ */}
        {(() => {
          const ascLon = getLongitude(chart.ascendant);
          if (ascLon === null) return null;
          const pos = polarToXY(astroToAngle(ascLon, ascLongitude), R_ZODIAC_INNER - 12);
          return (
            <Text
              x={textX(pos, 'ASC', tinyFont)}
              y={textY(pos, tinyFont)}
              text="ASC"
              font={tinyFont}
              color={theme.primary}
            />
          );
        })()}

        {(() => {
          const mcLon = getLongitude(chart.midheaven);
          if (mcLon === null) return null;
          const pos = polarToXY(astroToAngle(mcLon, ascLongitude), R_ZODIAC_INNER - 12);
          return (
            <Text
              x={textX(pos, 'MC', tinyFont)}
              y={textY(pos, tinyFont)}
              text="MC"
              font={tinyFont}
              color={theme.primary}
            />
          );
        })()}

        {/* ══════════════════════════════════════════
            LAYER 18 — Inner ring border
        ══════════════════════════════════════════ */}
        <Circle cx={CX} cy={CY} r={R_HOUSE_OUTER} style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.05)" />

        {/* ══════════════════════════════════════════
            LAYER 19 — Center hub (watch-face glass lens)
        ══════════════════════════════════════════ */}
        {/* Champagne outer glow */}
        <Circle cx={CX} cy={CY} r={R_INNER + 18} color="#C2A65A" opacity={0.10}>
          <BlurMask blur={8} style="normal" respectCTM />
        </Circle>
        {/* Navy shadow halo */}
        <Circle cx={CX} cy={CY} r={R_INNER + 4} style="stroke" strokeWidth={6} color="rgba(10,22,38,0.60)" />
        {/* Glass face */}
        <Circle cx={CX} cy={CY} r={R_INNER}>
          <RadialGradient
            c={{ x: CX - R_INNER * 0.1, y: CY - R_INNER * 0.15 }}
            r={R_INNER * 1.4}
            colors={['#1A3050f2', '#080F1Aff']}
            positions={[0, 1]}
          />
        </Circle>
        {/* Metallic rim */}
        <Circle cx={CX} cy={CY} r={R_INNER + 0.5} style="stroke" strokeWidth={1.2} color="#3A4A63" opacity={0.7} />
        {/* Champagne rim highlight */}
        <Circle cx={CX} cy={CY} r={R_INNER} style="stroke" strokeWidth={0.7} color="rgba(194,166,90,0.22)" />
        {/* Inner shadow */}
        <Circle cx={CX} cy={CY} r={R_INNER - 2} style="stroke" strokeWidth={1.5} color="rgba(0,0,0,0.20)" />

        {/* ══════════════════════════════════════════
            LAYER 20 — Synastry label in center hub
        ══════════════════════════════════════════ */}
        {overlayChart && overlayName && (() => {
          const label   = 'SYNASTRY';
          const nameStr = overlayName.length > 9 ? overlayName.slice(0, 9) + '\u2026' : overlayName;
          const topPos  = { x: CX, y: CY - 8 };
          const botPos  = { x: CX, y: CY + 8 };
          return (
            <Group>
              <Text
                x={textX(topPos, label, tinyFont)}
                y={textY(topPos, tinyFont)}
                text={label}
                font={tinyFont}
                color="rgba(255,255,255,0.60)"
              />
              <Text
                x={textX(botPos, nameStr, acFont)}
                y={textY(botPos, acFont)}
                text={nameStr}
                font={acFont}
                color="rgba(194,166,90,0.80)"
              />
            </Group>
          );
        })()}

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
