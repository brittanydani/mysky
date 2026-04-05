/**
 * ScreenshotComposition
 *
 * The master composition component that assembles a single App Store screenshot.
 *
 * Visual hierarchy (top to bottom):
 * 1. Headline (Playfair Display or Georgia serif)
 * 2. Phone frame with app UI inside
 * 3. Short benefit statement (Inter)
 *
 * Optionally adds the tagline on Screenshot 1.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import ScreenshotBackground from './ScreenshotBackground';
import PhoneFrame from './PhoneFrame';
import FeatureHighlight from './FeatureHighlight';
import NebulaArc from './NebulaArc';
import { SCREENSHOT, TYPOGRAPHY, TAGLINE, type ScreenshotConfig } from './config';

interface Props {
  config: ScreenshotConfig;
  /** The actual app screen content to show inside the phone frame */
  children: React.ReactNode;
  /** Optional: override screenshot dimensions for device preview */
  previewScale?: number;
}

export default function ScreenshotComposition({
  config,
  children,
  previewScale,
}: Props) {
  // Use device dimensions for preview, or full 1290×2796 for export
  const deviceWidth = Dimensions.get('window').width;
  const scale = previewScale ?? deviceWidth / SCREENSHOT.width;
  const w = SCREENSHOT.width * scale;
  const h = SCREENSHOT.height * scale;

  // Phone frame dimensions
  const phoneHeight = h * SCREENSHOT.phoneScale;
  const phoneWidth = phoneHeight * (1290 / 2796); // iPhone aspect ratio

  // Typography scaling
  const headlineSize = TYPOGRAPHY.headline.fontSize * scale;
  const subtextSize = TYPOGRAPHY.subtext.fontSize * scale;
  const letterSpacing = TYPOGRAPHY.headline.letterSpacing * scale;

  // Layout zones
  const headlineZoneHeight = h * 0.18;
  const phoneZoneTop = headlineZoneHeight;
  const subtextZoneTop = phoneZoneTop + phoneHeight + h * 0.02;

  return (
    <View style={[styles.container, { width: w, height: h }]}>
      {/* Background: obsidian gradient + nebula + stars */}
      <ScreenshotBackground width={w} height={h} config={config} />

      {/* Feature highlight glow behind phone area — enhanced gold glow for #1 */}
      <FeatureHighlight
        cx={w / 2}
        cy={phoneZoneTop + phoneHeight * 0.45}
        radius={config.id === 1 ? phoneWidth * 0.55 : phoneWidth * 0.4}
        color={config.accentColor}
        opacity={config.id === 1 ? 0.15 : 0.2}
        width={w}
        height={h}
      />

      {/* Nebula arc — cinematic framing behind the phone (Screenshot 1 only) */}
      {config.id === 1 && (
        <NebulaArc
          width={w}
          height={h}
          phoneCenterY={phoneZoneTop + phoneHeight * 0.45}
          color={config.accentColor}
          opacity={0.06}
        />
      )}

      {/* Headline */}
      <View style={[styles.headlineZone, { height: headlineZoneHeight, paddingTop: h * 0.06 }]}>
        <Text
          style={[
            styles.headline,
            {
              fontSize: headlineSize,
              letterSpacing,
              fontFamily: Platform.select({
                ios: 'Georgia',
                default: 'serif',
              }),
            },
          ]}
        >
          {config.headline}
        </Text>
      </View>

      {/* Phone frame with app content */}
      <View style={[styles.phoneZone, { top: phoneZoneTop }]}>
        <PhoneFrame frameWidth={phoneWidth} frameHeight={phoneHeight}>
          {children}
        </PhoneFrame>
      </View>

      {/* Subtext */}
      <View style={[styles.subtextZone, { top: subtextZoneTop }]}>
        <Text
          style={[
            styles.subtext,
            {
              fontSize: subtextSize,
              fontFamily: Platform.select({
                ios: 'System',
                default: 'sans-serif',
              }),
            },
          ]}
        >
          {config.subtext}
        </Text>

        {/* Tagline — only on first screenshot */}
        {config.id === 1 && (
          <Text
            style={[
              styles.tagline,
              {
                fontSize: subtextSize * 0.8,
                marginTop: h * 0.02,
                fontFamily: Platform.select({
                  ios: 'Georgia',
                  default: 'serif',
                }),
              },
            ]}
          >
            {TAGLINE}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#05060A',
    overflow: 'hidden',
  },
  headlineZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headline: {
    color: TYPOGRAPHY.headline.color,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: undefined, // Let RN calculate
  },
  phoneZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  subtextZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: '8%',
    zIndex: 10,
  },
  subtext: {
    color: TYPOGRAPHY.subtext.color,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: undefined,
  },
  tagline: {
    color: TYPOGRAPHY.headline.luxuryAccent,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.7,
  },
});
