// NOTE: @shopify/react-native-skia is NOT imported at the top level.
// The Skia barrel initializes a Reanimated worklet runtime at module eval time,
// which crashes on iOS 26 New Architecture before React mounts.
// The canvas inner component is lazy-loaded so the Skia import only runs
// after the JS engine is fully bootstrapped and React is rendering.
import React, { useState } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

// Lazy inner component — only imports Skia when actually rendered.
const SkiaGradientCanvas = React.lazy(() =>
  import('./SkiaGradientCanvas')
);

export interface LinearGradientProps extends ViewProps {
  colors: string[];
  locations?: number[] | null;
  start?: { x: number; y: number } | [number, number];
  end?: { x: number; y: number } | [number, number];
  children?: React.ReactNode;
}

export const SkiaGradient: React.FC<LinearGradientProps> = ({
  colors,
  locations,
  start = { x: 0.5, y: 0 },
  end = { x: 0.5, y: 1 },
  style,
  children,
  ...rest
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  return (
    <View
      style={[style, { overflow: 'hidden' }]}
      onLayout={(e) => {
        setDimensions({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        });
      }}
      {...rest}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <React.Suspense fallback={null}>
            <SkiaGradientCanvas
              width={dimensions.width}
              height={dimensions.height}
              colors={colors}
              locations={locations}
              start={start}
              end={end}
            />
          </React.Suspense>
        </View>
      )}
      {children}
    </View>
  );
};
