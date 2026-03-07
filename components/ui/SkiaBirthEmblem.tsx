/**
 * SkiaBirthEmblem
 * A metallic gold celestial emblem for the birth data screen.
 * Renders concentric rings, radiating lines, and glowing dots via Skia.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Line as SkiaLine,
  Path,
  LinearGradient,
  vec,
  Skia,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';

const SIZE = 160;
const CX = SIZE / 2;
const CY = SIZE / 2;

// Gold palette
const GOLD_BRIGHT = '#FDF3D7';
const GOLD_MID = '#C9AE78';
const GOLD_DARK = '#9B7A46';
const GOLD_DIM = 'rgba(201,174,120,0.25)';

// Build a 4-pointed star path
function makeStarPath(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  points.push('Z');
  return points.join(' ');
}

const SkiaBirthEmblem = React.memo(function SkiaBirthEmblem() {
  // Pulse animation for the inner glow
  const pulse = useSharedValue(0.4);
  // Slow rotation for the outer dots
  const rotation = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    rotation.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 30000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const innerGlowOpacity = useDerivedValue(() => pulse.value);

  // 12 dots around outer ring (like a clock / zodiac markers)
  const DOT_COUNT = 12;
  const DOT_RADIUS = 58;
  const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / DOT_COUNT - Math.PI / 2;
    return {
      x: CX + DOT_RADIUS * Math.cos(angle),
      y: CY + DOT_RADIUS * Math.sin(angle),
      r: i % 3 === 0 ? 2.5 : 1.5,
      bright: i % 3 === 0,
    };
  });

  // 8 thin radiating lines
  const LINE_COUNT = 8;
  const LINE_INNER = 28;
  const LINE_OUTER = 42;

  // Central star
  const starPath = Skia.Path.MakeFromSVGString(makeStarPath(CX, CY, 18, 8));

  return (
    <View style={{ width: SIZE, height: SIZE, alignSelf: 'center', marginBottom: 4 }}>
      <Canvas style={{ width: SIZE, height: SIZE }}>
        {/* Inner glow circle */}
        <Group opacity={innerGlowOpacity}>
          <Circle cx={CX} cy={CY} r={36}>
            <LinearGradient
              start={vec(CX - 36, CY - 36)}
              end={vec(CX + 36, CY + 36)}
              colors={['rgba(201,174,120,0.18)', 'rgba(201,174,120,0.04)']}
            />
          </Circle>
        </Group>

        {/* Outer ring */}
        <Circle
          cx={CX}
          cy={CY}
          r={56}
          color="transparent"
          style="stroke"
          strokeWidth={1.2}
        >
          <LinearGradient
            start={vec(CX - 56, CY)}
            end={vec(CX + 56, CY)}
            colors={[GOLD_DIM, GOLD_MID, GOLD_DIM]}
          />
        </Circle>

        {/* Inner ring */}
        <Circle
          cx={CX}
          cy={CY}
          r={38}
          color="transparent"
          style="stroke"
          strokeWidth={0.8}
        >
          <LinearGradient
            start={vec(CX, CY - 38)}
            end={vec(CX, CY + 38)}
            colors={[GOLD_MID, GOLD_DIM]}
          />
        </Circle>

        {/* Radiating lines */}
        {Array.from({ length: LINE_COUNT }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / LINE_COUNT - Math.PI / 2;
          const x1 = CX + LINE_INNER * Math.cos(angle);
          const y1 = CY + LINE_INNER * Math.sin(angle);
          const x2 = CX + LINE_OUTER * Math.cos(angle);
          const y2 = CY + LINE_OUTER * Math.sin(angle);
          return (
            <SkiaLine
              key={`line-${i}`}
              p1={vec(x1, y1)}
              p2={vec(x2, y2)}
              color={GOLD_DIM}
              strokeWidth={0.8}
              style="stroke"
            />
          );
        })}

        {/* Central 4-pointed star */}
        {starPath && (
          <Path path={starPath}>
            <LinearGradient
              start={vec(CX - 18, CY - 18)}
              end={vec(CX + 18, CY + 18)}
              colors={[GOLD_BRIGHT, GOLD_MID, GOLD_DARK]}
            />
          </Path>
        )}

        {/* Center dot */}
        <Circle cx={CX} cy={CY} r={3} color={GOLD_BRIGHT} />

        {/* 12 orbital dots */}
        {dots.map((dot, i) => (
          <Circle
            key={`dot-${i}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            color={dot.bright ? GOLD_MID : GOLD_DIM}
          />
        ))}

        {/* Tiny sparkle accents at cardinal points */}
        <Circle cx={CX} cy={CY - 68} r={1.8} color={GOLD_MID} />
        <Circle cx={CX + 68} cy={CY} r={1.2} color={GOLD_DIM} />
        <Circle cx={CX} cy={CY + 68} r={1.8} color={GOLD_MID} />
        <Circle cx={CX - 68} cy={CY} r={1.2} color={GOLD_DIM} />
      </Canvas>
    </View>
  );
});

export default SkiaBirthEmblem;
