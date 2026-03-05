import React, { useEffect } from 'react';
import { Canvas, Path, Group, BlurMask } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { BreathProfile } from '../../services/logic/GateInterpreter';

export const SomaticGate = ({ profile }: { profile: BreathProfile }) => {
  const progress = useSharedValue(0);

  // Sync animation to the calculated breath ratio
  useEffect(() => {
    const cycleDuration = (profile.inhale + profile.exhale) * 1000;
    progress.value = withRepeat(
      withTiming(1, { duration: cycleDuration, easing: Easing.inOut(Easing.sine) }),
      -1,
      true
    );
  }, [profile, progress]);

  const path = useDerivedValue(() => {
    // High-end Lissajous math to create the "Breathing Geometry"
    const scale = 100 + (progress.value * 50);
    return `M 150 150 m -${scale}, 0 a ${scale},${scale} 0 1,0 ${scale*2},0 a ${scale},${scale} 0 1,0 -${scale*2},0`;
  });

  return (
    <Canvas style={{ flex: 1 }}>
      <Group>
        <Path path={path} style="stroke" strokeWidth={3} color={profile.colorPalette[0]}>
          <BlurMask blur={15} style="outer" />
        </Path>
        {/* Secondary layer for that deep Obsidian depth */}
        <Path path={path} style="stroke" strokeWidth={1} color={profile.colorPalette[1]} opacity={0.5} />
      </Group>
    </Canvas>
  );
};
