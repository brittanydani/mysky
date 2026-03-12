/**
 * components/3d/UltimateWaveChart.tsx
 * MySky — Today Mood Wave Graph (3D Scene)
 *
 * Pure 3D scene — no Canvas wrapper. Rendered inside GlobalCanvas.
 *
 * Data bridge:
 *   • useTodayGraphStore (Zustand) — reads live/cached mood series
 *     written by useTodayGraphData / get_recent_check_in_series RPC.
 *
 * Design:
 *   • Three layered TubeGeometry ribbons with additive blending
 *   • Per-datapoint hotspot spheres at actual mood positions
 *   • Stars backdrop + ambient glow plane for depth
 *   • Falls back to EmptyWaveScene when fewer than 2 points exist
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useTodayGraphStore } from '../../store/todayGraphStore';

// ─── Layout constants ─────────────────────────────────────────────────────────

const CHART_WIDTH     = 16;
const BASE_Y_MIN      = -2.2;
const BASE_Y_MAX      = 2.2;
const TUBE_SEGMENTS   = 120;
const RADIAL_SEGMENTS = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

type LayerConfig = {
  radius: number;
  opacity: number;
  yOffset: number;
  zOffset: number;
};

type WavePalette = {
  coreA: string;
  coreB: string;
  haze: string;
};

// ─── Palettes ─────────────────────────────────────────────────────────────────

const PALETTES: WavePalette[] = [
  { coreA: '#FFD166', coreB: '#FF8A3D', haze: '#FFE2A8' },
  { coreA: '#00F5FF', coreB: '#66C7FF', haze: '#B7F4FF' },
  { coreA: '#BC13FE', coreB: '#7C4DFF', haze: '#D6AEFF' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(min: number, max: number, t: number) {
  return min + (max - min) * t;
}

function normalizeMood(value: number) {
  return clamp(value / 10, 0, 1);
}

// ─── Curve builders ───────────────────────────────────────────────────────────

function buildPrimaryCurve(values: number[], zOffset = 0, yBias = 0) {
  const count  = Math.max(values.length, 2);
  const stepX  = CHART_WIDTH / Math.max(count - 1, 1);
  const startX = -CHART_WIDTH / 2;
  const points: THREE.Vector3[] = [];

  for (let i = 0; i < count; i += 1) {
    const raw        = typeof values[i] === 'number' ? values[i] : 5;
    const normalized = normalizeMood(raw);
    const x          = startX + i * stepX;
    const y          = lerp(BASE_Y_MIN, BASE_Y_MAX, normalized) + yBias;
    const z          = Math.sin(i * 0.55) * 0.35 + Math.cos(i * 0.22) * 0.18 + zOffset;
    points.push(new THREE.Vector3(x, y, z));
  }

  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.7);
}

function buildSmoothedVariant(
  values: number[],
  intensityScale: number,
  yOffset: number,
  zOffset: number
) {
  const count  = Math.max(values.length, 2);
  const stepX  = CHART_WIDTH / Math.max(count - 1, 1);
  const startX = -CHART_WIDTH / 2;
  const points: THREE.Vector3[] = [];

  for (let i = 0; i < count; i += 1) {
    const raw        = typeof values[i] === 'number' ? values[i] : 5;
    const normalized = normalizeMood(raw);
    const x          = startX + i * stepX;
    const baseY      = lerp(BASE_Y_MIN, BASE_Y_MAX, normalized);
    const wave       =
      Math.sin(i * 0.5) * 0.22 * intensityScale +
      Math.cos(i * 0.19 + 0.6) * 0.12 * intensityScale;
    const y          = baseY + wave + yOffset;
    const z          =
      Math.sin(i * 0.48 + 0.5) * 0.28 * intensityScale +
      Math.cos(i * 0.17) * 0.12 * intensityScale +
      zOffset;
    points.push(new THREE.Vector3(x, y, z));
  }

  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.8);
}

// ─── Stars backdrop ───────────────────────────────────────────────────────────

function StarsField({ count = 110 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 10 + Math.random() * 14;
      const theta  = Math.random() * Math.PI * 2;
      const phi    = Math.acos(2 * Math.random() - 1);
      arr[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#D8E7FF"
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Ambient glow ─────────────────────────────────────────────────────────────

function AmbientGlowPlane() {
  return (
    <>
      <mesh position={[0, -0.8, -5.5]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[18, 8]} />
        <meshBasicMaterial
          color="#1A1B38"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, -8]}>
        <sphereGeometry args={[18, 32, 32]} />
        <meshBasicMaterial
          color="#13142A"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

// ─── Ribbon strand ────────────────────────────────────────────────────────────

function RibbonStrand({
  curve,
  palette,
  layers,
  motionOffset,
}: {
  curve: THREE.CatmullRomCurve3;
  palette: WavePalette;
  layers: LayerConfig[];
  motionOffset: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.z = Math.sin(t * 0.5 + motionOffset) * 0.06;
    groupRef.current.position.y = Math.cos(t * 0.4 + motionOffset) * 0.03;
  });

  return (
    <group ref={groupRef}>
      {layers.map((layer, index) => {
        const color =
          index === 0 ? palette.coreA : index === 1 ? palette.coreB : palette.haze;

        return (
          <mesh
            key={`${palette.coreA}-${index}`}
            position={[0, layer.yOffset, layer.zOffset]}
          >
            <tubeGeometry
              args={[curve, TUBE_SEGMENTS, layer.radius, RADIAL_SEGMENTS, false]}
            />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={layer.opacity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Per-datapoint hotspots ───────────────────────────────────────────────────

function FocusHotspots({ values }: { values: number[] }) {
  const points = useMemo(() => {
    const count  = Math.max(values.length, 2);
    const stepX  = CHART_WIDTH / Math.max(count - 1, 1);
    const startX = -CHART_WIDTH / 2;

    return values.map((value, index) => {
      const normalized = normalizeMood(value);
      const x          = startX + index * stepX;
      const y          = lerp(BASE_Y_MIN, BASE_Y_MAX, normalized);
      const z          = Math.sin(index * 0.55) * 0.35 + Math.cos(index * 0.22) * 0.18;
      return { x, y, z, strength: normalized };
    });
  }, [values]);

  return (
    <group>
      {points.map((point, index) => (
        <group key={`hotspot-${index}`} position={[point.x, point.y, point.z]}>
          <mesh>
            <sphereGeometry args={[0.14 + point.strength * 0.08, 16, 16]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0.18 + point.strength * 0.16}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.05 + point.strength * 0.03, 12, 12]} />
            <meshBasicMaterial
              color="#FFF7D1"
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Empty fallback ───────────────────────────────────────────────────────────

function EmptyWaveScene() {
  return (
    <group>
      <StarsField />
      <AmbientGlowPlane />
      <mesh position={[0, 0, -1]}>
        <torusGeometry args={[2.2, 0.08, 16, 100]} />
        <meshBasicMaterial
          color="#6BA7FF"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Layer presets ────────────────────────────────────────────────────────────

const LAYER_SETS: LayerConfig[][] = [
  [
    { radius: 0.038, opacity: 0.95, yOffset: 0.02,  zOffset: 0.1  },
    { radius: 0.11,  opacity: 0.28, yOffset: 0,     zOffset: 0    },
    { radius: 0.28,  opacity: 0.085,yOffset: -0.03, zOffset: -0.05},
    { radius: 0.5,   opacity: 0.028,yOffset: -0.05, zOffset: -0.12},
  ],
  [
    { radius: 0.034, opacity: 0.88, yOffset: 0.01,  zOffset: 0.06 },
    { radius: 0.1,   opacity: 0.24, yOffset: 0,     zOffset: 0    },
    { radius: 0.26,  opacity: 0.07, yOffset: -0.02, zOffset: -0.06},
    { radius: 0.46,  opacity: 0.024,yOffset: -0.04, zOffset: -0.12},
  ],
  [
    { radius: 0.032, opacity: 0.78, yOffset: 0.01,  zOffset: 0.04 },
    { radius: 0.095, opacity: 0.2,  yOffset: 0,     zOffset: 0    },
    { radius: 0.24,  opacity: 0.06, yOffset: -0.02, zOffset: -0.05},
    { radius: 0.42,  opacity: 0.02, yOffset: -0.04, zOffset: -0.1 },
  ],
];

// ─── Scene root (exported for GlobalCanvas lazy import) ───────────────────────

export default function UltimateWaveChart() {
  const data   = useTodayGraphStore((state) => state.data);
  const values = useMemo(
    () => (data?.series ?? []).map((point) => point.moodValue),
    [data?.series]
  );

  const hasEnoughData = values.length >= 2;

  const curves = useMemo(() => {
    if (!hasEnoughData) return null;
    return [
      buildPrimaryCurve(values, 0.15, 0.12),
      buildSmoothedVariant(values, 0.95, -0.08, -0.25),
      buildSmoothedVariant(values, 0.78, -0.42, -0.55),
    ];
  }, [hasEnoughData, values]);

  const rootRef = useRef<THREE.Group>(null);

  useFrame(({ clock, camera }) => {
    if (rootRef.current) {
      const t = clock.getElapsedTime();
      rootRef.current.rotation.y = Math.sin(t * 0.18) * 0.04;
      rootRef.current.rotation.x = Math.cos(t * 0.14) * 0.015;
    }
    camera.lookAt(0, 0, 0);
  });

  if (!hasEnoughData || !curves) {
    return <EmptyWaveScene />;
  }

  return (
    <group ref={rootRef}>
      <StarsField />
      <AmbientGlowPlane />

      <RibbonStrand
        curve={curves[0]}
        palette={PALETTES[0]}
        layers={LAYER_SETS[0]}
        motionOffset={0}
      />
      <RibbonStrand
        curve={curves[1]}
        palette={PALETTES[1]}
        layers={LAYER_SETS[1]}
        motionOffset={1.7}
      />
      <RibbonStrand
        curve={curves[2]}
        palette={PALETTES[2]}
        layers={LAYER_SETS[2]}
        motionOffset={3.1}
      />

      <FocusHotspots values={values} />
    </group>
  );
}
