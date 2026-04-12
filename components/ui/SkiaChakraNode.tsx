import React, { useMemo } from 'react';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  LinearGradient,
  vec,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import { useDerivedValue, SharedValue } from 'react-native-reanimated';

// ── Chakra jewel-tone palette (source of truth for the wheel) ──
export const CHAKRA_COLORS: Record<string, { core: string; glow: string; deep: string }> = {
  Crown:          { core: '#E2D9F3', glow: '#F6F3FB', deep: '#A692C4' }, // Ethereal Violet
  'Third Eye':    { core: '#A88BEB', glow: '#C8B5F4', deep: '#5E3B8F' }, // Nebula Purple
  Throat:         { core: '#5C7CAA', glow: '#B5CDE1', deep: '#264264' }, // Stratosphere Blue
  Heart:          { core: '#6B9080', glow: '#A3D2BC', deep: '#2A4E38' }, // Deep Sage
  'Solar Plexus': { core: '#D4AF37', glow: '#FDF1C0', deep: '#7C6213' }, // Metallic Gold
  Sacral:         { core: '#CD7F5D', glow: '#F4BCA9', deep: '#7D442B' }, // Rich Copper
  Root:           { core: '#DC5050', glow: '#F8B1B1', deep: '#8B2121' }, // Ember Ruby
};
// ── Vivid rainbow palette for card icon badges ──
const CHAKRA_VIVID_FLAT: Record<string, string> = {
  Root:           '#DC5050',
  Sacral:         '#CD7F5D',
  'Solar Plexus': '#D4AF37',
  Heart:          '#6B9080',
  Throat:         '#5C7CAA',
  'Third Eye':    '#A88BEB',
  Crown:          '#E2D9F3',
};
// ── Vivid saturated palette — used for card backgrounds in Today's Focus ──
export const CHAKRA_VIVID: Record<string, { top: string; bottom: string }> = {
  Crown:          { top: '#E2D9F3', bottom: '#A692C4' },
  'Third Eye':    { top: '#A88BEB', bottom: '#5E3B8F' },
  Throat:         { top: '#5C7CAA', bottom: '#264264' },
  Heart:          { top: '#6B9080', bottom: '#2A4E38' },
  'Solar Plexus': { top: '#D4AF37', bottom: '#7C6213' },
  Sacral:         { top: '#CD7F5D', bottom: '#7D442B' },
  Root:           { top: '#DC5050', bottom: '#8B2121' },
};

interface SkiaChakraNodeProps {
  name: string;
  color: { core: string; glow: string; deep: string };
  stateColor: string;
  intensity: number; // 0.65 to 1.0
  size: number;
  clock?: SharedValue<number>;
}

// ── Inline yantra geometry helpers (Flawless precision) ──
function petalD(cx: number, cy: number, angleDeg: number, innerR: number, outerR: number, w: number): string {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  const p = a + Math.PI / 2;
  const bx = cx + innerR * Math.cos(a);
  const by = cy + innerR * Math.sin(a);
  const tx = cx + outerR * Math.cos(a);
  const ty = cy + outerR * Math.sin(a);
  const mr = (innerR + outerR) * 0.55;
  const c1x = cx + mr * Math.cos(a) - w * Math.cos(p);
  const c1y = cy + mr * Math.sin(a) - w * Math.sin(p);
  const c2x = cx + mr * Math.cos(a) + w * Math.cos(p);
  const c2y = cy + mr * Math.sin(a) + w * Math.sin(p);
  return `M${bx} ${by}Q${c1x} ${c1y} ${tx} ${ty}Q${c2x} ${c2y} ${bx} ${by}Z`;
}

function petalsRingD(cx: number, cy: number, n: number, innerR: number, outerR: number, w: number): string {
  let d = '';
  for (let i = 0; i < n; i++) d += petalD(cx, cy, (i * 360) / n, innerR, outerR, w);
  return d;
}

function triUpD(cx: number, cy: number, r: number): string {
  const pts = [0, 120, 240].map((deg) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  });
  return `M${pts[0]}L${pts[1]}L${pts[2]}Z`;
}

