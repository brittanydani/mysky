// File: app/terms.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../constants/theme';
import StarField from '../components/ui/StarField';

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StarField starCount={15} />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/settings' as Href)}
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

            <Text style={styles.lastUpdated}>Last updated: March 1, 2026</Text>
            <Text style={styles.lastUpdated}>Last updated: March 3, 2026</Text>

            <Text style={styles.sectionTitle}>Welcome to MySky</Text>
            <Text style={styles.paragraph}>
              These Terms of Service govern your use of the MySky mobile application and related services. By using MySky, you agree to these terms.
            </Text>

            <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By downloading, installing, or using MySky, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the app.
            </Text>

            <Text style={styles.sectionTitle}>Eligibility</Text>
            <Text style={styles.paragraph}>
              MySky is intended for users aged 13 and older. By using this app, you confirm that you are at least 13 years of age. If you are under 13, please do not use MySky.
            </Text>

            <Text style={styles.sectionTitle}>Description of Service</Text>
            <Text style={styles.paragraph}>
              MySky is a personal growth and wellness app that provides:{'\n'}
              • Daily mood, energy, and stress check-ins{'\n'}
              • Sleep logging — quality and duration (dream journal requires premium){'\n'}
              • Journaling with guided prompts and on-device behavioral insights{'\n'}
              • Basic weekly averages for mood and sleep (free); full trend analysis (premium){'\n'}
              • A natal chart used as a personalization framework{'\n'}
              • Daily guidance and reflection prompts{'\n'}
              • Relationship reflection tools{'\n'}
              • PDF chart export (premium){'\n'}
              • Encrypted backup and restore (premium){'\n'}
              • Optional premium AI-generated reflection features (requires account)
            </Text>

            <Text style={styles.sectionTitle}>Your Data</Text>
            <Text style={styles.paragraph}>
              MySky does not require an account for core features. All data is stored locally on your device with sensitive fields encrypted at rest using AES-256-GCM. You are responsible for maintaining your device&apos;s security and for any backup or PDF files you create and share.
            </Text>
            <Text style={styles.paragraph}>
              If you choose to create an account to unlock premium AI-generated reflection features, your email address and a hashed password (never stored in plain text) are stored with our authentication provider (Supabase). For these features, only aggregated, non-identifying behavioral data (such as mood/energy/stress averages and theme-tag correlations) may be sent to Supabase and Anthropic (Claude AI) for the purpose of generating AI-written reflections. Raw journal content, birth data, and personal notes are never transmitted to any external server.
            </Text>

            <Text style={styles.sectionTitle}>Data Security</Text>
            <Text style={styles.paragraph}>
              All sensitive data in MySky is encrypted at rest using AES-256-GCM. Encryption keys are stored using your device&apos;s hardware-backed keychain/keystore (via SecureStore). No personal data ever leaves your device unless you explicitly export an encrypted backup, export a PDF, use premium AI features (see above), or perform a birth-location lookup (which sends only the location text you type to a geocoding provider). Subscription status is managed by RevenueCat, which receives only an anonymous app user identifier for purchase verification—never your journal, birth data, or other personal information.
            </Text>

            <Text style={styles.sectionTitle}>Free and Premium Features</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Free features include:</Text> Daily mood, energy &amp; stress check-ins, sleep logging (quality &amp; duration), journal with guided prompts, basic weekly averages, natal chart &amp; Big Three, basic daily guidance, one relationship chart, and privacy controls.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>&quot;Deeper Sky&quot; premium features include:</Text> Dream journal with sleep entries (encrypted), symbolic dream reflections, sleep &amp; mood trend analysis, behavioral insights &amp; trend charts, healing &amp; inner work (attachment styles, shadow work), unlimited relationship charts, mood &amp; journal pattern analysis, deep insights &amp; tag intelligence, full natal story (10 chapters), personalized guidance with action steps, Chiron &amp; Node depth mapping, PDF chart export, and encrypted backup &amp; restore.
            </Text>

            <Text style={styles.sectionTitle}>Subscriptions and Payments</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Premium Access Options:</Text> MySky offers auto-renewing subscriptions (monthly and yearly) and a one-time lifetime purchase. Monthly and yearly subscriptions automatically renew unless cancelled. Lifetime purchases do not renew.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Current Prices (USD):</Text> $4.99/month, $29.99/year, $49.99 lifetime. Prices may vary by region and may change at any time; the app store will always show the final price before purchase.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Billing:</Text> You will be charged through your device&apos;s app store (Apple App Store or Google Play Store).
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Cancellation (Subscriptions Only):</Text> You may cancel your subscription at any time through your device&apos;s subscription settings (iOS: Settings &gt; Apple ID &gt; Subscriptions; Android: Google Play &gt; Subscriptions). To avoid being charged for the next billing period, cancel at least 24 hours before the end of the current period. Cancellation takes effect at the end of the current billing period. Lifetime purchases do not renew and do not have a cancellation setting (refunds are handled by the app store).
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Refunds:</Text> Refunds are handled according to your app store&apos;s policies.
            </Text>

            <Text style={styles.sectionTitle}>Acceptable Use</Text>
            <Text style={styles.paragraph}>
              You agree not to:{'\n'}
              • Use the app for any illegal or unauthorized purpose{'\n'}
              • Attempt to reverse-engineer, decompile, or tamper with the app{'\n'}
              • Interfere with or disrupt the app&apos;s functionality{'\n'}
              • Use the app to harm, harass, or impersonate others
            </Text>

            <Text style={styles.sectionTitle}>Content and Intellectual Property</Text>
            <Text style={styles.paragraph}>
              • All app content, including text, graphics, and software, is owned by MySky or our licensors{'\n'}
              • You retain ownership of your personal data, journal entries, and check-ins{'\n'}
              • Your data is processed locally on your device to provide app features{'\n'}
              • You may not copy, modify, or distribute our content without permission
            </Text>

            <Text style={styles.sectionTitle}>Not Medical or Professional Advice</Text>
            <Text style={styles.paragraph}>
              MySky does not provide medical, psychological, therapeutic, financial, or legal advice. Content within the app is for personal reflection and self-exploration purposes only and should not be used as a substitute for professional advice regarding health, mental health, finances, relationships, or other important life decisions.
            </Text>
            <Text style={styles.paragraph}>
              If you are experiencing a mental health crisis, please contact a qualified mental health professional or emergency services.
            </Text>

            <Text style={styles.sectionTitle}>No Predictions or Guarantees</Text>
            <Text style={styles.paragraph}>
              MySky does not predict future events or guarantee any outcomes. Chart calculations are based on established astronomical data and are used as a reflective framework — not as predictions, fortune-telling, or deterministic guidance. All content is intended to support personal reflection and growth.
            </Text>

            <Text style={styles.sectionTitle}>Disclaimer</Text>
            <Text style={styles.paragraph}>
              MySky is provided for self-reflection and personal growth purposes. Planetary calculations are based on established astronomical data (Swiss Ephemeris) but all interpretations are generalized and not specific to any individual's circumstances.
            </Text>

            <Text style={styles.sectionTitle}>Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              MySky and its creators are not liable for any indirect, incidental, special, or consequential damages arising from your use of the app. To the maximum extent permitted by law, our total liability is limited to the amount you paid to access premium features during the twelve (12) months immediately preceding the event giving rise to the claim.
            </Text>

            <Text style={styles.sectionTitle}>Data and Privacy</Text>
            <Text style={styles.paragraph}>
              Your privacy is important to us. All data stays on your device unless you opt in to premium AI features, in which case only aggregated, non-identifying behavioral data is sent to Supabase and Anthropic for the purpose of generating AI-written reflections. Raw journal content, birth data, and personal notes are never transmitted. Please review our Privacy Policy to understand how we handle your information. Your data is never sold, shared, or used for AI training outside the scope of your own premium features.
            </Text>

            <Text style={styles.sectionTitle}>Termination</Text>
            <Text style={styles.paragraph}>
              We may revoke access to premium features for violation of these terms. You may terminate your use of MySky at any time by deleting the app, which permanently removes all locally stored data. You may also delete all your data through the Privacy Settings in the app without uninstalling.
            </Text>

            <Text style={styles.sectionTitle}>Changes to Terms</Text>
            <Text style={styles.paragraph}>
              We may update these Terms of Service from time to time. We will notify you of material changes by posting the updated terms in the app and updating the &quot;last updated&quot; date. Continued use constitutes acceptance of the new terms.
            </Text>

            <Text style={styles.sectionTitle}>Governing Law</Text>
            <Text style={styles.paragraph}>
              These terms are governed by applicable laws where you reside and where the app is offered. Any disputes will be resolved in accordance with applicable law.
            </Text>

            <Text style={styles.sectionTitle}>Contact Information</Text>
            <Text style={styles.paragraph}>
              If you have questions about these Terms of Service, please contact us at brittanyapps@outlook.com
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  lastUpdated: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  paragraph: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  bold: {
    fontWeight: '600',
    color: theme.textPrimary,
  },
});
