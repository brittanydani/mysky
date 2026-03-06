import React, { memo, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Canvas, Circle, Group, RadialGradient, Rect, vec, Blur, BlurMask } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

// Three layers of stars for a parallax depth effect
const LAYER_CONFIG = [
  { count: 60, size: [0.4, 0.8], alpha: [0.05, 0.15], speed: 1.2 }, // Distance
  { count: 50, size: [0.8, 1.4], alpha: [0.15, 0.30], speed: 1.8 }, // Mid-ground
  { count: 20, size: [1.4, 2.2], alpha: [0.30, 0.50], speed: 2.4 }, // Foreground
];

type Star = { x: number; y: number; r: number; a: number; phase: number; layerSpeed: number };

function makeStars(): Star[] {
  const stars: Star[] = [];
  LAYER_CONFIG.forEach((layer) => {
    for (let i = 0; i < layer.count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
        a: layer.alpha[0] + Math.random() * (layer.alpha[1] - layer.alpha[0]),
        phase: Math.random() * Math.PI * 2,
        layerSpeed: layer.speed,
      });
    }
  });
  return stars;
}

// Individual star component using Skia-driven animation (no React re-renders)
const CosmicStar = memo(({ star, time }: { star: Star; time: any }) => {
  const opacity = useDerivedValue(() => {
    const twinkle = 0.8 + 0.2 * Math.sin((time.value / 1000) * star.layerSpeed + star.phase);
    return Math.min(1, star.a * twinkle);
  });

  return (
    <Circle
      cx={star.x}
      cy={star.y}
      r={star.r}
      color="#FDFBF7"
      opacity={opacity}
    />
  );
});

function CosmicBackground() {
  const stars = useMemo(() => makeStars(), []);

  // High-performance frame loop — updates a shared value, no React state
  const time = useSharedValue(0);
  useFrameCallback((frameInfo) => {
    if (frameInfo.timeSinceFirstFrame !== undefined) {
      time.value = frameInfo.timeSinceFirstFrame;
    }
  });

  const center = vec(W / 2, H / 2);
  const nebulaCenter = vec(W * 0.7, H * 0.2); // Top right offset for visual interest
  const radius = Math.max(W, H);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Base Obsidian Layer */}
        <Rect x={0} y={0} width={W} height={H} color="#05070A" />

        {/* Deep Space Radial Depth */}
        <Rect x={0} y={0} width={W} height={H}>
          <RadialGradient
            c={center}
            r={radius}
            colors={["#0D1526", "#070B12", "#020305"]}
            positions={[0, 0.5, 1]}
          />
        </Rect>

        {/* Primary Nebula (Amethyst/Midnight) */}
        <Rect x={0} y={0} width={W} height={H}>
          <RadialGradient
            c={nebulaCenter}
            r={radius * 0.8}
            colors={["rgba(100, 70, 180, 0.12)", "rgba(50, 60, 120, 0.04)", "transparent"]}
          />
          <Blur blur={40} />
        </Rect>

        {/* Secondary Dust Cloud (Copper/Gold Tint) */}
        <Rect x={0} y={0} width={W} height={H}>
          <RadialGradient
            c={vec(W * 0.2, H * 0.8)}
            r={radius * 0.6}
            colors={["rgba(197, 180, 147, 0.05)", "rgba(100, 80, 40, 0.02)", "transparent"]}
          />
        </Rect>

        {/* Twinkling Stars with Multilayer Depth — driven by shared value, zero re-renders */}
        <Group>
          {stars.map((s, i) => (
            <CosmicStar key={`cosmic-star-${i}`} star={s} time={time} />
          ))}
        </Group>

        {/* Final Cinematic Vignette */}
        <Rect x={0} y={0} width={W} height={H}>
          <RadialGradient
            c={center}
            r={radius * 1.1}
            colors={["transparent", "transparent", "rgba(0,0,0,0.8)"]}
            positions={[0, 0.4, 1]}
          />
        </Rect>
      </Canvas>
    </View>
  );
}

export default memo(CosmicBackground);
