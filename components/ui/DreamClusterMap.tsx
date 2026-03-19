/**
 * DreamClusterMap.tsx
 * MySky — Dream Symbol Cluster Map (React Three Fiber / expo-gl)
 *
 * Architecture:
 *   • Dream symbols as glowing spherical nodes
 *   • Node radius ∝ frequency (1–10)
 *   • Node color ∝ emotional tone
 *   • Golden-angle spiral layout — deterministic, zero physics
 *   • Co-occurring symbols linked by softly curved bezier threads
 *   • Whole cluster rotates slowly; nodes breathe with individual phase offsets
 *   • Stars backdrop with fog depth
 *   • No window.devicePixelRatio · No GlobalCanvas · No @react-three/drei
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useDreamMapStore, DreamNodeData, DreamLinkData } from '../../store/dreamMapStore';

// Stable fallbacks — must be module-level constants so Object.is comparisons
// in useSyncExternalStore never see a new reference when data is null.
const EMPTY_NODES: DreamNodeData[] = [];
const EMPTY_LINKS: DreamLinkData[] = [];

// ─── Types ────────────────────────────────────────────────────────────────────

export type DreamTone =
  | 'joy' | 'fear' | 'longing' | 'adventure'
  | 'loss' | 'connection' | 'mystery' | 'neutral';

export interface DreamNode {
  id:              string;
  label:           string;
  frequency:       number;  // 1–10
  tone:            DreamTone;
  coOccursWith?:   string[];
}

// ─── Tone → color ─────────────────────────────────────────────────────────────

const TONE_COLOR: Record<DreamTone, string> = {
  joy:        '#FFDA03',
  fear:       '#FF4455',
  longing:    '#C86CFF',
  adventure:  '#5CADFF',
  loss:       '#3A8EBF',
  connection: '#9ACD32',
  mystery:    '#E070FF',
  neutral:    '#88AACC',
};

// ─── Internal render model ────────────────────────────────────────────────────
// Both static DreamNode[] and live DreamNodeData[] are normalised into this
// before being passed to the 3D components.

interface RenderNode {
  id:       string;
  hexColor: string;
  radius:   number; // world-space sphere radius
}

// ─── Golden-angle spiral layout ───────────────────────────────────────────────

function computePositions(nodes: RenderNode[]): THREE.Vector3[] {
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  return nodes.map((node, i) => {
    const r     = 1.4 + (node.radius / 0.23) * 1.2;  // 0.23 is max radius
    const angle = i * GOLDEN;
    const tilt  = Math.sin(i * 1.3) * 0.9;
    return new THREE.Vector3(Math.cos(angle) * r, tilt, Math.sin(angle) * r);
  });
}

// ─── Symbol node ──────────────────────────────────────────────────────────────

interface SymbolNodeProps {
  hexColor: string;
  radius:   number;
  nodeId:   string;
  position: [number, number, number];
}

function SymbolNode({ hexColor, radius: r, nodeId, position }: SymbolNodeProps) {
  const auraRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const color   = useMemo(() => new THREE.Color(hexColor), [hexColor]);
  const phase   = useMemo(() => (nodeId.charCodeAt(0) % 100) / 100 * Math.PI * 2, [nodeId]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (auraRef.current) auraRef.current.scale.setScalar(1 + Math.sin(t * 0.75 + phase) * 0.14);
    if (coreRef.current) coreRef.current.scale.setScalar(1 + Math.sin(t * 1.4 + phase) * 0.07);
  });

  return (
    <group position={position}>
      <mesh ref={auraRef}>
        <sphereGeometry args={[r * 2.4, 10, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[r * 1.55, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.20} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[r, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.88} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── Connector thread ─────────────────────────────────────────────────────────

interface ConnectorProps {
  from:  THREE.Vector3;
  to:    THREE.Vector3;
  color: string;
}

function ConnectorThread({ from, to, color }: ConnectorProps) {
  const lineObj = useMemo(() => {
    const mid = new THREE.Vector3().lerpVectors(from, to, 0.5);
    mid.y += 0.2;
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const geo   = new THREE.BufferGeometry().setFromPoints(curve.getPoints(20));
    const mat   = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Line(geo, mat);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from.x, from.y, from.z, to.x, to.y, to.z, color]);

  useEffect(() => () => {
    lineObj.geometry.dispose();
    (lineObj.material as THREE.Material).dispose();
  }, [lineObj]);

  return <primitive object={lineObj} />;
}

// ─── Starfield ────────────────────────────────────────────────────────────────

function Stars() {
  const geo = useMemo(() => {
    const N = 260, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r   = 9 + Math.sin(i * 1.7) * 2.5;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
      const θ   = i * 2.399;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(θ);
      pos[i * 3 + 1] = r * Math.cos(phi);
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(θ);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#9DABCF" size={0.038} transparent opacity={0.45} depthWrite={false} />
    </points>
  );
}

// ─── Cluster scene ────────────────────────────────────────────────────────────

interface SceneProps {
  renderNodes: RenderNode[];
  connectorPairs: Array<{ a: number; b: number; color: string }>;
}

function ClusterScene({ renderNodes, connectorPairs }: SceneProps) {
  const groupRef  = useRef<THREE.Group>(null);
  const positions = useMemo(() => computePositions(renderNodes), [renderNodes]);

  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.y = clock.getElapsedTime() * 0.055;
  });

  return (
    <group ref={groupRef}>
      <Stars />
      {connectorPairs.map(({ a, b, color }, i) => (
        <ConnectorThread key={i} from={positions[a]} to={positions[b]} color={color} />
      ))}
      {renderNodes.map((node, i) => (
        <SymbolNode
          key={node.id}
          hexColor={node.hexColor}
          radius={node.radius}
          nodeId={node.id}
          position={positions[i].toArray() as [number, number, number]}
        />
      ))}
    </group>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export interface DreamClusterMapProps {
  nodes?:  DreamNode[];    // explicit override (e.g. screenshots)
  height?: number;
}

export function DreamClusterMap({
  nodes,
  height = 300,
}: DreamClusterMapProps) {
  // Prefer live data from the store; then explicit prop; then nothing.
  // Selectors use module-level EMPTY_* fallbacks so useSyncExternalStore never
  // receives a new array reference when data is null (avoids infinite loop).
  const storeNodes = useDreamMapStore((s) => s.data?.nodes ?? EMPTY_NODES);
  const storeLinks = useDreamMapStore((s) => s.data?.links ?? EMPTY_LINKS);

  // useMemo must be called unconditionally (Rules of Hooks).
  // The early-return for "nothing to show" moves to after this hook.
  const { renderNodes, connectorPairs } = useMemo(() => {
    if (storeNodes.length > 0) {
      // ── Live path: data from RPC via useSyncDreamData ──
      const rNodes: RenderNode[] = storeNodes.map(n => ({
        id:       n.id,
        hexColor: n.color,
        // RPC size is 0.5–2.0 → map to sphere radius 0.07–0.23
        radius:   0.07 + ((n.size - 0.5) / 1.5) * 0.16,
      }));

      const indexMap = new Map<string, number>(storeNodes.map((n, i) => [n.id, i]));
      const seenLinks = new Set<string>();
      const pairs: Array<{ a: number; b: number; color: string }> = [];
      storeLinks.forEach(link => {
        const a = indexMap.get(link.source);
        const b = indexMap.get(link.target);
        if (a === undefined || b === undefined) return;
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
        if (!seenLinks.has(key)) {
          seenLinks.add(key);
          pairs.push({ a, b, color: storeNodes[a].color });
        }
      });

      return { renderNodes: rNodes, connectorPairs: pairs };
    }

    // ── Static path: use explicit DreamNode[] prop (e.g. screenshots) ──
    const srcNodes = nodes ?? [];
    const rNodes: RenderNode[] = srcNodes.map(n => ({
      id:       n.id,
      hexColor: TONE_COLOR[n.tone] ?? '#88AACC',
      radius:   0.07 + (n.frequency / 10) * 0.16,
    }));

    const indexMap = new Map<string, number>(srcNodes.map((n, i) => [n.id, i]));
    const seen = new Set<string>();
    const pairs: Array<{ a: number; b: number; color: string }> = [];
    srcNodes.forEach((n, i) => {
      (n.coOccursWith ?? []).forEach(otherId => {
        const j = indexMap.get(otherId);
        if (j === undefined) return;
        const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({ a: i, b: j, color: TONE_COLOR[n.tone] ?? '#88AACC' });
        }
      });
    });

    return { renderNodes: rNodes, connectorPairs: pairs };
  }, [storeNodes, storeLinks, nodes]);

  // Nothing to render — all hooks have already been called above.
  if (renderNodes.length === 0) return null;

  return (
    <View style={{ height, width: '100%' }}>
      <Canvas camera={{ position: [0, 2.2, 7], fov: 50 }}>
        <fog attach="fog" args={['#02010A', 7, 20]} />
        <ClusterScene renderNodes={renderNodes} connectorPairs={connectorPairs} />
      </Canvas>
    </View>
  );
}

