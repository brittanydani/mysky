/**
 * components/3d/DreamClusterMap.tsx
 * MySky — Force-Directed Dream Cluster Map (Physics Scene)
 *
 * Pure 3D scene — no Canvas wrapper. Rendered inside GlobalCanvas.
 *
 * Physics:
 *   • Coulomb repulsion:  Fr = k / r²   (nodes push apart)
 *   • Hooke attraction:   Fa = −c · r   (linked nodes spring together)
 *   • Central gravity keeps the cluster from drifting off screen
 *
 * Memory safety:
 *   • Float32Array line buffer pre-allocated once — mutated each frame
 *   • Shared Vector3 scratch objects avoid per-frame GC allocations
 *
 * State bridge:
 *   • useDreamMapStore (Zustand) — tap dispatches activeNode to the
 *     transparent React Native UI overlay (DreamScreen.tsx) without
 *     ever re-rendering the 3D scene.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber/native';
import * as THREE from 'three';
import { useDreamMapStore, DreamNodeData, DreamLinkData } from '@/store/dreamMapStore';

// ─── Physics node type ────────────────────────────────────────────────────────

type PhysicsNode = DreamNodeData & {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
};

// ─── Stars backdrop ────────────────────────────────────────────────────────────

function Stars() {
  const geo = useMemo(() => {
    const N = 260;
    const pos = new Float32Array(N * 3);
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
      <pointsMaterial
        color="#9DABCF"
        size={0.04}
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Physics cluster ───────────────────────────────────────────────────────────

function PhysicsCluster() {
  const linesRef      = useRef<THREE.LineSegments>(null);
  const nodesGroupRef = useRef<THREE.Group>(null);
  const setActiveNode = useDreamMapStore((s) => s.setActiveNode);
  const activeNodeId  = useDreamMapStore((s) => s.activeNode?.id ?? null);
  const storeData     = useDreamMapStore((s) => s.data);

  // Initialise positions on a spiral — physics settles them into a constellation
  const { nodes, links } = useMemo<{ nodes: PhysicsNode[]; links: DreamLinkData[] }>(() => {
    const inputNodes = storeData?.nodes ?? [];
    const inputLinks = storeData?.links ?? [];
    const initialised = inputNodes.map<PhysicsNode>((n, index) => {
      const angle  = (index / Math.max(inputNodes.length, 1)) * Math.PI * 2;
      const radius = 2.8 + (index % 3) * 0.9;
      return {
        ...n,
        pos: new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.7,
          ((index % 5) - 2) * 0.65,
        ),
        vel: new THREE.Vector3(),
      };
    });
    return { nodes: initialised, links: inputLinks };
  }, [storeData?.nodes, storeData?.links]);

  // Pre-allocate line buffer — mutated each frame to avoid GC spikes
  const linePositions = useMemo(() => new Float32Array(links.length * 6), [links.length]);

  // Scratch Vector3 instances — reused every frame (zero heap allocations in loop)
  const _delta   = useMemo(() => new THREE.Vector3(), []);
  const _gravity = useMemo(() => new THREE.Vector3(), []);
  const _origin  = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(() => {
    const REPULSION = 0.5;
    const SPRING_K  = 0.05;
    const DAMPING   = 0.85;

    // 1. Coulomb repulsion — every pair
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        _delta.subVectors(nodes[i].pos, nodes[j].pos);
        const dist = Math.max(_delta.length(), 0.1);
        _delta.normalize().multiplyScalar(REPULSION / (dist * dist));
        nodes[i].vel.add(_delta);
        nodes[j].vel.sub(_delta);
      }
    }

    // 2. Hooke attraction — linked pairs only
    for (const link of links) {
      const src = nodes.find((n) => n.id === link.source)!;
      const tgt = nodes.find((n) => n.id === link.target)!;
      _delta.subVectors(tgt.pos, src.pos);
      const dist = _delta.length();
      _delta.normalize().multiplyScalar((dist - 3.0) * SPRING_K * link.strength);
      src.vel.add(_delta);
      tgt.vel.sub(_delta);
    }

    // 3. Central gravity — prevents drift
    for (const n of nodes) {
      _gravity.subVectors(_origin, n.pos).multiplyScalar(0.01);
      n.vel.add(_gravity);
      n.vel.multiplyScalar(DAMPING);
      n.pos.add(n.vel);
    }

    // 4. Sync mesh positions
    if (nodesGroupRef.current) {
      nodes.forEach((n, i) => {
        nodesGroupRef.current!.children[i]?.position.copy(n.pos);
      });
    }

    // 5. Update laser-line buffer
    if (linesRef.current) {
      links.forEach((link, i) => {
        const s = nodes.find((n) => n.id === link.source)!.pos;
        const t = nodes.find((n) => n.id === link.target)!.pos;
        linePositions[i * 6]     = s.x; linePositions[i * 6 + 1] = s.y; linePositions[i * 6 + 2] = s.z;
        linePositions[i * 6 + 3] = t.x; linePositions[i * 6 + 4] = t.y; linePositions[i * 6 + 5] = t.z;
      });
      (linesRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Laser connections — caught by Bloom in GlobalCanvas */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={links.length * 2}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Dream orbs */}
      <group ref={nodesGroupRef}>
        {nodes.map((node) => {
          const isSelected = activeNodeId === node.id;
          return (
            <group
              key={node.id}
              onPointerDown={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation();
                setActiveNode(isSelected ? null : node);
              }}
            >
              {/* Outer glow layer */}
              <mesh>
                <sphereGeometry args={[node.size, 24, 24]} />
                <meshBasicMaterial
                  color={node.color}
                  transparent
                  opacity={isSelected ? 0.8 : 0.28}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
              {/* Hot white core — blooms in the post-processing pipeline */}
              <mesh>
                <sphereGeometry args={[node.size * 0.3, 16, 16]} />
                <meshBasicMaterial
                  color="#ffffff"
                  transparent
                  opacity={isSelected ? 1.0 : 0.7}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

// ─── Scene root (exported for GlobalCanvas lazy import) ───────────────────────

export default function DreamClusterMapScene() {
  return (
    <group>
      <Stars />
      <PhysicsCluster />
    </group>
  );
}
