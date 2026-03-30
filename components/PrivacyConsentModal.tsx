// components/PrivacyConsentModal.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { LEGAL_URL } from '../constants/config';
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
  }, [rotation]);

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
  privacyPolicyUrl?: string;
  contactEmail?: string;
}

export default function PrivacyConsentModal({
  visible,
  onConsent,
  privacyPolicyUrl,
  contactEmail,
}: PrivacyConsentModalProps) {
  const policyUrl = privacyPolicyUrl ?? LEGAL_URL;
  const [showFullPolicy, setShowFullPolicy] = useState(false);
  const [showDeclineHint, setShowDeclineHint] = useState(false);

  const handleOpenHostedPolicy = useCallback(() => {
    Linking.openURL(policyUrl).catch(() => {});
  }, [policyUrl]);

  useEffect(() => {
    if (!visible) {
      setShowFullPolicy(false);
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
            {!showFullPolicy ? (
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

                  <Pressable
                    style={({ pressed }) => [styles.policyLink, pressed && { opacity: 0.6 }]}
                    onPress={() => setShowFullPolicy(true)}
                  >
                    <Text style={styles.policyLinkText}>Read Full Privacy Policy</Text>
                    <MetallicIcon name="chevron-forward-outline" size={14} color={PALETTE.gold} />
                  </Pressable>

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
            ) : (
              <>
                {/* ── Full Policy View ── */}
                <Animated.View entering={FadeInUp.duration(400)} style={styles.policyHeader}>
                  <Pressable
                    style={styles.backBtn}
                    onPress={() => setShowFullPolicy(false)}
                    hitSlop={15}
                  >
                    <Ionicons name="chevron-back-outline" size={24} color={PALETTE.textMain} />
                  </Pressable>
                  <Text style={styles.policyTitle}>Privacy Policy</Text>
                </Animated.View>

                <Text style={styles.lastUpdated}>Last updated: March 30, 2026</Text>

                <View style={styles.legalContent}>
                    <Text style={styles.policyText}>
                    MySky ("we," "us," or "our") is a private self-pattern tracker for sleep, mood, dreams, and reflection. This policy explains what information you add and how it is protected.
                    </Text>
                    
                    <Text style={styles.legalSub}>Local-First Architecture</Text>
                    <Text style={styles.policyText}>
                    Core data—including your birth details, journal entries, dreams, and check-ins—is stored on your device using AES-256-GCM encryption. Pattern analysis runs locally by default. Optional external services are only used for features you explicitly invoke, such as subscription verification, city lookup, or cloud-assisted dream interpretation.
                    </Text>

                    <Text style={styles.legalSub}>Third-Party Services</Text>
                    <Text style={styles.policyText}>
                        We use RevenueCat for subscription verification and OpenStreetMap for geocoding city names. These services receive only anonymous identifiers or location text.
                    </Text>

                    <Text style={styles.legalSub}>Your Rights</Text>
                    <Text style={styles.policyText}>
                        You can export or delete your data at any time via Privacy Settings. Uninstalling the app erases all locally stored data.
                    </Text>
                </View>

                {!!policyUrl && (
                  <Pressable
                    style={[styles.policyCloseBtn, { marginBottom: 12 }]}
                    onPress={handleOpenHostedPolicy}
                  >
                    <Text style={[styles.policyCloseText, { color: PALETTE.gold }]}>Open full policy in browser ↗</Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.policyCloseBtn}
                  onPress={() => setShowFullPolicy(false)}
                >
                  <Text style={styles.policyCloseText}>Return to Summary</Text>
                </Pressable>
              </>
            )}
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
  
  policyLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  policyLinkText: { fontSize: 12, color: "#FFFFFF", fontWeight: '700' },

  footerActions: { marginTop: 24, gap: 16 },
  acceptBtn: { borderRadius: 16, overflow: 'hidden', },
  btnGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: '#020817', fontFamily: 'SF Pro Display' },
  declineBtn: { paddingVertical: 12, alignItems: 'center' },
  declineBtnText: { fontSize: 12, color: "#FFFFFF", fontWeight: '600', textDecorationLine: 'underline' },
  declineHint: { fontSize: 13, color: '#C5B5A1', textAlign: 'center', fontStyle: 'italic', marginTop: 4 },

  // Full Policy View
  policyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  policyTitle: { fontSize: 22, color: "#FFFFFF", fontFamily: 'SF Pro Display' },
  lastUpdated: { fontSize: 11, color: "#FFFFFF", marginBottom: 24, fontStyle: 'italic' },
  legalContent: { gap: 20 },
  legalSub: { fontSize: 16, fontWeight: '700', color: "#FFFFFF", marginTop: 10 },
  policyText: { fontSize: 13, color: "#FFFFFF", lineHeight: 22 },
  policyCloseBtn: { 
    marginTop: 40, 
    paddingVertical: 16, 
    borderRadius: 16, 
    backgroundColor: 'transparent', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  policyCloseText: { fontSize: 13, fontWeight: '700', color: "#FFFFFF" },
});
