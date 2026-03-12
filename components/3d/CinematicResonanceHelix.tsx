/**
 * components/3d/CinematicResonanceHelix.tsx
 * MySky — Depth-Volumetric Double Helix (pure scene, no Canvas wrapper)
 *
 * Rendered inside GlobalCanvas when activeScene === 'RESONANCE_HELIX'.
 *
 * Architecture:
 *   • Two DepthVolumetricStrand components (cyan user / pink partner)
 *   • Each strand is 4 tube layers (core → tight glow → silk band → haze)
 *   • Layer opacity modulated by a depth GLSL shader — objects further from the
 *     camera fade out naturally, reinforcing the 3D parallax
 *   • EnergyBridges: LineSegments connecting matching data points; opacity ∝
 *     strand proximity (closer = brighter "resonance spark")
 *   • All geometry shares the same useFrame rotation.x for coherent motion
 *   • Data fetched from resonanceStore (Zustand) — falls back to mock values
 *     while the RPC loads so the scene is never blank
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useResonanceStore } from '../../store/resonanceStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const HELIX_LENGTH  = 20;
const HELIX_RADIUS  = 2.5;
const TUBE_SEGMENTS = 100;
const RADIAL_SEGS   = 12;

// GlobalCanvas camera sits at z=15 → view-space depth range of the helix is
// roughly 12–18. These uniforms let the front faces pop forward.
const DEPTH_NEAR = 10;
const DEPTH_FAR  = 20;

// ─── Depth-aware GLSL ─────────────────────────────────────────────────────────

const DEPTH_VERT = `
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const DEPTH_FRAG = `
  uniform vec3  uColor;
  uniform float uBaseOpacity;
  uniform float uNearDepth;
  uniform float uFarDepth;
  varying float vDepth;
  void main() {
    float depthFactor = smoothstep(uFarDepth, uNearDepth, vDepth);
    float alpha = uBaseOpacity * mix(0.18, 1.0, depthFactor);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCurve(data: number[], phaseOffset: number): THREE.CatmullRomCurve3 {
  const count = Math.max(data.length, 2);
  const stepX = HELIX_LENGTH / (count - 1);
  const startX = -HELIX_LENGTH / 2;

  const points = data.map((val, i) => new THREE.Vector3(
    startX + i * stepX,
    ((val / 10) * 4) - 2,                         // 0–10 → -2 to +2
    Math.sin(i * 0.8 + phaseOffset) * HELIX_RADIUS,
  ));

  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.8);
}

// ─── Volumetric Strand ────────────────────────────────────────────────────────

interface StrandProps {
  data:        number[];
  baseColor:   string;
  phaseOffset: number;
}

function DepthVolumetricStrand({ data, baseColor, phaseOffset }: StrandProps) {
  const groupRef = useRef<THREE.Group>(null);
  const curve    = useMemo(() => buildCurve(data, phaseOffset), [data, phaseOffset]);
  const colorObj = useMemo(() => new THREE.Color(baseColor), [baseColor]);

  // 4-layer tube cluster: core → tight glow → silk band → atmospheric haze
  const layers = useMemo(() => [
    { radius: 0.03, opacity: 0.95  },
    { radius: 0.14, opacity: 0.34  },
    { radius: 0.36, opacity: 0.11  },
    { radius: 0.68, opacity: 0.035 },
  ], []);

  const uniformsByLayer = useMemo(() => layers.map((layer) => ({
    uColor:       { value: colorObj },
    uBaseOpacity: { value: layer.opacity },
    uNearDepth:   { value: DEPTH_NEAR },
    uFarDepth:    { value: DEPTH_FAR  },
  })), [layers, colorObj]);

  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.x = clock.getElapsedTime() * 0.15;
  });

  return (
    <group ref={groupRef}>
      {layers.map((layer, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, TUBE_SEGMENTS, layer.radius, RADIAL_SEGS, false]} />
          <shaderMaterial
            vertexShader={DEPTH_VERT}
            fragmentShader={DEPTH_FRAG}
            uniforms={uniformsByLayer[i]}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Energy Bridges ───────────────────────────────────────────────────────────

interface BridgesProps { userData: number[]; partnerData: number[] }

function EnergyBridges({ userData, partnerData }: BridgesProps) {
  const linesRef = useRef<THREE.LineSegments>(null);

  const { linePositions, opacities } = useMemo(() => {
    const count     = Math.min(userData.length, partnerData.length);
    const positions = new Float32Array(count * 6);
    const alphas    = new Float32Array(count * 2);

    const stepX  = HELIX_LENGTH / Math.max(count - 1, 1);
    const startX = -HELIX_LENGTH / 2;

    for (let i = 0; i < count; i++) {
      const x  = startX + i * stepX;
      const uY = (userData[i]    / 10) * 4 - 2;
      const uZ = Math.sin(i * 0.8)          * HELIX_RADIUS;
      const pY = (partnerData[i] / 10) * 4 - 2;
      const pZ = Math.sin(i * 0.8 + Math.PI) * HELIX_RADIUS;

      positions.set([x, uY, uZ, x, pY, pZ], i * 6);

      const dist      = Math.sqrt((uY - pY) ** 2 + (uZ - pZ) ** 2);
      const intensity = Math.max(0.06, 1 - dist / 5.5);
      alphas[i * 2]     = intensity;
      alphas[i * 2 + 1] = intensity;
    }

    return { linePositions: positions, opacities: alphas };
  }, [userData, partnerData]);

  useFrame(({ clock }) => {
    if (linesRef.current) linesRef.current.rotation.x = clock.getElapsedTime() * 0.15;
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={linePositions} count={linePositions.length / 3} itemSize={3} />
        <bufferAttribute attach="attributes-alpha"    array={opacities}     count={opacities.length}          itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        vertexShader={`
          attribute float alpha;
          varying float vAlpha;
          varying float vDepth;
          void main() {
            vAlpha = alpha;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vDepth = -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          varying float vAlpha;
          varying float vDepth;
          void main() {
            float depthFade = smoothstep(${DEPTH_FAR}.0, ${DEPTH_NEAR}.0, vDepth);
            float alpha = vAlpha * 0.42 * mix(0.25, 1.0, depthFade);
            gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
          }
        `}
      />
    </lineSegments>
  );
}

// ─── Scene Root ───────────────────────────────────────────────────────────────

export default function CinematicResonanceHelix() {
  const data = useResonanceStore((s) => s.data);

  // Provide a lively default while the RPC loads — the scene is never blank
  const ud = data?.userData.length  ?? 0 >= 2 ? data!.userData  : [6, 7, 5, 8, 6, 9, 7];
  const pd = data?.partnerData.length ?? 0 >= 2 ? data!.partnerData : [5, 6, 6, 7, 8, 8, 6];

  return (
    <group>
      <DepthVolumetricStrand data={ud} baseColor="#00F5FF" phaseOffset={0}        />
      <DepthVolumetricStrand data={pd} baseColor="#FF3FD2" phaseOffset={Math.PI}  />
      <EnergyBridges userData={ud} partnerData={pd} />
    </group>
  );
}
