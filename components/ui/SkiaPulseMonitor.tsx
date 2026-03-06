// File: components/ui/SkiaPulseMonitor.tsx
/**
 * SkiaPulseMonitor
 * A biometric confirmation tool.
 * Requires sustained touch to "Secure" data, providing somatic grounding.
 *
 * Somatic Logic:
 *   - Pressure Ring: Expands over 3 seconds while the user holds their finger
 *     on the "Pulse Orb," simulating heart-rate expansion.
 *   - Collapse Guard: If the user lifts too early the ring collapses, requiring
 *     them to stay present for the full Sync cycle.
 *   - Haptic Feedback: Light impact on touch-start, success notification on
 *     complete — grounding the interaction in physical sensation.
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const ORB_SIZE = 120;
const CENTER = ORB_SIZE / 2;

export default function SkiaPulseMonitor({
  onSyncComplete,
}: {
  onSyncComplete: () => void;
}) {
  const [complete, setComplete] = useState(false);
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);

  const tapGesture = Gesture.LongPress()
    .minDuration(1500)
    .maxDistance(50)
    .onBegin(() => {
      'worklet';
      scale.value = withTiming(1.2, { duration: 1500 });
      progress.value = withTiming(1, {
        duration: 1500,
        easing: Easing.linear,
      });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onStart(() => {
      'worklet';
      // They held it for 3000ms, gesture recognized.
      runOnJS(setComplete)(true);
      runOnJS(Haptics.notificationAsync)(
        Haptics.NotificationFeedbackType.Success,
      );
      runOnJS(onSyncComplete)();
    })
    .onFinalize((e, success) => {
      'worklet';
      if (!success) {
        // Did not reach 3 seconds or gesture was cancelled/failed
        scale.value = withTiming(1, { duration: 300 });
        progress.value = withTiming(0, { duration: 300 });
      }
    });

  // ── Derived Skia values ──
  const ringRadius = useDerivedValue(() => 40 + progress.value * 20);
  const ringOpacity = useDerivedValue(() => 1 - progress.value);
  const fluidRadius = useDerivedValue(() => 38 * progress.value);

  return (
    <GestureHandlerRootView style={styles.wrapper}>
      <GestureDetector gesture={tapGesture}>
        <View style={styles.container}>
          <Canvas style={{ width: ORB_SIZE, height: ORB_SIZE }}>
            <Group>
              {/* 1. The Pulse Aura — expands outward with radial blur */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={ringRadius}
                color="#6EBF8B"
                opacity={ringOpacity}
              >
                <BlurMask blur={15} style="outer" />
              </Circle>

              {/* 2. The Core Sensor Orb */}
              <Circle cx={CENTER} cy={CENTER} r={40} color="#020817">
                <BlurMask blur={5} style="inner" />
              </Circle>
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={38}
                style="stroke"
                strokeWidth={2}
                color={complete ? '#6EBF8B' : '#C9AE78'}
              />

              {/* 3. The Progress "Fluid" — fills the orb as sync completes */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={fluidRadius}
                color={complete ? '#6EBF8B' : '#C9AE78'}
                opacity={0.3}
              />
            </Group>
          </Canvas>
          <Text style={styles.label}>
            {complete ? 'ALIGNED' : 'HOLD TO SYNC'}
          </Text>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', marginVertical: 30 },
  container: {
    width: ORB_SIZE,
    height: ORB_SIZE + 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: 10,
    color: '#F0EAD6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    opacity: 0.6,
    textAlign: 'center',
  },
});
