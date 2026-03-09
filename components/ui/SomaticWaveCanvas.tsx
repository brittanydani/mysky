// File: components/ui/SomaticWaveCanvas.tsx
/**
 * SomaticWaveCanvas — "The Energy Mirror"
 *
 * Three horizontal overlapping wave ribbons rendered in GPU via Skia.
 * Each ribbon represents one pillar of inner stability:
 *
 *   Mood   → Solar Gold      (#D4AF37)
 *   Energy → Luminous Cyan   (#7DEBDB)
 *   Rest   → Soft Lavender   (#A286F2)
 *
 * The waves are additive-blended (blendMode="plusLighter") so their
 * intersection zones bloom white — light meeting light.
 *
 * Motion is state-aware:
 *   Coherent / Aligned  → slow, dreamy, 1.8 cycles — nervous-system ease
 *   Shifting            → mid-pace, 2.4 cycles, slight harmonic texture
 *   Turbulent / Fragmented → faster, 3.2 cycles, harmonic roughness visible
 *
 * Wave amplitude is proportional to the score for that dimension,
 * so a depleted dimension barely ripples while a strong one peaks high.
 */

import React, { memo, useEffect } from 'react';
import {
  BlurMask,
  Canvas,
  Group,
  Path,
  Skia,
  useClock,
  type SkPath,
} from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// ─── Palette ———————————————————————————————————————————————————————————————————

const W = {
  mood: {
    glow: 'rgba(212,175,55,0.32)',
    core: 'rgba(255,220,100,0.90)',
  },
  energy: {
    glow: 'rgba(125,235,219,0.32)',
    core: 'rgba(160,255,245,0.90)',
  },
  rest: {
    glow: 'rgba(162,134,242,0.32)',
    core: 'rgba(195,170,255,0.90)',
  },
} as const;

// ─── Animation presets by stability state ————————————————————————————————————

type StabilityLabel = 'Coherent' | 'Aligned' | 'Shifting' | 'Fragmented';

const ANIM: Record<StabilityLabel, { period: number; cycles: number; turbulence: number }> = {
  Coherent:   { period: 8400, cycles: 1.8, turbulence: 0.00 },
  Aligned:    { period: 7200, cycles: 2.0, turbulence: 0.05 },
  Shifting:   { period: 4500, cycles: 2.4, turbulence: 0.35 },
  Fragmented: { period: 2800, cycles: 3.2, turbulence: 0.80 },
};

// ─── Props ————————————————————————————————————————————————————————————————————

export interface SomaticWaveProps {
  width: number;
  height?: number;
  /** Mood score 1–10. Controls Mood wave amplitude. */
  moodScore?: number;
  /** Energy score 1–10. Controls Energy wave amplitude. */
  energyScore?: number;
  /** Rest/sleep (hours, normalized against 10). Controls Rest wave amplitude. */
  restScore?: number;
  /** Stability state — drives animation speed and harmonic texture. */
  stabilityLabel?: StabilityLabel;
}

// ─── Wave path worklet ————————————————————————————————————————————————————————
//
// Traces a horizontal sine wave across the full canvas width.
// `turbulence` adds a higher-harmonic ripple for a dysregulated look.
// Called inside useDerivedValue — must be annotated 'worklet'.

