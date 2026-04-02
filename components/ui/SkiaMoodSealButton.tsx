// File: components/ui/SkiaMoodSealButton.tsx
//
// "Hold to Seal" — Premium Skia Orb for Internal Weather
//
// Physics-driven biometric-lock interaction for sealing mood entries.
// Hold the orb for 1.8 seconds:
//   1. Gold arc sweeps clockwise around the orbit ring.
//   2. Particle-like tick marks pulse outward with progress.
//   3. Haptic pulses accelerate (heartbeat ramp: 400ms → 55ms).
//   4. At completion → white flash + heavy "thud" haptic + emerald success state.
//   5. Release early → arc rewinds gracefully, haptic loop stops.
//
// Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
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
import * as Haptics from '../../utils/haptics';

// ── Layout constants ──────────────────────────────────────────────────────────

const SIZE    = 180;
const CENTER  = SIZE / 2;
const RING_R  = 66;      // progress sweep ring radius
const CORE_R  = 32;      // inner orb radius
const ORBIT_R = RING_R + 14;
const HOLD_MS = 1800;    // milliseconds required to hold

// ── Palette ───────────────────────────────────────────────────────────────────

const GOLD    = '#D9BF8C';
const EMERALD = '#6EBF8B';
const BG      = '#020817';

// ── Precomputed tick-mark paths ───────────────────────────────────────────────
// 60 ticks on the outer orbit — alternate major/minor

const TICK_PATHS = Array.from({ length: 60 }, (_, i) => {
  const angle   = (i / 60) * Math.PI * 2 - Math.PI / 2;
  const isMajor = i % 5 === 0;
  const innerR  = ORBIT_R - (isMajor ? 7 : 3);
  const outerR  = ORBIT_R + (isMajor ? 3 : 1);
  const p       = Skia.Path.Make();
  p.moveTo(CENTER + Math.cos(angle) * innerR, CENTER + Math.sin(angle) * innerR);
  p.lineTo(CENTER + Math.cos(angle) * outerR, CENTER + Math.sin(angle) * outerR);
  return { path: p, isMajor };
});

// ── Diamond glyph path centred at (CENTER, CENTER) ───────────────────────────
// A classic wax-seal diamond symbol drawn with Skia paths.

const SEAL_GLYPH = (() => {
  const p = Skia.Path.Make();
  const s = 9; // half-size of diamond
  p.moveTo(CENTER,     CENTER - s);
  p.lineTo(CENTER + s, CENTER);
  p.lineTo(CENTER,     CENTER + s);
  p.lineTo(CENTER - s, CENTER);
  p.close();
  return p;
})();

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onSeal: () => void;
  isSaving?: boolean;
  disabled?: boolean;
  isEditing?: boolean;
}

