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
import { NatalChart, PlanetPlacement, Aspect, HouseCusp } from '../../services/astrology/types';
import { theme } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Configuration ──
const SIZE = Math.min(SCREEN_WIDTH - 32, 380);
const CX = SIZE / 2;
const CY = SIZE / 2;

// Ring radii (from outside in)
const R_OUTER = SIZE / 2 - 4;       // outermost edge
const R_ZODIAC_OUTER = R_OUTER;     // zodiac band outer
const R_ZODIAC_INNER = R_OUTER - 36; // zodiac band inner (sign glyphs live here)
const R_HOUSE_OUTER = R_ZODIAC_INNER; // house ring outer
const R_HOUSE_INNER = R_ZODIAC_INNER - 28; // house numbers
const R_PLANET_RING = R_HOUSE_INNER - 16; // planet glyphs orbit
const R_ASPECT_RING = R_PLANET_RING - 24; // aspect lines live inside this
const R_INNER = 30; // inner circle

// ── Zodiac Data ──
const ZODIAC_SIGNS = [
  { name: 'Aries',       symbol: '♈', element: 'Fire' },
  { name: 'Taurus',      symbol: '♉', element: 'Earth' },
  { name: 'Gemini',      symbol: '♊', element: 'Air' },
  { name: 'Cancer',      symbol: '♋', element: 'Water' },
  { name: 'Leo',         symbol: '♌', element: 'Fire' },
  { name: 'Virgo',       symbol: '♍', element: 'Earth' },
  { name: 'Libra',       symbol: '♎', element: 'Air' },
  { name: 'Scorpio',     symbol: '♏', element: 'Water' },
  { name: 'Sagittarius', symbol: '♐', element: 'Fire' },
  { name: 'Capricorn',   symbol: '♑', element: 'Earth' },
  { name: 'Aquarius',    symbol: '♒', element: 'Air' },
  { name: 'Pisces',      symbol: '♓', element: 'Water' },
];

const ELEMENT_COLORS: Record<string, string> = {
  Fire:  '#E07A7A',
  Earth: '#6EBF8B',
  Air:   '#8BC4E8',
  Water: '#7A8BE0',
};

const ELEMENT_BG: Record<string, string> = {
  Fire:  'rgba(224,122,122,0.12)',
  Earth: 'rgba(110,191,139,0.12)',
  Air:   'rgba(139,196,232,0.12)',
  Water: 'rgba(122,139,224,0.12)',
};

// ── Planet display symbols (shorter for tight space) ──
const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  Ascendant: 'AC', Midheaven: 'MC',
};

const PLANET_COLORS: Record<string, string> = {
  Sun: '#C9A962', Moon: '#B8C4D8', Mercury: '#8BC4E8', Venus: '#E07A98',
  Mars: '#E07A7A', Jupiter: '#E0B07A', Saturn: '#8B8BA8', Uranus: '#6EBFBF',
  Neptune: '#7A8BE0', Pluto: '#9B6EBF', Ascendant: '#C9A962', Midheaven: '#C9A962',
};

// ── Aspect colors ──
const ASPECT_LINE_COLORS: Record<string, string> = {
  Harmonious: 'rgba(110,191,139,0.4)',
  Challenging: 'rgba(224,122,122,0.4)',
  Neutral:    'rgba(201,169,98,0.5)',
};

const ASPECT_STRONG_COLORS: Record<string, string> = {
  Harmonious: 'rgba(110,191,139,0.7)',
  Challenging: 'rgba(224,122,122,0.7)',
  Neutral:    'rgba(201,169,98,0.8)',
};

// ══════════════════════════════════════════════════
// MATH HELPERS
// ══════════════════════════════════════════════════

/**
 * Convert ecliptic longitude (0° Aries = 0) to canvas angle.
 * Astro charts place 0° Aries at the left (9 o'clock), going counter-clockwise.
 * BUT we rotate the whole wheel so the Ascendant sits at 9 o'clock.
 */
function astroToAngle(longitude: number, ascLongitude: number): number {
  // Place Ascendant at 180° (left / 9-o'clock)
  const offset = ascLongitude;
  const adjusted = longitude - offset;
  // Astrology goes counter-clockwise, canvas goes clockwise
  const angleDeg = -adjusted;
  return (angleDeg * Math.PI) / 180;
}

