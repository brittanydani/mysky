import React, { useMemo } from 'react';
import {
  Circle,
  Group,
  BlurMask,
  LinearGradient,
  vec,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import { useDerivedValue, SharedValue } from 'react-native-reanimated';

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
      if (!skPath) throw new Error(`Invalid SVG path: ${p}`);
      return skPath;
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
  const strokeColor = 'rgba(255, 255, 255, 0.9)';

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
      {/* 1. The Aura Glow (Outer) - Breathing */}
      <Circle cx={center} cy={center} r={auraRadius} color={color.glow} opacity={auraOpacity}>
        <BlurMask blur={15} style="outer" />
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

      {/* 4. The Yantra Symbol (Glass Plate) */}
      <Group>
        <Circle cx={center} cy={center} r={radius * 0.8} color="rgba(10, 15, 25, 0.85)" />
        {paths.map((p, i) => (
          <Path 
            key={i} 
            path={p} 
            style="stroke" 
            strokeCap="round"
            strokeJoin="round"
            strokeWidth={tuning.sw} 
            color={strokeColor} 
          />
        ))}
        {circles.map((c, i) => (
          <Circle 
            key={`circle-${i}`} 
            cx={center} cy={center} r={c} 
            style="stroke" 
            strokeWidth={tuning.sw} 
            color={strokeColor} 
          />
        ))}
      </Group>
    </Group>
  );
};
