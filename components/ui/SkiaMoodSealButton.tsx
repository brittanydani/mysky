// File: components/ui/SkiaMoodSealButton.tsx
// MySky — "Hold to Seal" Premium Skia Orb
//
// Updated to "Lunar Sky" & "Velvet Glass" Aesthetic:
// 1. Purged muddy gold; implemented high-fidelity Atmosphere Blue.
// 2. Anchored the core in Midnight Slate for physical depth.
// 3. Synchronized bioluminescent "bloom" with accelerating haptic heartbeat.
// 4. Refined particle tick marks with a sheer silver-white finish.

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
  cancelAnimation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from '../../utils/haptics';
import { useAppTheme } from '../../context/ThemeContext';

// ── Layout constants ──────────────────────────────────────────────────────────
const SIZE        = 180;
const CANVAS_SIZE = 260; 
const CANVAS_PAD  = (CANVAS_SIZE - SIZE) / 2;
const CENTER      = CANVAS_SIZE / 2;
const RING_R      = 66;      
const CORE_R      = 32;      
const ORBIT_R     = RING_R + 14;
const HOLD_MS     = 750;     

// ── Cinematic Palette ──
const PALETTE = {
  atmosphere: '#A2C2E1', // Icy Blue Progress
  emerald:    '#6EBF8B', // Success
  slateDeep:  '#1A1E29', // Anchor Core
};

// ── Precomputed tick-mark paths ───────────────────────────────────────────────
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

