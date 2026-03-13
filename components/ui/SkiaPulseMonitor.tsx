// File: components/ui/SkiaPulseMonitor.tsx
//
// "Hold to Seal" — Haptic Energy Ring
//
// Physics-driven biometric-lock interaction for sealing sleep data.
// Hold the orb for 2.5 seconds:
//   1. Gold arc sweeps clockwise around the orbit ring.
//   2. Haptic pulses accelerate (heartbeat ramp: 400ms → 55ms).
//   3. At completion → white flash + heavy "thud" haptic + success state.
//   4. Release early → ring rewinds, haptic loop stops.
//
// Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  BlurMask,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

// ── Layout constants ──────────────────────────────────────────────────────────

const SIZE     = 200;
const CENTER   = SIZE / 2;
const RING_R   = 76;      // progress sweep ring radius
const CORE_R   = 36;      // inner orb radius
const ORBIT_R  = RING_R + 16; // tick-mark orbit radius
const HOLD_MS  = 2500;    // milliseconds to hold before sealing

// ── Palette ───────────────────────────────────────────────────────────────────

const GOLD      = '#C9AE78';
const EMERALD   = '#6EBF8B';
const NAVY      = '#030C1E';

// ── Precomputed tick-mark paths for the outer orbit (static, no SharedValues) ──

