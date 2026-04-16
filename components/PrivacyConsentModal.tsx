// components/PrivacyConsentModal.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import { MetallicIcon } from './ui/MetallicIcon';
import { MetallicText } from './ui/MetallicText';
import { type AppTheme } from '../constants/theme';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',
  silverBlue: '#A2C2E1',
  emerald: '#6EBF8B',
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
  titaniumGlow: 'rgba(197, 181, 161, 0.12)',
  starlight: 'rgba(79, 79, 127, 0.10)',
};

function LivingBackground({ backgroundColor }: { backgroundColor: string }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor }]} pointerEvents="none" />
  );
}

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

  useEffect(() => {
    if (!visible) {
      setShowDeclineHint(false);
    }
  }, [visible]);

  const handleAccept = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onConsent(true);
  }, [onConsent]);

  const handleDecline = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setShowDeclineHint(true);
    setTimeout(() => {
      onConsent(false);
    }, 2000);
  }, [onConsent]);


  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.container}>
        <LivingBackground backgroundColor={theme.background} />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <SkiaDynamicCosmos fill="transparent" />
        </View>

        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <>
              {/* ── Summary View ── */}
              <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.headerContainer}>
                <View style={styles.iconGlow}>
                  <MetallicIcon name="shield-checkmark-outline" size={44} color={PALETTE.gold} />
                </View>
                <Text style={styles.title}>Your Privacy Matters</Text>
                <MetallicText style={styles.subtitle} color={PALETTE.gold}>MySky is built to help you reflect privately, not to turn your inner life into ad data.</MetallicText>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.contentContainer}>

                {/* Glass Highlights Grid */}
                <View style={styles.glassSection}>
                  <Text style={styles.sectionLabel}>What You Add</Text>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="sparkles-outline" size={16} color={PALETTE.gold} />
                    <Text style={styles.dataText}>Birth data & personalization settings</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="book-outline" size={16} color={PALETTE.gold} />
                    <Text style={styles.dataText}>Journal, mood, and sleep entries</Text>
                  </View>
                </View>

                <View style={[styles.glassSection, styles.goldSection]}>
                  <Text style={styles.sectionLabel}>How We Protect It</Text>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="lock-closed-outline" size={16} color={PALETTE.silverBlue} />
                    <Text style={styles.dataText}>Core reflections stay encrypted on your device</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="hardware-chip-outline" size={16} color={PALETTE.silverBlue} />
                    <Text style={styles.dataText}>Pattern analysis runs locally whenever possible</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="ban-outline" size={16} color={PALETTE.silverBlue} />
                    <Text style={styles.dataText}>We never sell or share data for advertising</Text>
                  </View>
                </View>

                <View style={[styles.glassSection, styles.emeraldSection]}>
                  <Text style={styles.sectionLabel}>Your Agreement</Text>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="document-text-outline" size={16} color={PALETTE.emerald} />
                    <Text style={styles.dataText}>By continuing, you accept our Terms of Use and this Privacy Policy</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <MetallicIcon name="settings-outline" size={16} color={PALETTE.emerald} />
                    <Text style={styles.dataText}>You can review these anytime in Settings</Text>
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
            </>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) => {
  const glassSurface = theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255, 252, 247, 0.92)';
  const glassBorder = theme.isDark ? theme.cardBorder : 'rgba(255, 255, 255, 0.20)';
  const mutedGold = theme.isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(212, 175, 55, 0.24)';
  const mutedEmerald = theme.isDark ? 'rgba(110, 191, 139, 0.2)' : 'rgba(78, 138, 100, 0.24)';

  return StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 28 },

  // Summary View
  headerContainer: { alignItems: 'center', marginBottom: 20 },
  iconGlow: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(232,214,174,0.18)' : 'rgba(181, 138, 58, 0.2)',
  },
  title: { 
    fontSize: 30, 
    fontWeight: '800', 
    letterSpacing: -0.7, 
    color: theme.textPrimary, 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  subtitle: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20,  },
  
  contentContainer: { marginBottom: 28 },
  glassSection: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: glassSurface,
    borderWidth: 1,
    borderColor: glassBorder,
    marginBottom: 12,
  },
  goldSection: { borderColor: mutedGold },
  emeraldSection: { borderColor: mutedEmerald },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase', color: theme.textMuted, marginBottom: 10 },
  dataRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 10 },
  dataText: { fontSize: 12, color: theme.textPrimary, flex: 1 },
  
  footerActions: { marginTop: 24, gap: 16 },
  acceptBtn: { borderRadius: 28, overflow: 'hidden', },
  btnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: '#020817' },
  declineBtn: { paddingVertical: 12, alignItems: 'center' },
  declineBtnText: { fontSize: 12, color: theme.textPrimary, fontWeight: '600', textDecorationLine: 'underline' },
  declineHint: { fontSize: 13, color: theme.textSecondary, textAlign: 'center', marginTop: 4 },
  });
};
