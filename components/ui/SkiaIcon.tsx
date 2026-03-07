import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Canvas, Path, Group } from '@shopify/react-native-skia';

// A mapped subset of standard Material/Feather-like SVG paths normalized to a 24x24 viewBox.
// This replaces Ionicons for decorative structural rendering.
const SKIA_ICON_PATHS: Record<string, string> = {
  'flame': 'M12 2c0 0-7 5-7 12 0 4 3.13 8 7 8s7-4 7-8c0-7-7-12-7-12zm0 16c-1.5 0-2.5-1.5-2.5-3 0-2 2.5-5 2.5-5s2.5 3 2.5 5c0 1.5-1 3-2.5 3z',
  'trophy': 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1zM12 14c-1.66 0-3-1.34-3-3V5h6v6c0 1.66-1.34 3-3 3z',
  'checkmark-circle': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  'arrow-forward': 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z',
  'calendar-outline': 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z',
  'trending-up': 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z',
  'trending-down': 'M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z',
  'sparkles': 'M12 2l1.5 7.5L21 11l-7.5 1.5L12 20l-1.5-7.5L3 11l7.5-1.5Zm-6 2l.5 2.5L9 7l-2.5.5L6 10l-.5-2.5L3 7l2.5-.5ZM18 14l.5 2.5L21 17l-2.5.5L18 20l-.5-2.5L15 17l2.5-.5Z',
  'sparkles-outline': 'M12 2l1.5 7.5L21 11l-7.5 1.5L12 20l-1.5-7.5L3 11l7.5-1.5Zm-6 2l.5 2.5L9 7l-2.5.5L6 10l-.5-2.5L3 7l2.5-.5ZM18 14l.5 2.5L21 17l-2.5.5L18 20l-.5-2.5L15 17l2.5-.5Z',
  'compass-outline': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-3.5l1.5-7.5 7.5-1.5-1.5 7.5-7.5 1.5zm4.01-6.49l-1.12 3.35 3.35-1.12-1.12-3.35-1.11 1.12z',
  'grid-outline': 'M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z',
  'pulse': 'M3 13h2.5l2-5 3.5 10 3-8 1.5 3H21v-2h-4.5l-2-4-3.5 10-3-8-1.5 3H3z',
  'planet': 'M12 2C6.48 2 2 6.48 2 12c0 2.22.73 4.27 1.96 5.91l-1.34 1.34 1.41 1.41 1.34-1.34C7.02 20.93 9.38 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.41 3.59-8 8-8 1.83 0 3.51.62 4.86 1.66l-11.2 11.2C4.62 15.51 4 13.83 4 12zm8 8c-1.83 0-3.51-.62-4.86-1.66l11.2-11.2C19.38 8.49 20 10.17 20 12c0 4.41-3.59 8-8 8z',
  'person': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  'information-circle-outline': 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  'time-outline': 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  'book-outline': 'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z',
  'heart': 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
};

export interface SkiaIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const SkiaIcon = ({ name, size = 24, color = '#FFFFFF', style }: SkiaIconProps) => {
  // If the specific icon is missing from our curated set, fall back to a star/sparkle gracefully
  const pathData = SKIA_ICON_PATHS[name] || SKIA_ICON_PATHS['sparkles'];
  const scale = size / 24;

  return (
    <View style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Canvas style={{ width: size, height: size }}>
        <Group transform={[{ scale }]}>
          <Path path={pathData} color={color} style="fill" />
        </Group>
      </Canvas>
    </View>
  );
};