const TICK_PATHS = Array.from({ length: 48 }, (_, i) => {
  const angle    = (i / 48) * Math.PI * 2 - Math.PI / 2;
  const isMajor  = i % 4 === 0;
  const innerR   = ORBIT_R - (isMajor ? 6 : 3);
  const outerR   = ORBIT_R + (isMajor ? 3 : 1);
  const p        = Skia.Path.Make();
  p.moveTo(CENTER + Math.cos(angle) * innerR, CENTER + Math.sin(angle) * innerR);
  p.lineTo(CENTER + Math.cos(angle) * outerR, CENTER + Math.sin(angle) * outerR);
  return { path: p, isMajor };
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function SkiaPulseMonitor({
  onSyncComplete,
}: {
  onSyncComplete: () => void;
}) {
  const [complete, setComplete] = useState(false);

  // Reanimated shared values
  const progress     = useSharedValue(0);
  const breathe      = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  // ── Idle breathing animation ──────────────────────────────────────────────
  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathe]);

  // ── Accelerating haptic heartbeat ─────────────────────────────────────────
  const hapticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticMs    = useRef(400);

  const stopHaptics = useCallback(() => {
    if (hapticTimer.current) {
      clearTimeout(hapticTimer.current);
      hapticTimer.current = null;
    }
    hapticMs.current = 400;
  }, []);

  const startHaptics = useCallback(() => {
    stopHaptics();
    const tick = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      hapticMs.current = Math.max(55, hapticMs.current * 0.82);
      hapticTimer.current = setTimeout(tick, hapticMs.current);
    };
    tick();
  }, [stopHaptics]);

  // ── Seal completion ───────────────────────────────────────────────────────
  const handleComplete = useCallback(() => {
    stopHaptics();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setComplete(true);
    onSyncComplete();
  }, [stopHaptics, onSyncComplete]);

  // ── Gesture ───────────────────────────────────────────────────────────────
  const tapGesture = Gesture.LongPress()
    .minDuration(HOLD_MS)
    .maxDistance(60)
    .onBegin(() => {
      'worklet';
      progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
      runOnJS(startHaptics)();
    })
    .onStart(() => {
      'worklet';
      // White flash then fade
      flashOpacity.value = withSequence(
        withTiming(0.85, { duration: 70, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) }),
      );
      runOnJS(handleComplete)();
    })
    .onFinalize((_e, success) => {
      'worklet';
      if (!success) {
        progress.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) });
        runOnJS(stopHaptics)();
      }
    });

  // ── Derived Skia values ───────────────────────────────────────────────────

  // Ambient aura: grows and brightens as progress advances
  const auraR  = useDerivedValue(() => CORE_R + 8 + breathe.value * 6 + progress.value * 22);
  const auraOp = useDerivedValue(() => 0.10 + breathe.value * 0.08 + progress.value * 0.22);

  // Gold progress arc (sweeps −90° → +270°)
  const arcPath = useDerivedValue(() => {
    const p     = Skia.Path.Make();
    const sweep = 360 * progress.value;
    if (sweep > 0.5) {
      p.addArc(
        { x: CENTER - RING_R, y: CENTER - RING_R, width: RING_R * 2, height: RING_R * 2 },
        -90,
        sweep,
      );
    }
    return p;
  });

  // Fluid fill inside the orb grows with progress
  const fluidR   = useDerivedValue(() => (CORE_R - 3) * progress.value);

  // Arc glow blur intensifies as the ring fills
  const arcBlur  = useDerivedValue(() => 3 + progress.value * 9);

  // Ring border alpha brightens
  const coreOp   = useDerivedValue(() => 0.55 + progress.value * 0.40);

  // Success pulse after completion
  const sGlowR   = useDerivedValue(() => CORE_R + 6 + breathe.value * 12);
  const sGlowOp  = useDerivedValue(() => 0.20 + breathe.value * 0.22);

  // Flash overlay
  const flashOp  = useDerivedValue(() => flashOpacity.value);

  const accentColor = complete ? EMERALD : GOLD;

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={tapGesture}>
        <View style={styles.container} collapsable={false}>
          <Canvas style={{ width: SIZE, height: SIZE }}>
            <Group>

              {/* ── 1. Ambient aura glow ── */}
              <Circle cx={CENTER} cy={CENTER} r={auraR}
                color={accentColor} opacity={auraOp}>
                <BlurMask blur={24} style="outer" />
              </Circle>

              {/* ── 2. Outer orbit tick marks ── */}
              {TICK_PATHS.map(({ path, isMajor }, i) => (
                <Path
                  key={i}
                  path={path}
                  style="stroke"
                  strokeWidth={isMajor ? 1.4 : 0.7}
                  color="rgba(255,255,255,0.10)"
                />
              ))}

              {/* ── 3. Static track ring ── */}
              <Circle cx={CENTER} cy={CENTER} r={RING_R}
                style="stroke" strokeWidth={2}
                color="rgba(255,255,255,0.06)" />

              {/* ── 4. Gold progress arc (glow layer) ── */}
              <Path path={arcPath} style="stroke" strokeWidth={5} strokeCap="round"
                color={accentColor}>
                <BlurMask blur={arcBlur} style="solid" />
              </Path>

              {/* ── 5. Gold progress arc (crisp layer) ── */}
              <Path path={arcPath} style="stroke" strokeWidth={2.5} strokeCap="round"
                color={accentColor} />

              {/* ── 6. Core orb background ── */}
              <Circle cx={CENTER} cy={CENTER} r={CORE_R} color={NAVY} />

              {/* ── 7. Fluid fill (grows with progress) ── */}
              <Circle cx={CENTER} cy={CENTER} r={fluidR}
                color={accentColor} opacity={0.20}>
                <BlurMask blur={7} style="normal" />
              </Circle>

              {/* ── 8. Core border brightens as ring fills ── */}
              <Circle cx={CENTER} cy={CENTER} r={CORE_R - 1}
                style="stroke" strokeWidth={1.5}
                color={accentColor} opacity={coreOp} />

              {/* ── 9. Catch-light ── */}
              <Circle cx={CENTER - 10} cy={CENTER - 12} r={5}
                color="rgba(255,255,255,0.13)">
                <BlurMask blur={4} style="solid" />
              </Circle>

              {/* ── 10. Success pulse glow (post-seal) ── */}
              {complete && (
                <Circle cx={CENTER} cy={CENTER} r={sGlowR}
                  color={EMERALD} opacity={sGlowOp}>
                  <BlurMask blur={20} style="outer" />
                </Circle>
              )}

              {/* ── 11. Completion flash burst ── */}
              <Circle cx={CENTER} cy={CENTER} r={ORBIT_R + 10}
                color="rgba(255,255,255,1)" opacity={flashOp}>
                <BlurMask blur={28} style="outer" />
              </Circle>

            </Group>
          </Canvas>

          <Text style={[styles.label, complete && styles.labelComplete]}>
            {complete ? 'SEALED  ✦' : 'HOLD  TO  SEAL'}
          </Text>
        </View>
      </GestureDetector>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignItems:    'center',
    marginVertical: 8,
  },
  container: {
    width:          SIZE,
    height:         SIZE + 30,
    justifyContent: 'center',
    alignItems:     'center',
  },
  label: {
    marginTop:     10,
    color:         'rgba(255,255,255,0.35)',
    fontSize:      10,
    fontWeight:    '800',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    textAlign:     'center',
  },
  labelComplete: {
    color:         '#6EBF8B',
    opacity:       1,
  },
});
