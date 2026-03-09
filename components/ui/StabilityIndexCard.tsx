// File: components/ui/StabilityIndexCard.tsx
/**
 * StabilityIndexCard — "The Emotional Light Field"
 *
 * Three overlapping animated wave ribbons (Mood / Energy / Rest) rendered
 * as luminous filled light currents. Each ribbon fills downward from its
 * wave crest, creating liquid depth. Additive blending (PlusLighter) causes
 * overlapping zones to bloom brighter — light interacting with light.
 *
 * Ribbons:
 *   Mood   → Solar Gold      (#D4AF37) — emotional warmth / the Sun layer
 *   Energy → Luminous Aquamarine (#7DEBDB) — vitality / life force
 *   Rest   → Luminous Lavender  (#A286F2) — recovery / nervous-system restoration
 *
 * Interaction:
 *   Tap        → floating value tooltip at nearest data point
 *   Double-tap → morph to clean 7-day analytical line graph
 *   Long press → recalibration pulse ripple
 *
 * State-aware motion:
 *   ALIGNED (score ≥ 60)  → slow, dreamy oscillation
 *   TURBULENT (score < 60) → faster, tensioned oscillation
 *
 * @requires @shopify/react-native-skia 2.x
 * @requires react-native-reanimated 4.x
 * @requires react-native-gesture-handler 2.x
 */

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  Rect,
  Skia,
  useClock,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { computeStabilityIndex, type StabilityDataPoint } from './SkiaStabilityDashboard';

export type { StabilityDataPoint };

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Palette ———————————————————————————————————————————————————————————————────

const RIBBON = {
  mood: {
    base: '#D4AF37',
    fillTop: 'rgba(212,175,55,0.76)',
    fillBot: 'rgba(212,175,55,0)',
    glowTop: 'rgba(212,175,55,0.30)',
    glowBot: 'rgba(212,175,55,0)',
    stroke: 'rgba(255,227,120,0.90)',
  },
  energy: {
    base: '#7DEBDB',
    fillTop: 'rgba(125,235,219,0.76)',
    fillBot: 'rgba(125,235,219,0)',
    glowTop: 'rgba(125,235,219,0.30)',
    glowBot: 'rgba(125,235,219,0)',
    stroke: 'rgba(160,255,245,0.90)',
  },
  rest: {
    base: '#A286F2',
    fillTop: 'rgba(162,134,242,0.76)',
    fillBot: 'rgba(162,134,242,0)',
    glowTop: 'rgba(162,134,242,0.30)',
    glowBot: 'rgba(162,134,242,0)',
    stroke: 'rgba(195,170,255,0.90)',
  },
} as const;

// ─── Animation ————————————————————————————————————————————————————————————————

/** Each ribbon starts at a different phase so they move independently */
const PHASE_OFFSETS = [0, Math.PI * 0.72, Math.PI * 1.38] as const;

const ANIM = {
  aligned:   { period: 7500, amplitude: 4.5 },
  turbulent: { period: 3200, amplitude: 9.0 },
} as const;

// ─── Layout ———————————————————————————————————————————————————————————————————

const ML = 10;  // margin left
const MT = 18;  // margin top
const MB = 6;   // margin bottom

// ─── Types ————————————————————————————————————————————————————————————————————

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  mood: number;
  energy: number;
  sleep: number;
}

export interface StabilityIndexCardProps {
  data: StabilityDataPoint[];
  width?: number;
  /** Height of the canvas / wave graph area only (default 200) */
  graphHeight?: number;
  /** Called when the card label/header area is tapped (navigate to context) */
  onCardPress?: () => void;
}

// ─── Worklet: filled ribbon path ——————————————————————————————————————————————
//
// Builds a closed filled path:  wave crest → right edge down → bottom → left
// edge up → close.  The wave is a smooth cubic Bézier through the perturbed
// data points.
//
// Must be a 'worklet' function so it can be called from useDerivedValue.

