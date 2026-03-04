// components/PrivacyConsentModal.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import StarField from './ui/StarField';
import { logger } from '../utils/logger';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',
  silverBlue: '#8BC4E8',
  emerald: '#6EBF8B',
  textMain: '#FDFBF7',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

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
  const email = contactEmail ?? 'brittanyapps@outlook.com';
  const [showFullPolicy, setShowFullPolicy] = useState(false);

  useEffect(() => {
    if (!visible) setShowFullPolicy(false);
  }, [visible]);

  const handleAccept = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onConsent(true);
  }, [onConsent]);

  const handleDecline = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onConsent(false);
  }, [onConsent]);

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.container}>
        <StarField starCount={60} />

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
                    <Ionicons name="shield-checkmark" size={40} color={PALETTE.gold} />
                  </View>
                  <Text style={styles.title}>Your Privacy Matters</Text>
                  <Text style={styles.subtitle}>We’re committed to protecting your personal information.</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.contentContainer}>
                  
                  {/* Glass Highlights Grid */}
                  <View style={styles.glassSection}>
                    <Text style={styles.sectionLabel}>What We Collect</Text>
                    <View style={styles.dataRow}>
                        <Ionicons name="sparkles-outline" size={16} color={PALETTE.gold} />
                        <Text style={styles.dataText}>Birth data & personalization settings</Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Ionicons name="book-outline" size={16} color={PALETTE.gold} />
                        <Text style={styles.dataText}>Journal, mood, and sleep entries</Text>
                    </View>
                  </View>

                  <View style={[styles.glassSection, { borderColor: 'rgba(139, 196, 232, 0.2)' }]}>
                    <Text style={[styles.sectionLabel, { color: PALETTE.silverBlue }]}>How We Protect It</Text>
                    <View style={styles.dataRow}>
                        <Ionicons name="lock-closed-outline" size={16} color={PALETTE.silverBlue} />
                        <Text style={styles.dataText}>Core data stays encrypted on your device</Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Ionicons name="ban-outline" size={16} color={PALETTE.silverBlue} />
                        <Text style={styles.dataText}>We never sell or share data for advertising</Text>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.policyLink, pressed && { opacity: 0.6 }]}
                    onPress={() => setShowFullPolicy(true)}
                  >
                    <Text style={styles.policyLinkText}>Read Full Privacy Policy</Text>
                    <Ionicons name="chevron-forward" size={14} color={PALETTE.gold} />
                  </Pressable>

                  <View style={styles.footerActions}>
                    <Pressable
                      style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
                      onPress={handleAccept}
                    >
                      <LinearGradient
                        colors={['#FFF4D4', '#D4AF37', '#7A5C13']}
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
                    >
                      <Text style={styles.declineBtnText}>Not now</Text>
                    </Pressable>
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
                    <Ionicons name="chevron-back" size={24} color={PALETTE.textMain} />
                  </Pressable>
                  <Text style={styles.policyTitle}>Privacy Policy</Text>
                </Animated.View>

                <Text style={styles.lastUpdated}>Last updated: March 3, 2026</Text>

                <View style={styles.legalContent}>
                    <Text style={styles.policyText}>
                        MySky ("we," "us," or "our") is a personal growth and wellness app. This policy explains what information we process and how it is protected. 
                    </Text>
                    
                    <Text style={styles.legalSub}>Local-First Architecture</Text>
                    <Text style={styles.policyText}>
                        All core data—including your birth details, journal entries, and check-ins—is stored exclusively on your device using AES-256-GCM encryption. It is never transmitted to an external server unless you opt-in to premium AI features.
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
  container: { flex: 1, backgroundColor: '#07090F' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 },

  // Summary View
  headerContainer: { alignItems: 'center', marginBottom: 32 },
  iconGlow: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  title: { 
    fontSize: 30, 
    color: PALETTE.textMain, 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  subtitle: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22, fontStyle: 'italic' },
  
  contentContainer: { marginBottom: 40 },
  glassSection: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: PALETTE.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  dataRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 },
  dataText: { fontSize: 14, color: theme.textSecondary, flex: 1 },
  
  policyLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  policyLinkText: { fontSize: 14, color: PALETTE.gold, fontWeight: '700' },

  footerActions: { marginTop: 24, gap: 16 },
  acceptBtn: { borderRadius: 16, overflow: 'hidden', elevation: 4 },
  btnGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  declineBtn: { paddingVertical: 12, alignItems: 'center' },
  declineBtnText: { fontSize: 14, color: theme.textMuted, fontWeight: '600', textDecorationLine: 'underline' },

  // Full Policy View
  policyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 16 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  policyTitle: { fontSize: 24, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  lastUpdated: { fontSize: 12, color: theme.textMuted, marginBottom: 24, fontStyle: 'italic' },
  legalContent: { gap: 20 },
  legalSub: { fontSize: 18, fontWeight: '700', color: PALETTE.gold, marginTop: 10 },
  policyText: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
  policyCloseBtn: { 
    marginTop: 40, 
    paddingVertical: 16, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  policyCloseText: { fontSize: 15, fontWeight: '700', color: PALETTE.textMain },
});