function triDownD(cx: number, cy: number, r: number): string {
  const pts = [0, 120, 240].map((deg) => {
    const a = ((deg + 90) * Math.PI) / 180;
    return `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  });
  return `M${pts[0]}L${pts[1]}L${pts[2]}Z`;
}

function hexagramD(cx: number, cy: number, r: number): string {
  return triUpD(cx, cy, r) + triDownD(cx, cy, r);
}

function diamondD(cx: number, cy: number, r: number): string {
  return `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`;
}

const CHAKRA_ICON_TUNING: Record<string, { scale: number; sw: number }> = {
  Crown:          { scale: 1.3,  sw: 1.2 },
  'Third Eye':    { scale: 1.5,  sw: 1.2 },
  Throat:         { scale: 1.35, sw: 1.2 },
  Heart:          { scale: 1.4,  sw: 1.2 },
  'Solar Plexus': { scale: 1.6,  sw: 1.2 },
  Sacral:         { scale: 1.35, sw: 1.2 },
  Root:           { scale: 1.35, sw: 1.2 },
};

function getSkiaPathsForChakra(name: string, cx: number, cy: number, r: number) {
  const paths: string[] = [];
  const circles: number[] = [];

  switch (name) {
    case 'Crown': {
      paths.push(petalsRingD(cx, cy, 12, r * 0.3, r, r * 0.2));
      paths.push(hexagramD(cx, cy, r * 0.42));
      break;
    }
    case 'Third Eye': {
      const cr = r * 0.38;
      const pr = r * 0.95;
      const lp = `M${cx - cr} ${cy}C${cx - cr * 1.5} ${cy - r * 0.55} ${cx - pr} ${cy - r * 0.25} ${cx - pr} ${cy}C${cx - pr} ${cy + r * 0.25} ${cx - cr * 1.5} ${cy + r * 0.55} ${cx - cr} ${cy}`;
      const rp = `M${cx + cr} ${cy}C${cx + cr * 1.5} ${cy - r * 0.55} ${cx + pr} ${cy - r * 0.25} ${cx + pr} ${cy}C${cx + pr} ${cy + r * 0.25} ${cx + cr * 1.5} ${cy + r * 0.55} ${cx + cr} ${cy}`;
      circles.push(cr);
      paths.push(lp + rp);
      paths.push(triDownD(cx, cy, cr * 0.65));
      break;
    }
    case 'Throat': {
      paths.push(petalsRingD(cx, cy, 16, r * 0.35, r, r * 0.14));
      circles.push(r * 0.35);
      paths.push(triDownD(cx, cy, r * 0.32));
      break;
    }
    case 'Heart': {
      paths.push(petalsRingD(cx, cy, 12, r * 0.3, r, r * 0.2));
      paths.push(hexagramD(cx, cy, r * 0.38));
      break;
    }
    case 'Solar Plexus': {
      paths.push(petalsRingD(cx, cy, 10, r * 0.3, r, r * 0.2));
      paths.push(triDownD(cx, cy, r * 0.38));
      break;
    }
    case 'Sacral': {
      paths.push(petalsRingD(cx, cy, 6, r * 0.3, r, r * 0.25));
      circles.push(r * 0.38);
      break;
    }
    case 'Root': {
      paths.push(petalsRingD(cx, cy, 4, r * 0.25, r, r * 0.28));
      paths.push(diamondD(cx, cy, r * 0.45));
      break;
    }
    default:
      circles.push(r * 0.3);
      break;
  }
  
  return {
    paths: paths.map(p => {
      const skPath = Skia.Path.MakeFromSVGString(p);
      return skPath ?? Skia.Path.Make(); // safe fallback — renders nothing
    }),
    circles
  };
}

export const SkiaChakraNode = ({ name, color, stateColor, intensity, size, clock }: SkiaChakraNodeProps) => {
  const center = size / 2;
  const radius = size * 0.4;
  const specularPos = vec(size * 0.35, size * 0.35);

  const tuning = CHAKRA_ICON_TUNING[name] ?? { scale: 1.25, sw: 1.3 };
  const yantraSize = (size * 0.86) * tuning.scale / 2;
  // Scale stroke width with node size so small orbit dots show clear symbols
  const strokeW = Math.max(0.9, tuning.sw * (size / 68));
  const strokeColor = 'rgba(255, 255, 255, 0.95)';

  const { paths, circles } = useMemo(() => {
    return getSkiaPathsForChakra(name, center, center, yantraSize);
  }, [name, center, yantraSize]);

  // Derive dynamic aura properties using the shared clock if passed
  const auraOpacity = useDerivedValue(() => {
    const basePulse = clock ? clock.value : 0;
    return intensity * (0.6 + basePulse * 0.4);
  });
  
  const auraRadius = useDerivedValue(() => {
    const basePulse = clock ? clock.value : 0;
    return radius * 1.5 + basePulse * (radius * 0.2);
  });

  return (
    <Group opacity={intensity}>
      {/* 1. The Aura Glow (Outer) - Breathing — blendMode screen = emitted light */}
      <Circle cx={center} cy={center} r={auraRadius} color={color.glow} opacity={auraOpacity} blendMode="screen">
        <BlurMask blur={15} style="outer" />
      </Circle>

      {/* 1b. Inner burning core — screens with background to create white-hot center */}
      <Circle cx={center} cy={center} r={auraRadius} color={color.core} opacity={0.28} blendMode="screen">
        <BlurMask blur={6} style="inner" />
      </Circle>

      {/* 2. The 3D Specular Sphere */}
      <Circle cx={center} cy={center} r={radius}>
        <LinearGradient
          start={specularPos}
          end={vec(size, size)}
          colors={['#FFFFFF', color.glow, color.core, color.deep, '#020817']}
          positions={[0, 0.2, 0.5, 0.85, 1]}
        />
      </Circle>

      {/* 3. Rim Light & State Indicator */}
      <Circle 
        cx={center} cy={center} r={radius} 
        style="stroke" strokeWidth={1} color={color.glow} opacity={0.8} 
      />
      <Circle 
        cx={center} cy={center} r={radius + 4} 
        style="stroke" strokeWidth={0.8} color={stateColor} opacity={0.5} 
      />

      {/* 4. The Yantra Symbol (Glass Plate + Sacred Symbol) */}
      <Group>
        {/* Thin dark base — mostly replaced by the chakra color fill */}
        <Circle cx={center} cy={center} r={radius * 0.82} color="rgba(4, 7, 16, 0.40)" />
        {/* Chakra color — fill with deep shade, center bloom to core */}
        <Circle cx={center} cy={center} r={radius * 0.82} color={color.deep} opacity={0.78} />
        <Circle cx={center} cy={center} r={radius * 0.52} color={color.core} opacity={0.32} />
        {paths.map((p, i) => (
          <Path 
            key={i} 
            path={p} 
            style="stroke" 
            strokeCap="round"
            strokeJoin="round"
            strokeWidth={strokeW} 
            color={strokeColor} 
          />
        ))}
        {circles.map((c, i) => (
          <Circle 
            key={`circle-${i}`} 
            cx={center} cy={center} r={c} 
            style="stroke" 
            strokeWidth={strokeW} 
            color={strokeColor} 
          />
        ))}
      </Group>
    </Group>
  );
};

// ─────────────────────────────────────────────────────────────
// SkiaChakraGlyph — standalone Canvas for use anywhere in the UI
// (ChakraCard lists, detail panels, etc.)
// ─────────────────────────────────────────────────────────────

interface SkiaChakraGlyphProps {
  name: string;
  /** Canvas size in px. Default 44. */
  size?: number;
  /**
   * 'sphere' (default) — full 3-D specular sphere with yantra overlay.
   * 'flat'   — white symbol only on transparent canvas; card supplies color.
   * 'vivid'  — bright solid chakra-colored disc + white symbol; no sphere.
   */
  variant?: 'sphere' | 'flat' | 'vivid';
}

export function SkiaChakraGlyph({ name, size = 44, variant = 'sphere' }: SkiaChakraGlyphProps) {
  // ── Flat variant: pure white symbol, no sphere, transparent background ──
  if (variant === 'flat') {
    const tuningF = CHAKRA_ICON_TUNING[name] ?? { scale: 1.25, sw: 1.3 };
    const centerF = size / 2;
    const yantraRF = size * 0.43;
    const strokeWF = Math.max(1.4, tuningF.sw * (size / 44));
    const { paths: fp, circles: fc } = getSkiaPathsForChakra(name, centerF, centerF, yantraRF);
    return (
      <Canvas style={{ width: size, height: size }}>
        {fp.map((p, i) => (
          <Path key={i} path={p} style="stroke" strokeCap="round" strokeJoin="round"
            strokeWidth={strokeWF} color="rgba(255,255,255,0.96)" />
        ))}
        {fc.map((r, i) => (
          <Circle key={`fc-${i}`} cx={centerF} cy={centerF} r={r}
            style="stroke" strokeWidth={strokeWF} color="rgba(255,255,255,0.96)" />
        ))}
      </Canvas>
    );
  }

  // ── Vivid variant: solid bright-colored disc + white symbol ──
  if (variant === 'vivid') {
    const tuningV = CHAKRA_ICON_TUNING[name] ?? { scale: 1.25, sw: 1.3 };
    const centerV = size / 2;
    const radius  = size * 0.46;           // disc fills most of the canvas
    const yantraRV = size * 0.42;          // symbol fills the disc comfortably
    const strokeWV = Math.max(1.6, tuningV.sw * (size / 42));
    const vividColor = CHAKRA_VIVID_FLAT[name] ?? '#555577';
    const { paths: vp, circles: vc } = getSkiaPathsForChakra(name, centerV, centerV, yantraRV);
    return (
      <Canvas style={{ width: size, height: size }}>
        {/* Solid vivid disc */}
        <Circle cx={centerV} cy={centerV} r={radius} color={vividColor} />
        {/* Subtle inner highlight to keep it from looking flat */}
        <Circle cx={centerV} cy={centerV} r={radius * 0.65} color="rgba(255,255,255,0.10)" />
        {/* White sacred geometry symbol */}
        {vp.map((p, i) => (
          <Path key={i} path={p} style="stroke" strokeCap="round" strokeJoin="round"
            strokeWidth={strokeWV} color="rgba(255,255,255,0.97)" />
        ))}
        {vc.map((r, i) => (
          <Circle key={`vc-${i}`} cx={centerV} cy={centerV} r={r}
            style="stroke" strokeWidth={strokeWV} color="rgba(255,255,255,0.97)" />
        ))}
      </Canvas>
    );
  }

  const color = CHAKRA_COLORS[name] ?? CHAKRA_COLORS['Solar Plexus'];
  const tuning = CHAKRA_ICON_TUNING[name] ?? { scale: 1.25, sw: 1.3 };

  const center  = size / 2;
  const radius  = size * 0.40;
  const yantraR = (size * 0.86) * tuning.scale / 2;
  // Clamp stroke: visible at 32px, comfortable at 64px
  const strokeW = Math.max(1.1, tuning.sw * (size / 56));

  const specStart = vec(size * 0.28, size * 0.28);
  const specEnd   = vec(size * 0.95, size * 0.95);

  const { paths: symbolPaths, circles: symbolCircles } = getSkiaPathsForChakra(name, center, center, yantraR);

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* 1. Soft outer aura — bloom glow matching chakra color */}
      <Circle cx={center} cy={center} r={radius * 1.4} color={color.glow} opacity={0.30} blendMode="screen">
        <BlurMask blur={size * 0.12} style="outer" />
      </Circle>

      {/* 2. Specular 3-D sphere */}
      <Circle cx={center} cy={center} r={radius}>
        <LinearGradient
          start={specStart}
          end={specEnd}
          colors={['#FFFFFF', color.glow, color.core, color.deep, '#020817']}
          positions={[0, 0.18, 0.50, 0.86, 1.0]}
        />
      </Circle>

      {/* 3. Rim light */}
      <Circle cx={center} cy={center} r={radius} style="stroke" strokeWidth={0.9} color={color.glow} opacity={0.85} />

      {/* 4. Glass plate — chakra color-filled with a center bloom */}
      <Circle cx={center} cy={center} r={radius * 0.82} color="rgba(4, 7, 16, 0.38)" />
      <Circle cx={center} cy={center} r={radius * 0.82} color={color.deep} opacity={0.78} />
      <Circle cx={center} cy={center} r={radius * 0.52} color={color.core} opacity={0.30} />

      {/* 5. Sacred geometry symbol */}
      {symbolPaths.map((p, i) => (
        <Path
          key={i}
          path={p}
          style="stroke"
          strokeCap="round"
          strokeJoin="round"
          strokeWidth={strokeW}
          color="rgba(255,255,255,0.94)"
        />
      ))}
      {symbolCircles.map((r, i) => (
        <Circle
          key={`sc-${i}`}
          cx={center}
          cy={center}
          r={r}
          style="stroke"
          strokeWidth={strokeW}
          color="rgba(255,255,255,0.94)"
        />
      ))}
    </Canvas>
  );
}
