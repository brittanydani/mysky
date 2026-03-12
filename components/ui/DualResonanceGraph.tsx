/**
 * DualResonanceGraph.tsx
 * MySky — 3D Double-Helix Resonance Graph (React Three Fiber / expo-gl)
 *
 * Architecture:
 *   • Two CatmullRomCurve3 splines intertwined in 3D (sine Z-axis offset)
 *   • Each spline: fiber-optic GLSL aura + razor-thin core tube
 *   • Connection threads bridge the two splines at each data point
 *   • Where Y-coordinates nearly match AND strands are close → AdditiveBlending
 *     causes cyan + gold to mathematically output blinding white fusion light
 *   • Data nodes (spheres) at each point on both strands
 *   • Slow auto-rotation to show the helix depth (3D parallax)
 *   • Resonance score badge (% of time strands are within harmony threshold)
 *   • No window.devicePixelRatio · No GlobalCanvas · No @react-three/drei
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResonanceSeries {
  label:  string;
  color:  string;
  values: number[]; // 0–10, one per time unit
}

export interface DualResonanceGraphProps {
  seriesA: ResonanceSeries;
  seriesB: ResonanceSeries;
  height?: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SERIES_A: ResonanceSeries = {
  label:  'You',
  color:  '#00EEFF',
  values: [6, 7, 5, 8, 6, 9, 7],
};

export const DEFAULT_SERIES_B: ResonanceSeries = {
  label:  'Them',
  color:  '#FFDA03',
  values: [5, 6, 6, 7, 8, 8, 6],
};

// ─── Layout ───────────────────────────────────────────────────────────────────

const SPREAD_X  = 14;
const START_X   = -SPREAD_X / 2;
const HELIX_AMP = 1.8;   // Z-axis helix radius

function buildCurve(values: number[], sign: 1 | -1): THREE.CatmullRomCurve3 {
  const n   = Math.max(values.length, 2);
  const step = SPREAD_X / (n - 1);
  const pts  = values.map((v, i) => {
    const x = START_X + i * step;
    const y = ((v - 1) / 9) * 5.0 - 2.5;  // 1–10 → -2.5 to +2.5
    const z = Math.sin(i * 1.55) * HELIX_AMP * sign;
    return new THREE.Vector3(x, y, z);
  });
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
}

// ─── GLSL Fiber-Optic Silk Shader ─────────────────────────────────────────────

const SILK_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SILK_FRAG = `
  uniform float uTime;
  uniform vec3  uColor;
  varying vec2  vUv;

  void main() {
    float t1 = sin(vUv.x * 110.0 + vUv.y * 18.0 - uTime * 2.8);
    float t2 = sin(vUv.x *  72.0 - vUv.y * 26.0 + uTime * 2.1);
    float t3 = sin(vUv.x * 145.0                 + uTime * 3.4);
    float weave = (t1 + t2 + t3) / 3.0;
    weave = smoothstep(0.15, 0.85, weave);
    float edge  = pow(sin(vUv.y * 3.14159), 1.8);
    vec3  col   = uColor * weave * edge;
    float alpha = (weave * 0.55 + 0.08) * edge;
    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── One Helix Strand ─────────────────────────────────────────────────────────

interface StrandProps {
  curve:    THREE.CatmullRomCurve3;
  hexColor: string;
  dotPositions: THREE.Vector3[];
}

function HelixStrand({ curve, hexColor, dotPositions }: StrandProps) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms  = useMemo(() => ({
    uTime:  { value: 0 },
    uColor: { value: new THREE.Color(hexColor) },
  }), [hexColor]);

  useFrame(({ clock }) => {
    if (shaderRef.current) shaderRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <>
      {/* Aura */}
      <mesh>
        <tubeGeometry args={[curve, 140, 0.45, 18, false]} />
        <shaderMaterial
          ref={shaderRef}
          vertexShader={SILK_VERT}
          fragmentShader={SILK_FRAG}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Core */}
      <mesh>
        <tubeGeometry args={[curve, 140, 0.028, 8, false]} />
        <meshBasicMaterial
          color={hexColor}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Data nodes */}
      {dotPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshBasicMaterial color={hexColor} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={1.0} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ─── Connection Threads ───────────────────────────────────────────────────────

interface ThreadsProps {
  ptsA: THREE.Vector3[];
  ptsB: THREE.Vector3[];
}

function ConnectionThreads({ ptsA, ptsB }: ThreadsProps) {
  const lineObjects = useMemo(() => ptsA.map((a, i) => {
    const b    = ptsB[i];
    const arr  = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z]);
    const dist = a.distanceTo(b);
    const op   = Math.max(0.05, Math.min(0.4, 1 - dist / 8));
    const geo  = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const mat  = new THREE.LineBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: op,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Line(geo, mat);
  }), [ptsA, ptsB]);

  useEffect(() => () => {
    lineObjects.forEach(l => {
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
  }, [lineObjects]);

  return (
    <>
      {lineObjects.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </>
  );
}

// ─── Starfield ────────────────────────────────────────────────────────────────

function Stars() {
  const geo = useMemo(() => {
    const N = 200, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = Math.sin(i * 2.13) * 12;
      pos[i * 3 + 1] = Math.sin(i * 3.71) * 8;
      pos[i * 3 + 2] = Math.sin(i * 1.37) * 5 - 8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#6688AA" size={0.05} transparent opacity={0.4} depthWrite={false} />
    </points>
  );
}

// ─── Resonance Score ──────────────────────────────────────────────────────────

function computeResonance(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  const avgGap = a.slice(0, n).reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / n;
  return Math.round(Math.max(0, (1 - avgGap / 9) * 100));
}

// ─── Scene ────────────────────────────────────────────────────────────────────

interface SceneProps {
  seriesA: ResonanceSeries;
  seriesB: ResonanceSeries;
}

function HelixScene({ seriesA, seriesB }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { curveA, curveB, ptsA, ptsB } = useMemo(() => {
    const cA = buildCurve(seriesA.values, 1);
    const cB = buildCurve(seriesB.values, -1);
    const n  = Math.max(seriesA.values.length, seriesB.values.length);
    const pA = seriesA.values.map((_, i) => cA.getPoint(i / Math.max(seriesA.values.length - 1, 1)));
    const pB = seriesB.values.map((_, i) => cB.getPoint(i / Math.max(seriesB.values.length - 1, 1)));
    return { curveA: cA, curveB: cB, ptsA: pA, ptsB: pB };
  }, [seriesA, seriesB]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.08;
    groupRef.current.rotation.x = Math.sin(t * 0.18) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <Stars />
      <ConnectionThreads ptsA={ptsA} ptsB={ptsB} />
      <HelixStrand curve={curveA} hexColor={seriesA.color} dotPositions={ptsA} />
      <HelixStrand curve={curveB} hexColor={seriesB.color} dotPositions={ptsB} />
    </group>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DualResonanceGraph({
  seriesA = DEFAULT_SERIES_A,
  seriesB = DEFAULT_SERIES_B,
  height  = 260,
}: DualResonanceGraphProps) {
  const score = useMemo(
    () => computeResonance(seriesA.values, seriesB.values),
    [seriesA.values, seriesB.values],
  );

  return (
    <View style={{ width: '100%', height }}>
      {/* 3D canvas */}
      <Canvas camera={{ position: [0, 0.5, 11], fov: 52 }}
              style={StyleSheet.absoluteFillObject as object}>
        <fog attach="fog" args={['#02010A', 8, 26]} />
        <HelixScene seriesA={seriesA} seriesB={seriesB} />
      </Canvas>

      {/* Resonance badge overlay */}
      <View style={styles.badge} pointerEvents="none">
        <Text style={styles.badgeScore}>{score}%</Text>
        <Text style={styles.badgeLbl}>resonance</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend} pointerEvents="none">
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: seriesA.color }]} />
          <Text style={styles.legendTxt}>{seriesA.label}</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: seriesB.color }]} />
          <Text style={styles.legendTxt}>{seriesB.label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position:        'absolute',
    top:             12,
    right:           14,
    alignItems:      'center',
    backgroundColor: 'rgba(8,10,24,0.75)',
    borderRadius:    10,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeScore: {
    color:      '#FFDA03',
    fontSize:   18,
    fontWeight: '700',
  },
  badgeLbl: {
    color:        'rgba(255,255,255,0.45)',
    fontSize:     9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  legend: {
    position:  'absolute',
    bottom:    10,
    left:      14,
    flexDirection: 'row',
    gap:       16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
  },
  legendTxt: {
    color:    'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
});
