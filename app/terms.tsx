// File: app/terms.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import MySkyScrollSkia from '../components/skia/MySkyScrollSkia';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';

// ── Cinematic Palette ──
const PALETTE = {
  gold: theme.textGold,
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
  glassHighlight: theme.glass.highlight,
};

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/onboarding/consent' as Href))}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <MySkyScrollSkia size={140} />
            </View>

            <Text style={styles.lastUpdated}>Last updated: March 15, 2026</Text>

            <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By downloading or using MySky, you agree to these Terms and our Privacy Policy. All personal data is stored locally on your device with <Text style={styles.highlight}>AES-256-GCM field-level encryption</Text> and hardware-backed key storage.
            </Text>

            <Text style={styles.sectionTitle}>Service Description</Text>
            <Text style={styles.paragraph}>
              MySky provides a local-first personal framework for self-knowledge, growth, and reflection. Tools include daily wellness tracking, dream journaling, emotional pattern mapping, self-discovery exercises (values inventory, somatic body mapping, nervous system trigger logs), and optional astrological context. The app is intended for users aged 17 and older. Core features work fully offline without an account.
            </Text>

            <View style={styles.glassCard}>
              <Text style={[styles.subHeader, { color: PALETTE.gold }]}>Free & Premium Features</Text>
              <Text style={styles.paragraph}>
                <Text style={styles.boldText}>Free:</Text> Personal birth chart visualization, Big Three, daily mood/energy/stress check-ins, basic journal, sleep quality logging, balance dashboard, 2 rotating energy domains, 1 relationship chart, 3 personal story chapters, and daily context.
              </Text>
              <Text style={styles.paragraph}>
                <Text style={[styles.boldText, { color: PALETTE.gold }]}>Deeper Sky:</Text> Dream journal with symbolic reflections, extended personal reflection trends, unlimited relationship charts, all 10 personal story chapters, growth and attachment reflections, full 5-domain energy reflection, emotional quality tagging, AI Reflection Insights, personalized daily guidance with action steps, sensitivity and growth mapping, PDF chart export, encrypted .msky backup and restore, and extended pattern reflections.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Subscriptions & Payments</Text>
            <Text style={styles.paragraph}>
              Premium access ("Deeper Sky") is available via auto-renewing subscriptions (monthly or yearly) or a one-time lifetime purchase, managed through RevenueCat. Manage cancellations via your device's App Store or Google Play settings at least 24 hours before renewal. Access continues through the end of your current billing period. Purchases can be restored at any time.
            </Text>

            <Text style={styles.sectionTitle}>Accounts</Text>
            <Text style={styles.paragraph}>
              Account creation is entirely optional and required only for the AI Reflection Insights feature. Accounts are managed via Supabase Auth (email and password). All other features work without an account.
            </Text>

            <LinearGradient 
              colors={['rgba(205,127,93,0.10)', theme.cardGradientEnd]} 
              style={styles.disclaimerCard}
            >
              <View style={styles.disclaimerHeader}>
                <MetallicIcon name="medical-outline" size={18} color={PALETTE.copper} />
                <MetallicText style={[styles.subHeader, { marginBottom: 0 }]} color={PALETTE.copper}>Not Medical or Therapeutic Advice</MetallicText>
              </View>
              <Text style={styles.paragraph}>
                MySky is a self-reflection and personal growth tool, not a medical app. None of its features — including chart-based content, dream reflections, somatic body mapping, nervous system trigger logs, core values exercises, psychological archetype profiles, emotional pattern analysis, cognitive style assessments, healing path prompts, or any other content — constitute medical advice, psychological diagnosis, therapy, counseling, or treatment of any kind.
              </Text>
              <Text style={styles.paragraph}>
                These tools are designed for self-awareness and personal exploration only. They are not a substitute for professional mental health care, psychotherapy, psychiatry, or medical treatment. Do not use MySky as a replacement for professional support.
              </Text>
              <Text style={[styles.paragraph, { marginBottom: 0 }]}>
                {'If you are experiencing a mental health crisis or are in danger, please reach out immediately:\n\n'}{'• Crisis & Suicide Prevention (US): call or text 988\n'}{'• Crisis Text Line: text HOME to 741741\n'}{'• International resources: findahelpline.com\n'}{'• Emergency services: 911 (US) or your local number'}
              </Text>
            </LinearGradient>

            <Text style={styles.sectionTitle}>Intellectual Property</Text>
            <Text style={styles.paragraph}>
              You retain full ownership of your personal data, including journal entries, check-ins, sleep logs, and dream content. MySky owns the app code, design, generalized interpretations, symbolic pattern mappings, and all generated chart-based content.
            </Text>

            <Text style={styles.sectionTitle}>Data & Privacy</Text>
            <Text style={styles.paragraph}>
              All core data is stored locally on your device. Sensitive fields are encrypted with AES-256-GCM. No analytics SDKs, advertising identifiers, or cross-app tracking are used. For full details, see our Privacy Policy.
            </Text>

            <Text style={styles.sectionTitle}>Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              MySky is provided "as is" without warranties of any kind. We are not liable for incidental, consequential, or indirect damages, or for any decisions or choices made based on personalized reflective content, dream interpretations, or behavioral insights provided by the app.
            </Text>

            <Text style={styles.sectionTitle}>Termination</Text>
            <Text style={styles.paragraph}>
              You may stop using MySky at any time by uninstalling the app, which permanently erases all locally stored data. If you created an account for AI Reflection Insights, you may request account deletion by contacting support.
            </Text>

            <Text style={styles.sectionTitle}>Age Requirement</Text>
            <Text style={styles.paragraph}>
              MySky is intended for users aged 17 and older. By using the app, you confirm that you are at least 17 years of age. We do not knowingly collect personal information from anyone under 17.
            </Text>

            <Text style={styles.sectionTitle}>User Conduct</Text>
            <Text style={styles.paragraph}>
              You agree to use MySky only for its intended purpose of personal reflection and self-awareness. You agree not to reverse-engineer, decompile, disassemble, or attempt to derive the source code of the app, or use it to develop a competing product. You are solely responsible for maintaining the confidentiality of any backup passphrases and account credentials.
            </Text>

            <Text style={styles.sectionTitle}>Changes to These Terms</Text>
            <Text style={styles.paragraph}>
              We may update these Terms from time to time. When we make material changes, the "Last updated" date will be revised, and — where required — we will re-request your consent within the app. Continued use of MySky after changes constitutes acceptance of the revised Terms. We encourage you to review this page periodically.
            </Text>

            <Text style={styles.sectionTitle}>Indemnification</Text>
            <Text style={styles.paragraph}>
              You agree to indemnify and hold harmless MySky and its developer from any claims, damages, losses, or expenses arising from your use of the app, your violation of these Terms, or your violation of any third-party rights.
            </Text>

            <Text style={styles.sectionTitle}>Governing Law</Text>
            <Text style={styles.paragraph}>
              These Terms are governed by and construed in accordance with the laws of the United States. Any disputes shall be resolved in the courts of competent jurisdiction.
            </Text>

            <Text style={styles.sectionTitle}>Severability</Text>
            <Text style={styles.paragraph}>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </Text>

            <Text style={styles.sectionTitle}>Entire Agreement</Text>
            <Text style={styles.paragraph}>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and MySky regarding the use of the app and supersede all prior agreements, representations, and understandings.
            </Text>

            <View style={styles.contactCard}>
              <Text style={styles.sectionTitle}>Contact</Text>
              <Text style={styles.paragraph}>Questions regarding these terms? Reach us at:</Text>
              <Text style={styles.email}>brittanyapps@outlook.com</Text>
            </View>

          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { 
    fontSize: 16,
    color: '#FFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  lastUpdated: { fontSize: 13, color: theme.textMuted, marginBottom: 24, fontStyle: 'italic', textAlign: 'center' },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textGold,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginTop: 24,
    marginBottom: 12,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  glassCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
    marginVertical: 16,
  },
  disclaimerCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(205,127,93,0.20)',
    marginVertical: 16,
  },
  disclaimerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  highlight: { color: PALETTE.silverBlue, fontWeight: '600' },
  boldText: { color: theme.textPrimary, fontWeight: '600' },
  email: { color: theme.textGold, fontWeight: '700', fontSize: 16 },
  contactCard: { marginTop: 24, paddingBottom: 40 },
});
