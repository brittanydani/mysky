// components/PrivacyConsentModal.tsx

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import { MetallicIcon } from './ui/MetallicIcon';
import { GoldSubtitle } from './ui/GoldSubtitle';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

const PALETTE = {
  gold: '#D4AF37',
  atmosphere: '#A2C2E1',
  slateMid: '#2C3645',
  slateDeep: '#1A1E29',
};

interface PrivacyConsentModalProps {
  visible: boolean;
  onConsent: (granted: boolean) => void;
}

export default function PrivacyConsentModal({
  visible,
  onConsent,
}: PrivacyConsentModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [showDeclineHint, setShowDeclineHint] = useState(false);
  const declineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setShowDeclineHint(false);
      if (declineTimeoutRef.current) {
        clearTimeout(declineTimeoutRef.current);
        declineTimeoutRef.current = null;
      }
    }
  }, [visible]);

  const handleAccept = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onConsent(true);
  }, [onConsent]);

  const handleDecline = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setShowDeclineHint(true);
    declineTimeoutRef.current = setTimeout(() => {
      onConsent(false);
    }, 2000);
  }, [onConsent]);

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.container}>
        <SkiaDynamicCosmos />

        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
          <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
        </View>

        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.spacer} />
          </View>
          <View style={styles.titleArea}>
            <Text style={styles.headerTitle}>Privacy</Text>
            <GoldSubtitle style={styles.headerSubtitle}>Your Privacy Matters</GoldSubtitle>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(100).duration(600)}>
              <View style={styles.heroIconWrap}>
                <LinearGradient
                  colors={['rgba(162, 194, 225, 0.15)', 'rgba(162, 194, 225, 0.05)']}
                  style={styles.heroIconCircle}
                >
                  <MetallicIcon name="shield-checkmark-outline" size={64} variant="gold" />
                </LinearGradient>
              </View>

              <Text style={styles.introText}>
                MySky is built to help you reflect privately, not to turn your inner life into ad data.
              </Text>

              <View style={[styles.card, styles.velvetBorder]}>
                <LinearGradient 
                  colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} 
                  style={StyleSheet.absoluteFill} 
                />
                
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>What You Add</Text>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="sparkles-outline" size={18} variant="gold" />
                    <Text style={styles.dataText}>Birth data & personalization settings</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="book-outline" size={18} variant="gold" />
                    <Text style={styles.dataText}>Journal, mood, and sleep entries</Text>
                  </View>

                  <Text style={[styles.sectionTitle, { marginTop: 24 }]}>How We Protect It</Text>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="lock-closed-outline" size={18} color={PALETTE.atmosphere} />
                    <Text style={styles.dataText}>Core reflections stay encrypted on your device</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="hardware-chip-outline" size={18} color={PALETTE.atmosphere} />
                    <Text style={styles.dataText}>Pattern analysis runs locally whenever possible</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="ban-outline" size={18} color={PALETTE.atmosphere} />
                    <Text style={styles.dataText}>We never sell or share data for advertising</Text>
                  </View>

                  <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Your Agreement</Text>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="document-text-outline" size={18} color={theme.textPrimary} />
                    <Text style={styles.dataText}>By continuing, you accept our Terms of Use and this Privacy Policy</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="settings-outline" size={18} color={theme.textPrimary} />
                    <Text style={styles.dataText}>You can review these anytime in Settings</Text>
                  </View>
                </View>
              </View>

              <View style={styles.footerActions}>
                <Pressable
                  style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                  onPress={handleAccept}
                  accessibilityRole="button"
                  accessibilityLabel="Accept and continue"
                >
                  <LinearGradient
                    colors={['#FFF4D6', '#D4AF37', '#6B532E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.acceptBtnText}>I Accept & Continue</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  style={styles.declineBtn}
                  onPress={handleDecline}
                  disabled={showDeclineHint}
                  accessibilityRole="button"
                  accessibilityLabel="Decline, not now"
                >
                  <Text style={styles.declineBtnText}>Not now</Text>
                </Pressable>

                {showDeclineHint && (
                  <Animated.View entering={FadeInUp.duration(400)}>
                    <Text style={styles.declineHint}>No worries — we'll be here whenever you're ready ✨</Text>
                  </Animated.View>
                )}
              </View>

            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },

  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingHorizontal: 24, paddingBottom: 8 },
  spacer: { width: 44, height: 44 }, // Matches back button spacing
  titleArea: { paddingHorizontal: 24, paddingBottom: 8 },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -1,
  },
  headerSubtitle: { marginBottom: 4 },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  
  heroIconWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(162, 194, 225, 0.2)',
  },

  introText: {
    fontSize: 15,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 12,
  },

  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
  },
  cardContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: theme.textMuted,
    marginBottom: 16,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingRight: 10,
  },
  dataText: {
    fontSize: 14,
    color: theme.textPrimary,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },

  footerActions: { marginTop: 8, gap: 16 },
  acceptBtn: { borderRadius: 28, overflow: 'hidden' },
  btnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { fontSize: 16, fontWeight: '700', color: '#020817' },
  declineBtn: { paddingVertical: 12, alignItems: 'center' },
  declineBtnText: { fontSize: 14, color: theme.textPrimary, fontWeight: '600', textDecorationLine: 'underline' },
  declineHint: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 4 },
});
