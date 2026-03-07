/**
 * ShadowQuoteCard
 *
 * A quiet, elegant card that surfaces shadow quotes.
 * Visual: obsidian glass with jewel-tone aura highlights.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Canvas, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import { ShadowQuote, ShadowTone } from '../../services/astrology/shadowQuotes';

interface ShadowQuoteCardProps {
  quote: ShadowQuote;
  variant?: 'inline' | 'standalone' | 'footer';
  animationDelay?: number;
  onLongPress?: () => void;
  isCloseQuote?: boolean;
}

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  amethyst: '#9D76C1',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

const TONE_CONFIG: Record<ShadowTone, { colors: [string, string]; highlight: string }> = {
  awareness: { 
    colors: ['rgba(157, 118, 193, 0.15)', 'rgba(2,8,23,0.50)'], // Amethyst
    highlight: 'rgba(157, 118, 193, 0.3)' 
  },
  protective: { 
    colors: ['rgba(232, 214, 174, 0.12)', 'rgba(2,8,23,0.50)'], // Gold
    highlight: 'rgba(232,214,174,0.25)' 
  },
  tension: { 
    colors: ['rgba(205, 127, 93, 0.15)', 'rgba(2,8,23,0.50)'], // Copper
    highlight: 'rgba(205, 127, 93, 0.3)' 
  },
  release: { 
    colors: ['rgba(110, 191, 139, 0.12)', 'rgba(2,8,23,0.50)'], // Emerald
    highlight: 'rgba(110, 191, 139, 0.3)' 
  },
};

export default function ShadowQuoteCard({
  quote,
  variant = 'standalone',
  animationDelay = 0,
  onLongPress,
  isCloseQuote = false,
}: ShadowQuoteCardProps) {
  const tone = TONE_CONFIG[quote.tone] || TONE_CONFIG.awareness;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLongPress?.();
  };

  if (variant === 'inline') {
    return (
      <Animated.View
        entering={FadeIn.delay(animationDelay).duration(1000)}
        style={styles.inlineContainer}
      >
        <Text style={styles.inlineText}>"{quote.text}"</Text>
      </Animated.View>
    );
  }

  if (variant === 'footer') {
    return (
      <Animated.View
        entering={FadeIn.delay(animationDelay).duration(1200)}
        style={styles.footerContainer}
      >
        <View style={[styles.footerDivider, { overflow: 'hidden' }]}>
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFillObject}>
              <RoundedRect x={0} y={0} width={60} height={1} r={0}>
                <LinearGradient start={vec(0, 0)} end={vec(60, 0)} colors={['rgba(255,255,255,0)', PALETTE.glassHighlight, 'rgba(255,255,255,0)']} />
              </RoundedRect>
            </Canvas>
          </View>
        </View>
        <Text style={styles.footerText}>"{quote.text}"</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.delay(animationDelay).duration(800)}>
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
      >
        <View
          style={[
            styles.card,
            { borderColor: PALETTE.glassBorder, borderTopColor: tone.highlight },
            isCloseQuote && styles.closeCard,
          ]}
        >
          <View style={[StyleSheet.absoluteFillObject, { borderRadius: 24, overflow: 'hidden' }]} pointerEvents="none">
            <Canvas style={StyleSheet.absoluteFillObject}>
              <RoundedRect x={0} y={0} width={400} height={400} r={24}>
                <LinearGradient start={vec(0, 0)} end={vec(0, 400)} colors={tone.colors} />
              </RoundedRect>
            </Canvas>
          </View>
          <Text style={[
            styles.quoteText,
            isCloseQuote && styles.closeQuoteText,
          ]}>
            "{quote.text}"
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function ShadowQuoteInline({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(1000)} style={styles.inlineContainer}>
      <Text style={styles.inlineText}>"{text}"</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  closeCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  quoteText: {
    fontSize: 17,
    color: PALETTE.textMain,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    opacity: 0.95,
    letterSpacing: 0.2,
  },
  closeQuoteText: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
  },
  inlineContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inlineText: {
    fontSize: 15,
    color: theme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    opacity: 0.8,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  footerDivider: {
    width: 60,
    height: 1,
    marginBottom: 24,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 14,
    color: theme.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    opacity: 0.7,
  },
});
