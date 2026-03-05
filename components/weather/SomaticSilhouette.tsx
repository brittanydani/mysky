import React, { useState } from 'react';
import { View } from 'react-native';
import { Canvas, Circle, Path, Skia, Blur, Group } from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

interface SomaticNode {
  x: number;
  y: number;
  intensity: number;
}

interface SomaticSilhouetteProps {
  size?: number;
}

export default function SomaticSilhouette({ size = 300 }: SomaticSilhouetteProps) {
  const [nodes, setNodes] = useState<SomaticNode[]>([]);

  // Simple touch interaction to paint 'heat' nodes
  const gesture = Gesture.Pan()
    .onBegin((e) => {
      setNodes((prev) => [...prev, { x: e.x, y: e.y, intensity: 1 }]);
    })
    .onUpdate((e) => {
      setNodes((prev) => [...prev, { x: e.x, y: e.y, intensity: 1 }]);
    });

  // A basic placeholder shape for the silhouette
  const silhouettePath = Skia.Path.Make();
  const cx = size / 2;
  const cy = size / 2;
  
  // Outer pill shape
  silhouettePath.addRoundRect(
    Skia.XYWHRect(size * 0.25, size * 0.1, size * 0.5, size * 0.8),
    size * 0.25,
    size * 0.25
  );

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width: size, height: size, overflow: 'hidden' }}>
        <Canvas style={{ width: size, height: size }}>
          {/* Base Silhouette */}
          <Path path={silhouettePath} color="#2A2A35" />
          
          {/* Heat map nodes */}
          <Group>
            <Blur blur={12} />
            {nodes.map((node, i) => (
              <Circle
                key={i}
                cx={node.x}
                cy={node.y}
                r={20}
                color="rgba(255, 120, 150, 0.4)"
              />
            ))}
          </Group>
        </Canvas>
      </View>
    </GestureDetector>
  );
}