function buildRibbonFill(
  vals: number[],     // normalized 0–1, index = data point
  gW: number,         // graph pixel width
  gH: number,         // graph pixel height
  clockMs: number,    // current clock value (ms)
  period: number,     // wave period (ms)
  amp: number,        // wave amplitude (px)
  phOff: number,      // per-ribbon phase offset
  morph: number,      // 0 = liquid waves, 1 = flat (analytical transition)
): SkPath {
  'worklet';
  const n = vals.length;
  if (n < 2) return Skia.Path.Make();

  const step = gW / (n - 1);
  const phase = ((clockMs % period) / period) * Math.PI * 2 + phOff;
  const effectiveAmp = amp * (1 - morph);

  const pts: { x: number; y: number }[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = ML + i * step;
    const baseY = MT + gH - vals[i] * gH;
    const perturb = Math.sin(phase + i * 0.46) * effectiveAmp;
    pts[i] = { x, y: baseY + perturb };
  }

  const bottom = MT + gH + 3; // slightly below data area for clean fill edge

  const p = Skia.Path.Make();
  p.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX = (prev.x + curr.x) / 2;
    p.cubicTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
  }
  p.lineTo(pts[n - 1].x, bottom);
  p.lineTo(pts[0].x, bottom);
  p.close();
  return p;
}

// ─── Worklet: open wave crest (stroke only) ———————————————————————————————————

function buildRibbonCrest(
  vals: number[],
  gW: number,
  gH: number,
  clockMs: number,
  period: number,
  amp: number,
  phOff: number,
  morph: number,
): SkPath {
  'worklet';
  const n = vals.length;
  if (n < 2) return Skia.Path.Make();

  const step = gW / (n - 1);
  const phase = ((clockMs % period) / period) * Math.PI * 2 + phOff;
  const effectiveAmp = amp * (1 - morph);

  const pts: { x: number; y: number }[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = ML + i * step;
    const baseY = MT + gH - vals[i] * gH;
    const perturb = Math.sin(phase + i * 0.46) * effectiveAmp;
    pts[i] = { x, y: baseY + perturb };
  }

  const p = Skia.Path.Make();
  p.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX = (prev.x + curr.x) / 2;
    p.cubicTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
  }
  return p;
}

// ─── Helper: static analytical Bézier path (JS thread) ———————————————————————

function buildAnalyticalPath(
  values: number[],
  gW: number,
  gH: number,
  maxVal: number,
): SkPath {
  const p = Skia.Path.Make();
  const n = values.length;
  if (n < 2) return p;
  const step = gW / (n - 1);
  const pts = values.map((v, i) => ({
    x: ML + i * step,
    y: MT + gH - (v / maxVal) * gH,
  }));
  p.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX = (prev.x + curr.x) / 2;
    p.cubicTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
  }
  return p;
}

// ─── Component ————————————————————————————————————————————————————————————————

