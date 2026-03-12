/**
 * components/ui/GlobalCanvas.tsx
 * MySky — Global WebGL Canvas Router
 *
 * Single <Canvas> for the entire app. Scenes are swapped via useSceneStore
 * (Zustand) so React Three Fiber never tears down the WebGL context between
 * tab transitions.
 *
 * Post-processing:
 *   EffectComposer wraps every scene — bloom luminance-threshold is tuned so
 *   only the hot-white cores and emissive materials catch the light bleed,
 *   giving the holographic glow without washing out dark UI.
 *
 * Performance:
 *   dpr={1} — post-processing on mobile requires DPR 1 to maintain 60 fps.
 *   React.lazy — 3D scene bundles are split so only the active scene is
 *   loaded into memory.
 */

import React, { Suspense, useState, useEffect } from 'react';
import { StyleSheet, View, AppState } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { PerformanceMonitor } from '@react-three/drei/native';
import { useSceneStore } from '@/store/sceneStore';

// Lazy-load scenes — only the active scene bundle is ever evaluated
const DreamClusterMapScene    = React.lazy(() => import('../3d/DreamClusterMap'));
const CinematicResonanceHelix = React.lazy(() => import('../3d/CinematicResonanceHelix'));
const EtherealPlasmaSphere    = React.lazy(() => import('../3d/EtherealPlasmaSphere'));

// Future scenes — uncomment as each is built
// const TodayWavesScene       = React.lazy(() => import('../3d/TodayWaves'));
// const PatternsOrbitScene    = React.lazy(() => import('../3d/PatternsOrbit'));

export function GlobalCanvas() {
  const activeScene = useSceneStore((s) => s.activeScene);
  const [appIsActive, setAppIsActive] = useState(true);
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setAppIsActive(state === 'active');
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 55 }}
        dpr={dpr}
        style={{ pointerEvents: 'auto' }}
        frameloop={appIsActive ? 'always' : 'never'}
      >
        <>
          <color attach="background" args={['#02010A']} />
          <fog attach="fog" args={['#02010A', 8, 30]} />

          <Suspense fallback={null}>
            {activeScene === 'DREAM_MAP'        && <DreamClusterMapScene />}
            {activeScene === 'RESONANCE_HELIX'  && <CinematicResonanceHelix />}
            {activeScene === 'CHECK_IN_SPHERE'  && <EtherealPlasmaSphere />}
            {/* TODAY_WAVES, PATTERNS_ORBIT rendered here once built */}
          </Suspense>

          {/* Auto-lowers pixel ratio to 0.8 when FPS drops below threshold on device */}
          <PerformanceMonitor onDecline={() => setDpr(0.8)} onIncline={() => setDpr(1)} />

          {/* Cinematic post-processing pipeline — shared across all scenes */}
          <EffectComposer enableNormalPass={false}>
            <Bloom
              luminanceThreshold={0.15}
              luminanceSmoothing={0.9}
              intensity={1.5}
              mipmapBlur
            />
          </EffectComposer>
        </>
      </Canvas>
    </View>
  );
}
