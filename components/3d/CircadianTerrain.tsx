/**
 * components/3d/CircadianTerrain.tsx
 * MySky — Circadian Rhythm Terrain (3D Scene)
 *
 * Pure 3D scene — no Canvas wrapper. Rendered inside GlobalCanvas.
 *
 * Data bridge:
 *   • useCircadianStore (Zustand) — reads the 7×24 mood grid produced
 *     by the get_weekly_rhythm RPC.
 *
 * Design:
 *   • PlaneGeometry (24 cols × 7 rows) sculpted into a terrain by
 *     displacing each vertex's Z-axis by the corresponding mood value.
 *   • Geometry is computed once via useMemo and reused for both the
 *     wireframe glow layer and the solid shadow mesh — zero extra allocs.
 *   • frameloop="demand" in the parent Canvas keeps this cheap when static.
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCircadianStore } from '../../store/circadianStore';

// ─── Layout constants ─────────────────────────────────────────────────────────

/** World-space width mapped to 24 hours. */
const TERRAIN_WIDTH = 14;
/** World-space height mapped to 7 days. */
const TERRAIN_HEIGHT = 8;
/** Maximum Z displacement at mood_value = 10. */
const PEAK_HEIGHT = 2.5;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CircadianTerrain() {
  const grid = useCircadianStore((state) => state.grid);

  /**
   * Build (or rebuild) the geometry whenever the grid changes.
   * PlaneGeometry(w, h, wSegs, hSegs) creates (wSegs+1)*(hSegs+1) vertices.
   * With 23 width-segments and 6 height-segments we get exactly 24×7 = 168 vertices.
   */
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_WIDTH,
      TERRAIN_HEIGHT,
      23, // widthSegments  → 24 columns (hours)
      6   // heightSegments → 7 rows    (days)
    );

    const pos = geo.attributes.position as THREE.BufferAttribute;

    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const vertexIndex = d * 24 + h;
        const mood = grid[d]?.[h] ?? 5;
        // Displace the Z-axis to raise terrain peaks at high-energy hours.
        pos.setZ(vertexIndex, (mood / 10) * PEAK_HEIGHT);
      }
    }

    geo.computeVertexNormals();
    return geo;
  }, [grid]);

  return (
    <group rotation={[-Math.PI / 2.8, 0, 0]} position={[0, -1, 0]}>
      {/* Glow wireframe layer */}
      <mesh geometry={geometry}>
        <meshPhongMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.6}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Solid shadow mesh for depth and readability */}
      <mesh geometry={geometry}>
        <meshPhongMaterial
          color="#050512"
          transparent
          opacity={0.85}
          shininess={50}
        />
      </mesh>
    </group>
  );
}
