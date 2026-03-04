// File: components/ui/SkiaMoonDragger.tsx
/**
 * SkiaMoonDragger — Radial Sleep Duration Instrument
 *
 * A radial instrument where the user drags a golden crescent moon around
 * a circular track to log sleep hours. Features a "Mist" fog that clears
 * as the user approaches 8 hours of restorative rest.
 *
 * Visual Language:
 *   - Golden crescent moon handle
 *   - Silver-Blue arc fill showing logged hours
 *   - Frosted mist shader that dissolves at 8h
 *   - Hour markers around the perimeter
 *
 * Requires: @shopify/react-native-skia 2.x, react-native-reanimated 4.x
 */

import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  PanResponder,
  Platform,
} from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
  BlurMask,
  RadialGradient,
  vec,
  RoundedRect,
  LinearGradient,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const SIZE = 280;
const CENTER = SIZE / 2;
const TRACK_RADIUS = SIZE * 0.38;
const HANDLE_RADIUS = 16;
const MAX_HOURS = 12;
const OPTIMAL_HOURS = 8;

// ─── Palette ───────────────────────────────────────────────────────────────────

const COLORS = {
  track: 'rgba(255, 255, 255, 0.04)',
  trackActive: '#8BC4E8',
  trackActiveGlow: 'rgba(139, 196, 232, 0.35)',
  moon: '#D4AF37',
  moonGlow: 'rgba(212, 175, 55, 0.4)',
  moonCore: '#FDFBF7',
  mist: 'rgba(139, 196, 232, 0.08)',
  hourMark: 'rgba(253, 251, 247, 0.2)',
  hourMarkActive: 'rgba(139, 196, 232, 0.6)',
  text: '#FDFBF7',
  textMuted: 'rgba(253, 251, 247, 0.5)',
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  /** Current hours value (0–12) */
  value: number;
  /** Change handler */
  onChange: (hours: number) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const SkiaMoonDragger = memo(function SkiaMoonDragger({ value, onChange }: Props) {
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // ── Moon idle pulse ──
  const moonPulse = useSharedValue(0);
  useEffect(() => {
    moonPulse.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [moonPulse]);

  const moonGlowRadius = useDerivedValue(() => HANDLE_RADIUS + 4 + moonPulse.value * 4);

  // ── Angle computation ──
  const angleFraction = value / MAX_HOURS; // 0–1
  const angleRad = angleFraction * Math.PI * 2 - Math.PI / 2; // Start at top (–π/2)
  const handleX = CENTER + Math.cos(angleRad) * TRACK_RADIUS;
  const handleY = CENTER + Math.sin(angleRad) * TRACK_RADIUS;

  // ── Mist opacity (1 at 0h → 0 at 8h+) ──
  const mistOpacity = Math.max(0, 1 - value / OPTIMAL_HOURS);

  // ── Pan responder for dragging ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      },
      onPanResponderMove: (_, gs) => {
        // Calculate angle from center based on gesture position
        const dx = gs.moveX - SIZE / 2;
        // Approximate: use the gesture's absolute position relative to center
        // This is a simplification — in production you'd measure the canvas offset
        const dy = gs.moveY - SIZE / 2;
        let angle = Math.atan2(dy, dx);
        // Shift angle so top = 0
        angle += Math.PI / 2;
        if (angle < 0) angle += Math.PI * 2;
        // Convert to hours
        const hours = Math.round((angle / (Math.PI * 2)) * MAX_HOURS * 2) / 2; // 0.5h steps
        const clamped = Math.max(0, Math.min(MAX_HOURS, hours));
        if (clamped !== valueRef.current) {
          Haptics.selectionAsync().catch(() => {});
          onChangeRef.current(clamped);
        }
      },
    }),
  ).current;

  // ── Arc path for the active portion ──
  const arcPath = useMemo(() => {
    const path = Skia.Path.Make();
    if (value <= 0) return path;

    const startAngle = -90; // Top
    const sweepAngle = (value / MAX_HOURS) * 360;

    path.addArc(
      {
        x: CENTER - TRACK_RADIUS,
        y: CENTER - TRACK_RADIUS,
        width: TRACK_RADIUS * 2,
        height: TRACK_RADIUS * 2,
      },
      startAngle,
      sweepAngle,
    );

    return path;
  }, [value]);

  // ── Hour markers ──
  const hourMarkers = useMemo(() => {
    const markers: { x: number; y: number; label: string; active: boolean }[] = [];
    for (let h = 0; h <= MAX_HOURS; h += 2) {
      const a = (h / MAX_HOURS) * Math.PI * 2 - Math.PI / 2;
      const outerR = TRACK_RADIUS + 24;
      markers.push({
        x: CENTER + Math.cos(a) * outerR,
        y: CENTER + Math.sin(a) * outerR,
        label: `${h}h`,
        active: h <= value,
      });
    }
    return markers;
  }, [value]);

  // ── Duration label ──
  const durationLabel = useMemo(() => {
    const h = Math.floor(value);
    const m = Math.round((value - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }, [value]);

  const qualityLabel = useMemo(() => {
    if (value >= 8) return 'Restorative';
    if (value >= 6) return 'Moderate';
    if (value >= 4) return 'Light';
    return 'Insufficient';
  }, [value]);

  const qualityColor = useMemo(() => {
    if (value >= 8) return COLORS.trackActive;
    if (value >= 6) return COLORS.moon;
    return '#CD7F5D';
  }, [value]);

  return (
    <View
      style={localStyles.container}
      accessibilityLabel={`Sleep duration: ${durationLabel}, ${qualityLabel}`}
      accessibilityRole="adjustable"
    >
      <View style={{ width: SIZE, height: SIZE }} {...panResponder.panHandlers}>
        <Canvas style={{ width: SIZE, height: SIZE }}>
          {/* ── 1. Background track ring ── */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={TRACK_RADIUS}
            style="stroke"
            strokeWidth={6}
            color={COLORS.track}
          />

          {/* ── 2. Active arc — Silver-Blue glow ── */}
          {value > 0 && (
            <Group>
              <Path
                path={arcPath}
                style="stroke"
                strokeWidth={8}
                strokeCap="round"
              >
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(SIZE, SIZE)}
                  colors={[COLORS.trackActiveGlow, COLORS.trackActive]}
                />
                <BlurMask blur={4} style="solid" />
              </Path>
              <Path
                path={arcPath}
                style="stroke"
                strokeWidth={4}
                strokeCap="round"
                color={COLORS.trackActive}
              />
            </Group>
          )}

          {/* ── 3. Mist / Fog overlay ── */}
          {mistOpacity > 0 && (
            <Circle cx={CENTER} cy={CENTER} r={TRACK_RADIUS - 20}>
              <RadialGradient
                c={vec(CENTER, CENTER)}
                r={TRACK_RADIUS}
                colors={[
                  `rgba(139, 196, 232, ${(0.12 * mistOpacity).toFixed(2)})`,
                  `rgba(74, 59, 107, ${(0.08 * mistOpacity).toFixed(2)})`,
                  'transparent',
                ]}
              />
              <BlurMask blur={20 * mistOpacity} style="normal" />
            </Circle>
          )}

          {/* ── 4. Moon handle — golden crescent ── */}
          <Group>
            {/* Glow */}
            <Circle cx={handleX} cy={handleY} r={HANDLE_RADIUS + 8}>
              <RadialGradient
                c={vec(handleX, handleY)}
                r={HANDLE_RADIUS + 12}
                colors={[COLORS.moonGlow, 'transparent']}
              />
              <BlurMask blur={8} style="solid" />
            </Circle>
            {/* Moon body */}
            <Circle cx={handleX} cy={handleY} r={HANDLE_RADIUS} color={COLORS.moon} />
            {/* Crescent cutout — a circle offset to create crescent illusion */}
            <Circle
              cx={handleX + 5}
              cy={handleY - 3}
              r={HANDLE_RADIUS - 4}
              color="#07090F"
            />
            {/* Inner glow point */}
            <Circle cx={handleX - 4} cy={handleY + 2} r={3} color={COLORS.moonCore}>
              <BlurMask blur={2} style="solid" />
            </Circle>
          </Group>

          {/* ── 5. Tick marks ── */}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
            const isMajor = i % 4 === 0;
            const innerR = TRACK_RADIUS - (isMajor ? 12 : 8);
            const outerR = TRACK_RADIUS - 4;
            return (
              <Path
                key={i}
                path={(() => {
                  const p = Skia.Path.Make();
                  p.moveTo(
                    CENTER + Math.cos(a) * innerR,
                    CENTER + Math.sin(a) * innerR,
                  );
                  p.lineTo(
                    CENTER + Math.cos(a) * outerR,
                    CENTER + Math.sin(a) * outerR,
                  );
                  return p;
                })()}
                style="stroke"
                strokeWidth={isMajor ? 2 : 1}
                color={
                  (i / 24) * MAX_HOURS <= value
                    ? COLORS.hourMarkActive
                    : COLORS.hourMark
                }
              />
            );
          })}
        </Canvas>

        {/* ── Center display ── */}
        <View style={localStyles.centerOverlay} pointerEvents="none">
          <Text style={localStyles.durationText}>{durationLabel}</Text>
          <Text style={[localStyles.qualityText, { color: qualityColor }]}>
            {qualityLabel}
          </Text>
        </View>
      </View>

      {/* ── Hour labels around the dial ── */}
      {hourMarkers.map((m, i) => (
        <View
          key={i}
          style={[
            localStyles.hourLabel,
            { left: m.x - 12, top: m.y - 8 },
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              localStyles.hourLabelText,
              m.active && { color: COLORS.hourMarkActive },
            ]}
          >
            {m.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

export default SkiaMoonDragger;

// ─── Styles ────────────────────────────────────────────────────────────────────

const localStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: SIZE + 48,
    height: SIZE + 48,
    alignSelf: 'center',
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationText: {
    color: '#FDFBF7',
    fontSize: 36,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
  },
  qualityText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  hourLabel: {
    position: 'absolute',
    width: 24,
    alignItems: 'center',
  },
  hourLabelText: {
    color: 'rgba(253, 251, 247, 0.3)',
    fontSize: 10,
    fontWeight: '600',
  },
});
