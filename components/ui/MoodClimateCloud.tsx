/**
 * components/ui/MoodClimateCloud.tsx
 * MySky — Mood Climate: Volumetric Particle Cloud (React Three Fiber)
 *
 * Architecture:
 *   • Self-contained Canvas (no GlobalCanvas dependency)
 *   • 400 particles whose motion regime is driven by emotional climate data
 *   • Climate input: avgAnxiety + avgStress → 0–1 turbulenceLevel
 *   • Low calm:    slow laminar drift, soft cyan/blue/indigo tones
 *   • High anxiety: turbulent jitter, fast noise, pink-red/amber/violet tones
 *   • Each particle has an individual phase offset for organic variance
 *   • Turbulence ramps smoothly — no hard cutoff
 *   • Particle size + opacity also respond to turbulence level
 *   • No GLSL · No window.devicePixelRatio · No GlobalCanvas · No drei
 */

import React, { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MoodClimateCloudProps {
  /** 1–10 average anxiety/stress proxy — drives turbulence. Default 3 (calm) */
  turbulence?: number;
  height?:     number;
}

// ─── Particle cloud ───────────────────────────────────────────────────────────

const PARTICLE_COUNT = 400;

// Color palettes
const CALM_COLORS    = ['#00F5FF', '#33CCFF', '#5EF2FF', '#66C7FF', '#7C4DFF'];
const CHARGED_COLORS = ['#FF4D6D', '#FF8A3D', '#FF003C', '#BC13FE', '#FFD166'];

function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  const r = a.r + (b.r - a.r) * t;
  const g = a.g + (b.g - a.g) * t;
  const bl = a.b + (b.b - a.b) * t;
  return new THREE.Color(r, g, bl);
}

interface CloudProps {
  turbulence: number;  // 0–1
}

function ParticleCloud({ turbulence }: CloudProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Build stable initial positions and per-particle phase offsets
  const { positions, phases, speeds } = useMemo(() => {
    const pos   = new Float32Array(PARTICLE_COUNT * 3);
    const ph    = new Float32Array(PARTICLE_COUNT);
    const sp    = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Fibonacci sphere for even initial distribution
      const theta = (i / PARTICLE_COUNT) * Math.PI * 2 * 13.7;
      const phi   = Math.acos(1 - 2 * ((i * 0.618033) % 1));
      const r     = 1.5 + (i % 5) * 0.9;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      ph[i] = (i / PARTICLE_COUNT) * Math.PI * 2;
      sp[i] = 0.3 + (i % 7) * 0.09;
    }

    return { positions: pos, phases: ph, speeds: sp };
  }, []);

  // Working buffer mutated every frame
  const workPos = useMemo(() => new Float32Array(positions), [positions]);

  useFrame(({ clock }) => {
    const t   = clock.getElapsedTime();
    const pts = pointsRef.current;
    if (!pts) return;

    const attr  = pts.geometry.attributes.position as THREE.BufferAttribute;
    const jitter = turbulence * 0.6;          // amplitude of chaotic displacement
    const base   = 1.0 - turbulence * 0.5;   // laminar amplitude shrinks under chaos

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ph = phases[i];
      const sp = speeds[i];
      const ox = positions[i * 3];
      const oy = positions[i * 3 + 1];
      const oz = positions[i * 3 + 2];

      // Laminar drift — large-scale, slow wave flow
      const lx = Math.sin(t * sp * 0.4 + ph)           * base * 0.9;
      const ly = Math.cos(t * sp * 0.35 + ph + 1.2)    * base * 0.9;
      const lz = Math.sin(t * sp * 0.3  + ph + 2.4)    * base * 0.9;

      // Turbulence — fast, small, multi-frequency noise
      const tx = Math.sin(t * sp * 4.2 + ph * 3.1)     * jitter * 0.55;
      const ty = Math.cos(t * sp * 3.8 + ph * 2.7)     * jitter * 0.55;
      const tz = Math.sin(t * sp * 5.1 + ph * 1.9)     * jitter * 0.55;

      workPos[i * 3]     = ox + lx + tx;
      workPos[i * 3 + 1] = oy + ly + ty;
      workPos[i * 3 + 2] = oz + lz + tz;
    }

    attr.array = workPos;
    attr.needsUpdate = true;
  });

  // Interpolate particle color between calm and charged palettes
  const pointColor = useMemo(() => {
    const calmHex    = CALM_COLORS[Math.floor(turbulence * (CALM_COLORS.length - 1))];
    const chargedHex = CHARGED_COLORS[Math.floor(turbulence * (CHARGED_COLORS.length - 1))];
    return lerpColor(
      new THREE.Color(calmHex),
      new THREE.Color(chargedHex),
      turbulence,
    );
  }, [turbulence]);

  const particleSize    = 0.04 + turbulence * 0.06;
  const particleOpacity = 0.45 + turbulence * 0.35;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={workPos}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={pointColor}
        size={particleSize}
        transparent
        opacity={particleOpacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MoodClimateCloud({ turbulence = 3, height = 280 }: MoodClimateCloudProps) {
  // Normalise 1–10 input → 0–1
  const t01 = Math.max(0, Math.min(1, (turbulence - 1) / 9));

  return (
    <View style={{ height, width: '100%' }}>
      <Canvas camera={{ position: [0, 0, 12], fov: 55 }}>
        <fog attach="fog" args={['#030308', 8, 22]} />
        <ParticleCloud turbulence={t01} />
      </Canvas>
    </View>
  );
}
