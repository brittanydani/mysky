/**
 * components/3d/EtherealPlasmaSphere.tsx
 * MySky — Plasma Sphere scene for GlobalCanvas (CHECK_IN_SPHERE)
 *
 * Canvas-free — rendered inside the app's shared GlobalCanvas via:
 *   {activeScene === 'CHECK_IN_SPHERE' && <EtherealPlasmaSphere />}
 *
 * Mood reactivity:
 *   Reads liveMood from checkInInteractionStore via the escape-hatch
 *   getLiveMood() getter so the hot path never triggers a React re-render.
 *   All interpolation happens inside useFrame on the render thread.
 *
 * Color mapping:
 *   mood 0–3  → deep navy / cyan  (calm)
 *   mood 4–6  → violet / cyan     (neutral)
 *   mood 7–10 → rose / gold       (intense)
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { getLiveMood } from '../../store/checkInInteractionStore';

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec2 vUv;
  varying vec3 vNormal;

  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float n = dot(i, vec3(1.0, 57.0, 113.0));

    return mix(
      mix(
        mix(hash(n + 0.0),   hash(n + 1.0),   f.x),
        mix(hash(n + 57.0),  hash(n + 58.0),  f.x),
        f.y
      ),
      mix(
        mix(hash(n + 113.0), hash(n + 114.0), f.x),
        mix(hash(n + 170.0), hash(n + 171.0), f.x),
        f.y
      ),
      f.z
    );
  }

  void main() {
    float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    rim = smoothstep(0.55, 1.0, rim);

    vec3 noisePos = vec3(vUv.x * 4.0, vUv.y * 4.0, uTime * uIntensity);
    float n = noise(noisePos) * 0.5 + 0.5;

    vec3 finalColor = mix(uColorA, uColorB, n);
    float alpha = (n * 0.42 + rim * 0.92) * (0.35 + uIntensity * 0.42);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export default function EtherealPlasmaSphere() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef     = useRef<THREE.Mesh>(null);

  const currentIntensity = useRef(0.65);
  const targetColorA     = useMemo(() => new THREE.Color('#00F5FF'), []);
  const targetColorB     = useMemo(() => new THREE.Color('#BC13FE'), []);
  const currentColorA    = useRef(new THREE.Color('#00F5FF'));
  const currentColorB    = useRef(new THREE.Color('#BC13FE'));

  const uniforms = useMemo(
    () => ({
      uTime:       { value: 0 },
      uIntensity:  { value: 0.65 },
      uColorA:     { value: currentColorA.current },
      uColorB:     { value: currentColorB.current },
    }),
    []
  );

  useFrame(({ clock }) => {
    const mood = Math.max(0, Math.min(10, getLiveMood()));

    const targetIntensity = 0.35 + (mood / 10) * 1.35;

    if (mood >= 7) {
      targetColorA.setHex(0xFF4D6D);
      targetColorB.setHex(0xFFD166);
    } else if (mood >= 4) {
      targetColorA.setHex(0xBC13FE);
      targetColorB.setHex(0x00F5FF);
    } else {
      targetColorA.setHex(0x0A192F);
      targetColorB.setHex(0x33CCFF);
    }

    currentIntensity.current = THREE.MathUtils.lerp(
      currentIntensity.current,
      targetIntensity,
      0.06
    );
    currentColorA.current.lerp(targetColorA, 0.06);
    currentColorB.current.lerp(targetColorB, 0.06);

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value      = clock.getElapsedTime();
      materialRef.current.uniforms.uIntensity.value = currentIntensity.current;
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0045 * currentIntensity.current;
      meshRef.current.rotation.z += 0.0018 * currentIntensity.current;
    }
  });

  return (
    <group>
      {/* Outer corona glow */}
      <mesh scale={2.1}>
        <sphereGeometry args={[1.15, 48, 48]} />
        <meshBasicMaterial
          color="#4C8CFF"
          transparent
          opacity={0.035}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Plasma shell */}
      <mesh ref={meshRef} scale={1.55}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
