/**
 * components/ui/CircadianRhythmTerrain.tsx
 * MySky — Circadian Rhythm: 3D Vertex-Displaced Heatmap Surface (R3F)
 *
 * Architecture:
 *   • Self-contained Canvas (no GlobalCanvas dependency)
 *   • PlaneGeometry(6, 23, 6, 23) → 7 cols (days) × 24 rows (hours)
 *     Vertex Y is displaced by the mood value at that day/hour slot
 *   • Color per vertex: deep indigo (low) → blue-violet → white-cyan peak
 *   • Camera angled at 35° to give terrain a navigable, topographic feel
 *   • Slow camera orbit to let depth become legible
 *   • Grid lines (wireframe overlay) show slot boundaries subtly
 *   • Data source: useCircadianStore (see store/circadianStore.ts)
 *   • No GLSL · No window.devicePixelRatio · No GlobalCanvas · No drei
 */

import React, { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useCircadianStore } from '../../store/circadianStore';

// ─── Color gradient for terrain height ───────────────────────────────────────

// value 0–10 → color interpolated across these stops
const COLOR_STOPS: Array<[number, THREE.Color]> = [
  [0,    new THREE.Color('#1A1B38')],   // deep indigo — trough
  [3,    new THREE.Color('#13142A')],   // near-black violet
  [5,    new THREE.Color('#3B2F8A')],   // blue-violet
  [7,    new THREE.Color('#00B4F0')],   // electric blue
  [9,    new THREE.Color('#00F5FF')],   // cyan
  [10,   new THREE.Color('#FFFFFF')],   // white-hot peak
];

function valueToColor(v: number): THREE.Color {
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [lo, cLo] = COLOR_STOPS[i];
    const [hi, cHi] = COLOR_STOPS[i + 1];
    if (v >= lo && v <= hi) {
      const t = (v - lo) / (hi - lo);
      return cLo.clone().lerp(cHi, t);
    }
  }
  return new THREE.Color('#FFFFFF');
}

// ─── Terrain Mesh ─────────────────────────────────────────────────────────────

const COLS =  6;   // days   0–6
const ROWS = 23;   // hours  0–23
const W    =  9;   // world units wide
const D    =  9;   // world units deep

function TerrainMesh() {
  const grid         = useCircadianStore((s) => s.grid);
  const solidRef     = useRef<THREE.Mesh>(null);
  const wireRef      = useRef<THREE.Mesh>(null);
  const systemRef    = useRef<THREE.Group>(null);

  const { solidGeo, wireGeo } = useMemo(() => {
    const colCount = COLS + 1;   // 7 vertices wide
    const rowCount = ROWS + 1;   // 24 vertices deep

    const sg = new THREE.PlaneGeometry(W, D, COLS, ROWS);
    sg.rotateX(-Math.PI / 2);

    const positions = sg.attributes.position as THREE.Float32BufferAttribute;
    const count     = positions.count;
    const colors    = new Float32Array(count * 3);

    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        const vtxIdx = r * colCount + c;
        // grid[day][hour] — day = column, hour = row
        const day  = Math.min(c, 6);
        const hour = Math.min(r, 23);
        const val  = grid[day]?.[hour] ?? 5;

        // Y displacement — scale 0–10 → 0–3.5 world units height
        positions.setY(vtxIdx, (val / 10) * 3.5);

        const col = valueToColor(val);
        colors[vtxIdx * 3]     = col.r;
        colors[vtxIdx * 3 + 1] = col.g;
        colors[vtxIdx * 3 + 2] = col.b;
      }
    }

    sg.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    sg.computeVertexNormals();

    // Shared position for wireframe
    const wg = sg.clone();

    return { solidGeo: sg, wireGeo: wg };
  }, [grid]);

  useFrame(({ clock }) => {
    if (systemRef.current) {
      const t = clock.getElapsedTime();
      // Gentle orbit — 40-second full cycle
      systemRef.current.rotation.y = Math.sin(t * 0.08) * 0.25;
    }
  });

  return (
    <group ref={systemRef} position={[0, -1.5, 0]}>
      {/* Solid terrain surface */}
      <mesh ref={solidRef} geometry={solidGeo}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.82}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Subtle wireframe grid overlay */}
      <mesh ref={wireRef} geometry={wireGeo}>
        <meshBasicMaterial
          color="#1A2A4A"
          wireframe
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface CircadianRhythmTerrainProps {
  height?: number;
}

export function CircadianRhythmTerrain({ height = 300 }: CircadianRhythmTerrainProps) {
  return (
    <View style={{ height, width: '100%' }}>
      <Canvas camera={{ position: [0, 7, 10], fov: 52 }}>
        <fog attach="fog" args={['#030308', 8, 28]} />
        <TerrainMesh />
      </Canvas>
    </View>
  );
}