export default function SkiaMoodSealButton({
  onSeal,
  isSaving = false,
  disabled = false,
  isEditing = false,
}: Props) {
  const [complete, setComplete] = useState(false);

  // After saving finishes (isSaving true→false), auto-reset the complete
  // state so the user can hold-to-seal again (edit flow).
  const prevSaving = useRef(isSaving);
  useEffect(() => {
    if (prevSaving.current && !isSaving) {
      // Saving finished — show success briefly, then reset
      const timer = setTimeout(() => {
        setComplete(false);
      }, 1400);
      return () => clearTimeout(timer);
    }
    prevSaving.current = isSaving;
  }, [isSaving]);

  // ── Shared values ─────────────────────────────────────────────────────────
  const progress     = useSharedValue(0);
  const breathe      = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  // Rewind the arc when complete resets (so user can seal again)
  useEffect(() => {
    if (!complete) {
      progress.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    }
  }, [complete, progress]);

  // ── Idle breathing animation ──────────────────────────────────────────────
  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathe]);

  // ── Accelerating haptic heartbeat ────────────────────────────────────────
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
      hapticMs.current = Math.max(55, hapticMs.current * 0.80);
      hapticTimer.current = setTimeout(tick, hapticMs.current);
    };
    tick();
  }, [stopHaptics]);

  // ── Seal completion ───────────────────────────────────────────────────────
  const handleComplete = useCallback(() => {
    stopHaptics();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setComplete(true);
    onSeal();
  }, [stopHaptics, onSeal]);

  // ── Gesture — only active when not disabled/saving/complete ──────────────
  const isInteractive = !disabled && !isSaving && !complete;

  const longPress = Gesture.LongPress()
    .minDuration(HOLD_MS)
    .maxDistance(60)
    .enabled(isInteractive)
    .onBegin(() => {
      'worklet';
      progress.value = withTiming(1, {
        duration: HOLD_MS,
        easing: Easing.linear,
      });
      runOnJS(startHaptics)();
    })
    .onStart(() => {
      'worklet';
      // Brilliant white flash then fade to nothing
      flashOpacity.value = withSequence(
        withTiming(0.9, { duration: 60,  easing: Easing.out(Easing.quad) }),
        withTiming(0,   { duration: 600, easing: Easing.in(Easing.quad) }),
      );
      runOnJS(handleComplete)();
    })
    .onFinalize((_e, success) => {
      'worklet';
      if (!success) {
        progress.value = withTiming(0, {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(stopHaptics)();
      }
    });

  // ── Derived Skia values ───────────────────────────────────────────────────

  // Ambient aura
  const auraR  = useDerivedValue(() =>
    CORE_R + 10 + breathe.value * 7 + progress.value * 26,
  );
  const auraOp = useDerivedValue(() =>
    0.08 + breathe.value * 0.07 + progress.value * 0.20,
  );

  // Secondary outer glow ring (always present, grows with breathe)
  const outerGlowR  = useDerivedValue(() => RING_R + 24 + breathe.value * 4);
  const outerGlowOp = useDerivedValue(() => 0.04 + breathe.value * 0.04);

  // Gold progress arc
  const arcPath = useDerivedValue(() => {
    const p     = Skia.Path.Make();
    const sweep = 360 * progress.value;
    if (sweep > 0.5) {
      p.addArc(
        {
          x: CENTER - RING_R,
          y: CENTER - RING_R,
          width:  RING_R * 2,
          height: RING_R * 2,
        },
        -90,
        sweep,
      );
    }
    return p;
  });

  // Glow layer behind the arc
  const arcGlowPath = useDerivedValue(() => {
    const p     = Skia.Path.Make();
    const sweep = 360 * progress.value;
    if (sweep > 0.5) {
      p.addArc(
        {
          x: CENTER - RING_R,
          y: CENTER - RING_R,
          width:  RING_R * 2,
          height: RING_R * 2,
        },
        -90,
        sweep,
      );
    }
    return p;
  });

  // Fluid fill grows with progress
  const fluidR = useDerivedValue(() => (CORE_R - 4) * progress.value);

  // Arc glow intensity
  const arcBlur = useDerivedValue(() => 4 + progress.value * 12);

  // Core border alpha
  const coreOp = useDerivedValue(() => 0.50 + progress.value * 0.45);

  // Post-seal success pulse
  const sGlowR  = useDerivedValue(() => CORE_R + 8 + breathe.value * 14);
  const sGlowOp = useDerivedValue(() => 0.22 + breathe.value * 0.24);

  // Diamond glyph opacity — appears softly inside the orb
  const glyphOp = useDerivedValue(() =>
    complete ? (0.55 + breathe.value * 0.15) : (0.18 + breathe.value * 0.10 + progress.value * 0.12),
  );

  // Flash overlay
  const flashOp = useDerivedValue(() => flashOpacity.value);

  const accent = complete ? EMERALD : GOLD;
  const dimOpacity = (disabled && !complete) ? 0.35 : 1;

  return (
    <View style={[styles.wrapper, { opacity: dimOpacity }]}>
      <GestureDetector gesture={longPress}>
        <View style={styles.container} collapsable={false}>
          <Canvas style={{ width: SIZE, height: SIZE }}>
            <Group>

              {/* ── 1. Outer ambient glow (always breathing) ── */}
              <Circle cx={CENTER} cy={CENTER} r={outerGlowR}
                color={accent} opacity={outerGlowOp}>
                <BlurMask blur={36} style="outer" />
              </Circle>

              {/* ── 2. Core aura (grows on hold) ── */}
              <Circle cx={CENTER} cy={CENTER} r={auraR}
                color={accent} opacity={auraOp}>
                <BlurMask blur={20} style="outer" />
              </Circle>

              {/* ── 3. Orbit tick marks ── */}
              {TICK_PATHS.map(({ path, isMajor }, i) => (
                <Path
                  key={i}
                  path={path}
                  style="stroke"
                  strokeWidth={isMajor ? 1.5 : 0.7}
                  color={`rgba(255,255,255,${isMajor ? 0.14 : 0.06})`}
                />
              ))}

              {/* ── 4. Static track ring ── */}
              <Circle cx={CENTER} cy={CENTER} r={RING_R}
                style="stroke" strokeWidth={1.5}
                color="rgba(255,255,255,0.06)" />

              {/* ── 5. Arc glow layer ── */}
              <Path
                path={arcGlowPath}
                style="stroke"
                strokeWidth={8}
                strokeCap="round"
                color={accent}
              >
                <BlurMask blur={arcBlur} style="solid" />
              </Path>

              {/* ── 6. Arc crisp layer ── */}
              <Path
                path={arcPath}
                style="stroke"
                strokeWidth={2.5}
                strokeCap="round"
                color={accent}
              />

              {/* ── 7. Core orb background ── */}
              <Circle cx={CENTER} cy={CENTER} r={CORE_R} color={BG} />

              {/* ── 8. Fluid fill (grows with progress) ── */}
              <Circle cx={CENTER} cy={CENTER} r={fluidR}
                color={accent} opacity={0.18}>
                <BlurMask blur={8} style="normal" />
              </Circle>

              {/* ── 9. Diamond seal glyph ── */}
              <Path
                path={SEAL_GLYPH}
                style="stroke"
                strokeWidth={1.2}
                color={accent}
                opacity={glyphOp}
              />

              {/* ── 10. Core border ── */}
              <Circle cx={CENTER} cy={CENTER} r={CORE_R - 1}
                style="stroke" strokeWidth={1.5}
                color={accent} opacity={coreOp} />

              {/* ── 11. Specular catch-light ── */}
              <Circle cx={CENTER - 9} cy={CENTER - 11} r={4.5}
                color="rgba(255,255,255,0.12)">
                <BlurMask blur={4} style="solid" />
              </Circle>

              {/* ── 12. Success: emerald pulse glow ── */}
              {complete && (
                <Circle cx={CENTER} cy={CENTER} r={sGlowR}
                  color={EMERALD} opacity={sGlowOp}>
                  <BlurMask blur={22} style="outer" />
                </Circle>
              )}

              {/* ── 13. Completion flash burst ── */}
              <Circle cx={CENTER} cy={CENTER} r={ORBIT_R + 12}
                color="rgba(255,255,255,1)" opacity={flashOp}>
                <BlurMask blur={30} style="outer" />
              </Circle>

            </Group>
          </Canvas>

          {isSaving && (
            <View style={styles.savingOverlay}>
              <ActivityIndicator size="small" color={GOLD} />
            </View>
          )}

          <Text style={[styles.label, complete && styles.labelComplete]}>
            {isSaving ? 'SEALING…' : complete ? 'SEALED  ✦' : isEditing ? 'HOLD  TO  UPDATE' : 'HOLD  TO  SEAL'}
          </Text>
        </View>
      </GestureDetector>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignItems:     'center',
    marginVertical: 8,
  },
  container: {
    width:          SIZE,
    height:         SIZE + 36,
    justifyContent: 'center',
    alignItems:     'center',
  },
  savingOverlay: {
    position:       'absolute',
    top:            SIZE / 2 - 12,
    left:           SIZE / 2 - 12,
    width:          24,
    height:         24,
    justifyContent: 'center',
    alignItems:     'center',
  },
  label: {
    marginTop:     8,
    color:         'rgba(255,255,255,0.30)',
    fontSize:      10,
    fontWeight:    '800',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    textAlign:     'center',
  },
  labelComplete: {
    color:    '#6EBF8B',
    opacity:  1,
  },
});
