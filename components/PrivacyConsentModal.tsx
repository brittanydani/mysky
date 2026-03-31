// components/PrivacyConsentModal.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import { MetallicIcon } from './ui/MetallicIcon';
import { MetallicText } from './ui/MetallicText';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C9AE78',
  silverBlue: '#8BC4E8',
  emerald: '#6EBF8B',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
  titaniumGlow: 'rgba(197, 181, 161, 0.12)',
  starlight: 'rgba(79, 79, 127, 0.10)',
};

function LivingBackground() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 80_000, easing: Easing.linear }),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#020817' }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <View style={bgStyles.orbTitanium} />
        <View style={bgStyles.orbStarlight} />
      </Animated.View>
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
    </View>
  );
}

const bgStyles = StyleSheet.create({
  orbTitanium: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: PALETTE.titaniumGlow,
    top: -250,
    right: -200,
  },
  orbStarlight: {
    position: 'absolute',
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: PALETTE.starlight,
    bottom: -150,
    left: -200,
  },
});

interface PrivacyConsentModalProps {
  visible: boolean;
  onConsent: (granted: boolean) => void;
}

export default function PrivacyConsentModal({
  visible,
  onConsent,
}: PrivacyConsentModalProps) {
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
        <LivingBackground />
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

                <View style={[styles.glassSection, { borderColor: 'rgba(139, 196, 232, 0.2)' }]}>
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

                <View style={[styles.glassSection, { borderColor: 'rgba(110, 191, 139, 0.2)' }]}>
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
                  >
                    <LinearGradient
                      colors={['#FFF4D6', '#C9AE78', '#6B532E']}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
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
    borderColor: 'rgba(232,214,174,0.18)',
  },
  title: { 
    fontSize: 30, 
    fontWeight: '800', 
    letterSpacing: -0.7, 
    color: '#F5F5F7', 
    fontFamily: 'SF Pro Display', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  subtitle: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, color: '#C5B5A1', textAlign: 'center', paddingHorizontal: 20, lineHeight: 20, fontStyle: 'italic' },
  
  contentContainer: { marginBottom: 28 },
  glassSection: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5, textTransform: 'uppercase', color: '#86868B', marginBottom: 10 },
  dataRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 10 },
  dataText: { fontSize: 12, color: "#FFFFFF", flex: 1 },
  
  footerActions: { marginTop: 24, gap: 16 },
  acceptBtn: { borderRadius: 16, overflow: 'hidden', },
  btnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: '#020817', fontFamily: 'SF Pro Display' },
  declineBtn: { paddingVertical: 12, alignItems: 'center' },
  declineBtnText: { fontSize: 12, color: "#FFFFFF", fontWeight: '600', textDecorationLine: 'underline' },
  declineHint: { fontSize: 13, color: '#C5B5A1', textAlign: 'center', fontStyle: 'italic', marginTop: 4 },


});
