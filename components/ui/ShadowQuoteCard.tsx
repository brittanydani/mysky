/**
 * ShadowQuoteCard
 *
 * A quiet, elegant card that surfaces shadow quotes.
 * Never dominates the screen. Always feels like truth arriving softly.
 *
 * Visual: faint plum/indigo gradient, serif italic text, no icon overkill.
 * Appears under transit headers, at journal prompt top, after journal save,
 * and as a footer on emotionally active days.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../../constants/theme';
import { ShadowQuote, ShadowTone } from '../../services/astrology/shadowQuotes';

interface ShadowQuoteCardProps {
  /** The shadow quote to display */
  quote: ShadowQuote;
  /** Visual variant: 'inline' blends into flow, 'standalone' is a full card */
  variant?: 'inline' | 'standalone' | 'footer';
  /** Optional: animate with delay (ms offset for staggered entry) */
  animationDelay?: number;
  /** Optional: callback when user long-presses (for sharing/saving) */
  onLongPress?: () => void;
  /** Optional: show as a close/completion quote (even softer) */
  isCloseQuote?: boolean;
}

// Subtle gradient tints per tone — barely visible, just enough presence
const TONE_GRADIENTS: Record<ShadowTone, [string, string]> = {
  awareness: ['rgba(61, 41, 82, 0.18)', 'rgba(61, 41, 82, 0.06)'],   // plum
  protective: ['rgba(201, 169, 98, 0.12)', 'rgba(201, 169, 98, 0.04)'], // warm gold
  tension: ['rgba(45, 58, 92, 0.20)', 'rgba(45, 58, 92, 0.06)'],     // indigo
  release: ['rgba(110, 191, 139, 0.10)', 'rgba(110, 191, 139, 0.03)'], // soft green
};

const TONE_BORDER: Record<ShadowTone, string> = {
  awareness: 'rgba(61, 41, 82, 0.25)',
  protective: 'rgba(201, 169, 98, 0.15)',
  tension: 'rgba(45, 58, 92, 0.25)',
  release: 'rgba(110, 191, 139, 0.15)',
};

export default function ShadowQuoteCard({
  quote,
  variant = 'standalone',
  animationDelay = 0,
  onLongPress,
  isCloseQuote = false,
}: ShadowQuoteCardProps) {
  const gradientColors = TONE_GRADIENTS[quote.tone];
  const borderColor = TONE_BORDER[quote.tone];

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLongPress?.();
  };

  if (variant === 'inline') {
    return (
      <Animated.View
        entering={FadeIn.delay(animationDelay).duration(800)}
        style={styles.inlineContainer}
      >
        <Text style={styles.inlineText}>"{quote.text}"</Text>
      </Animated.View>
    );
  }

  if (variant === 'footer') {
    return (
      <Animated.View
        entering={FadeIn.delay(animationDelay).duration(1000)}
        style={styles.footerContainer}
      >
        <View style={styles.footerDivider} />
        <Text style={styles.footerText}>"{quote.text}"</Text>
      </Animated.View>
    );
  }

  // Standalone card
  return (
    <Animated.View
      entering={FadeInDown.delay(animationDelay).duration(700)}
    >
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={({ pressed }) => [
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.card,
            { borderColor },
            isCloseQuote && styles.closeCard,
          ]}
        >
          <Text style={[
            styles.quoteText,
            isCloseQuote && styles.closeQuoteText,
          ]}>
            "{quote.text}"
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Minimal inline shadow quote — just the text, no card chrome.
 * Used at the top of journal prompts.
 */
export function ShadowQuoteInline({
  text,
  delay = 0,
}: {
  text: string;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(800)}
      style={styles.inlineContainer}
    >
      <Text style={styles.inlineText}>"{text}"</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // ── Standalone card ──
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeCard: {
    padding: theme.spacing.lg,
    borderWidth: 0,
    backgroundColor: 'rgba(30, 45, 71, 0.3)',
  },
  quoteText: {
    fontSize: 16,
    color: theme.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'serif',
    opacity: 0.92,
  },
  closeQuoteText: {
    fontSize: 15,
    opacity: 0.75,
    lineHeight: 24,
  },

  // ── Inline (journal prompt header) ──
  inlineContainer: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  inlineText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'serif',
    opacity: 0.8,
  },

  // ── Footer (emotionally active days) ──
  footerContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  footerDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    marginBottom: theme.spacing.lg,
  },
  footerText: {
    fontSize: 14,
    color: theme.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'serif',
    opacity: 0.7,
  },
});
