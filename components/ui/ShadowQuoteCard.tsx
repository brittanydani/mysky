/**
 * ShadowQuoteCard
 *
 * A quiet, elegant card that surfaces shadow quotes.
 * Visual: obsidian glass with jewel-tone aura highlights.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { type AppTheme } from '../../constants/theme';
import { ShadowQuote, ShadowTone } from '../../services/astrology/shadowQuotes';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

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
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  amethyst: '#9D76C1',
  textMain: '#FFFFFF',
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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
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
        <View style={[styles.footerDivider, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)' }]} />
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
            { borderColor: theme.cardBorder, borderTopColor: tone.highlight, backgroundColor: tone.colors[0] },
            isCloseQuote && styles.closeCard,
          ]}
        >
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
  const styles = useThemedStyles(createStyles);
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(1000)} style={styles.inlineContainer}>
      <Text style={styles.inlineText}>"{text}"</Text>
    </Animated.View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  closeCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    backgroundColor: 'transparent',
  },
  quoteText: {
    fontSize: 17,
    color: theme.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
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
    textAlign: 'center',
    lineHeight: 24,
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
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.7,
  },
});
