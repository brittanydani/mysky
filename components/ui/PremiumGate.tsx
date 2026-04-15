/**
 * PremiumGate
 *
 * Unified visual language for premium-locked content across the app.
 * Renders children with a blur overlay + gold CTA when user is not premium.
 * Provides consistent premium gating UX regardless of screen.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { usePremium } from '../../context/PremiumContext';
import { MetallicText } from './MetallicText';
import { MetallicIcon } from './MetallicIcon';
import { useAppTheme } from '../../context/ThemeContext';

interface PremiumGateProps {
  children: React.ReactNode;
  /** Short feature name, e.g. "Dream Symbol Map" */
  feature?: string;
  /** Optional teaser line shown below the title */
  teaser?: string;
  /** If provided, renders this preview above the gate instead of blurred children */
  preview?: React.ReactNode;
  /** Override navigation target (defaults to premium page) */
  route?: Href;
}

export function PremiumGate({
  children,
  feature,
  teaser,
  preview,
  route,
}: PremiumGateProps) {
  const { isPremium } = usePremium();
  const theme = useAppTheme();
  const router = useRouter();

  if (isPremium) return <>{children}</>;

  const goldColor = '#D4AF37';

  return (
    <View style={styles.container}>
      {/* Blurred preview of actual content */}
      {preview ? (
        <View style={styles.previewArea}>{preview}</View>
      ) : (
        <View style={styles.blurWrapper}>
          <View style={styles.childrenContainer}>{children}</View>
          <BlurView
            intensity={theme.isDark ? 25 : 15}
            tint={theme.isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* CTA overlay */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.ctaOverlay}>
        <View style={[styles.ctaCard, { borderColor: `${goldColor}30` }]}>
          <MetallicIcon name="lock-closed-outline" size={18} color={goldColor} />
          <MetallicText
            style={styles.ctaTitle}
            color={goldColor}
          >
            {feature ? `Unlock ${feature}` : 'Unlock with Deeper Sky'}
          </MetallicText>
          {teaser && (
            <Text style={[styles.ctaTeaser, { color: theme.textSecondary }]}>
              {teaser}
            </Text>
          )}
          <Pressable
            style={[styles.ctaButton, { backgroundColor: `${goldColor}18`, borderColor: `${goldColor}40` }]}
            onPress={() => router.push(route ?? '/(tabs)/premium' as Href)}
            accessibilityRole="button"
            accessibilityLabel={feature ? `Unlock ${feature}` : 'View premium plans'}
          >
            <Text style={[styles.ctaButtonText, { color: goldColor }]}>
              View Plans
            </Text>
            <Ionicons name="arrow-forward" size={14} color={goldColor} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  blurWrapper: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  childrenContainer: {
    opacity: 0.4,
  },
  previewArea: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ctaCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 8,
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ctaTeaser: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 240,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
  },
  ctaButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
