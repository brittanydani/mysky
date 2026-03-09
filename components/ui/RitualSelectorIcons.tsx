// File: components/ui/RitualSelectorIcons.tsx
/**
 * RitualSelectorIcons — The Ritual menu icons
 *
 * Three Skia-drawn symbols: Sun (Internal Weather), Moon (Morning Rest),
 * Pen (Journal). When one is selected, it moves to the centre and the
 * others fade to 0.2 opacity via withSpring.
 *
 * Visual Spec (Gemini):
 *   Sun  — 1.5px stroke circle with radiating lines (Cyan #7DEBDB)
 *   Moon — crescent shape with soft outer glow (Lavender #A286F2)
 *   Pen  — minimalist vertical stroke (Gold #D4AF37)
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { memo } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  Skia,
  Group,
  BlurMask,
  vec,
  RadialGradient,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// ── Palette ───────────────────────────────────────────────────────────────────

const CYAN = '#7DEBDB';
const LAVENDER = '#A286F2';
const GOLD = '#D4AF37';
const ICON_SIZE = 72;
const IC = ICON_SIZE / 2; // centre

// ── Skia: Sun icon ─────────────────────────────────────────────────────────────

function SunCanvas({ active }: { active: boolean }) {
  const R = 16; // body radius
  const rayLen = 8;
  const rayCount = 8;
  const color = CYAN;

  const rays = React.useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const startR = R + 5;
      const endR = R + 5 + rayLen;
      const x1 = IC + Math.cos(angle) * startR;
      const y1 = IC + Math.sin(angle) * startR;
      const x2 = IC + Math.cos(angle) * endR;
      const y2 = IC + Math.sin(angle) * endR;
      p.moveTo(x1, y1);
      p.lineTo(x2, y2);
    }
    return p;
  }, []);

  return (
    <Canvas style={{ width: ICON_SIZE, height: ICON_SIZE }}>
      {/* Glow */}
      {active && (
        <Circle cx={IC} cy={IC} r={R + 14} color={CYAN} opacity={0.15}>
          <BlurMask blur={10} style="outer" />
        </Circle>
      )}
      {/* Body */}
      <Circle cx={IC} cy={IC} r={R} style="stroke" strokeWidth={1.5} color={color} />
      {/* Rays */}
      <Path path={rays} style="stroke" strokeWidth={1.5} color={color} strokeCap="round" />
    </Canvas>
  );
}

// ── Skia: Moon icon ────────────────────────────────────────────────────────────

function MoonCanvas({ active }: { active: boolean }) {
  const crescent = React.useMemo(() => {
    const p = Skia.Path.Make();
    // Outer circle clip — crescent via subtract
    // Draw a filled outer circle, then cut away the inner offset circle
    // Using SVG-string path for precise crescent shape
    // The crescent: outer circle centred slightly left, inner circle offset right
    const cx = IC, cy = IC;
    const outerR = 18;
    const innerR = 14;
    const offsetX = 10;

    // Build the crescent boundary using two arcs
    // We trace the outer circle arc (the visible part) and the inner circle arc (the cut)
    // Approximate crescent with a custom SVG path
    // Outer arc: start top, sweep clockwise ~240 degrees
    p.addArc(
      { x: cx - outerR, y: cy - outerR, width: outerR * 2, height: outerR * 2 },
      -120,
      300,
    );
    return p;
  }, []);

  const crescentFill = React.useMemo(() => {
    // A filled crescent: outer circle minus inner shifted circle
    // We can use SVG path to create a proper crescent
    const outerR = 18;
    const innerR = 14;
    const cx = IC;
    const cy = IC;
    const ox = IC + 7; // offset inner circle rightward
    const svgPath =
      `M ${cx} ${cy - outerR} ` +
      `A ${outerR} ${outerR} 0 0 1 ${cx} ${cy + outerR} ` +
      `A ${innerR} ${innerR} 0 0 0 ${cx} ${cy - outerR} Z`;
    const p = Skia.Path.MakeFromSVGString(svgPath);
    return p ?? Skia.Path.Make();
  }, []);

  return (
    <Canvas style={{ width: ICON_SIZE, height: ICON_SIZE }}>
      {/* Glow */}
      {active && (
        <Circle cx={IC} cy={IC} r={22} color={LAVENDER} opacity={0.18}>
          <BlurMask blur={12} style="outer" />
        </Circle>
      )}
      {/* Crescent fill */}
      <Path path={crescentFill} color={LAVENDER} opacity={0.9} />
      {/* Crescent stroke for crispness */}
      <Path path={crescent} style="stroke" strokeWidth={1.5} color={LAVENDER} strokeCap="round" />
    </Canvas>
  );
}

