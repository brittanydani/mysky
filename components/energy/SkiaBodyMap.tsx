import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import {
  Canvas,
  Path,
  RadialGradient,
  vec,
  Group,
  Skia,
  SweepGradient,
  mix,
} from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSomaticContext } from '../../context/SomaticContext';

const { width } = Dimensions.get('window');
const CANVAS_WIDTH = width - 40;
const CANVAS_HEIGHT = 500;
const CENTER = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

// A stylized, abstract silhouette representing the body
const bodyPath = Skia.Path.Make();
bodyPath.addRoundRect(
  Skia.XYWHRect(CENTER.x - 60, CENTER.y - 180, 120, 360),
  60,
  60
);

export type TensionPoint = {
  x: number;
  y: number;
  type: 'tension' | 'flow' | 'vitality';
};

const COLORS = {
  flow: ['#D4AF37', '#FFD700', 'transparent'], // Gold
  tension: ['#B87333', '#CD7F32', 'transparent'], // Copper
  vitality: ['#00FF7F', '#50C878', 'transparent'], // Emerald
};

export default function SkiaBodyMap() {
  const { addTensionNode } = useSomaticContext();
  const points = useSharedValue<TensionPoint[]>([]);
  const pulse = useSharedValue(0);

  useEffect(() => {
    // Start pulsing animation
    pulse.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseRadius = useDerivedValue(() => {
    return mix(pulse.value, 40, 60);
  });

  const gesture = Gesture.Pan()
    .onBegin((e) => {
      // For demonstration, cycling through states based on y-position or random
      const type = e.y < CANVAS_HEIGHT / 3 ? 'vitality' : e.y < (CANVAS_HEIGHT * 2) / 3 ? 'flow' : 'tension';
      
      const newNode: TensionPoint = { x: e.x, y: e.y, type };
      points.value = [...points.value, newNode];
      
      // We pass the normalized Y point (0.0 to 1.0) and intensity
      runOnJS(addTensionNode)({ 
        x: e.x, 
        y: e.y / CANVAS_HEIGHT, 
        type, 
        intensity: type === 'tension' ? 2 : 1 
      });
    })
    .onUpdate((e) => {
      // allow drawing?
    });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={styles.canvasContainer}>
          <Canvas style={styles.canvas}>
            {/* Background / Body Outline */}
            <Group>
              <Path path={bodyPath} color="#1A1A1A" />
              <Path path={bodyPath} color="#2A2A2A" style="stroke" strokeWidth={2} />
            </Group>

            {/* Render painted points */}
            {points.value.map((point, index) => (
              <Group key={index}>
                <Path path={bodyPath}>
                  <RadialGradient
                    c={vec(point.x, point.y)}
                    r={pulseRadius}
                    colors={COLORS[point.type]}
                  />
                </Path>
              </Group>
            ))}
          </Canvas>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 24,
    padding: 20,
  },
  canvasContainer: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  canvas: {
    flex: 1,
  },
});
