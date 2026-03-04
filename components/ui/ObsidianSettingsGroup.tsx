// File: components/ui/ObsidianSettingsGroup.tsx
/**
 * ObsidianSettingsGroup — "The Core Framework"
 *
 * A premium settings section container with:
 *   1. Obsidian glass surface with specular edge highlights.
 *   2. Section dividers rendered as luminous hairlines.
 *   3. Static high-contrast nebula tint in the background.
 *
 * Each group wraps its children (typically SkiaCelestialToggle rows
 * or standard Pressable setting rows) in a cohesive obsidian card.
 *
 * Requires: @shopify/react-native-skia 2.x
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Canvas,
  RoundedRect,
  Group,
  LinearGradient,
  Rect,
  BlurMask,
  vec,
} from '@shopify/react-native-skia';
import { theme } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const GROUP_W = SCREEN_W - 32;

// ── Glass palette ───────────────────────────────────────────────────────────

const GLASS = {
  surface: 'rgba(15, 18, 25, 0.88)',
  border: 'rgba(255, 255, 255, 0.06)',
  specularTop: 'rgba(255, 255, 255, 0.06)',
  specularBot: 'rgba(255, 255, 255, 0.0)',
  divider: 'rgba(255, 255, 255, 0.04)',
  nebulaHint: 'rgba(100, 70, 160, 0.04)',
};

// ── Props ───────────────────────────────────────────────────────────────────

interface Props {
  /** Section title */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Optional icon name (Ionicons) */
  icon?: string;
  /** Child elements (setting rows) */
  children: React.ReactNode;
}

// ── Component ───────────────────────────────────────────────────────────────

const ObsidianSettingsGroup = memo(function ObsidianSettingsGroup({
  title,
  subtitle,
  children,
}: Props) {
  // Measure height dynamically — we use a fixed min-height and let React
  // measure the actual content. The Skia canvas is positioned absolute.
  const [contentH, setContentH] = React.useState(120);
  const cardH = contentH + 48; // title area + padding

  return (
    <View style={styles.wrapper}>
      {/* ── Skia Glass Background ── */}
      <Canvas
        style={[styles.canvas, { width: GROUP_W, height: cardH }]}
        pointerEvents="none"
      >
        {/* Glass surface */}
        <RoundedRect
          x={0}
          y={0}
          width={GROUP_W}
          height={cardH}
          r={16}
          color={GLASS.surface}
        />

        {/* Nebula tint (subtle amethyst) */}
        <RoundedRect
          x={0}
          y={0}
          width={GROUP_W}
          height={cardH}
          r={16}
          color={GLASS.nebulaHint}
        >
          <BlurMask blur={20} style="normal" />
        </RoundedRect>

        {/* Specular top-edge */}
        <RoundedRect
          x={1}
          y={1}
          width={GROUP_W - 2}
          height={cardH * 0.3}
          r={16}
        >
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, cardH * 0.3)}
            colors={[GLASS.specularTop, GLASS.specularBot]}
          />
        </RoundedRect>

        {/* Border */}
        <RoundedRect
          x={0.5}
          y={0.5}
          width={GROUP_W - 1}
          height={cardH - 1}
          r={16}
          style="stroke"
          strokeWidth={1}
          color={GLASS.border}
        />

        {/* Specular edge highlight (left accent bar) */}
        <Rect x={0} y={20} width={2} height={cardH - 40} color="rgba(201, 169, 98, 0.15)">
          <BlurMask blur={3} style="outer" />
        </Rect>
      </Canvas>

      {/* ── Content Layer ── */}
      <View style={[styles.content, { minHeight: cardH }]}>
        {/* Section header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Children (setting rows) */}
        <View
          onLayout={(e) => setContentH(e.nativeEvent.layout.height)}
          style={styles.childWrap}
        >
          {children}
        </View>
      </View>
    </View>
  );
});

export default ObsidianSettingsGroup;

// ── Divider sub-component ───────────────────────────────────────────────────

export const ObsidianDivider = memo(function ObsidianDivider() {
  return <View style={styles.divider} />;
});

// ── Styles ──────────────────────────────────────────────────────────────────

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

const styles = StyleSheet.create({
  wrapper: {
    width: GROUP_W,
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  title: {
    color: '#FDFBF7',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: SERIF,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: GLASS.divider,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  childWrap: {
    // Children provide their own padding
  },
});
