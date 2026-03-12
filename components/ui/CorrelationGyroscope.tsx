/**
 * components/ui/CorrelationGyroscope.tsx
 * MySky — Neural Patterns: 3D Correlation Gyroscope (React Three Fiber)
 *
 * Architecture:
 *   • Self-contained Canvas (no GlobalCanvas dependency)
 *   • Central Core Self orb — 4-layer volumetric white sphere
 *   • Each correlation pair → one tilted orbital ring + indicator orb
 *   • Ring speed  ∝ |correlation| (stronger = faster rotation)
 *   • Ring direction: positive CW, negative CCW (counter-rotation)
 *   • Ring color: positive → cyan #00FFFF, negative → magenta #FF00FF
 *   • Optional pulse sync for |correlation| > 0.75
 *   • All additive blending — no depthWrite — no GLSL
 *   • No window.devicePixelRatio  ·  No @react-three/drei
 */

import React, { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useCorrelationStore, CorrelationPair } from '../../store/correlationStore';

// ─── Ring parameters derived from a correlation pair ─────────────────────────

interface RingConfig {
  radius:      number;
  tiltX:       number;
  tiltZ:       number;
  speed:       number;   // rad/s, signed (+ = positive corr, - = negative)
  colorHex:    string;
  opacity:     number;
  isPulse:     boolean;
}

const RING_BASE_RADII = [2.2, 3.0, 3.7, 4.3, 4.9, 5.4];
const RING_TILTS: [number, number][] = [
  [0,              0            ],
  [Math.PI / 6,    Math.PI / 5  ],
  [Math.PI / 3,   -Math.PI / 4  ],
  [2 * Math.PI / 3, Math.PI / 8 ],
  [Math.PI / 4,    Math.PI / 3  ],
  [5 * Math.PI / 9, -Math.PI / 6],
];

function buildRingConfig(pair: CorrelationPair, idx: number): RingConfig {
  const abs     = Math.abs(pair.correlation);
  const isPos   = pair.correlation >= 0;
  return {
    radius:   RING_BASE_RADII[idx % RING_BASE_RADII.length],
    tiltX:    RING_TILTS[idx % RING_TILTS.length][0],
    tiltZ:    RING_TILTS[idx % RING_TILTS.length][1],
    speed:    (0.25 + abs * 1.5) * (isPos ? 1 : -1),
    colorHex: isPos ? '#00FFFF' : '#FF00FF',
    opacity:  0.22 + abs * 0.35,
    isPulse:  abs > 0.75,
  };
}

// ─── Orbital Ring with spinning indicator node ────────────────────────────────

interface OrbitalRingProps extends RingConfig {}

function OrbitalRing({ radius, tiltX, tiltZ, speed, colorHex, opacity, isPulse }: OrbitalRingProps) {
  const nodeRef  = useRef<THREE.Group>(null);
  const angleRef = useRef(Math.random() * Math.PI * 2);

  const colorObj = useMemo(() => new THREE.Color(colorHex), [colorHex]);
  const quat     = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(tiltX, 0, tiltZ)),
    [tiltX, tiltZ],
  );
  const baseVec  = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    angleRef.current += speed * 0.016;  // ~60 fps step

    // Pulse scale — only for strong correlations
    let scale = 1.0;
    if (isPulse) {
      scale = 1 + Math.sin(t * 3.5) * 0.18;
    }

    if (nodeRef.current) {
      baseVec.set(radius * Math.cos(angleRef.current), 0, radius * Math.sin(angleRef.current));
      baseVec.applyQuaternion(quat);
      nodeRef.current.position.copy(baseVec);
      nodeRef.current.scale.setScalar(scale);
    }
  });

  const ringRotation: [number, number, number] = [tiltX, 0, tiltZ];

  return (
    <group>
      {/* Ring */}
      <mesh rotation={ringRotation}>
        <torusGeometry args={[radius, 0.015, 8, 80]} />
        <meshBasicMaterial
          color={colorObj}
          transparent
          opacity={opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbital indicator node */}
      <group ref={nodeRef}>
        {/* Outer haze */}
        <mesh>
          <sphereGeometry args={[0.28, 10, 10]} />
          <meshBasicMaterial
            color={colorObj}
            transparent
            opacity={0.07}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Inner glow */}
        <mesh>
          <sphereGeometry args={[0.16, 10, 10]} />
          <meshBasicMaterial
            color={colorObj}
            transparent
            opacity={0.30}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Bright core */}
        <mesh>
          <sphereGeometry args={[0.065, 8, 8]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.90}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

// ─── Gyroscope Scene ──────────────────────────────────────────────────────────

function GyroscopeScene() {
  const correlations = useCorrelationStore((s) => s.correlations);
  const systemRef    = useRef<THREE.Group>(null);

  const ringConfigs = useMemo(
    () => correlations.map((pair, i) => buildRingConfig(pair, i)),
    [correlations],
  );

  useFrame(({ clock }) => {
    if (systemRef.current) {
      const t = clock.getElapsedTime();
      systemRef.current.rotation.y = t * 0.025;
      systemRef.current.rotation.x = Math.sin(t * 0.07) * 0.04;
    }
  });

  return (
    <group ref={systemRef}>
      {/* ── Central Core Self — 4-layer white orb ── */}
      <mesh>
        <sphereGeometry args={[1.5, 20, 20]} />
        <meshBasicMaterial
          color="#D8E7FF"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.0, 18, 18]} />
        <meshBasicMaterial
          color="#D8E7FF"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.60, 16, 16]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Orbital rings — one per correlation pair ── */}
      {ringConfigs.map((cfg, i) => (
        <OrbitalRing key={i} {...cfg} />
      ))}
    </group>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface CorrelationGyroscopeProps {
  height?: number;
}

export function CorrelationGyroscope({ height = 300 }: CorrelationGyroscopeProps) {
  return (
    <View style={{ height, width: '100%' }}>
      <Canvas camera={{ position: [0, 3.5, 13], fov: 52 }}>
        <fog attach="fog" args={['#02010A', 10, 26]} />
        <GyroscopeScene />
      </Canvas>
    </View>
  );
}
