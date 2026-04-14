// app/privacy.tsx
// MySky — Privacy & Data Framework
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged "Muddy Gold" remnants and generic matte backgrounds.
// 2. Implemented "Midnight Slate" anchor for heavy data sections.
// 3. Refined security cards with a crisp Sage/Emerald bioluminescent wash.
// 4. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 5. Reserved Atmosphere Blue for technical specifications and data protocols.

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';

import { type AppTheme } from '../constants/theme';
import { SUPPORT_EMAIL } from '../constants/config';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { MetallicText } from '../components/ui/MetallicText';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { useThemedStyles } from '../context/ThemeContext';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Metallic Accent
  atmosphere: '#A2C2E1', // Technical Protocols (Icy Blue)
  emerald: '#6EBF8B',    // Security Status (Green)
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
};

export default function PrivacyPolicyScreen({ onBack }: { onBack?: () => void } = {}) {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => onBack ? onBack() : (router.canGoBack() ? router.back() : undefined)}
          >
            <MetallicIcon name="chevron-back-outline" size={22} variant="gold" />
          </Pressable>
        </View>
        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Privacy</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Technical Transparency</GoldSubtitle>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroIconWrap}>
            <LinearGradient
              colors={['rgba(110, 191, 139, 0.15)', 'rgba(110, 191, 139, 0.05)']}
              style={styles.heroIconCircle}
            >
              <MetallicIcon name="shield-checkmark-outline" size={64} color={PALETTE.emerald} />
            </LinearGradient>
          </View>

          <Text style={styles.lastUpdated}>Last updated: April 7, 2026</Text>

          {/* ── Commitment (Midnight Slate Anchor) ── */}
          <View style={[styles.glassSection, styles.velvetBorder]}>
            <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
            <Text style={styles.sectionTitle}>Our Framework</Text>
            <Text style={styles.paragraph}>
              MySky is built on <MetallicText color={PALETTE.atmosphere} style={styles.boldText}>Privacy by Design</MetallicText>. We do not collect advertising IDs, perform cross-app tracking, or sell your data. Your inner world is encrypted at rest and belongs entirely to you.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INFORMATION WE PROTECT</Text>
            
            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Birth Data & Charts</Text>
              <Text style={styles.paragraph}>Stored exclusively on-device. Sensitive fields use <MetallicText color={PALETTE.atmosphere} style={styles.boldText}>AES-256-GCM</MetallicText> field-level encryption. Calculations are performed locally via Swiss Ephemeris.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Internal Weather & Journal</Text>
              <Text style={styles.paragraph}>Mood scores, tags, and free-text entries are processed entirely on-device via local NLP. Raw content is encrypted at rest and never leaves your device sandbox.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Somatic & Nervous System Entries</Text>
              <Text style={styles.paragraph}>Body sensation logs and trigger descriptions are stored locally with hardware-backed encryption. This is your most sensitive data and is never transmitted to any server.</Text>
            </View>
          </View>

          {/* ── Security Architecture (Sage/Emerald Wash) ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SECURITY ARCHITECTURE</Text>
            <View style={[styles.securityCard, styles.velvetBorder]}>
              <LinearGradient colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']} style={StyleSheet.absoluteFill} />
              <View style={styles.securityHeader}>
                <MetallicIcon name="lock-closed-outline" size={18} color={PALETTE.emerald} />
                <Text style={styles.securityTitle}>Encryption at Rest</Text>
              </View>
              <Text style={styles.paragraph}>
                We utilize <MetallicText color={PALETTE.atmosphere} style={styles.boldText}>AES-256-GCM</MetallicText> encryption. The data key is stored in your device's hardware-backed Secure Enclave (iOS Keychain).
              </Text>
            </View>

            <View style={[styles.securityCard, styles.velvetBorder, { marginTop: 16 }]}>
              <LinearGradient colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']} style={StyleSheet.absoluteFill} />
              <View style={styles.securityHeader}>
                <MetallicIcon name="cloud-offline-outline" size={18} color={PALETTE.emerald} />
                <Text style={styles.securityTitle}>Local-First Protocols</Text>
              </View>
              <Text style={styles.paragraph}>
                SecureStore payloads use <MetallicText color={PALETTE.atmosphere} style={styles.boldText}>HMAC-SHA256</MetallicText> tamper detection. Backups are shared via your device's share sheet; we never upload them.
              </Text>
            </View>
          </View>

          {/* ── Contact Card ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONTACT US</Text>
            <Pressable
              style={[styles.contactCard, styles.velvetBorder]}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=MySky%20Privacy%20Inquiry`)}
            >
              <LinearGradient colors={['rgba(162, 194, 225, 0.10)', 'transparent']} style={StyleSheet.absoluteFill} />
              <MetallicIcon name="mail-outline" size={20} variant="gold" />
              <Text style={styles.contactInfo}>{SUPPORT_EMAIL}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Privacy is a human right — MySky is built on that foundation.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
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

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea: { paddingHorizontal: 24, paddingBottom: 8 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    borderColor: 'rgba(110, 191, 139, 0.2)',
  },

  lastUpdated: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 24, textAlign: 'center', letterSpacing: 0.5 },
  
  section: { marginBottom: 36 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 18, marginLeft: 4 },
  
  glassSection: {
    borderRadius: 28,
    padding: 28,
    marginBottom: 32,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D4AF37',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 24,
    marginBottom: 12,
  },
  dataBlock: {
    marginBottom: 24,
    paddingLeft: 16,
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(212, 175, 55, 0.15)',
  },
  boldText: { fontWeight: '800' },
  
  securityCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  securityTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: '#FFF' },
  
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  contactInfo: { fontSize: 16, color: '#FFF', fontWeight: '700' },
  
  footer: {
    alignItems: 'center',
    paddingVertical: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: '600', letterSpacing: 0.5 },
});