// ── Skia: Pen icon ─────────────────────────────────────────────────────────────

function PenCanvas({ active }: { active: boolean }) {
  const pen = React.useMemo(() => {
    const p = Skia.Path.Make();
    const cx = IC;
    // Vertical stem
    p.moveTo(cx, IC - 18);
    p.lineTo(cx, IC + 10);
    // Nib point
    p.moveTo(cx - 5, IC + 5);
    p.lineTo(cx, IC + 18);
    p.lineTo(cx + 5, IC + 5);
    // Top cap horizontal line
    p.moveTo(cx - 4, IC - 18);
    p.lineTo(cx + 4, IC - 18);
    return p;
  }, []);

  return (
    <Canvas style={{ width: ICON_SIZE, height: ICON_SIZE }}>
      {active && (
        <Circle cx={IC} cy={IC} r={20} color={GOLD} opacity={0.15}>
          <BlurMask blur={10} style="outer" />
        </Circle>
      )}
      <Path path={pen} style="stroke" strokeWidth={1.5} color={GOLD} strokeCap="round" strokeJoin="round" />
    </Canvas>
  );
}

// ── Types & labels ─────────────────────────────────────────────────────────────

export type RitualType = 'weather' | 'rest' | 'journal';

const LABELS: Record<RitualType, string> = {
  weather: 'Internal Weather',
  rest: 'Morning Rest',
  journal: 'Journal',
};

// ── Animated icon wrapper ──────────────────────────────────────────────────────

interface IconProps {
  type: RitualType;
  selected: RitualType | null;
  onPress: (type: RitualType) => void;
}

const RitualIcon = memo(function RitualIcon({ type, selected, onPress }: IconProps) {
  const isActive = selected === type;
  const isOther = selected !== null && !isActive;

  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withSpring(isOther ? 0.2 : 1, { damping: 16, stiffness: 160 });
  }, [isOther, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const iconEl = React.useMemo(() => {
    if (type === 'weather') return <SunCanvas active={isActive} />;
    if (type === 'rest') return <MoonCanvas active={isActive} />;
    return <PenCanvas active={isActive} />;
  }, [type, isActive]);

  return (
    <Animated.View style={[styles.iconWrapper, animStyle]}>
      <Pressable
        style={[styles.iconButton, isActive && styles.iconButtonActive]}
        onPress={() => onPress(type)}
        accessibilityRole="button"
        accessibilityLabel={LABELS[type]}
      >
        {iconEl}
      </Pressable>
      <Text style={[styles.iconLabel, isActive && styles.iconLabelActive]}>
        {LABELS[type]}
      </Text>
    </Animated.View>
  );
});

// ── Main export ────────────────────────────────────────────────────────────────

interface SelectorProps {
  selected: RitualType | null;
  onSelect: (type: RitualType) => void;
}

export default memo(function RitualSelectorIcons({ selected, onSelect }: SelectorProps) {
  return (
    <View style={styles.row}>
      <RitualIcon type="weather" selected={selected} onPress={onSelect} />
      <RitualIcon type="rest" selected={selected} onPress={onSelect} />
      <RitualIcon type="journal" selected={selected} onPress={onSelect} />
    </View>
  );
});

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    gap: 6,
    minWidth: 80,
  },
  iconButton: {
    borderRadius: 36,
    padding: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconButtonActive: {
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconLabel: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  iconLabelActive: {
    color: 'rgba(255,255,255,0.80)',
  },
});
