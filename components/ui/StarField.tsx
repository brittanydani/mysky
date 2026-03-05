import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Path,
  Shadow,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useDerivedValue,
  useFrameCallback,
} from 'react-native-reanimated';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delayOffset: number; // For phase shift
  duration: number;
  driftX: number;
  driftY: number;
  driftDuration: number;
  layer: number;
  starColor: string;
}

const STAR_PALETTE = ['#FFFFFF', '#FDFBF7', '#E8F4FF', '#FFF4D4'];

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

const generateStars = (count: number, w: number, h: number): Star[] =>
  Array.from({ length: count }, (_, i) => {
    const rand = splitmix32(i * 2654435761);
    const layer = rand() < 0.6 ? 0 : rand() < 0.9 ? 1 : 2; // 0=Far, 1=Mid, 2=Near
    const sizeBase = layer === 0 ? 0.6 : layer === 1 ? 1.0 : 2.2;
    return {
      id: i,
      x: rand() * w,
      y: rand() * h,
      size: rand() * sizeBase + 0.4,
      delayOffset: rand() * Math.PI * 2,
      duration: rand() * 3000 + 3000,
      driftX: (rand() - 0.5) * (layer === 0 ? 5 : layer === 1 ? 15 : 30),
      driftY: (rand() - 0.5) * (layer === 0 ? 3 : layer === 1 ? 8 : 15),
      driftDuration: rand() * 15000 + 20000,
      layer,
      starColor: STAR_PALETTE[Math.floor(rand() * STAR_PALETTE.length)],
    };
  });

// Skia animation components
const SkiaStar = memo(({ star, time }: { star: Star; time: any }) => {
  const x = useDerivedValue(() => {
    const progress = (time.value / star.driftDuration) * Math.PI * 2;
    return star.x + Math.sin(progress) * star.driftX;
  });

  const y = useDerivedValue(() => {
    const progress = (time.value / star.driftDuration) * Math.PI * 2;
    return star.y + Math.sin(progress) * star.driftY;
  });

  const r = useDerivedValue(() => {
    const progress = (time.value / star.duration) * Math.PI * 2 + star.delayOffset;
    const scale = 1 + Math.sin(progress) * (star.layer === 2 ? 0.2 : 0.1);
    return (star.size / 2) * scale;
  });

  const opacity = useDerivedValue(() => {
    const progress = (time.value / star.duration) * Math.PI * 2 + star.delayOffset;
    const baseOpacity = star.layer === 2 ? 0.8 : star.layer === 1 ? 0.6 : 0.4;
    const variance = star.layer === 2 ? 0.2 : 0.1;
    return baseOpacity + Math.sin(progress) * variance;
  });

  return (
    <Group>
      <Circle cx={x} cy={y} r={r} color={star.starColor} opacity={opacity}>
        {star.layer === 2 && <BlurMask blur={2} style="normal" />}
      </Circle>
    </Group>
  );
});

// Constellation line that connects two SkiaStars dynamically
const SkiaConstellationLine = memo(({ 
  star1, 
  star2, 
  time, 
  delayOffset 
}: { 
  star1: Star; 
  star2: Star; 
  time: any;
  delayOffset: number;
}) => {
  const path = useDerivedValue(() => {
    const p1 = (time.value / star1.driftDuration) * Math.PI * 2;
    const x1 = star1.x + Math.sin(p1) * star1.driftX;
    const y1 = star1.y + Math.sin(p1) * star1.driftY;

    const p2 = (time.value / star2.driftDuration) * Math.PI * 2;
    const x2 = star2.x + Math.sin(p2) * star2.driftX;
    const y2 = star2.y + Math.sin(p2) * star2.driftY;

    // Use string definition for path, simplified
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  });

  const opacity = useDerivedValue(() => {
    // Pulse sequence for the constelation lines
    const cycle = (time.value / 6000) * Math.PI * 2 + delayOffset;
    return 0.15 + Math.sin(cycle) * 0.1;
  });

  return (
    <Path
      path={path}
      color="rgba(197, 180, 147, 0.4)" // Soft gold text.primary or theme.primary
      style="stroke"
      strokeWidth={0.8}
      opacity={opacity}
    />
  );
});

function StarField({ starCount = 40 }: { starCount?: number }) {
  const { width, height } = useWindowDimensions();
  
  const { stars, constellations } = useMemo(() => {
    const generatedStars = generateStars(starCount, width, height);

    // Filter out only medium and far stars or near stars to connect
    const connectableStars = generatedStars.filter(s => s.layer > 0);
    const lines = [];

    // Make a few random constellations (lines between close stars)
    // Using simple math to find somewhat close pairs
    for (let i = 0; i < connectableStars.length; i++) {
       const s1 = connectableStars[i];
       for (let j = i + 1; j < connectableStars.length; j++) {
          const s2 = connectableStars[j];
          const dist = Math.hypot(s1.x - s2.x, s1.y - s2.y);
          if (dist < 120 && lines.length < 8) {
             lines.push({ s1, s2, delayOffset: i * 0.5 });
             break; // Max 1 line per star typically
          }
       }
    }

    return { stars: generatedStars, constellations: lines };
  }, [starCount, width, height]);

  const time = useSharedValue(0);

  // High performance frame loop
  useFrameCallback((frameInfo) => {
    if (frameInfo.timeSinceFirstFrame !== undefined) {
      time.value = frameInfo.timeSinceFirstFrame;
    }
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Canvas style={styles.canvas}>
        <Group>
          {constellations.map((line, idx) => (
            <SkiaConstellationLine 
              key={`line-${idx}`} 
              star1={line.s1} 
              star2={line.s2} 
              time={time} 
              delayOffset={line.delayOffset} 
            />
          ))}
          {stars.map((star) => (
            <SkiaStar key={star.id} star={star} time={time} />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}

export default memo(StarField);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  canvas: {
    flex: 1,
  },
});
