import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Canvas, Path, Skia, LinearGradient, vec, BlurMask } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

export interface DynamicBreathPortalProps {
  inhale: number;
  exhale: number;
  color: string;
  label: string;
  onComplete?: () => void;
  durationInSeconds?: number;
}

export const DynamicBreathPortal: React.FC<DynamicBreathPortalProps> = ({ inhale, exhale, color, label, onComplete, durationInSeconds = 60 }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    const cycleDuration = (inhale + exhale) * 1000;

    // A pulsating animation that maps to exactly the full breath cycle
    progress.value = withRepeat(
      withSequence(
        // Inhale phase zooms the curve outward
        withTiming(1, { duration: inhale * 1000, easing: Easing.out(Easing.sine) }),
        // Exhale phase brings it back
        withTiming(0, { duration: exhale * 1000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false
    );

    let timeout: NodeJS.Timeout;
    if (onComplete) {
      timeout = setTimeout(() => {
        onComplete();
      }, durationInSeconds * 1000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [inhale, exhale, progress, onComplete, durationInSeconds]);

  // Derived Skia Path to generate the moving Lissajous shape
  const animatedPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const cx = 150;
    const cy = 150;
    
    // Scale the amplitude based on the breathe ratio state
    const tShift = progress.value * Math.PI * 2;
    const sizeBase = 45;
    const sizeMax = 120 * progress.value + sizeBase;

    // Constructing a smoothed parametric Lissajous curve
    p.moveTo(cx + sizeMax * Math.sin(tShift), cy + sizeMax * Math.cos(tShift));
    for (let t = 0; t <= Math.PI * 2; t += 0.05) {
      // 3 petals / lobes spinning organically
      const x = cx + sizeMax * Math.sin(3 * t + tShift) * Math.cos(t);
      const y = cy + sizeMax * Math.sin(2 * t) * Math.sin(t + tShift);
      p.lineTo(x, y);
    }
    p.close();

    return p;
  }, [progress]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color }]}>{label}</Text>
      <Text style={styles.ratio}>
        {inhale}s Inhale : {exhale}s Exhale
      </Text>

      <Canvas style={styles.portal}>
        <Path path={animatedPath} style="stroke" strokeWidth={3}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(300, 300)}
            colors={[color, `${color}40`, 'transparent']}
          />
          <BlurMask blur={8} style="solid" />
        </Path>

        <Path path={animatedPath} color={color} style="stroke" strokeWidth={1} opacity={0.8} />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  ratio: {
    fontSize: 14,
    color: '#8A8A8E', // Muted text for the UI
    marginBottom: 20,
    fontFamily: 'Menlo', 
  },
  portal: {
    width: 300,
    height: 300,
  },
});
