// File: components/ui/NeonWaveChart.tsx
// MySky — 7-Day Aurora Pillar Chart (Skia)
//
// Updated to "Lunar Sky" & "Velvet Glass" Aesthetic:
// 1. Purged legacy teal/rose; implemented Atmosphere Blue and Ember Red.
// 2. Refined "Aurora Pillars" with high-fidelity vertical glass gradients.
// 3. Implemented "Bioluminescent Bloom" for today's data point and active states.
// 4. Unified tooltip and legend with the semantic semantic palette.

import React, { useMemo, useState } from 'react';
import { toLocalDateString } from '../../utils/dateUtils';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Canvas,
  LinearGradient,
  Circle,
  BlurMask,
  Rect,
  RoundedRect,
  vec,
  rrect,
} from '@shopify/react-native-skia';
import { DailyCheckIn } from '../../services/patterns/types';
import { useAppTheme } from '../../context/ThemeContext';

// ── Cinematic Palette ──
const PALETTE = {
  mood:        '#E2C27A',   // Champagne Gold (Core)
  atmosphere:  '#A2C2E1',   // Energy (Icy Blue)
  ember:       '#DC5050',   // Stress (Deep Red)
  slateMid:    '#2C3645',
  slateDeep:   '#1A1E29',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelToFrac(level: 'low' | 'medium' | 'high'): number {
  return level === 'low' ? 0.22 : level === 'medium' ? 0.55 : 0.90;
}

function hexAlpha(hex: string, alpha: number): string {
  const r = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex + r;
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface NeonWaveChartProps {
  checkIns: DailyCheckIn[];
  width:    number;
  height?:  number;
}

export function NeonWaveChart({ checkIns, width, height = 200 }: NeonWaveChartProps) {
  const theme = useAppTheme();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = toLocalDateString(d);
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

  const PAD_T  = 20;
  const PAD_B  = 34;   
  const PAD_X  = 12;
  const plotH  = height - PAD_T - PAD_B;
  const plotW  = width  - PAD_X * 2;
  const bottom = PAD_T + plotH;

  const PILLAR_W   = Math.floor((plotW - 60) / 7);
  const STRIDE     = PILLAR_W + 10;
  const ACCENT_W   = 2.5;
  const MIN_PILLAR = 6;

  const pillars = useMemo(() =>
    days.map((day, i) => {
      const px    = PAD_X + i * STRIDE;
      const moodH = day.mood !== null ? Math.max(day.mood * plotH, MIN_PILLAR) : MIN_PILLAR;
      const topY  = bottom - moodH;
      const energyH = day.energy !== null ? Math.max(day.energy * plotH * 0.7, 4) : 0;
      const stressH = day.stress !== null ? Math.max(day.stress * plotH * 0.7, 4) : 0;
      return { ...day, px, moodH, topY, energyH, stressH };
    }),
  [days, plotH, bottom, STRIDE]);

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
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Subtle ground line */}
        <Rect x={PAD_X} y={bottom} width={plotW} height={1} color="rgba(255,255,255,0.08)" />

        {pillars.map((day, i) => {
          const cx = day.px + PILLAR_W / 2;
          const isActive = activeIdx === i;

          if (day.mood === null) {
            return (
              <Rect key={i} x={day.px} y={bottom - MIN_PILLAR} width={PILLAR_W} height={MIN_PILLAR} color="rgba(255,255,255,0.04)" />
            );
          }

          return (
            <React.Fragment key={i}>
              {/* Aurora Bloom (Halos) */}
              <RoundedRect
                rect={rrect({ x: day.px - 8, y: day.topY - 12, width: PILLAR_W + 16, height: day.moodH + 20 }, 999, 999)}
                color={hexAlpha(PALETTE.mood, day.isToday || isActive ? 0.16 : 0.04)}
              >
                <BlurMask blur={isActive ? 22 : 14} style="normal" />
              </RoundedRect>

              {/* Main Pillar Body (Machined Glass) */}
              <RoundedRect rect={rrect({ x: day.px, y: day.topY, width: PILLAR_W, height: day.moodH }, 999, 999)}>
                <LinearGradient
                  start={vec(day.px, bottom)}
                  end={vec(day.px, day.topY)}
                  positions={[0, 0.45, 1]}
                  colors={day.isToday || isActive
                    ? ['rgba(44, 54, 69, 0.2)', 'rgba(226, 194, 122, 0.4)', 'rgba(244, 230, 188, 0.95)']
                    : ['rgba(44, 54, 69, 0.1)', 'rgba(226, 194, 122, 0.2)', 'rgba(244, 230, 188, 0.6)']
                  }
                />
              </RoundedRect>

              {/* Atmosphere Accent (Energy) */}
              {day.energyH > 0 && (
                <Rect x={day.px} y={bottom - day.energyH} width={ACCENT_W} height={day.energyH}>
                  <LinearGradient
                    start={vec(day.px, bottom)}
                    end={vec(day.px, bottom - day.energyH)}
                    colors={day.isToday ? ['rgba(162, 194, 225, 0.4)', '#A2C2E1'] : ['rgba(162, 194, 225, 0.1)', 'rgba(162, 194, 225, 0.6)']}
                  />
                </Rect>
              )}

              {/* Ember Accent (Stress) */}
              {day.stressH > 0 && (
                <Rect x={day.px + PILLAR_W - ACCENT_W} y={bottom - day.stressH} width={ACCENT_W} height={day.stressH}>
                  <LinearGradient
                    start={vec(day.px + PILLAR_W, bottom)}
                    end={vec(day.px + PILLAR_W, bottom - day.stressH)}
                    colors={day.isToday ? ['rgba(220, 80, 80, 0.4)', '#DC5050'] : ['rgba(220, 80, 80, 0.1)', 'rgba(220, 80, 80, 0.6)']}
                  />
                </Rect>
              )}

              {/* Luminous Crown Dot */}
              <Circle cx={cx} cy={day.topY - (day.isToday ? 8 : 6)} r={day.isToday ? 3.5 : 2.5} color={day.isToday ? '#F4E6BC' : hexAlpha(PALETTE.mood, 0.7)} />
              <Circle cx={cx} cy={day.topY - (day.isToday ? 8 : 6)} r={PILLAR_W * 0.8} color={hexAlpha(PALETTE.mood, day.isToday ? 0.3 : 0.1)}>
                <BlurMask blur={day.isToday ? 10 : 5} style="normal" />
              </Circle>
            </React.Fragment>
          );
        })}
      </Canvas>

      {/* Tap targets */}
      {pillars.map((day, i) => (
        <Pressable key={i} style={{ position: 'absolute', left: day.px - 4, top: PAD_T, width: PILLAR_W + 8, height: plotH }} onPress={() => { Haptics.selectionAsync(); setActiveIdx(activeIdx === i ? null : i); }} />
      ))}

      {/* Day labels */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {pillars.map((day, i) => (
          <Text key={i} style={[styles.dayLabel, { left:  day.px, width: PILLAR_W, bottom: 8, color: day.isToday ? PALETTE.mood : activeIdx === i ? '#FFF' : 'rgba(255,255,255,0.25)' }]}>
            {day.label}
          </Text>
        ))}
      </View>

      {/* Tooltip */}
      {active && activeIdx !== null && (
        <View style={[styles.tooltipShell, { top: PAD_T, left: Math.max(0, Math.min(width - 148, pillars[activeIdx].px + PILLAR_W / 2 - 74)) }]} pointerEvents="none">
          <BlurView intensity={50} tint={theme.blurTint} style={StyleSheet.absoluteFill} />
          <View style={styles.tooltipTint} />
          <View style={styles.tooltipRim} />
          <View style={styles.tooltipContent}>
            <Text style={styles.tooltipDate}>{active.displayDate}</Text>
            {active.raw && (
              <>
                <TooltipRow label="Mood" val={active.raw.moodScore.toFixed(1)} color={PALETTE.mood} />
                <TooltipRow label="Energy" val={active.raw.energyLevel} color={PALETTE.atmosphere} />
                <TooltipRow label="Stress" val={active.raw.stressLevel} color={PALETTE.ember} />
              </>
            )}
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legend} pointerEvents="none">
        <LegendItem color={PALETTE.mood} label="Mood" />
        <LegendItem color={PALETTE.atmosphere} label="Energy" />
        <LegendItem color={PALETTE.ember} label="Stress" />
      </View>
    </View>
  );
}

function TooltipRow({ label, val, color }: any) {
  return (
    <View style={styles.tooltipRow}>
      <View style={[styles.tooltipDot, { backgroundColor: color }]} />
      <Text style={styles.tooltipLbl}>{label}</Text>
      <Text style={[styles.tooltipVal, { color }]}>{val}</Text>
    </View>
  );
}

function LegendItem({ color, label }: any) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  emptyTxt: { color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center' },
  dayLabel: { position: 'absolute', textAlign: 'center', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  legend: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 5, height: 5, borderRadius: 2.5, opacity: 0.8 },
  legendLabel: { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '700', textTransform: 'uppercase' },
  tooltipShell: { position: 'absolute', width: 148, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15, zIndex: 50 },
  tooltipTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,8,23,0.75)' },
  tooltipRim: { ...StyleSheet.absoluteFillObject, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tooltipContent: { padding: 12 },
  tooltipDate: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  tooltipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  tooltipDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  tooltipLbl: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  tooltipVal: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
});
