/**
 * PhoneFrame
 *
 * Renders a realistic iPhone 15 Pro-style frame around the app screenshot.
 * - Black bezel with rounded corners
 * - Dynamic Island notch
 * - Subtle drop shadow for depth
 *
 * The `children` slot is where the actual app UI screenshot content goes.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, RoundedRect, BlurMask } from '@shopify/react-native-skia';
import { SCREENSHOT } from './config';

interface Props {
  /** Width of the phone frame (outer) */
  frameWidth: number;
  /** Height of the phone frame (outer) */
  frameHeight: number;
  /** Children rendered inside the phone screen area */
  children: React.ReactNode;
}

// iPhone 15 Pro proportions
const BEZEL = 12;
const CORNER_RADIUS = 48;
const DYNAMIC_ISLAND_WIDTH_RATIO = 0.27;
const DYNAMIC_ISLAND_HEIGHT = 32;
const DYNAMIC_ISLAND_RADIUS = 16;

export default function PhoneFrame({ frameWidth, frameHeight, children }: Props) {
  const screenWidth = frameWidth - BEZEL * 2;
  const screenHeight = frameHeight - BEZEL * 2;
  const dynamicIslandWidth = frameWidth * DYNAMIC_ISLAND_WIDTH_RATIO;

  return (
    <View style={[styles.container, { width: frameWidth, height: frameHeight }]}>
      {/* Shadow layer behind the frame */}
      <Canvas
        style={[
          styles.shadowCanvas,
          {
            width: frameWidth + 80,
            height: frameHeight + 80,
            left: -40,
            top: -40 + SCREENSHOT.phoneShadowOffsetY,
          },
        ]}
      >
        <RoundedRect
          x={40}
          y={40}
          width={frameWidth}
          height={frameHeight}
          r={CORNER_RADIUS}
          color="#000000"
          opacity={SCREENSHOT.phoneShadowOpacity}
        >
          <BlurMask blur={SCREENSHOT.phoneShadowBlur} style="normal" />
        </RoundedRect>
      </Canvas>

      {/* Phone bezel */}
      <View
        style={[
          styles.bezel,
          {
            width: frameWidth,
            height: frameHeight,
            borderRadius: CORNER_RADIUS,
          },
        ]}
      >
        {/* Screen area */}
        <View
          style={[
            styles.screen,
            {
              width: screenWidth,
              height: screenHeight,
              borderRadius: CORNER_RADIUS - 6,
            },
          ]}
        >
          {/* Dynamic Island */}
          <View
            style={[
              styles.dynamicIsland,
              {
                width: dynamicIslandWidth,
                height: DYNAMIC_ISLAND_HEIGHT,
                borderRadius: DYNAMIC_ISLAND_RADIUS,
              },
            ]}
          />

          {/* App content goes here */}
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  shadowCanvas: {
    position: 'absolute',
  },
  bezel: {
    backgroundColor: '#000000',
    padding: BEZEL,
    overflow: 'hidden',
  },
  screen: {
    flex: 1,
    backgroundColor: '#020817',
    overflow: 'hidden',
    alignItems: 'center',
  },
  dynamicIsland: {
    backgroundColor: '#000000',
    marginTop: 12,
    zIndex: 10,
  },
  content: {
    flex: 1,
    width: '100%',
  },
});
