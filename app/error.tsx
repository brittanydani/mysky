// app/error.tsx
// MySky — Global Error Boundary
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged flat inline styles and generic backgrounds.
// 2. Implemented "Midnight Slate" card anchor floating in deep space.
// 3. Added a subtle "Ember" (Red) atmospheric wash to signal interruption.
// 4. Upgraded the recovery action to a Tactile Hardware button.

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { logger } from '../utils/logger';
import { type AppTheme } from '../constants/theme';
import { useThemedStyles } from '../context/ThemeContext';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { VelvetGlassSurface } from '../components/ui/VelvetGlassSurface';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { MetallicText } from '../components/ui/MetallicText';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Lunar Gold
  ember: '#DC5050',      // Error / Interruption
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
};

export default function GlobalError({ error, retry }: { error: Error; retry?: () => void }) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    logger.error('Global error boundary caught error', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, [error]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Subtle Ember wash to signal an interruption */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(220, 80, 80, 0.12)' }]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerWrap}>
          
          <VelvetGlassSurface style={[styles.errorCard, styles.velvetBorder]} intensity={45}>
            <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
            
            <View style={styles.iconWrap}>
              <MetallicIcon name="warning-outline" size={32} color={PALETTE.ember} />
            </View>

            <Text style={styles.title}>System Interruption</Text>
            
            <Text style={styles.subtitle}>
              We encountered an unexpected anomaly. If this persists, please force-close the app and reopen to recalibrate.
            </Text>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                if (retry) {
                  retry();
                } else {
                  router.replace('/(tabs)/home' as Href);
                }
              }}
              style={styles.actionBtn}
              accessibilityRole="button"
            >
              <LinearGradient colors={['rgba(212, 175, 55, 0.12)', 'rgba(0, 0, 0, 0.3)']} style={StyleSheet.absoluteFill} />
              <MetallicIcon name="refresh-outline" size={18} variant="gold" />
              <MetallicText style={styles.actionBtnText} variant="gold">
                {retry ? 'Recalibrate' : 'Return Home'}
              </MetallicText>
            </Pressable>

          </VelvetGlassSurface>

        </View>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background, // Absolute Midnight
  },
  safeArea: {
    flex: 1,
  },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  errorCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(220, 80, 80, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(220, 80, 80, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: theme.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    overflow: 'hidden',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