function polarToXY(angle: number, radius: number): { x: number; y: number } {
  return {
    x: CX + radius * Math.cos(angle),
    y: CY - radius * Math.sin(angle), // SVG Y is inverted
  };
}

/**
 * Create an SVG arc path between two angles at a given radius.
 */
function arcPath(
  startAngle: number,
  endAngle: number,
  outerR: number,
  innerR: number
): string {
  const s1 = polarToXY(startAngle, outerR);
  const e1 = polarToXY(endAngle, outerR);
  const s2 = polarToXY(endAngle, innerR);
  const e2 = polarToXY(startAngle, innerR);

  // Determine if the arc is > 180 degrees
  let sweep = startAngle - endAngle; // counter-clockwise
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

  // Sort by original angle
  items.sort((a, b) => a.originalAngle - b.originalAngle);

  // Push apart any that are too close
  const minSepRad = (minSeparationDeg * Math.PI) / 180;
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        let diff = items[j].displayAngle - items[i].displayAngle;
        // Normalize to [-PI, PI]
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
}

export default function NatalChartWheel({ chart, showAspects = true }: Props) {
  const ascLongitude = chart.ascendant?.longitude ?? 0;

  // ── Prepare planets ──
  const placedPlanets = useMemo(() => {
    const raw: { label: string; longitude: number; isRetrograde: boolean }[] = [
      { label: 'Sun', longitude: chart.sun.longitude, isRetrograde: false },
      { label: 'Moon', longitude: chart.moon.longitude, isRetrograde: false },
      { label: 'Mercury', longitude: chart.mercury.longitude, isRetrograde: chart.mercury.isRetrograde },
      { label: 'Venus', longitude: chart.venus.longitude, isRetrograde: chart.venus.isRetrograde },
      { label: 'Mars', longitude: chart.mars.longitude, isRetrograde: chart.mars.isRetrograde },
      { label: 'Jupiter', longitude: chart.jupiter.longitude, isRetrograde: chart.jupiter.isRetrograde },
      { label: 'Saturn', longitude: chart.saturn.longitude, isRetrograde: chart.saturn.isRetrograde },
      { label: 'Uranus', longitude: chart.uranus.longitude, isRetrograde: chart.uranus.isRetrograde },
      { label: 'Neptune', longitude: chart.neptune.longitude, isRetrograde: chart.neptune.isRetrograde },
      { label: 'Pluto', longitude: chart.pluto.longitude, isRetrograde: chart.pluto.isRetrograde },
    ];
    return spreadPlanets(raw, ascLongitude);
  }, [chart, ascLongitude]);

  // ── Planet longitude map for aspects ──
  const planetLongitudes = useMemo(() => {
    const map: Record<string, number> = {};
    placedPlanets.forEach((p) => { map[p.label] = p.longitude; });
    return map;
  }, [placedPlanets]);

  // ── Filtered aspects (only major, tight) ──
  const visibleAspects = useMemo(() => {
    if (!showAspects) return [];
    return chart.aspects
      .filter((a) => a.orb < 8 && ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile'].includes(a.type.name))
      .sort((a, b) => a.orb - b.orb)
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
              {/* Segment fill */}
              <Path
                d={arcPath(startAngle, endAngle, R_ZODIAC_OUTER, R_ZODIAC_INNER)}
                fill={ELEMENT_BG[sign.element]}
                stroke="rgba(201,169,98,0.15)"
                strokeWidth={0.5}
              />
              {/* Sign glyph */}
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
              x1={outer.x} y1={outer.y}
              x2={inner.x} y2={inner.y}
              stroke="rgba(201,169,98,0.2)"
              strokeWidth={0.8}
            />
          );
        })}

        {/* ── House cusps ── */}
        {chart.houseCusps.map((cusp: HouseCusp) => {
          const angle = astroToAngle(cusp.longitude, ascLongitude);
          const outer = polarToXY(angle, R_ZODIAC_INNER);
          const inner = polarToXY(angle, R_INNER);

          // House 1 (ASC) and House 10 (MC) get thicker lines
          const isAngular = cusp.house === 1 || cusp.house === 4 || cusp.house === 7 || cusp.house === 10;
          const strokeW = isAngular ? 1.5 : 0.6;
          const strokeColor = isAngular ? 'rgba(201,169,98,0.5)' : 'rgba(255,255,255,0.12)';

          // House number at midpoint
          const nextHouse = chart.houseCusps.find((c: HouseCusp) => c.house === (cusp.house % 12) + 1);
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
              <Line
                x1={outer.x} y1={outer.y}
                x2={inner.x} y2={inner.y}
                stroke={strokeColor}
                strokeWidth={strokeW}
              />
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
          const lon1 = planetLongitudes[asp.planet1.name];
          const lon2 = planetLongitudes[asp.planet2.name];
          if (lon1 === undefined || lon2 === undefined) return null;

          const angle1 = astroToAngle(lon1, ascLongitude);
          const angle2 = astroToAngle(lon2, ascLongitude);
          const p1 = polarToXY(angle1, R_ASPECT_RING);
          const p2 = polarToXY(angle2, R_ASPECT_RING);

          const isTight = asp.orb < 3;
          const color = isTight
            ? ASPECT_STRONG_COLORS[asp.type.nature]
            : ASPECT_LINE_COLORS[asp.type.nature];

          return (
            <Line
              key={`asp-${idx}`}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              stroke={color}
              strokeWidth={isTight ? 1.2 : 0.6}
              strokeDasharray={asp.type.nature === 'Harmonious' ? undefined : '4,3'}
            />
          );
        })}

        {/* ── Planet glyphs ── */}
        {placedPlanets.map((planet) => {
          const glyphPos = polarToXY(planet.displayAngle, R_PLANET_RING);

          // Tick line from glyph to zodiac ring at exact position
          const tickOuter = polarToXY(planet.originalAngle, R_ZODIAC_INNER - 1);
          const tickInner = polarToXY(planet.originalAngle, R_PLANET_RING + 10);

          return (
            <G key={planet.label}>
              {/* Position tick */}
              <Line
                x1={tickOuter.x} y1={tickOuter.y}
                x2={tickInner.x} y2={tickInner.y}
                stroke={planet.color}
                strokeWidth={0.8}
                opacity={0.5}
              />
              {/* Glyph background circle */}
              <Circle
                cx={glyphPos.x}
                cy={glyphPos.y}
                r={11}
                fill="rgba(13,20,33,0.85)"
                stroke={planet.color}
                strokeWidth={1}
                opacity={0.9}
              />
              {/* Glyph symbol */}
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
              {/* Retrograde indicator */}
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

        {/* ── ASC / MC labels ── */}
        {chart.ascendant && (() => {
          const ascAngle = astroToAngle(chart.ascendant.longitude, ascLongitude);
          const ascPos = polarToXY(ascAngle, R_ZODIAC_OUTER + 0);
          const ascLabelPos = polarToXY(ascAngle, R_ZODIAC_INNER - 6);
          return (
            <G>
              <SvgText
                x={ascPos.x - 16}
                y={ascPos.y}
                textAnchor="end"
                alignmentBaseline="central"
                fontSize={10}
                fill={theme.primary}
                fontWeight="700"
              >
                ASC
              </SvgText>
            </G>
          );
        })()}
        {chart.midheaven && (() => {
          const mcAngle = astroToAngle(chart.midheaven.longitude, ascLongitude);
          const mcPos = polarToXY(mcAngle, R_ZODIAC_OUTER + 0);
          return (
            <G>
              <SvgText
                x={mcPos.x}
                y={mcPos.y - 12}
                textAnchor="middle"
                alignmentBaseline="central"
                fontSize={10}
                fill={theme.primary}
                fontWeight="700"
              >
                MC
              </SvgText>
            </G>
          );
        })()}

        {/* ── Inner circle ── */}
        <Circle cx={CX} cy={CY} r={R_INNER} fill="rgba(13,20,33,0.6)" stroke="rgba(201,169,98,0.15)" strokeWidth={0.8} />

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
