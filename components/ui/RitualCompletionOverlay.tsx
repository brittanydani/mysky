// File: components/ui/RitualCompletionOverlay.tsx
/**
 * RitualCompletionOverlay — "The Micro-Insight" Seal
 *
 * After the Hold Ring reaches 100%, this full-screen Skia overlay renders
 * for ~3 seconds then fires onDone().
 *
 * Visual Spec (Gemini):
 *   - A single massive "Star" in the center: scale 0→5, opacity 1→0
 *   - Personalised Delta text: "Your radiance has increased by X%"
 *   - Gold burst — 8-point star drawn via Skia Path
 *   - Tappable "Done" button appears after 1.8 s
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { Canvas, Path, Skia, BlurMask, Group } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { SkiaDynamicCosmos } from './SkiaDynamicCosmos';

const { width: W, height: H } = Dimensions.get('window');

// ── Palette ───────────────────────────────────────────────────────────────────

const GOLD = '#D4AF37';
const GOLD_LIGHT = '#EBC07D';

// ── Build star path at given pixel size ───────────────────────────────────────

function makeStarPath(cx: number, cy: number, outerR: number, innerR: number, points: number) {
  const p = Skia.Path.Make();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.close();
  return p;
}

// Build a static star at canvas centre
const STAR_CANVAS_SIZE = 300;
const STAR_CENTER = STAR_CANVAS_SIZE / 2;
const starPath = makeStarPath(STAR_CENTER, STAR_CENTER, 60, 26, 8);

// ── Animated star ─────────────────────────────────────────────────────────────

function StarBurst({ checkInType }: { checkInType: 'weather' | 'rest' }) {
  const color = checkInType === 'rest' ? '#A286F2' : GOLD;

  return (
    <Canvas style={styles.starCanvas}>
      <Path path={starPath} color={color} opacity={0.95}>
        <BlurMask blur={8} style="outer" />
      </Path>
      <Path path={starPath} color={color} opacity={0.6}>
        <BlurMask blur={20} style="outer" />
      </Path>
      <Path path={starPath} color={GOLD_LIGHT} opacity={0.4}>
        <BlurMask blur={40} style="outer" />
      </Path>
    </Canvas>
  );
}

// ── Delta calculation ──────────────────────────────────────────────────────────

function calcDelta(currentMood: number, previousMood: number): number {
  if (previousMood <= 0) return 0;
  return Math.round(((currentMood - previousMood) / previousMood) * 100);
}

function buildInsightText(
  userName: string,
  checkInType: 'weather' | 'rest',
  microInsight: string,
  currentMood: number,
  previousMood: number,
): string {
  if (microInsight && microInsight.length > 10) return microInsight;

  const delta = calcDelta(currentMood, previousMood);
  const name = userName?.split(' ')[0] ?? 'You';

  if (checkInType === 'weather') {
    if (delta > 0) {
      return `${name}, your radiance has increased by ${delta}% since your last log. Observe this expansion.`;
    }
    if (delta < 0) {
      return `${name}, your field has shifted ${Math.abs(delta)}% since your last log. This too is data.`;
    }
    return `${name}, your internal weather is anchored. The Observatory has received your signal.`;
  }
  // rest
  return `${name}, your rest is recorded. Sleep is the architecture of tomorrow's clarity.`;
}

// ── Props & Component ─────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onDone: () => void;
  microInsight?: string;
  checkInType: 'weather' | 'rest';
  userName?: string;
  currentMood?: number;
  previousMood?: number;
}

export default function RitualCompletionOverlay({
  visible,
  onDone,
  microInsight = '',
  checkInType,
  userName = '',
  currentMood = 5,
  previousMood = 5,
}: Props) {
  // Star animation values
  const starScale = useSharedValue(0);
  const starOpacity = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  const hasRun = useRef(false);

  const fireDone = useCallback(() => {
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (!visible) {
      // Reset for next open
      starScale.value = 0;
      starOpacity.value = 1;
      textOpacity.value = 0;
      buttonOpacity.value = 0;
      hasRun.current = false;
      return;
    }

    if (hasRun.current) return;
    hasRun.current = true;

    // Star expands and fades
    starScale.value = withTiming(5, { duration: 2800, easing: Easing.out(Easing.cubic) });
    starOpacity.value = withSequence(
      withTiming(1, { duration: 600 }),
      withDelay(600, withTiming(0, { duration: 2000, easing: Easing.in(Easing.quad) })),
    );

    // Insight text fades in after the star blooms
    textOpacity.value = withDelay(500, withTiming(1, { duration: 700 }));

    // Done button appears at 1.8 s
    buttonOpacity.value = withDelay(1800, withSpring(1, { damping: 14, stiffness: 120 }));
  }, [visible]);

  const starAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
    opacity: starOpacity.value,
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: (1 - buttonOpacity.value) * 16 }],
  }));

  const insightText = buildInsightText(userName, checkInType, microInsight, currentMood, previousMood);
  const accentColor = checkInType === 'rest' ? '#A286F2' : GOLD;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {/* Cosmic background */}
        <SkiaDynamicCosmos />
        <View style={styles.darkOverlay} pointerEvents="none" />

        {/* Star burst */}
        <Animated.View style={[styles.starWrapper, starAnimStyle]} pointerEvents="none">
          <StarBurst checkInType={checkInType} />
        </Animated.View>

        {/* Insightful text */}
        <Animated.View style={[styles.textBlock, textAnimStyle]}>
          <Text style={[styles.sealedLabel, { color: accentColor }]}>
            {checkInType === 'weather' ? 'INTERNAL WEATHER SEALED' : 'REST RECORDED'}
          </Text>
          <Text style={styles.insightText}>{insightText}</Text>
        </Animated.View>

        {/* Done button */}
        <Animated.View style={[styles.buttonWrapper, buttonAnimStyle]}>
          <Pressable
            style={[styles.doneButton, { borderColor: `${accentColor}60` }]}
            onPress={fireDone}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={[styles.doneText, { color: accentColor }]}>Done</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020817',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,8,23,0.55)',
  },
  starCanvas: {
    width: STAR_CANVAS_SIZE,
    height: STAR_CANVAS_SIZE,
  },
  starWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: H / 2 - STAR_CANVAS_SIZE / 2,
    left: W / 2 - STAR_CANVAS_SIZE / 2,
  },
  textBlock: {
    position: 'absolute',
    bottom: H * 0.28,
    left: 32,
    right: 32,
    alignItems: 'center',
    gap: 12,
  },
  sealedLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  insightText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: H * 0.12,
  },
  doneButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  doneText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
