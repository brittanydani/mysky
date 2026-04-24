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
            accessibilityRole="button"
            accessibilityLabel="Go back"
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

          <Text style={styles.lastUpdated}>Last updated: April 21, 2026</Text>

          {/* ── Commitment (Midnight Slate Anchor) ── */}
          <View style={[styles.glassSection, styles.velvetBorder]}>
            <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
            <Text style={styles.sectionTitle}>Our Framework</Text>
            <Text style={styles.paragraph}>
              MySky is built on <MetallicText color={PALETTE.atmosphere} style={styles.boldText}>Privacy by Design</MetallicText>. We do not collect advertising IDs, perform cross-app tracking, or sell your data. Your account data belongs to you and is stored in infrastructure protected by row-level access controls.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INFORMATION WE PROTECT</Text>
            
            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Birth Data & Charts</Text>
              <Text style={styles.paragraph}>Stored in your Supabase account as the canonical record. Chart calculations are still performed locally via Swiss Ephemeris.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Internal Weather & Journal</Text>
              <Text style={styles.paragraph}>Mood scores, tags, and free-text entries are stored in your Supabase account and isolated per user with Row Level Security. Devices may keep local cache and queued offline writes, but the cloud account remains canonical.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Somatic & Nervous System Entries</Text>
              <Text style={styles.paragraph}>Body sensation logs and trigger descriptions are stored in account-scoped application storage with per-user isolation.</Text>
            </View>
          </View>

          {/* ── Security Architecture (Sage/Emerald Wash) ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SECURITY ARCHITECTURE</Text>
            <View style={[styles.securityCard, styles.velvetBorder]}>
              <LinearGradient colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']} style={StyleSheet.absoluteFill} />
              <View style={styles.securityHeader}>
                <MetallicIcon name="lock-closed-outline" size={18} color={PALETTE.emerald} />
                <Text style={styles.securityTitle}>Canonical Cloud Storage</Text>
              </View>
              <Text style={styles.paragraph}>
                Core app content is stored in Supabase and protected by row-level access controls tied to your authenticated user.
              </Text>
            </View>

            <View style={[styles.securityCard, styles.velvetBorder, { marginTop: 16 }]}>
              <LinearGradient colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']} style={StyleSheet.absoluteFill} />
              <View style={styles.securityHeader}>
                <MetallicIcon name="cloud-offline-outline" size={18} color={PALETTE.emerald} />
                <Text style={styles.securityTitle}>Cache & Queueing</Text>
              </View>
              <Text style={styles.paragraph}>
                Devices may keep local cache and queued offline writes so recent data stays available and pending updates can sync later. Those local copies are not treated as the source of truth.
              </Text>
            </View>
          </View>

          {/* ── Third-Party Processors ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>THIRD-PARTY SERVICE PROCESSORS</Text>
            <View style={[styles.glassSection, styles.velvetBorder]}>
              <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
              <Text style={styles.sectionTitle}>Who We Work With</Text>
              <Text style={styles.paragraph}>MySky limits third-party data exposure to the minimum necessary to operate. Below is every service that may receive any portion of your data, what it receives, and why.</Text>

              <View style={styles.dataBlock}>
                <Text style={styles.subSectionTitle}>Supabase</Text>
                <Text style={styles.paragraph}>Handles account authentication, session management, and your primary cloud data synchronization. Your email address, hashed password, and a unique user ID are stored securely on Supabase servers, alongside your synchronized journal entries, check-ins, and charts which are isolated under rigorous Row Level Security.</Text>
              </View>

              <View style={styles.dataBlock}>
                <Text style={styles.subSectionTitle}>Google Gemini</Text>
                <Text style={styles.paragraph}>Used for AI dream interpretation and AI Reflection Insights (Deeper Sky). When you request an AI pass, only your dream text, selected feelings, and minimal symbolic context are transmitted. No birth data, location, somatic logs, or account identity is included. Transmissions occur only on your explicit action. Google's data processing terms apply.</Text>
              </View>

              <View style={styles.dataBlock}>
                <Text style={styles.subSectionTitle}>RevenueCat</Text>
                <Text style={styles.paragraph}>Manages subscription state and purchase validation for Deeper Sky. RevenueCat receives a pseudonymous subscriber ID, platform receipt data, and subscription status. No personal content, journal entries, or reflection data is shared.</Text>
              </View>

              <View style={styles.dataBlock}>
                <Text style={styles.subSectionTitle}>Sentry</Text>
                <Text style={styles.paragraph}>Collects crash reports and error diagnostics. Reports include device type, OS version, app version, and a sanitized stack trace. We configure Sentry to strip personally identifiable content before transmission. Crash reports never include journal text, birth data, or location.</Text>
              </View>

              <View style={styles.dataBlock}>
                <Text style={styles.subSectionTitle}>OpenStreetMap Nominatim</Text>
                <Text style={styles.paragraph}>Used for birth location geocoding (converting a city name to coordinates for chart calculations). Only the text you type in the location search field is transmitted. Coordinates are stored locally on your device and are never sent back to Nominatim.</Text>
              </View>

              <View style={[styles.dataBlock, { borderLeftColor: 'rgba(110,191,139,0.25)', marginBottom: 0 }]}>
                <Text style={[styles.subSectionTitle, { color: PALETTE.emerald }]}>What We Do NOT Use</Text>
                <Text style={styles.paragraph}>We do not use Google Analytics, Meta Pixel, AppsFlyer, Adjust, Amplitude, Mixpanel, Firebase Analytics, or any advertising SDK. No advertising identifiers (IDFA, GAID) are collected or transmitted at any time.</Text>
              </View>
            </View>
          </View>

          {/* ── Data Retention & Deletion ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DATA RETENTION & DELETION</Text>
            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>On-Device Data</Text>
              <Text style={styles.paragraph}>Devices may keep local cache and queued writes for performance and offline resilience. Those copies can be cleared locally without changing the canonical account record.</Text>
            </View>
            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Cloud Sync Data</Text>
              <Text style={styles.paragraph}>Your data automatically syncs to Supabase to prevent data loss. You can restore your data continuously across all your personal devices just by logging in.</Text>
            </View>
            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Account Deletion</Text>
              <Text style={styles.paragraph}>You can request full deletion of your Supabase auth account through the app or by emailing us. This deletes all your cloud records and purges your email, credentials, and synced history from Supabase.</Text>
            </View>
            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Crash & Diagnostic Logs</Text>
              <Text style={styles.paragraph}>Sentry crash reports are retained for up to 90 days and then automatically purged. These logs contain no personally identifiable information.</Text>
            </View>
          </View>

          {/* ── Your Rights ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR RIGHTS</Text>
            <View style={[styles.glassSection, styles.velvetBorder]}>
              <LinearGradient colors={[PALETTE.slateMid, PALETTE.slateDeep]} style={StyleSheet.absoluteFill} />
              <Text style={styles.sectionTitle}>Access, Control & Portability</Text>
              <Text style={styles.paragraph}>Because MySky keeps your account as the source of truth while using local cache only as a convenience layer, you have direct access to your data across devices. In addition, you have the following rights:</Text>

              <View style={styles.dataBlock}>
                <Text style={styles.subSectionTitle}>Right to Access</Text>
                <Text style={styles.paragraph}>You can view all your stored data directly within the app at any time — no request needed.</Text>
              </View>
              <View style={styles.dataBlock}>
                <Text style={styles.subSectionTitle}>Right to Export</Text>
                <Text style={styles.paragraph}>Deeper Sky subscribers can export a .msky backup via the app. Free users can export a PDF birth chart. Additional export options are in development.</Text>
              </View>
              <View style={styles.dataBlock}>
                <Text style={styles.subSectionTitle}>Right to Delete</Text>
                <Text style={styles.paragraph}>Perform a Hard Reset in Privacy Settings to permanently delete all on-device data. Email us to delete your Supabase auth account and remove your credentials from our systems.</Text>
              </View>
              <View style={styles.dataBlock}>
                <Text style={styles.subSectionTitle}>Right to Correct</Text>
                <Text style={styles.paragraph}>You can update your birth data, journal entries, or any stored information directly within the app at any time. No approval or request is required.</Text>
              </View>
              <View style={[styles.dataBlock, { marginBottom: 0 }]}>
                <Text style={styles.subSectionTitle}>Right to Opt Out of AI Features</Text>
                <Text style={styles.paragraph}>AI features (dream interpretation, AI Reflection Insights) are always opt-in and only trigger on your explicit action. You can use MySky fully without ever activating an AI pass. AI features can be disabled entirely in Settings.</Text>
              </View>
            </View>
          </View>

          {/* ── Children's Privacy ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CHILDREN'S PRIVACY</Text>
            <View style={styles.dataBlock}>
              <Text style={styles.paragraph}>MySky is intended for users aged <MetallicText color={PALETTE.atmosphere} style={styles.boldText}>17 and older</MetallicText>. We do not knowingly collect personal information from anyone under 17. If you believe a minor has created an account, please contact us immediately and we will delete the account. Parents or guardians who become aware of a minor using MySky should contact us at the address below.</Text>
            </View>
          </View>

          {/* ── California Privacy Rights ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CALIFORNIA PRIVACY RIGHTS (CCPA)</Text>
            <View style={styles.dataBlock}>
              <Text style={styles.paragraph}>California residents have additional rights under the California Consumer Privacy Act. You have the right to know what personal information is collected, the right to delete personal information, and the right to opt out of the sale of personal information.</Text>
              <Text style={styles.paragraph}><MetallicText color={PALETTE.emerald} style={styles.boldText}>We do not sell personal information</MetallicText> — to anyone, ever. We do not share personal information for cross-context behavioral advertising. California residents can exercise their rights by contacting us below. We will not discriminate against you for exercising any CCPA rights.</Text>
            </View>
          </View>

          {/* ── International Users ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INTERNATIONAL USERS</Text>
            <View style={styles.dataBlock}>
              <Text style={styles.paragraph}>MySky is operated from the United States. By using the app, users outside the US acknowledge that authentication credentials and account data are processed via Supabase infrastructure, which may operate in the US.</Text>
              <Text style={styles.paragraph}>If you are located in the European Economic Area (EEA) or United Kingdom, you have rights under GDPR — including the right to access, rectify, erase, restrict processing, and data portability. Our legal basis for processing your email and auth credentials is contractual necessity. Contact us to exercise any GDPR rights.</Text>
            </View>
          </View>

          {/* ── Policy Updates ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>POLICY UPDATES</Text>
            <View style={styles.dataBlock}>
              <Text style={styles.paragraph}>When we make material changes to this Privacy Policy, we will update the "Last updated" date and, where required by law, re-request your consent within the app. For significant changes we will display a clear notice on first launch after the update. Continued use of MySky after changes constitutes acceptance of the revised policy. We encourage you to review this page periodically.</Text>
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

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingHorizontal: 24, paddingBottom: 8 },
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
    color: theme.textPrimary,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textGold,
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
  securityTitle: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: theme.textPrimary },
  
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
  },
  contactInfo: { fontSize: 16, color: theme.textPrimary, fontWeight: '700' },
  
  footer: {
    alignItems: 'center',
    paddingVertical: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: '600', letterSpacing: 0.5 },
});
