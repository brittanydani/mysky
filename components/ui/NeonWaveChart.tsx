/**
 * NeonWaveChart.tsx
 * MySky — 7-Day Aurora Pillar Chart (Skia)
 *
 * Each day = a glowing vertical pillar whose height encodes Mood.
 * Energy (teal) + Stress (rose) appear as slim accent strips flanking each pillar.
 * TODAY's pillar glows brightest. Tap any pillar for a frosted-glass tooltip.
 *
 * No overlapping wave areas — completely redesigned.
 */

import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Canvas,
  LinearGradient,
  Circle,
  BlurMask,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { DailyCheckIn } from '../../services/patterns/types';

// ── Palette ───────────────────────────────────────────────────────────────────

const MOOD_COLOR   = '#E2C27A';   // champagne gold
const ENERGY_COLOR = '#7DD3F0';   // azure
const STRESS_COLOR = '#E8807A';   // rose coral

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelToFrac(level: 'low' | 'medium' | 'high'): number {
  return level === 'low' ? 0.18 : level === 'medium' ? 0.52 : 0.88;
}

function hexAlpha(hex: string, alpha: number): string {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface NeonWaveChartProps {
  checkIns: DailyCheckIn[];
  width:    number;
  height?:  number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NeonWaveChart({ checkIns, width, height = 200 }: NeonWaveChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Always display exactly 7 days (oldest → today)
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const ci = checkIns.find(c => c.date === dateStr) ?? null;
      return {
        dateStr,
        label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
        displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        isToday: i === 6,
        mood:   ci ? ci.moodScore / 10 : null,
        energy: ci ? levelToFrac(ci.energyLevel) : null,
        stress: ci ? levelToFrac(ci.stressLevel) : null,
        raw:    ci,
      };
    });
  }, [checkIns]);

  // ── Layout ────────────────────────────────────────────────────────────────
  const PAD_T  = 16;
  const PAD_B  = 30;   // day labels
  const PAD_X  = 12;
  const plotH  = height - PAD_T - PAD_B;
  const plotW  = width  - PAD_X * 2;
  const bottom = PAD_T + plotH;

  const PILLAR_W   = Math.floor((plotW - 6 * 10) / 7);   // 6 gaps × 10px
  const STRIDE     = PILLAR_W + Math.floor((plotW - 7 * PILLAR_W) / 6);
  const ACCENT_W   = 3;
  const MIN_PILLAR = 6;

  // ── Skia geometry — memoized ───────────────────────────────────────────────
  const pillars = useMemo(() =>
    days.map((day, i) => {
      const px    = PAD_X + i * STRIDE;
      const moodH = day.mood !== null ? Math.max(day.mood * plotH, MIN_PILLAR) : MIN_PILLAR;
      const topY  = bottom - moodH;

      const energyH = day.energy !== null
        ? Math.max(day.energy * plotH * 0.65, 3)
        : 0;
      const stressH = day.stress !== null
        ? Math.max(day.stress * plotH * 0.65, 3)
        : 0;

      return { ...day, px, moodH, topY, energyH, stressH };
    }),
  [days, plotH, bottom, PILLAR_W, STRIDE]);

  // Ground line dimensions
  const groundY = bottom;

  // Active day for tooltip
  const active = activeIdx !== null ? days[activeIdx] : null;

  const hasSomeData = days.some(d => d.mood !== null);

  if (!hasSomeData) {
    return (
      <View style={[styles.root, { width, height, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyTxt}>Complete a check-in to begin tracking</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { width, height }]}>
      {/* ── Skia canvas ─────────────────────────────────────────────────── */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Subtle ground line */}
        <Rect x={PAD_X} y={groundY} width={plotW} height={1} color="rgba(255,255,255,0.07)" />

        {pillars.map((day, i) => {
          const cx = day.px + PILLAR_W / 2;

          if (day.mood === null) {
            // Empty day — ghost stub at the base
            return (
              <React.Fragment key={i}>
                <Rect
                  x={day.px}
                  y={bottom - MIN_PILLAR}
                  width={PILLAR_W}
                  height={MIN_PILLAR}
                  color="rgba(255,255,255,0.04)"
                />
              </React.Fragment>
            );
          }

          const isActive = activeIdx === i;

          return (
            <React.Fragment key={i}>
              {/* Atmospheric glow halo (wider + blurred) */}
              <Rect
                x={day.px - 5}
                y={day.topY - 10}
                width={PILLAR_W + 10}
                height={day.moodH + 14}
                color={hexAlpha(MOOD_COLOR, day.isToday || isActive ? 0.15 : 0.05)}
              >
                <BlurMask blur={18} style="normal" />
              </Rect>

              {/* Main pillar body — horizontal metallic sweep */}
              <Rect x={day.px} y={day.topY} width={PILLAR_W} height={day.moodH}>
                <LinearGradient
                  start={vec(day.px, 0)}
                  end={vec(day.px + PILLAR_W, 0)}
                  positions={[0, 0.22, 0.5, 0.78, 1]}
                  colors={day.isToday
                    ? ['rgba(74,47,16,0.72)', 'rgba(168,116,46,0.82)', 'rgba(239,213,150,0.90)', 'rgba(168,116,46,0.82)', 'rgba(74,47,16,0.72)']
                    : ['rgba(74,47,16,0.28)', 'rgba(168,116,46,0.38)', 'rgba(221,186,106,0.44)', 'rgba(168,116,46,0.38)', 'rgba(74,47,16,0.28)']
                  }
                />
              </Rect>

              {/* Rounded top cap — horizontal metallic sweep */}
              <Circle cx={cx} cy={day.topY} r={PILLAR_W / 2}>
                <LinearGradient
                  start={vec(cx - PILLAR_W / 2, 0)}
                  end={vec(cx + PILLAR_W / 2, 0)}
                  positions={[0, 0.22, 0.5, 0.78, 1]}
                  colors={day.isToday
                    ? ['rgba(74,47,16,0.80)', 'rgba(168,116,46,0.88)', '#EFD596', 'rgba(168,116,46,0.88)', 'rgba(74,47,16,0.80)']
                    : ['rgba(74,47,16,0.38)', 'rgba(168,116,46,0.50)', 'rgba(201,153,73,0.60)', 'rgba(168,116,46,0.50)', 'rgba(74,47,16,0.38)']
                  }
                />
              </Circle>

              {/* Energy accent — metallic blue left strip */}
              {day.energyH > 0 && (
                <Rect
                  x={day.px}
                  y={bottom - day.energyH}
                  width={ACCENT_W}
                  height={day.energyH}
                >
                  <LinearGradient
                    start={vec(day.px, bottom)}
                    end={vec(day.px, bottom - day.energyH)}
                    colors={day.isToday
                      ? ['rgba(139,196,232,0.30)', 'rgba(176,216,240,0.88)', 'rgba(214,238,255,0.96)']
                      : ['rgba(139,196,232,0.12)', 'rgba(139,196,232,0.56)', 'rgba(214,238,255,0.72)']
                    }
                  />
                </Rect>
              )}

              {/* Stress accent — metallic rose right strip */}
              {day.stressH > 0 && (
                <Rect
                  x={day.px + PILLAR_W - ACCENT_W}
                  y={bottom - day.stressH}
                  width={ACCENT_W}
                  height={day.stressH}
                >
                  <LinearGradient
                    start={vec(day.px + PILLAR_W, bottom)}
                    end={vec(day.px + PILLAR_W, bottom - day.stressH)}
                    colors={day.isToday
                      ? ['rgba(212,163,179,0.30)', 'rgba(224,176,196,0.88)', 'rgba(245,214,224,0.96)']
                      : ['rgba(212,163,179,0.12)', 'rgba(212,163,179,0.56)', 'rgba(245,214,224,0.72)']
                    }
                  />
                </Rect>
              )}

              {/* Bright crown dot on top */}
              <Circle
                cx={cx}
                cy={day.topY}
                r={day.isToday ? 3.5 : 2.5}
                color={day.isToday ? MOOD_COLOR : hexAlpha(MOOD_COLOR, 0.72)}
              />

              {/* Top glow bloom */}
              <Circle
                cx={cx}
                cy={day.topY}
                r={PILLAR_W}
                color={hexAlpha(MOOD_COLOR, day.isToday ? 0.28 : 0.10)}
              >
                <BlurMask blur={day.isToday ? 12 : 7} style="normal" />
              </Circle>
            </React.Fragment>
          );
        })}
      </Canvas>

      {/* ── Tap targets (invisible, over each pillar column) ─────────────── */}
      {pillars.map((day, i) => (
        <Pressable
          key={i}
          style={{
            position: 'absolute',
            left: day.px - 4,
            top: PAD_T,
            width: PILLAR_W + 8,
            height: plotH,
          }}
          onPress={() => setActiveIdx(activeIdx === i ? null : i)}
        />
      ))}

      {/* ── Day labels ───────────────────────────────────────────────────── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {pillars.map((day, i) => (
          <Text
            key={i}
            style={[
              styles.dayLabel,
              {
                left:  day.px,
                width: PILLAR_W,
                bottom: 6,
                color: day.isToday
                  ? 'rgba(226,194,122,0.85)'
                  : activeIdx === i
                  ? 'rgba(255,255,255,0.7)'
                  : 'rgba(255,255,255,0.28)',
              },
            ]}
          >
            {day.label}
          </Text>
        ))}
      </View>

      {/* ── Tooltip ──────────────────────────────────────────────────────── */}
      {active && activeIdx !== null && (
        <View
          style={[
            styles.tooltipShell,
            {
              top: PAD_T,
              left: Math.max(
                0,
                Math.min(
                  width - 148,
                  pillars[activeIdx].px + PILLAR_W / 2 - 74,
                ),
              ),
            },
          ]}
          pointerEvents="none"
        >
          <BlurView
            intensity={Platform.OS === 'android' ? 20 : 50}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.tooltipTint} />
          <View style={styles.tooltipRim} />
          <View style={styles.tooltipAccentBar} />
          <View style={styles.tooltipContent}>
            <Text style={styles.tooltipDate}>{active.displayDate}</Text>
            {active.raw && (
              <>
                <View style={styles.tooltipRow}>
                  <View style={[styles.tooltipDot, { backgroundColor: MOOD_COLOR }]} />
                  <Text style={styles.tooltipLbl}>Mood</Text>
                  <Text style={[styles.tooltipVal, { color: MOOD_COLOR }]}>
                    {active.raw.moodScore.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.tooltipRow}>
                  <View style={[styles.tooltipDot, { backgroundColor: ENERGY_COLOR }]} />
                  <Text style={styles.tooltipLbl}>Energy</Text>
                  <Text style={[styles.tooltipVal, { color: ENERGY_COLOR }]}>
                    {active.raw.energyLevel}
                  </Text>
                </View>
                <View style={styles.tooltipRow}>
                  <View style={[styles.tooltipDot, { backgroundColor: STRESS_COLOR }]} />
                  <Text style={styles.tooltipLbl}>Stress</Text>
                  <Text style={[styles.tooltipVal, { color: STRESS_COLOR }]}>
                    {active.raw.stressLevel}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <View style={styles.legend} pointerEvents="none">
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: MOOD_COLOR }]} />
          <Text style={styles.legendLabel}>Mood</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ENERGY_COLOR }]} />
          <Text style={styles.legendLabel}>Energy</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: STRESS_COLOR }]} />
          <Text style={styles.legendLabel}>Stress</Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  emptyTxt: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    textAlign: 'center',
  },
  dayLabel: {
    position: 'absolute',
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  legend: {
    position: 'absolute',
    top: 6,
    right: 4,
    flexDirection: 'row',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.75,
  },
  legendLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  // Tooltip
  tooltipShell: {
    position: 'absolute',
    width: 148,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.65,
    shadowRadius: 22,
    elevation: 14,
    zIndex: 10,
  },
  tooltipTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,8,28,0.65)',
  },
  tooltipRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226,194,122,0.22)',
  },
  tooltipAccentBar: {
    height: 2.5,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: -4,
    backgroundColor: 'rgba(226,194,122,0.38)',
    borderRadius: 2,
  },
  tooltipContent: {
    padding: 10,
  },
  tooltipDate: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 10,
    marginBottom: 6,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 7,
  },
  tooltipLbl: {
    flex: 1,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
  },
  tooltipVal: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
