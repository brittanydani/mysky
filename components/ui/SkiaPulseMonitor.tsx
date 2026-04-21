// components/ui/SkiaPulseMonitor.tsx
//
// "Hold to Seal" — Haptic Energy Ring
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged legacy "Muddy Gold" and static Navy backgrounds.
// 2. Implemented "Midnight Slate" core with "Lunar Gold" specular arcs.
// 3. Assigned "Atmosphere Blue" for idle discovery cues.
// 4. Intensified bioluminescent bloom during the 2.5s hold sequence.
// 5. Applied high-precision haptic heartbeat ramp (400ms → 55ms).

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
  cancelAnimation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Lunar Gold Core
  specular: '#FFF9EA',   // Light Peak
  atmosphere: '#A2C2E1', // Discovery Cue (Icy Blue)
  emerald: '#6EBF8B',    // Success
  slateDeep: '#1A1E29',  // Anchor Bottom
};

const SIZE     = 200;
const CENTER   = SIZE / 2;
const RING_R   = 76;      
const CORE_R   = 36;      
const ORBIT_R  = RING_R + 16; 
const HOLD_MS  = 2500;    

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

export default function SkiaPulseMonitor({
  onSyncComplete,
  isSaving = false,
}: {
  onSyncComplete: () => boolean | void | Promise<boolean | void>;
  isSaving?: boolean;
}) {
  const [complete, setComplete] = useState(false);

  const progress     = useSharedValue(0);
  const breathe      = useSharedValue(0);
  const discoveryPulse = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  const prevSaving = useRef(isSaving);
  useEffect(() => {
    if (prevSaving.current && !isSaving) {
      const timer = setTimeout(() => {
        setComplete(false);
        progress.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
      }, 1400);
      return () => clearTimeout(timer);
    }
    prevSaving.current = isSaving;
  }, [isSaving, progress]);

  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
    discoveryPulse.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, false);
    return () => {
      cancelAnimation(breathe);
      cancelAnimation(discoveryPulse);
    };
  }, [breathe, discoveryPulse]);

  const hapticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticMs    = useRef(400);
  const hapticMounted = useRef(true);

  const stopHaptics = useCallback(() => {
    if (hapticTimer.current) { clearTimeout(hapticTimer.current); hapticTimer.current = null; }
    hapticMs.current = 400;
  }, []);

  useEffect(() => {
    hapticMounted.current = true;
    return () => {
      hapticMounted.current = false;
      stopHaptics();
    };
  }, [stopHaptics]);

  const startHaptics = useCallback(() => {
    stopHaptics();
    const tick = () => {
      if (!hapticMounted.current) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      hapticMs.current = Math.max(55, hapticMs.current * 0.82);
      hapticTimer.current = setTimeout(tick, hapticMs.current);
    };
    tick();
  }, [stopHaptics]);

  const handleComplete = useCallback(() => {
    stopHaptics();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    const result = onSyncComplete();
    const revert = () => {
      setComplete(false);
      progress.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    };
    if (result instanceof Promise) {
      result.then((ok) => { if (ok === false) revert(); else setComplete(true); }).catch(revert);
    } else if (result === false) { revert(); } else { setComplete(true); }
  }, [stopHaptics, onSyncComplete, progress]);

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
      flashOpacity.value = withSequence(
        withTiming(0.85, { duration: 70, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) }),
      );
      runOnJS(handleComplete)();
    })
    .onFinalize((_e, success) => {
      'worklet';
      if (!success) {
        cancelAnimation(progress);
        progress.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
        runOnJS(stopHaptics)();
      }
    });

  const auraR  = useDerivedValue(() => CORE_R + 8 + breathe.value * 6 + progress.value * 22);
  const auraOp = useDerivedValue(() => 0.12 + breathe.value * 0.05 + progress.value * 0.25);
  const cueOuterOp = useDerivedValue(() => (complete || isSaving ? 0 : 0.20 - discoveryPulse.value * 0.15));
  const cueInnerOp = useDerivedValue(() => (complete || isSaving ? 0 : 0.15 - discoveryPulse.value * 0.10));

  const arcPath = useDerivedValue(() => {
    const p = Skia.Path.Make(); const sweep = 360 * progress.value;
    if (sweep > 0.5) p.addArc({ x: CENTER - RING_R, y: CENTER - RING_R, width: RING_R * 2, height: RING_R * 2 }, -90, sweep);
    return p;
  });

  const accentColor = complete ? PALETTE.emerald : PALETTE.gold;

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={tapGesture}>
        <View style={styles.container} collapsable={false}>
          <Canvas style={{ width: SIZE, height: SIZE }}>
            <Group>
              {/* 1. Ambient Bloom */}
              <Circle cx={CENTER} cy={CENTER} r={auraR} color={accentColor} opacity={auraOp}>
                <BlurMask blur={30} style="outer" />
              </Circle>

              {/* 2. Atmosphere Discovery Cues */}
              <Circle cx={CENTER} cy={CENTER} r={ORBIT_R + 4 + discoveryPulse.value * 10} style="stroke" strokeWidth={1.5} color={PALETTE.atmosphere} opacity={cueOuterOp} />
              <Circle cx={CENTER} cy={CENTER} r={ORBIT_R - 2 + discoveryPulse.value * 6} style="stroke" strokeWidth={1} color="#FFF" opacity={cueInnerOp} />

              {/* 3. Orbit Hardware */}
              {TICK_PATHS.map(({ path, isMajor }, i) => (
                <Path key={i} path={path} style="stroke" strokeWidth={isMajor ? 1.5 : 0.8} color={`rgba(255,255,255,${isMajor ? 0.2 : 0.1})`} />
              ))}

              {/* 4. Tracking Ring */}
              <Circle cx={CENTER} cy={CENTER} r={RING_R} style="stroke" strokeWidth={2} color="rgba(255,255,255,0.08)" />

              {/* 5. Progress Arcs */}
              <Path path={arcPath} style="stroke" strokeWidth={6} strokeCap="round" color={accentColor}>
                <BlurMask blur={useDerivedValue(() => 4 + progress.value * 10)} style="solid" />
              </Path>
              <Path path={arcPath} style="stroke" strokeWidth={2.5} strokeCap="round" color={accentColor} />

              {/* 6. Slate Core */}
              <Circle cx={CENTER} cy={CENTER} r={CORE_R} color={PALETTE.slateDeep} />

              {/* 7. Bioluminescent Fluid */}
              <Circle cx={CENTER} cy={CENTER} r={useDerivedValue(() => (CORE_R - 3) * progress.value)} color={accentColor} opacity={0.25}>
                <BlurMask blur={8} style="normal" />
              </Circle>

              {/* 8. Core Border (Hardware) */}
              <Circle cx={CENTER} cy={CENTER} r={CORE_R - 1} style="stroke" strokeWidth={1.5} color={accentColor} opacity={useDerivedValue(() => 0.4 + progress.value * 0.6)} />

              {/* 9. Specular Catch-light */}
              <Circle cx={CENTER - 10} cy={CENTER - 12} r={6} color="rgba(255,255,255,0.15)">
                <BlurMask blur={5} style="solid" />
              </Circle>

              {/* 10. White Flash Burst */}
              <Circle cx={CENTER} cy={CENTER} r={ORBIT_R + 15} color="#FFF" opacity={useDerivedValue(() => flashOpacity.value)}>
                <BlurMask blur={32} style="outer" />
              </Circle>
            </Group>
          </Canvas>
        </View>
      </GestureDetector>

      <Text style={[styles.label, complete && styles.labelComplete]}>
        {complete ? 'LOG  SEALED' : 'HOLD  TO  SEAL'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', marginVertical: 8 },
  container: { width: SIZE, height: SIZE },
  label: { marginTop: 12, color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase', textAlign: 'center' },
  labelComplete: { color: '#6EBF8B' },
});