const SEAL_GLYPH = (() => {
  const p = Skia.Path.Make();
  const s = 9; 
  p.moveTo(CENTER,     CENTER - s);
  p.lineTo(CENTER + s, CENTER);
  p.lineTo(CENTER,     CENTER + s);
  p.lineTo(CENTER - s, CENTER);
  p.close();
  return p;
})();

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
  const theme = useAppTheme();
  const textDim = theme.isDark ? 'rgba(255,255,255,0.72)' : 'rgba(26, 24, 21, 0.6)';
  const [gestureKey, setGestureKey] = useState(0);

  const prevSaving = useRef(isSaving);
  useEffect(() => {
    if (prevSaving.current && !isSaving) {
      const timer = setTimeout(() => {
        setComplete(false);
        setGestureKey(k => k + 1);
      }, 1400);
      return () => clearTimeout(timer);
    }
    prevSaving.current = isSaving;
  }, [isSaving]);

  const progress     = useSharedValue(0);
  const breathe      = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (!complete) {
      progress.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    }
  }, [complete, progress]);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breathe]);

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

  const handleComplete = useCallback(() => {
    stopHaptics();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setComplete(true);
    onSeal();
  }, [stopHaptics, onSeal]);

  const isInteractive = !disabled && !isSaving && !complete;

  const longPress = Gesture.LongPress()
    .minDuration(HOLD_MS)
    .maxDistance(60)
    .enabled(isInteractive)
    .onBegin(() => {
      'worklet';
      progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      runOnJS(startHaptics)();
    })
    .onStart(() => {
      'worklet';
      flashOpacity.value = withSequence(
        withTiming(0.9, { duration: 60, easing: Easing.out(Easing.quad) }),
        withTiming(0,   { duration: 600, easing: Easing.in(Easing.quad) }),
      );
      runOnJS(handleComplete)();
    })
    .onFinalize((_e, success) => {
      'worklet';
      if (!success) {
        cancelAnimation(progress);
        progress.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
        runOnJS(stopHaptics)();
      }
    });

  const auraR  = useDerivedValue(() => CORE_R + 10 + breathe.value * 7 + progress.value * 26);
  const auraOp = useDerivedValue(() => 0.08 + breathe.value * 0.07 + progress.value * 0.20);
  const outerGlowR  = useDerivedValue(() => RING_R + 24 + breathe.value * 4);
  const outerGlowOp = useDerivedValue(() => 0.04 + breathe.value * 0.04);
  const pulseRingR = useDerivedValue(() => RING_R + 10 + breathe.value * 10 + progress.value * 18);
  const pulseRingOp = useDerivedValue(() => 0.05 + breathe.value * 0.05 + progress.value * 0.18);

  const arcPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const sweep = 360 * progress.value;
    if (sweep > 0.5) p.addArc({ x: CENTER - RING_R, y: CENTER - RING_R, width: RING_R * 2, height: RING_R * 2 }, -90, sweep);
    return p;
  });

  const fluidR = useDerivedValue(() => (CORE_R - 4) * progress.value);
  const arcBlur = useDerivedValue(() => 4 + progress.value * 12);
  const coreOp = useDerivedValue(() => 0.50 + progress.value * 0.45);
  const sGlowR  = useDerivedValue(() => CORE_R + 8 + breathe.value * 14);
  const sGlowOp = useDerivedValue(() => 0.22 + breathe.value * 0.24);
  const glyphOp = useDerivedValue(() => complete ? (0.75 + breathe.value * 0.15) : (0.22 + breathe.value * 0.10 + progress.value * 0.12));
  const flashOp = useDerivedValue(() => flashOpacity.value);

  const accent = complete ? PALETTE.emerald : PALETTE.atmosphere;
  const dimOpacity = (disabled && !complete) ? 0.35 : 1;

  return (
    <View style={[styles.wrapper, { opacity: dimOpacity }]}>
      <GestureDetector key={gestureKey} gesture={longPress}>
        <View
          style={styles.container}
          collapsable={false}
          accessible
          accessibilityRole="button"
          accessibilityLabel={complete ? 'Entry sealed' : isEditing ? 'Hold to update check-in' : 'Hold to seal check-in'}
          accessibilityState={{ disabled: disabled && !complete }}
        >
          <View style={{ width: SIZE, height: SIZE, pointerEvents: 'none' }}>
            <Canvas style={{ position: 'absolute', top: -CANVAS_PAD, left: -CANVAS_PAD, width: CANVAS_SIZE, height: CANVAS_SIZE }}>
              <Group>
              <Circle cx={CENTER} cy={CENTER} r={outerGlowR} color={accent} opacity={outerGlowOp}><BlurMask blur={36} style="outer" /></Circle>
              <Circle cx={CENTER} cy={CENTER} r={auraR} color={accent} opacity={auraOp}><BlurMask blur={20} style="outer" /></Circle>
              <Circle cx={CENTER} cy={CENTER} r={pulseRingR} color={accent} opacity={pulseRingOp} style="stroke" strokeWidth={progress.value > 0.02 ? 2.4 : 1.2}><BlurMask blur={18} style="solid" /></Circle>
              {TICK_PATHS.map(({ path, isMajor }, i) => (
                <Path key={i} path={path} style="stroke" strokeWidth={isMajor ? 1.5 : 0.7} color={`rgba(255,255,255,${isMajor ? 0.24 : 0.12})`} />
              ))}
              <Circle cx={CENTER} cy={CENTER} r={RING_R} style="stroke" strokeWidth={1.5} color="rgba(255,255,255,0.10)" />
              <Path path={arcPath} style="stroke" strokeWidth={8} strokeCap="round" color={accent}><BlurMask blur={arcBlur} style="solid" /></Path>
              <Path path={arcPath} style="stroke" strokeWidth={2.5} strokeCap="round" color={accent} />
              <Circle cx={CENTER} cy={CENTER} r={CORE_R} color={PALETTE.slateDeep} />
              <Circle cx={CENTER} cy={CENTER} r={fluidR} color={accent} opacity={0.24}><BlurMask blur={8} style="normal" /></Circle>
              <Path path={SEAL_GLYPH} style="stroke" strokeWidth={1.4} color={accent} opacity={glyphOp} />
              <Circle cx={CENTER} cy={CENTER} r={CORE_R - 1} style="stroke" strokeWidth={1.5} color={accent} opacity={coreOp} />
              <Circle cx={CENTER - 9} cy={CENTER - 11} r={4.5} color="rgba(255,255,255,0.15)"><BlurMask blur={4} style="solid" /></Circle>
              {complete && <Circle cx={CENTER} cy={CENTER} r={sGlowR} color={PALETTE.emerald} opacity={sGlowOp}><BlurMask blur={22} style="outer" /></Circle>}
              <Circle cx={CENTER} cy={CENTER} r={ORBIT_R + 12} color="rgba(255,255,255,1)" opacity={flashOp}><BlurMask blur={30} style="outer" /></Circle>
            </Group>
          </Canvas>
          </View>
          {isSaving && <View style={styles.savingOverlay}><ActivityIndicator size="small" color={PALETTE.atmosphere} /></View>}
          <Text style={[styles.label, complete && styles.labelComplete]}>
            {isSaving ? 'SEALING…' : complete ? 'SEALED  ✦' : isEditing ? 'HOLD  TO  UPDATE' : 'HOLD  TO  SEAL'}
          </Text>
          <Text style={[styles.subLabel, { color: textDim }]}>
            {isEditing ? 'Press and hold until the ring blooms to update this check-in' : 'Press and hold until the ring blooms to save this check-in'}
          </Text>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', marginVertical: 8 },
  container: { width: SIZE, height: SIZE + 36, justifyContent: 'center', alignItems: 'center' },
  savingOverlay: { position: 'absolute', top: SIZE / 2 - 12, left: SIZE / 2 - 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  label: { marginTop: 8, color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '800', letterSpacing: 3.8, textTransform: 'uppercase', textAlign: 'center' },
  labelComplete: { color: '#6EBF8B', opacity: 1 },
  subLabel: { marginTop: 6, fontSize: 12, fontWeight: '600', lineHeight: 18, textAlign: 'center', maxWidth: 220 },
});
