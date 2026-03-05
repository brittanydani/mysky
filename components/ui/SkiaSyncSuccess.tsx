/**
 * SkiaSyncSuccess
 * High-end cinematic fusion between the Body Map and the Breath Portal.
 * Dissolves tension nodes into the central coherence point.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface SkiaSyncSuccessProps {
  originX: number;
  originY: number;
  onComplete: () => void;
}

export const SkiaSyncSuccess: React.FC<SkiaSyncSuccessProps> = ({ originX, originY, onComplete }) => {
  const progress = useSharedValue(0);
  const particleRadius = useSharedValue(0);

  useEffect(() => {
    // 1. Ignite the particles
    particleRadius.value = withTiming(4, { duration: 400 });
    
    // 2. Travel to center
    progress.value = withDelay(
      400, 
      withTiming(
        1, 
        { duration: 1200, easing: Easing.bezier(0.45, 0, 0.55, 1) }, 
        (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        }
      )
    );
  }, []);

  // Create 12 particles that "swirl" toward the center
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    return {
      id: i,
      angle,
    };
  });

  const centerPopRadius = useDerivedValue(() => progress.value * 100);
  const centerPopOpacity = useDerivedValue(() => (progress.value > 0.9 ? (1 - progress.value) * 10 : 0));

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group>
        {particles.map((p) => {
          const x = useDerivedValue(() => {
            const startX = originX;
            const endX = width / 2;
            const swirl = Math.sin(progress.value * 10 + p.angle) * 50 * (1 - progress.value);
            return startX + (endX - startX) * progress.value + swirl;
          });

          const y = useDerivedValue(() => {
            const startY = originY;
            const endY = height / 2;
            const swirl = Math.cos(progress.value * 10 + p.angle) * 50 * (1 - progress.value);
            return startY + (endY - startY) * progress.value + swirl;
          });

          const opacity = useDerivedValue(() => 1 - Math.pow(progress.value, 4));

          return (
            <Circle 
              key={p.id}
              cx={x} 
              cy={y} 
              r={particleRadius} 
              color="#D4AF37" // Gold (Success)
              opacity={opacity}
            >
              <BlurMask blur={3} style="solid" />
            </Circle>
          );
        })}
      </Group>

      {/* Central "Pop" on completion */}
      <Circle 
        cx={width / 2} 
        cy={height / 2} 
        r={centerPopRadius} 
        color="#D4AF37"
        opacity={centerPopOpacity}
      />
    </Canvas>
  );
};
