// File: components/ui/SkiaReflectionMirror.tsx
/**
 * SkiaReflectionMirror — "The Mirror Portal"
 *
 * A frosted-glass writing environment for journal reflection prompts.
 * The prompt text "emerges" from behind a layer of fogged glass.
 *
 * Architecture:
 *   1. Frosted Glass Shader — a Gaussian blur layer that clears as
 *      the user breathes with the integrated Breath Portal.
 *   2. Typography-first — Georgia/serif stack, centred on a dark
 *      infinite plane. Zero astrology icons. Only the user's thoughts.
 *   3. Breath integration — `breathProgress` (0→1) controls the
 *      frost opacity: 0 = fully frosted, 1 = perfectly clear.
 *
 * The component can be used standalone (with its own breathing timer)
 * or receive an external `breathProgress` shared value from the
 * SkiaBreathPortal.
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { memo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Canvas,
  Rect,
  RoundedRect,
  Group,
  LinearGradient,
  RadialGradient,
  BlurMask,
  Circle,
  vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');
const MIRROR_W = W - 32;
const MIRROR_H = H * 0.55;
const CX = MIRROR_W / 2;
const CY = MIRROR_H / 2;

// ── Palette (muted, silent, introspective) ──────────────────────────────────

const PALETTE = {
  frost: 'rgba(180, 190, 210, 0.12)',
  frostDeep: 'rgba(120, 140, 170, 0.08)',
  glass: 'rgba(15, 18, 25, 0.92)',
  border: 'rgba(255, 255, 255, 0.04)',
  textPrompt: 'rgba(240, 234, 214, 0.85)',
  textHint: 'rgba(255, 255, 255, 0.35)',
  breathGlow: 'rgba(110, 191, 139, 0.15)',
  cursorLine: 'rgba(232, 214, 174, 0.5)',
};

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  /** The reflection prompt text to display */
  prompt: string;
  /** Optional secondary instruction line */
  instruction?: string;
  /** Current user text */
  value: string;
  /** Text change handler */
  onChangeText: (text: string) => void;
  /** Optional external breath progress (0–1). If omitted, uses internal timer. */
  breathProgress?: { value: number };
  /** Placeholder text */
  placeholder?: string;
  /** Whether the writing area is focused */
  autoFocus?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────────

const SkiaReflectionMirror = memo(function SkiaReflectionMirror({
  prompt,
  instruction,
  value,
  onChangeText,
  breathProgress: externalBreath,
  placeholder = 'Begin writing...',
  autoFocus = false,
}: Props) {
  // ── Internal breath timer (if no external provided) ──
  const internalBreath = useSharedValue(0);

  useEffect(() => {
    if (!externalBreath) {
      // Auto-breathe: 8-second cycle (coherent breathing)
      internalBreath.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    }
  }, [externalBreath, internalBreath]);

  const breath = externalBreath ?? internalBreath;

  // ── Frost opacity (inversely proportional to breath) ──
  // When breath = 0 (exhale), frost is maximally visible.
  // When breath = 1 (inhale peak), frost clears.
  const frostOpacity = useDerivedValue(() => {
    'worklet';
    return 0.15 * (1 - breath.value * 0.7);
  });

  const frostBlur = useDerivedValue(() => {
    'worklet';
    return 20 - breath.value * 12;
  });

  // ── Breath glow (emerald pulse at centre) ──
  const glowRadius = useDerivedValue(() => {
    'worklet';
    return 40 + breath.value * 60;
  });

  const glowOpacity = useDerivedValue(() => {
    'worklet';
    return 0.08 + breath.value * 0.1;
  });

  // ── Has user started writing? ──
  const hasContent = value.length > 0;

  return (
    <View style={styles.container}>
      {/* ── Skia Frosted Glass Layer ── */}
      <Canvas style={styles.canvas} pointerEvents="none">
        {/* Dark infinite plane */}
        <Rect x={0} y={0} width={MIRROR_W} height={MIRROR_H} color={PALETTE.glass} />

        {/* Frosted glass overlay — clears with breath */}
        <Group opacity={frostOpacity}>
          <Rect x={0} y={0} width={MIRROR_W} height={MIRROR_H} color={PALETTE.frost}>
            <BlurMask blur={25} style="normal" />
          </Rect>
          <Rect
            x={MIRROR_W * 0.1}
            y={MIRROR_H * 0.15}
            width={MIRROR_W * 0.8}
            height={MIRROR_H * 0.7}
            color={PALETTE.frostDeep}
          >
            <BlurMask blur={40} style="normal" />
          </Rect>
        </Group>

        {/* Breath glow — subtle emerald pulse */}
        <Group opacity={glowOpacity}>
          <Circle cx={CX} cy={CY * 0.4} r={glowRadius}>
            <RadialGradient
              c={vec(CX, CY * 0.4)}
              r={100}
              colors={[PALETTE.breathGlow, 'transparent']}
            />
            <BlurMask blur={30} style="normal" />
          </Circle>
        </Group>

        {/* Glass border */}
        <RoundedRect
          x={0.5}
          y={0.5}
          width={MIRROR_W - 1}
          height={MIRROR_H - 1}
          r={20}
          color={PALETTE.border}
          style="stroke"
          strokeWidth={1}
        />

        {/* Specular top edge */}
        <Rect x={MIRROR_W * 0.15} y={0} width={MIRROR_W * 0.7} height={1.5}>
          <LinearGradient
            start={vec(MIRROR_W * 0.15, 0)}
            end={vec(MIRROR_W * 0.85, 0)}
            colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
          />
        </Rect>
      </Canvas>

      {/* ── Content Layer ── */}
      <View style={styles.contentLayer}>
        {/* Prompt text — emerges from frost */}
        <View style={styles.promptArea}>
          <Text style={styles.promptText}>{prompt}</Text>
          {instruction && (
            <Text style={styles.instructionText}>{instruction}</Text>
          )}
        </View>

        {/* Divider — a single breath line */}
        <View style={styles.divider} />

        {/* Writing area */}
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={PALETTE.textHint}
          multiline
          autoFocus={autoFocus}
          textAlignVertical="top"
          scrollEnabled
          selectionColor={PALETTE.cursorLine}
        />
      </View>
    </View>
  );
});

export default memo(SkiaReflectionMirror);

// ── Styles ──────────────────────────────────────────────────────────────────

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  container: {
    width: MIRROR_W,
    height: MIRROR_H,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
    width: MIRROR_W,
    height: MIRROR_H,
  },
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    padding: 24,
    justifyContent: 'flex-start',
  },
  promptArea: {
    marginBottom: 16,
  },
  promptText: {
    color: PALETTE.textPrompt,
    fontSize: 18,
    fontWeight: '500',
    fontFamily: SERIF,
    lineHeight: 28,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  instructionText: {
    color: PALETTE.textHint,
    fontSize: 12,
    fontFamily: SERIF,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(232,214,174,0.18)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    color: 'rgba(240, 234, 214, 0.9)',
    fontSize: 15,
    fontFamily: SERIF,
    lineHeight: 24,
    letterSpacing: 0.2,
    paddingTop: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'top',
  },
});

