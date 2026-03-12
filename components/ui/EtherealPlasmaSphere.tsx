/**
 * EtherealPlasmaSphere.tsx
 * MySky — Emotional Plasma Sphere (React Three Fiber / expo-gl)
 *
 * Architecture:
 *   • SphereGeometry with custom GLSL ShaderMaterial
 *   • Fresnel rim-lighting — "energy leaking through the shell"
 *   • FBM (fractional Brownian motion) — layered sine noise swirls the surface
 *   • Hue is derived from emotional state: mood shifts cyan→gold, stress adds red
 *   • Slow auto-rotation; gentle idle breathing scale animation
 *   • Outer glow corona — second sphere with additive blending
 *   • No window.devicePixelRatio · No GlobalCanvas · No @react-three/drei
 */

import React, { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

// ─── GLSL Shaders ─────────────────────────────────────────────────────────────

const PLASMA_VERT = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vUv       = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLASMA_FRAG = `
  uniform float uTime;
  uniform vec3  uColorA;  // cool/base colour
  uniform vec3  uColorB;  // warm/highlight colour
  uniform float uStressBlend;  // 0–1, adds red-hot tinge

  varying vec3  vNormal;
  varying vec3  vPosition;
  varying vec2  vUv;

  // Fractional Brownian Motion — 3 octaves of sine noise
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * sin(p.x * (1.0 + float(i)) + uTime * (0.4 + float(i) * 0.2)
                 + p.y * (1.5 + float(i)));
      v += a * sin(p.y * (2.1 + float(i)) - uTime * (0.3 + float(i) * 0.15));
      a *= 0.5;
      p *= 2.1;
    }
    return v * 0.5 + 0.5;
  }

  void main() {
    // FBM noise evaluated on the sphere UV
    float n = fbm(vUv * 3.0 + uTime * 0.12);

    // Fresnel — angle between view vector and surface normal
    vec3  viewVec = normalize(-vPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewVec)), 2.2);

    // Surface colour: blend A→B by noise, then add stress tinge at rim
    vec3 surface = mix(uColorA, uColorB, n);
    surface = mix(surface, vec3(1.0, 0.25, 0.12), uStressBlend * fresnel * 0.65);

    // Core glow: brighter at centre (1 - fresnel)
    float coreGlow = (1.0 - fresnel) * 0.6 + 0.1;
    vec3  col      = surface * (coreGlow + n * 0.3);

    // Rim light
    col += uColorB * fresnel * 1.1;

    float alpha = clamp(coreGlow + fresnel * 0.7 + n * 0.2, 0.0, 1.0);

    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── Sphere Scene ─────────────────────────────────────────────────────────────

interface SceneProps {
  mood:   number;  // 1–10
  energy: number;  // 1–10
  stress: number;  // 1–10
}

function PlasmaScene({ mood, energy, stress }: SceneProps) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

  // Derive colour A and B from emotional state
  // Mood 1→10: hue slides from deep violet (cool) toward gold (warm)
  // Energy scales brightness
  // Stress adds red tinge via uniform
  const { colorA, colorB, stressBlend } = useMemo(() => {
    const moodT      = (mood   - 1) / 9;   // 0→1
    const energyT    = (energy - 1) / 9;
    const stressNorm = (stress - 1) / 9;

    // ColorA: deep cool (violet/indigo → cyan)
    const cA = new THREE.Color().setHSL(
      0.65 - moodT * 0.25,        // hue: 0.65 (violet) → 0.40 (cyan-green)
      0.6 + energyT * 0.3,        // saturation increases with energy
      0.12 + energyT * 0.12,      // lightness
    );

    // ColorB: warm highlight (cyan → gold)
    const cB = new THREE.Color().setHSL(
      0.55 - moodT * 0.45,        // hue: 0.55 (cyan) → 0.10 (gold/orange)
      0.75 + energyT * 0.2,
      0.35 + moodT * 0.25,
    );

    return { colorA: cA, colorB: cB, stressBlend: stressNorm };
  }, [mood, energy, stress]);

  const uniforms = useMemo(() => ({
    uTime:        { value: 0 },
    uColorA:      { value: colorA },
    uColorB:      { value: colorB },
    uStressBlend: { value: stressBlend },
  }), [colorA, colorB, stressBlend]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (sphereRef.current) {
      sphereRef.current.rotation.y = t * 0.09;
      sphereRef.current.rotation.x = Math.sin(t * 0.13) * 0.08;
      const breathe = 1 + Math.sin(t * 0.8) * 0.04;
      sphereRef.current.scale.setScalar(breathe);
    }

    if (coronaRef.current) {
      const pulse = 1 + Math.sin(t * 0.6 + 0.5) * 0.06;
      coronaRef.current.scale.setScalar(pulse);
    }

    // Update shader time
    uniforms.uTime.value = t;
  });

  return (
    <>
      {/* Outer corona glow */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[2.15, 24, 24]} />
        <meshBasicMaterial
          color={colorB}
          transparent
          opacity={0.06}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Mid halo */}
      <mesh>
        <sphereGeometry args={[1.72, 20, 20]} />
        <meshBasicMaterial
          color={colorB}
          transparent
          opacity={0.10}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main plasma sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1.4, 64, 64]} />
        <shaderMaterial
          vertexShader={PLASMA_VERT}
          fragmentShader={PLASMA_FRAG}
          uniforms={uniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Bright inner core */}
      <mesh>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial
          color={colorB}
          transparent
          opacity={0.22}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface EtherealPlasmaSphereProps {
  mood?:   number;  // 1–10, default 5
  energy?: number;  // 1–10, default 5
  stress?: number;  // 1–10, default 3
  height?: number;
}

export function EtherealPlasmaSphere({
  mood   = 5,
  energy = 5,
  stress = 3,
  height = 260,
}: EtherealPlasmaSphereProps) {
  return (
    <View style={{ height, width: '100%' }}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 48 }}>
        <fog attach="fog" args={['#020108', 5, 16]} />
        <PlasmaScene mood={mood} energy={energy} stress={stress} />
      </Canvas>
    </View>
  );
}
