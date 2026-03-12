/**
 * components/ui/OrbitalPatternsMap.tsx
 * MySky — Orbital Patterns Orrery (React Three Fiber / expo-gl)
 *
 * Architecture:
 *   • Self-contained Canvas (no GlobalCanvas dependency)
 *   • Central stellar core — 4-layer volumetric sphere in warm gold
 *   • 5 tilted torus rings at distinct inclinations and orbital radii
 *   • Orbital node per ring — 3-layer volumetric sphere traveling the ring
 *   • Sparse starfield in the background for depth
 *   • Whole orrery breathes with a slow compound rotation
 *   • All materials use AdditiveBlending — no depthWrite — no GLSL needed
 *   • No window.devicePixelRatio · No GlobalCanvas · No @react-three/drei
 */

import React, { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// ─── Ring Definitions ─────────────────────────────────────────────────────────

interface RingDef {
  radius:    number;
  rotation:  [number, number, number];
  color:     string;
  nodeColor: string;
  speed:     number;   // radians/sec for orbital node
  opacity:   number;
}

const RING_DEFS: RingDef[] = [
  {
    radius:    2.2,
    rotation:  [0, 0, 0],
    color:     '#FFD460',
    nodeColor: '#FFF8C0',
    speed:     0.65,
    opacity:   0.55,
  },
  {
    radius:    3.0,
    rotation:  [Math.PI / 7, Math.PI / 6, 0],
    color:     '#20FFF0',
    nodeColor: '#B0FFF8',
    speed:     0.42,
    opacity:   0.42,
  },
  {
    radius:    3.8,
    rotation:  [Math.PI / 3.5, -Math.PI / 5, 0],
    color:     '#9B6FFF',
    nodeColor: '#D4C4FF',
    speed:     0.28,
    opacity:   0.36,
  },
  {
    radius:    4.5,
    rotation:  [2.2, Math.PI / 4, 0],
    color:     '#FF6BA8',
    nodeColor: '#FFD0E6',
    speed:     0.19,
    opacity:   0.28,
  },
  {
    radius:    5.1,
    rotation:  [5 * Math.PI / 9, -Math.PI / 8, 0],
    color:     '#7BB8F8',
    nodeColor: '#CBE8FF',
    speed:     0.12,
    opacity:   0.22,
  },
];

// ─── Starfield ────────────────────────────────────────────────────────────────

function StarField() {
  const positions = useMemo(() => {
    const arr = new Float32Array(220 * 3);
    // Seeded-ish layout — avoid changing per render
    for (let i = 0; i < 220; i++) {
      const theta = (i / 220) * Math.PI * 2 * 7.3;
      const phi   = Math.acos(1 - 2 * ((i * 0.618033) % 1));
      const r     = 14 + (i % 7) * 1.8;
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={220}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#8898B8"
        size={0.055}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Orbital Scene ────────────────────────────────────────────────────────────

function OrbitalScene() {
  const systemRef = useRef<THREE.Group>(null);
  const nodeRefs  = useRef<(THREE.Group | null)[]>(RING_DEFS.map(() => null));

  // Quaternions for each ring — computed once from static RING_DEFS
  const ringQuaternions = useMemo(
    () => RING_DEFS.map(r => new THREE.Quaternion().setFromEuler(new THREE.Euler(...r.rotation))),
    [],
  );

  const baseVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Slow, compound orrery drift
    if (systemRef.current) {
      systemRef.current.rotation.y = t * 0.032;
      systemRef.current.rotation.x = Math.sin(t * 0.065) * 0.055;
    }

    // Walk each orbital node along its ring
    RING_DEFS.forEach((ring, i) => {
      const node = nodeRefs.current[i];
      if (!node) return;

      const phi = t * ring.speed;
      baseVec.set(
        ring.radius * Math.cos(phi),
        0,
        ring.radius * Math.sin(phi),
      );
      baseVec.applyQuaternion(ringQuaternions[i]);
      node.position.copy(baseVec);
    });
  });

  return (
    <group ref={systemRef}>
      {/* ── Starfield backdrop ── */}
      <StarField />

      {/* ── Central stellar core — 4 concentric volumetric spheres ── */}
      <mesh>
        <sphereGeometry args={[1.2, 20, 20]} />
        <meshBasicMaterial
          color="#FFE080"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.82, 20, 20]} />
        <meshBasicMaterial
          color="#FFD460"
          transparent
          opacity={0.10}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.52, 20, 20]} />
        <meshBasicMaterial
          color="#FFF0A0"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.20, 14, 14]} />
        <meshBasicMaterial
          color="#FFFEF8"
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Orbital rings ── */}
      {RING_DEFS.map((ring, i) => (
        <mesh key={i} rotation={ring.rotation}>
          <torusGeometry args={[ring.radius, 0.013, 8, 96]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ── Orbital nodes (positioned every frame in useFrame) ── */}
      {RING_DEFS.map((ring, i) => (
        <group
          key={`node-${i}`}
          ref={(el: THREE.Group | null) => { nodeRefs.current[i] = el; }}
        >
          {/* Outer haze */}
          <mesh>
            <sphereGeometry args={[0.24, 10, 10]} />
            <meshBasicMaterial
              color={ring.nodeColor}
              transparent
              opacity={0.07}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Inner glow */}
          <mesh>
            <sphereGeometry args={[0.13, 10, 10]} />
            <meshBasicMaterial
              color={ring.nodeColor}
              transparent
              opacity={0.34}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Bright core */}
          <mesh>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshBasicMaterial
              color="#FFFFFF"
              transparent
              opacity={0.88}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface OrbitalPatternsMapProps {
  height?: number;
}

export function OrbitalPatternsMap({ height = 300 }: OrbitalPatternsMapProps) {
  return (
    <View style={{ height, width: '100%' }}>
      <Canvas camera={{ position: [0, 3.5, 11], fov: 52 }}>
        <fog attach="fog" args={['#02010A', 10, 26]} />
        <OrbitalScene />
      </Canvas>
    </View>
  );
}
