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

            <Text style={styles.lastUpdated}>Last updated: February 18, 2026</Text>

            <Text style={styles.sectionTitle}>Encryption, Storage, and Subscriptions</Text>
            <Text style={styles.paragraph}>
              All sensitive data in MySky is encrypted at rest using AES-256. Encryption keys are securely stored using your device's hardware-backed keychain/keystore (via SecureStore). No personal data ever leaves your device unless you explicitly export an encrypted backup. Subscription status is managed by RevenueCat, which receives only an anonymized app user ID—never your journal, birth data, or other personal information.
            </Text>
            
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
              MySky is a personal growth and reflection app that provides:{'\n'}
              • Journaling and daily emotional check-ins{'\n'}
              • Trend analysis of mood, energy, and stress over time{'\n'}
              • A natal chart used as a personalization framework{'\n'}
              • Daily guidance and reflection prompts{'\n'}
              • Emotional pattern insights drawn from your chart profile{'\n'}
              • Relationship reflection tools{'\n'}
              • Encrypted backup and restore (premium)
            </Text>

            <Text style={styles.sectionTitle}>Your Data</Text>
            <Text style={styles.paragraph}>
              MySky does not require an account. All data is stored locally on your device with sensitive fields encrypted at rest using AES-256.{' '}
              You are responsible for maintaining your device&apos;s security and for any backup or PDF files you create and share.
            </Text>

            <Text style={styles.sectionTitle}>Free and Premium Features</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Free features include:</Text> Natal chart with all major aspects, Big Three (Sun, Moon, Rising), basic daily guidance, one relationship chart, journal with mood tracking, energy snapshot, PDF chart export, and privacy controls.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>&quot;Deeper Sky&quot; premium features include:</Text> Encrypted backup &amp; restore, full natal story (10 chapters), healing &amp; inner work insights, unlimited relationship charts, journal pattern analysis, Chiron &amp; Node depth mapping, full chakra mapping with check-ins, personalized guidance with action steps, and extended pattern analysis.
            </Text>

            <Text style={styles.sectionTitle}>Subscriptions and Payments</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Premium Subscriptions:</Text> MySky offers monthly, yearly, and lifetime premium subscriptions. Subscriptions automatically renew unless cancelled.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Billing:</Text> You will be charged through your device&apos;s app store (e.g. the App Store). Prices may vary by location.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Cancellation:</Text> You may cancel your subscription at any time through your device&apos;s subscription settings (Settings &gt; Apple ID &gt; Subscriptions). To avoid being charged for the next billing period, cancel at least 24 hours before the end of the current period. Cancellation takes effect at the end of the current billing period.
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
              • You grant us a license to use your data solely to provide our services on your device{'\n'}
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
              MySky and its creators are not liable for any indirect, incidental, special, or consequential damages arising from your use of the app. Our total liability is limited to the amount you paid for the service.
            </Text>

            <Text style={styles.sectionTitle}>Data and Privacy</Text>
            <Text style={styles.paragraph}>
              Your privacy is important to us. All data stays on your device. Please review our Privacy Policy to understand how we handle your information. Your data is never sold, shared, or used for AI training.
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
              These terms are governed by the laws of the United States. Any disputes will be resolved in accordance with applicable federal and state laws.
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
