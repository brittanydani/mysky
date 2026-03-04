// File: components/ui/SkiaStoryGate.tsx
/**
 * SkiaStoryGate
 * A cinematic interactive gateway for Natal Story chapters.
 * Features: Rotating geometric rings, Pulse Shaders, and Jewel-Tone Bloom.
 *
 * Each chapter is rendered as an interactive "Stargate" — a geometric key that
 * rotates and blooms with jewel-toned light as the user scrolls, creating a
 * sense of unlocking ancient personal wisdom from a living star chart.
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Platform } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
  BlurMask,
  SweepGradient,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const GATE_SIZE = 120;
const RADIUS = GATE_SIZE * 0.4;

export const PALETTE = {
  amethyst: '#9D76C1',
  gold: '#D4AF37',
  emerald: '#6EBF8B',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  rose: '#D4A3B3',
  sapphire: '#4A6FA5',
  ruby: '#9B2335',
  topaz: '#FFBF00',
  moonstone: '#AAB7C4',
};

/** Jewel-tone chapter → accent color mapping (thematic) */
export const CHAPTER_COLORS: string[] = [
  PALETTE.gold,       // Ch 1: Identity / Core Vitality
  PALETTE.silverBlue, // Ch 2: Emotional Body
  PALETTE.copper,     // Ch 3: Activating Force
  PALETTE.rose,       // Ch 4: Relational Force
  PALETTE.emerald,    // Ch 5: Creative Expression
  PALETTE.moonstone,  // Ch 6: Daily Structure
  PALETTE.sapphire,   // Ch 7: Relational Domain
  PALETTE.amethyst,   // Ch 8: Shadow Work
  PALETTE.topaz,      // Ch 9: Growth Direction
  PALETTE.ruby,       // Ch 10: Life Mission
];

interface StoryGateProps {
  /** Zero-based chapter index */
  index: number;
  /** Chapter title text */
  title: string;
  /** Whether this chapter content is available to view */
  isUnlocked: boolean;
  /** Whether the user holds premium access */
  isPremium?: boolean;
  /** Jewel-tone accent for this chapter's Stargate glow */
  accentColor?: string;
  /** Callback when the gate is pressed */
  onPress: () => void;
}

export default function SkiaStoryGate({
  index,
  title,
  isUnlocked,
  isPremium = false,
  accentColor = PALETTE.gold,
  onPress,
}: StoryGateProps) {

  // ── Shared Animation Values (Reanimated) ──
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);

  // ── Permanent Motion ──
  // Each gate gets a unique spin duration so they don't rotate in lock-step
  useEffect(() => {
    const spinDuration = 10000 + index * 800;
    rotation.value = withRepeat(
      withTiming(Math.PI * 2, { duration: spinDuration, easing: Easing.linear }),
      -1,  // infinite
      false,
    );
    if (isUnlocked) {
      pulse.value = withRepeat(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,  // infinite
        true, // reverse each cycle
      );
    }
  }, [rotation, pulse, index, isUnlocked]);

  // ── Derived Transformations (Reanimated → Skia bridge) ──
  const groupTransform = useDerivedValue(() => [
    { rotate: rotation.value },
    { scale: isUnlocked ? pulse.value : 1 },
  ]);

  // ── Geometric "Key" Design — 8-pointed star path ──
  const starPath = useMemo(() => {
    const path = Skia.Path.Make();
    const cx = GATE_SIZE / 2;
    const cy = GATE_SIZE / 2;
    const outerR = RADIUS;
    const innerR = RADIUS * 0.6;
    const points = 8;

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (Math.PI / points) * i;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    path.close();
    return path;
  }, []);

  return (
    <Pressable onPress={onPress} style={styles.gateWrapper}>
      <View style={styles.canvasContainer}>
        <Canvas style={{ width: GATE_SIZE, height: GATE_SIZE }}>
          <Group
            origin={vec(GATE_SIZE / 2, GATE_SIZE / 2)}
            transform={groupTransform}
          >
            {/* 1. Outer Orbit Ring */}
            <Circle
              cx={GATE_SIZE / 2}
              cy={GATE_SIZE / 2}
              r={RADIUS + 6}
              style="stroke"
              strokeWidth={1}
              color="rgba(255,255,255,0.1)"
            />

            {/* 2. The Geometric Chapter Key */}
            <Path
              path={starPath}
              style="stroke"
              strokeWidth={isUnlocked ? 2 : 1}
              color={isUnlocked ? accentColor : 'rgba(255,255,255,0.2)'}
            >
              {isUnlocked && <BlurMask blur={4} style="outer" />}
            </Path>

            {/* 3. The Core Light — only when chapter is unlocked */}
            {isUnlocked && (
              <Circle
                cx={GATE_SIZE / 2}
                cy={GATE_SIZE / 2}
                r={RADIUS * 0.3}
                color={accentColor}
              >
                <BlurMask blur={15} style="solid" />
                <SweepGradient
                  c={vec(GATE_SIZE / 2, GATE_SIZE / 2)}
                  colors={[accentColor, 'transparent', accentColor]}
                />
              </Circle>
            )}
          </Group>

          {/* 4. Locked Overlay — dim dot for locked chapters */}
          {!isUnlocked && (
            <Circle
              cx={GATE_SIZE / 2}
              cy={GATE_SIZE / 2}
              r={RADIUS * 0.2}
              color="rgba(255,255,255,0.05)"
            />
          )}
        </Canvas>

        {/* Chapter index badge */}
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
      </View>

      {/* Text column */}
      <View style={styles.textColumn}>
        <Text style={[styles.chapterLabel, !isUnlocked && styles.lockedText]}>
          Chapter {index + 1}
        </Text>
        <Text
          style={[styles.chapterTitle, !isUnlocked && styles.lockedText]}
          numberOfLines={2}
        >
          {isUnlocked ? title : 'Locked Pattern'}
        </Text>
        {!isPremium && !isUnlocked && (
          <View style={styles.premiumTag}>
            <Text style={styles.premiumTagText}>DEEPER SKY</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingRight: 20,
  },
  canvasContainer: {
    width: GATE_SIZE,
    height: GATE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexBadge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#07090F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
  },
  textColumn: {
    flex: 1,
    marginLeft: 10,
  },
  chapterLabel: {
    color: PALETTE.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  chapterTitle: {
    color: '#FDFBF7',
    fontSize: 20,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    fontWeight: '600',
  },
  lockedText: {
    opacity: 0.35,
  },
  premiumTag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  premiumTagText: {
    color: PALETTE.gold,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
