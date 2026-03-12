/**
 * NeonWaveChart.tsx
 * MySky — Luminous Terrain Chart (React Three Fiber / expo-gl)
 *
 * Architecture:
 *   • Three series: Mood (#FFCC00), Energy (#00FFFF), Stress (#FF003C)
 *   • Each series is a LayeredRibbonCluster: 4 concentric tube layers
 *       1. Core       radius 0.02  opacity 0.90
 *       2. Tight glow radius 0.12  opacity 0.40
 *       3. Silk band  radius 0.40  opacity 0.12
 *       4. Haze       radius 0.80  opacity 0.04
 *   • Organic Y breathing: Math.sin(i * 0.8 + phase) * 0.8 on data Y
 *   • All layers: meshBasicMaterial + THREE.AdditiveBlending — no GLSL
 *   • Scrub beam / gesture / tooltip identical to previous version
 *
 * No GLSL  ·  No window.devicePixelRatio  ·  No GlobalCanvas  ·  No drei
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { DailyCheckIn } from '../../services/patterns/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levelToNum(level: 'low' | 'medium' | 'high'): number {
  return level === 'low' ? 2 : level === 'medium' ? 5 : 9;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const HALF_W = 5.6;   // half the 3D chart width
const CAM_Z  = 8.5;

function indexToX(i: number, total: number): number {
  if (total <= 1) return 0;
  return -HALF_W + (i / (total - 1)) * (HALF_W * 2);
}

function valToY(v: number): number {
  // 1–10 → -2.4 to +2.4
  return ((v - 1) / 9) * 4.8 - 2.4;
}

// ─── Tube layer definitions ───────────────────────────────────────────────────

const TUBE_LAYERS = [
  { radius: 0.02, opacity: 0.90 },
  { radius: 0.12, opacity: 0.40 },
  { radius: 0.40, opacity: 0.12 },
  { radius: 0.80, opacity: 0.04 },
] as const;

// ─── Layered Ribbon Cluster ───────────────────────────────────────────────────

interface RibbonProps {
  values:   number[];
  hexColor: string;
  zOffset:  number;
  phase:    number;
  speed:    number;
}

function LayeredRibbonCluster({ values, hexColor, zOffset, phase, speed }: RibbonProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { curve, dotPositions } = useMemo(() => {
    const pts = values.map((v, i) => new THREE.Vector3(
      indexToX(i, values.length),
      valToY(v) + Math.sin(i * 0.8 + phase) * 0.8,
      zOffset,
    ));
    return {
      curve:        new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5),
      dotPositions: pts,
    };
  }, [values, zOffset, phase]);

  const tubeGeos = useMemo(
    () => TUBE_LAYERS.map(l => new THREE.TubeGeometry(curve, 100, l.radius, 10, false)),
    [curve],
  );

  const colorObj = useMemo(() => new THREE.Color(hexColor), [hexColor]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * speed + phase) * 0.10;
    }
  });

  return (
    <group ref={groupRef}>
      {TUBE_LAYERS.map((layer, i) => (
        <mesh key={i} geometry={tubeGeos[i]}>
          <meshBasicMaterial
            color={colorObj}
            transparent
            opacity={layer.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {dotPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <sphereGeometry args={[0.13, 10, 10]} />
            <meshBasicMaterial
              color={hexColor}
              transparent
              opacity={0.38}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={1.0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Scrub Beam ───────────────────────────────────────────────────────────────

interface BeamProps {
  indexRef: React.MutableRefObject<number>;
  total:    number;
}

function ScrubBeam({ indexRef, total }: BeamProps) {
  const beamRef  = useRef<THREE.Mesh>(null);
  const currentX = useRef(0);

  useFrame(() => {
    if (!beamRef.current) return;
    const targetX = indexToX(indexRef.current, total);
    currentX.current = THREE.MathUtils.lerp(currentX.current, targetX, 0.18);
    beamRef.current.position.x = currentX.current;
  });

  return (
    <mesh ref={beamRef} position={[0, 0, 1.5]}>
      <cylinderGeometry args={[0.025, 0.025, 10, 8]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Starfield ────────────────────────────────────────────────────────────────

function Stars() {
  const positions = useMemo(() => {
    const N   = 220;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (Math.sin(i * 2.13) * 0.5 + 0.5) * 22 - 11;
      pos[i * 3 + 1] = (Math.sin(i * 3.71) * 0.5 + 0.5) * 14 -  7;
      pos[i * 3 + 2] = (Math.sin(i * 1.37) * 0.5 + 0.5) *  6 -  9;
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={220} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#8899BB"
        size={0.05}
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Series config ────────────────────────────────────────────────────────────

const SERIES = [
  { key: 'stress' as const, color: '#FF003C', zOffset: -0.5, phase: 1.2, speed: 0.45 },
  { key: 'energy' as const, color: '#00FFFF', zOffset:  0.0, phase: 0.0, speed: 0.60 },
  { key: 'mood'   as const, color: '#FFCC00', zOffset:  0.5, phase: 2.4, speed: 0.38 },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NeonWaveChartProps {
  checkIns: DailyCheckIn[];
  width:    number;
  height?:  number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NeonWaveChart({ checkIns, width, height = 240 }: NeonWaveChartProps) {
  const displayed = useMemo(
    () => [...checkIns].sort((a, b) => a.date.localeCompare(b.date)).slice(-14),
    [checkIns],
  );

  const seriesValues = useMemo(() => ({
    mood:   displayed.map(c => c.moodScore),
    energy: displayed.map(c => levelToNum(c.energyLevel)),
    stress: displayed.map(c => levelToNum(c.stressLevel)),
  }), [displayed]);

  const total = displayed.length;

  // Active index propagated to 3D beam without re-renders
  const scrubIndexRef = useRef(Math.max(0, total - 1));
  const [activeIdx, setActiveIdx]         = useState(Math.max(0, total - 1));
  const tooltipOpacity                    = useSharedValue(0);
  const tooltipLeft                       = useSharedValue(width / 2 - 72);

  const updateScrub = (touchX: number) => {
    'worklet';
    const clamped = Math.max(0, Math.min(width, touchX));
    const idx     = Math.round((clamped / width) * (total - 1));
    const safe    = Math.max(0, Math.min(total - 1, idx));
    scrubIndexRef.current = safe;
    tooltipLeft.value = Math.max(4, Math.min(width - 148, clamped - 72));
    runOnJS(setActiveIdx)(safe);
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onBegin(e => { 'worklet'; tooltipOpacity.value = withSpring(1); updateScrub(e.x); })
    .onChange(e => { 'worklet'; updateScrub(e.x); })
    .onFinalize(() => { 'worklet'; tooltipOpacity.value = withSpring(0); });

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity:   tooltipOpacity.value,
    transform: [{ translateX: tooltipLeft.value }],
  }));

  const active = displayed[activeIdx];
  const dateLabel = active
    ? new Date(active.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '';

  // X-axis labels: show first, middle, last
  const axisLabels = useMemo(() => {
    if (total === 0) return [];
    const indices = [0, Math.floor((total - 1) / 2), total - 1].filter(
      (v, i, arr) => arr.indexOf(v) === i,
    );
    return indices.map(i => ({
      label: new Date(displayed[i].date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      pct:   total === 1 ? 0.5 : i / (total - 1),
    }));
  }, [displayed, total]);

  if (total < 2) {
    return (
      <View style={[styles.root, { width, height, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyTxt}>Log more check-ins to see your chart</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { width, height }]}>
      {/* ── 3D layer (non-interactive) ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Canvas camera={{ position: [0, 0, CAM_Z], fov: 55 }}>
          <fog attach="fog" args={['#02010A', 6, 22]} />
          <Stars />
          {SERIES.map(s => (
            <LayeredRibbonCluster
              key={s.key}
              values={seriesValues[s.key]}
              hexColor={s.color}
              zOffset={s.zOffset}
              phase={s.phase}
              speed={s.speed}
            />
          ))}
          <ScrubBeam indexRef={scrubIndexRef} total={total} />
        </Canvas>
      </View>

      {/* ── Gesture & UI layer ── */}
      <GestureDetector gesture={panGesture}>
        <View style={StyleSheet.absoluteFill}>
          {/* Floating tooltip */}
          <Animated.View style={[styles.tooltip, tooltipStyle]} pointerEvents="none">
            <Text style={styles.tooltipDate}>{dateLabel}</Text>
            <View style={styles.tooltipRow}>
              <View style={[styles.dot, { backgroundColor: '#FFCC00' }]} />
              <Text style={styles.tooltipLbl}>Mood</Text>
              <Text style={[styles.tooltipVal, { color: '#FFCC00' }]}>
                {active ? active.moodScore.toFixed(1) : '—'}
              </Text>
            </View>
            <View style={styles.tooltipRow}>
              <View style={[styles.dot, { backgroundColor: '#00FFFF' }]} />
              <Text style={styles.tooltipLbl}>Energy</Text>
              <Text style={[styles.tooltipVal, { color: '#00FFFF' }]}>
                {active ? active.energyLevel : '—'}
              </Text>
            </View>
            <View style={styles.tooltipRow}>
              <View style={[styles.dot, { backgroundColor: '#FF003C' }]} />
              <Text style={styles.tooltipLbl}>Stress</Text>
              <Text style={[styles.tooltipVal, { color: '#FF003C' }]}>
                {active ? active.stressLevel : '—'}
              </Text>
            </View>
          </Animated.View>

          {/* X-axis labels */}
          <View style={[styles.axis, { width }]} pointerEvents="none">
            {axisLabels.map((item, i) => (
              <Text
                key={i}
                style={[styles.axisLbl, { left: item.pct * (width - 48) }]}
              >
                {item.label}
              </Text>
            ))}
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#02010A',
  },
  emptyTxt: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
  },
  tooltip: {
    position:        'absolute',
    top:             18,
    width:           144,
    backgroundColor: 'rgba(12,14,30,0.88)',
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.12)',
    padding:         12,
  },
  tooltipDate: {
    color:        'rgba(255,255,255,0.5)',
    fontSize:     10,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tooltipRow: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   5,
  },
  dot: {
    width:        7,
    height:       7,
    borderRadius: 3.5,
    marginRight:  7,
  },
  tooltipLbl: {
    flex:     1,
    color:    '#ffffff',
    fontSize: 12,
  },
  tooltipVal: {
    fontSize:   13,
    fontWeight: '700',
  },
  axis: {
    position: 'absolute',
    bottom:   6,
    height:   18,
  },
  axisLbl: {
    position:  'absolute',
    color:     'rgba(255,255,255,0.3)',
    fontSize:  10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