const StabilityIndexCard = memo(function StabilityIndexCard({
  data,
  width = SCREEN_W - 48,
  graphHeight = 200,
  onCardPress,
}: StabilityIndexCardProps) {
  const gW = width - ML * 2;         // graph pixel width
  const gH = graphHeight - MT - MB;  // graph pixel height

  // ── Stability score ──────────────────────────────────────────────────────────
  const stability = useMemo(() => computeStabilityIndex(data), [data]);
  const isAligned = stability.index >= 60;

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, mood: 0, energy: 0, sleep: 0,
  });
  const [isAnalytical, setIsAnalytical] = useState(false);

  // ── SharedValues ──────────────────────────────────────────────────────────────
  const clock       = useClock();           // ms since mount (Skia clock)
  const modeProgress= useSharedValue(0);    // 0=liquid, 1=analytical
  const animPeriod   = useSharedValue<number>(ANIM.aligned.period);
  const animAmp      = useSharedValue<number>(ANIM.aligned.amplitude);

  // Pulse (long-press recalibration)
  const pulseCx     = useSharedValue(width / 2);
  const pulseCy     = useSharedValue(graphHeight / 2);
  const pulseR      = useSharedValue(0);
  const pulseOp     = useSharedValue(0);

  // Normalized data values pushed into SharedValues so worklets pick up changes
  const nMood   = useSharedValue<number[]>([]);
  const nEnergy = useSharedValue<number[]>([]);
  const nRest   = useSharedValue<number[]>([]);

  // ── Sync data → SharedValues ──────────────────────────────────────────────────
  useEffect(() => {
    nMood.value   = data.map(d => Math.min(Math.max(d.mood / 10, 0), 1));
    nEnergy.value = data.map(d => Math.min(Math.max(d.energy / 10, 0), 1));
    nRest.value   = data.map(d => Math.min(Math.max(d.sleep / 10, 0), 1));
  }, [data, nMood, nEnergy, nRest]);

  // ── State-based animation speed ──────────────────────────────────────────────
  useEffect(() => {
    const { period, amplitude } = isAligned ? ANIM.aligned : ANIM.turbulent;
    animPeriod.value = withTiming(period, { duration: 1800 });
    animAmp.value    = withTiming(amplitude, { duration: 1800 });
  }, [isAligned, animPeriod, animAmp]);

  // ── Mode toggle ───────────────────────────────────────────────────────────────
  const toggleMode = useCallback(() => {
    setIsAnalytical(prev => {
      const next = !prev;
      modeProgress.value = withTiming(next ? 1 : 0, {
        duration: 700,
        easing: Easing.inOut(Easing.cubic),
      });
      return next;
    });
  }, [modeProgress]);

  // ── Tooltip ───────────────────────────────────────────────────────────────────
  const showTooltip = useCallback(
    (tapX: number, tapY: number) => {
      if (data.length < 2) return;
      const relX  = Math.max(0, Math.min(tapX - ML, gW));
      const idx   = Math.round((relX / gW) * (data.length - 1));
      const pt    = data[Math.max(0, Math.min(idx, data.length - 1))];
      const ttX   = Math.max(8, Math.min(tapX - 56, width - 120));
      const ttY   = Math.max(8, tapY - 96);
      setTooltip({ visible: true, x: ttX, y: ttY, mood: pt.mood, energy: pt.energy, sleep: pt.sleep });
      setTimeout(() => setTooltip(t => ({ ...t, visible: false })), 3000);
    },
    [data, gW, width],
  );

  // ── Recalibration pulse ───────────────────────────────────────────────────────
  const triggerPulse = useCallback(
    (cx: number, cy: number) => {
      pulseCx.value = cx;
      pulseCy.value = cy;
      const maxR    = Math.sqrt(width * width + graphHeight * graphHeight);
      pulseR.value  = 0;
      pulseOp.value = 0.7;
      pulseR.value  = withTiming(maxR * 0.65, { duration: 1100, easing: Easing.out(Easing.quad) });
      pulseOp.value = withSequence(
        withTiming(0.7, { duration: 0 }),
        withTiming(0,   { duration: 1100, easing: Easing.out(Easing.quad) }),
      );
    },
    [pulseCx, pulseCy, pulseR, pulseOp, width, graphHeight],
  );

  // ── Gestures ──────────────────────────────────────────────────────────────────
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onEnd(() => { toggleMode(); });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(400)
    .runOnJS(true)
    .requireExternalGestureToFail(doubleTap)
    .onEnd((e, success) => { if (success) showTooltip(e.x, e.y); });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .runOnJS(true)
    .onStart(e => { triggerPulse(e.x, e.y); });

  const gesture = Gesture.Race(longPress, doubleTap, singleTap);

  // ── Derived opacities ─────────────────────────────────────────────────────────
  const liquidOp     = useDerivedValue(() => 1 - modeProgress.value);
  const analyticalOp = useDerivedValue(() => modeProgress.value);

  // ── Animated wave ribbon paths ────────────────────────────────────────────────
  //  Each path re-derives every frame because clock.value ticks at 60fps.

  // Mood — Solar Gold
  const moodFill = useDerivedValue(() =>
    buildRibbonFill(nMood.value, gW, gH, clock.value, animPeriod.value, animAmp.value, PHASE_OFFSETS[0], modeProgress.value)
  );
  const moodCrest = useDerivedValue(() =>
    buildRibbonCrest(nMood.value, gW, gH, clock.value, animPeriod.value, animAmp.value, PHASE_OFFSETS[0], modeProgress.value)
  );

  // Energy — Luminous Aquamarine
  const energyFill = useDerivedValue(() =>
    buildRibbonFill(nEnergy.value, gW, gH, clock.value, animPeriod.value, animAmp.value, PHASE_OFFSETS[1], modeProgress.value)
  );
  const energyCrest = useDerivedValue(() =>
    buildRibbonCrest(nEnergy.value, gW, gH, clock.value, animPeriod.value, animAmp.value, PHASE_OFFSETS[1], modeProgress.value)
  );

  // Rest — Luminous Lavender
  const restFill = useDerivedValue(() =>
    buildRibbonFill(nRest.value, gW, gH, clock.value, animPeriod.value, animAmp.value, PHASE_OFFSETS[2], modeProgress.value)
  );
  const restCrest = useDerivedValue(() =>
    buildRibbonCrest(nRest.value, gW, gH, clock.value, animPeriod.value, animAmp.value, PHASE_OFFSETS[2], modeProgress.value)
  );

  // ── Static analytical paths (no animation — built on JS thread) ───────────────
  const { moodLine, energyLine, restLine } = useMemo(() => ({
    moodLine:   buildAnalyticalPath(data.map(d => d.mood),            gW, gH, 10),
    energyLine: buildAnalyticalPath(data.map(d => d.energy),          gW, gH, 10),
    restLine:   buildAnalyticalPath(data.map(d => Math.min(d.sleep, 10)), gW, gH, 10),
  }), [data, gW, gH]);

  // ── Gradient anchor vectors ───────────────────────────────────────────────────
  const gradStart = vec(0, MT);
  const gradEnd   = vec(0, MT + gH);

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (data.length < 2) {
    return (
      <View style={[s.card, { width }]}>
        <Text style={s.emptyText}>Log 2+ days to see your Stability Field</Text>
      </View>
    );
  }

  return (
    <View style={[s.card, { width }]}>

      {/* ── Header — tappable area for card navigation ── */}
      <View style={s.header} accessible accessibilityLabel={`Stability Index ${stability.index}% ${stability.label}`}>
        <View>
          <Text style={s.eyebrow}>STABILITY INDEX</Text>
          <View style={s.scoreRow}>
            <Text style={[s.scoreValue, { color: stability.color }]}>
              {stability.index}%
            </Text>
            <View style={[s.statusPill, { backgroundColor: stability.color + '22' }]}>
              <Text style={[s.statusLabel, { color: stability.color }]}>
                {stability.label}
              </Text>
            </View>
          </View>
        </View>
        <View style={s.legend}>
          {([
            ['Mood',   RIBBON.mood.base],
            ['Energy', RIBBON.energy.base],
            ['Rest',   RIBBON.rest.base],
          ] as [string, string][]).map(([label, color]) => (
            <View key={label} style={s.legendRow}>
              <View style={[s.legendDot, { backgroundColor: color }]} />
              <Text style={s.legendLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Interactive Graph Area ── */}
      <GestureDetector gesture={gesture}>
        <View>
          <Canvas style={{ width, height: graphHeight }}>

            {/* Deep obsidian field — dark bg needed for PlusLighter additive bloom  */}
            <Rect x={0} y={0} width={width} height={graphHeight} color="rgba(2,8,23,0.98)" />

            {/* ═══ Liquid Wave Ribbons ═══════════════════════════════════════════
                Each ribbon Group uses BlendMode.PlusLighter so overlapping light
                zones add together and bloom bright rather than stacking opaquely. */}
            <Group opacity={liquidOp}>

              {/* Rest ribbon — Luminous Lavender (drawn first / base layer) */}
              <Group blendMode="plusLighter">
                {/* Soft ambient glow beneath the wave crest */}
                <Path path={restFill} style="fill">
                  <LinearGradient start={gradStart} end={gradEnd}
                    colors={[RIBBON.rest.glowTop, RIBBON.rest.glowBot]} />
                  <BlurMask blur={24} style="normal" />
                </Path>
                {/* Primary filled ribbon */}
                <Path path={restFill} style="fill">
                  <LinearGradient start={gradStart} end={gradEnd}
                    colors={[RIBBON.rest.fillTop, RIBBON.rest.fillBot]} />
                </Path>
                {/* Luminous crest edge — neon-like atmospheric glow */}
                <Path path={restCrest} style="stroke" strokeWidth={1.8}
                  color={RIBBON.rest.stroke} strokeCap="round" strokeJoin="round">
                  <BlurMask blur={3.5} style="solid" />
                </Path>
              </Group>

              {/* Energy ribbon — Luminous Aquamarine (middle layer) */}
              <Group blendMode="plusLighter">
                <Path path={energyFill} style="fill">
                  <LinearGradient start={gradStart} end={gradEnd}
                    colors={[RIBBON.energy.glowTop, RIBBON.energy.glowBot]} />
                  <BlurMask blur={24} style="normal" />
                </Path>
                <Path path={energyFill} style="fill">
                  <LinearGradient start={gradStart} end={gradEnd}
                    colors={[RIBBON.energy.fillTop, RIBBON.energy.fillBot]} />
                </Path>
                <Path path={energyCrest} style="stroke" strokeWidth={1.8}
                  color={RIBBON.energy.stroke} strokeCap="round" strokeJoin="round">
                  <BlurMask blur={3.5} style="solid" />
                </Path>
              </Group>

              {/* Mood ribbon — Solar Gold (top layer) */}
              <Group blendMode="plusLighter">
                <Path path={moodFill} style="fill">
                  <LinearGradient start={gradStart} end={gradEnd}
                    colors={[RIBBON.mood.glowTop, RIBBON.mood.glowBot]} />
                  <BlurMask blur={24} style="normal" />
                </Path>
                <Path path={moodFill} style="fill">
                  <LinearGradient start={gradStart} end={gradEnd}
                    colors={[RIBBON.mood.fillTop, RIBBON.mood.fillBot]} />
                </Path>
                <Path path={moodCrest} style="stroke" strokeWidth={1.8}
                  color={RIBBON.mood.stroke} strokeCap="round" strokeJoin="round">
                  <BlurMask blur={3.5} style="solid" />
                </Path>
              </Group>

            </Group>

            {/* ═══ Analytical Line Graph (morph target) ══════════════════════════
                Revealed by double-tap. Fades in as liquid ribbons flatten out. */}
            <Group opacity={analyticalOp}>

              {/* Rest — Lavender line */}
              <Group>
                <Path path={restLine} style="stroke" strokeWidth={3.5}
                  strokeCap="round" strokeJoin="round"
                  color="rgba(162,134,242,0.28)">
                  <BlurMask blur={5} style="solid" />
                </Path>
                <Path path={restLine} style="stroke" strokeWidth={2}
                  strokeCap="round" strokeJoin="round"
                  color={RIBBON.rest.base} />
              </Group>

              {/* Energy — Aquamarine line */}
              <Group>
                <Path path={energyLine} style="stroke" strokeWidth={3.5}
                  strokeCap="round" strokeJoin="round"
                  color="rgba(125,235,219,0.28)">
                  <BlurMask blur={5} style="solid" />
                </Path>
                <Path path={energyLine} style="stroke" strokeWidth={2}
                  strokeCap="round" strokeJoin="round"
                  color={RIBBON.energy.base} />
              </Group>

              {/* Mood — Gold line */}
              <Group>
                <Path path={moodLine} style="stroke" strokeWidth={3.5}
                  strokeCap="round" strokeJoin="round"
                  color="rgba(212,175,55,0.28)">
                  <BlurMask blur={5} style="solid" />
                </Path>
                <Path path={moodLine} style="stroke" strokeWidth={2}
                  strokeCap="round" strokeJoin="round"
                  color={RIBBON.mood.base} />
              </Group>

            </Group>

            {/* ═══ Recalibration Pulse ═══════════════════════════════════════════
                Ripples outward on long-press. Interacts visually with ribbon field. */}
            <Group opacity={pulseOp}>
              {/* Outer diffuse ring */}
              <Circle cx={pulseCx} cy={pulseCy} r={pulseR}
                color="rgba(255,255,255,0.12)">
                <BlurMask blur={16} style="normal" />
              </Circle>
              {/* Crisp ring edge */}
              <Circle cx={pulseCx} cy={pulseCy} r={pulseR}
                style="stroke" strokeWidth={1.5}
                color="rgba(255,255,255,0.55)">
                <BlurMask blur={3} style="solid" />
              </Circle>
            </Group>

          </Canvas>

          {/* ── Floating Tooltip (React Native overlay) ── */}
          {tooltip.visible && (
            <View
              style={[s.tooltip, { left: tooltip.x, top: tooltip.y }]}
              pointerEvents="none"
            >
              <View style={s.tooltipInner}>
                <Text style={[s.ttRow, { color: RIBBON.mood.base }]}>
                  {'Mood   '}
                  <Text style={s.ttValue}>{tooltip.mood}</Text>
                </Text>
                <Text style={[s.ttRow, { color: RIBBON.energy.base }]}>
                  {'Energy '}
                  <Text style={s.ttValue}>{tooltip.energy}</Text>
                </Text>
                <Text style={[s.ttRow, { color: RIBBON.rest.base }]}>
                  {'Rest   '}
                  <Text style={s.ttValue}>{tooltip.sleep.toFixed(1)}h</Text>
                </Text>
              </View>
            </View>
          )}
        </View>
      </GestureDetector>

      {/* ── Day labels ── */}
      <View style={[s.dayLabels, { width }]}>
        {data.slice(-7).map((d, i) => (
          <Text key={d.date ? `${d.date}-${i}` : `day-${i}`} style={s.dayLabel}>
            {d.date
              ? new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })
              : ''}
          </Text>
        ))}
      </View>

      {/* ── Interaction hint ── */}
      <View style={s.hint}>
        <Text style={s.hintText}>
          {isAnalytical
            ? '2× tap to return to field view'
            : '2× tap for data view  ·  hold to recalibrate'}
        </Text>
      </View>

    </View>
  );
});

export default StabilityIndexCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: 'rgba(11,18,32,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderTopColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  eyebrow: {
    color: 'rgba(240,234,214,0.50)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: -0.5,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legend: {
    gap: 5,
    paddingTop: 4,
    alignItems: 'flex-start',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: 'rgba(240,234,214,0.60)',
    fontSize: 10,
    fontWeight: '600',
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 4,
  },
  dayLabel: {
    color: 'rgba(240,234,214,0.40)',
    fontSize: 10,
    fontWeight: '600',
  },
  hint: {
    paddingBottom: 14,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(240,234,214,0.22)',
    fontSize: 9.5,
    letterSpacing: 0.3,
  },
  tooltip: {
    position: 'absolute',
    zIndex: 20,
  },
  tooltipInner: {
    backgroundColor: 'rgba(4,12,28,0.93)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    gap: 4,
    minWidth: 112,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },
  ttRow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  ttValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  emptyText: {
    color: 'rgba(240,234,214,0.50)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    padding: 32,
  },
});