function buildWavePath(
  canvasW: number,
  centerY: number,
  amplitude: number,
  phase: number,
  cycles: number,
  turbulence: number,
): SkPath {
  'worklet';
  const pts = 80; // sample count; >60 is visually identical to cubic at phone res
  const p = Skia.Path.Make();

  for (let i = 0; i <= pts; i++) {
    const x = (i / pts) * canvasW;
    const t = (i / pts) * cycles * Math.PI * 2;
    const primary = amplitude * Math.sin(t + phase);
    // Secondary harmonic — triple frequency, phase-shifted — creates organic roughness
    const secondary = amplitude * 0.22 * turbulence * Math.sin(t * 3.1 + phase * 1.6);
    const y = centerY + primary + secondary;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}

// ─── Component ————————————————————————————————————————————————————————————————

const SomaticWaveCanvas = memo(function SomaticWaveCanvas({
  width,
  height = 130,
  moodScore = 7,
  energyScore = 7,
  restScore = 7,
  stabilityLabel = 'Aligned',
}: SomaticWaveProps) {
  const midY = height / 2;

  // ── Clamp scores ──────────────────────────────────────────────────────────────
  const m = Math.max(1, Math.min(10, moodScore));
  const e = Math.max(1, Math.min(10, energyScore));
  const r = Math.max(1, Math.min(10, restScore));

  // Amplitude: low score → barely ripples (10px), high → peaks (32px)
  const moodAmp   = 10 + (m / 10) * 22;
  const energyAmp = 10 + (e / 10) * 22;
  const restAmp   = 10 + (r / 10) * 22;

  // ── Animation SharedValues ────────────────────────────────────────────────────
  const clock  = useClock();
  const period = useSharedValue(ANIM[stabilityLabel].period);
  const cycles = useSharedValue(ANIM[stabilityLabel].cycles);
  const turb   = useSharedValue(ANIM[stabilityLabel].turbulence);

  // ── Sync state → animation params ────────────────────────────────────────────
  useEffect(() => {
    const preset = ANIM[stabilityLabel];
    period.value = withTiming(preset.period,    { duration: 1600, easing: Easing.inOut(Easing.quad) });
    cycles.value = withTiming(preset.cycles,    { duration: 1600, easing: Easing.inOut(Easing.quad) });
    turb.value   = withTiming(preset.turbulence,{ duration: 1600, easing: Easing.inOut(Easing.quad) });
  }, [stabilityLabel, period, cycles, turb]);

  // ── Wave center Y positions — offset so they overlap heavily at midY ──────────
  // All three are anchored near mid; vertical offsets cause rich intersection zones
  const moodCY   = midY - 8;
  const energyCY = midY;
  const restCY   = midY + 8;

  // Phase offsets per ribbon so they never move in perfect unison
  const PHASE = [0, Math.PI * 0.64, Math.PI * 1.31] as const;

  // ── Derived paths — re-computed every frame via clock ─────────────────────────

  const moodPath = useDerivedValue(() => {
    const phase = ((clock.value % period.value) / period.value) * Math.PI * 2 + PHASE[0];
    return buildWavePath(width, moodCY, moodAmp, phase, cycles.value, turb.value);
  });

  const energyPath = useDerivedValue(() => {
    const phase = ((clock.value % period.value) / period.value) * Math.PI * 2 + PHASE[1];
    return buildWavePath(width, energyCY, energyAmp, phase, cycles.value, turb.value);
  });

  const restPath = useDerivedValue(() => {
    const phase = ((clock.value % period.value) / period.value) * Math.PI * 2 + PHASE[2];
    return buildWavePath(width, restCY, restAmp, phase, cycles.value, turb.value);
  });

  // ─── Render ───────────────────────────────────────────────────────────────────
  //
  // Each ribbon is two draw calls:
  //   1. Thick soft stroke + BlurMask → the luminous atmospheric halo
  //   2. Thin crisp stroke             → the sharp bright crest line
  //
  // All three groups use blendMode="plusLighter" so intersections
  // add together and bloom toward white rather than stacking opaquely.

  return (
    <Canvas style={{ width, height }}>

      {/* Rest — Lavender (drawn first, bottommost layer) */}
      <Group blendMode="plusLighter">
        {/* Soft glow halo */}
        <Path path={restPath} style="stroke" strokeWidth={18}
          color={W.rest.glow} strokeCap="round">
          <BlurMask blur={18} style="normal" />
        </Path>
        {/* Crisp luminous crest */}
        <Path path={restPath} style="stroke" strokeWidth={2.2}
          color={W.rest.core} strokeCap="round">
          <BlurMask blur={2.5} style="solid" />
        </Path>
      </Group>

      {/* Energy — Cyan (middle layer) */}
      <Group blendMode="plusLighter">
        <Path path={energyPath} style="stroke" strokeWidth={18}
          color={W.energy.glow} strokeCap="round">
          <BlurMask blur={18} style="normal" />
        </Path>
        <Path path={energyPath} style="stroke" strokeWidth={2.2}
          color={W.energy.core} strokeCap="round">
          <BlurMask blur={2.5} style="solid" />
        </Path>
      </Group>

      {/* Mood — Gold (top layer) */}
      <Group blendMode="plusLighter">
        <Path path={moodPath} style="stroke" strokeWidth={18}
          color={W.mood.glow} strokeCap="round">
          <BlurMask blur={18} style="normal" />
        </Path>
        <Path path={moodPath} style="stroke" strokeWidth={2.2}
          color={W.mood.core} strokeCap="round">
          <BlurMask blur={2.5} style="solid" />
        </Path>
      </Group>

    </Canvas>
  );
});

export default SomaticWaveCanvas;
