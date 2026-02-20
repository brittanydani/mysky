import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';

import { theme } from '../constants/theme';
import StarField from '../components/ui/StarField';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StarField starCount={20} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/settings' as Href)}
          >
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >

          <Text style={styles.lastUpdated}>Last updated: February 18, 2026</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Encryption, Storage, and Subscriptions</Text>
            <Text style={styles.paragraph}>
              All sensitive data in MySky is encrypted at rest using AES-256. Encryption keys are securely stored using your device's hardware-backed keychain/keystore (via SecureStore). No personal data ever leaves your device unless you explicitly export an encrypted backup. Subscription status is managed by RevenueCat, which receives only an anonymized app user ID—never your journal, birth data, or other personal information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Commitment to Your Privacy</Text>
            <Text style={styles.paragraph}>
              MySky is designed with GDPR and CCPA data protection principles in mind. 
              We believe your personal information should remain private and under your control.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information We Collect</Text>
            <Text style={styles.paragraph}>
              MySky collects only the information you provide directly:
            </Text>
            <Text style={styles.bulletPoint}>• Birth date, time, and location (used to generate your personal chart)</Text>
            <Text style={styles.bulletPoint}>• Journal entries and mood check-ins you create</Text>
            <Text style={styles.bulletPoint}>• Energy check-in data you submit</Text>
            <Text style={styles.bulletPoint}>• App preferences and settings</Text>
            <Text style={styles.paragraph}>
              We do not collect device identifiers, location data beyond what you enter, advertising IDs, behavioral tracking data, or any information beyond what you explicitly provide.
            </Text>
            <Text style={styles.paragraph}>
              We do not use analytics trackers, advertising SDKs, or third-party behavioral tracking of any kind. Your journal entries and personal data never leave your device.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              Your birth information is used solely to personalize MySky for you:
            </Text>
            <Text style={styles.bulletPoint}>• Generate your natal chart for use as a reflection framework</Text>
            <Text style={styles.bulletPoint}>• Provide personalized daily guidance and growth prompts</Text>
            <Text style={styles.bulletPoint}>• Offer relationship reflection insights</Text>
            <Text style={styles.bulletPoint}>• Map emotional patterns from your chart profile</Text>
            <Text style={styles.bulletPoint}>• Generate your themes narrative and PDF export</Text>
            <Text style={styles.paragraph}>
              All processing happens on your device. We do not use your data for advertising, marketing, research, or any other purposes.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Storage and Security</Text>
            <Text style={styles.paragraph}>
              Your data is stored locally on your device using multiple layers of protection:
            </Text>
            <Text style={styles.bulletPoint}>• All data is stored in a local database on your device — never on external servers</Text>
            <Text style={styles.bulletPoint}>• Sensitive fields (birth data, journal content) are encrypted at rest with AES-256</Text>
            <Text style={styles.bulletPoint}>• Encryption keys are stored in your device&apos;s secure keychain/keystore</Text>
            <Text style={styles.bulletPoint}>• Your device passcode and biometrics provide an additional layer of protection</Text>
            <Text style={styles.bulletPoint}>• Encrypted backup is optional and requires your explicit action</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Sharing</Text>
            <Text style={styles.paragraph}>
              We do not sell, share, or monetize your personal information. Period.
            </Text>
            <Text style={styles.bulletPoint}>• No third-party advertising networks</Text>
            <Text style={styles.bulletPoint}>• No analytics tracking of personal data</Text>
            <Text style={styles.bulletPoint}>• No data brokers or marketing companies</Text>
            <Text style={styles.bulletPoint}>• No AI training on your personal information</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PDF Export</Text>
            <Text style={styles.paragraph}>
              When you export your chart as a PDF:
            </Text>
            <Text style={styles.bulletPoint}>• The PDF is generated entirely on your device</Text>
            <Text style={styles.bulletPoint}>• It is saved to your device&apos;s temporary cache, then the share sheet opens</Text>
            <Text style={styles.bulletPoint}>• You choose where to save or share the file</Text>
            <Text style={styles.bulletPoint}>• MySky does not upload or retain the PDF</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Encrypted Backup (Premium)</Text>
            <Text style={styles.paragraph}>
              If you choose to create an encrypted backup:
            </Text>
            <Text style={styles.bulletPoint}>• Your data is encrypted with AES-256 using a passphrase you create</Text>
            <Text style={styles.bulletPoint}>• A .msky backup file is created on your device</Text>
            <Text style={styles.bulletPoint}>• The share sheet opens and you choose the destination (Files, iCloud, AirDrop, email, etc.)</Text>
            <Text style={styles.bulletPoint}>• MySky never uploads your backup to any server</Text>
            <Text style={styles.bulletPoint}>• You can restore from a backup file at any time</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscriptions & Third Parties</Text>
            <Text style={styles.paragraph}>
              Subscription purchases are processed by Apple through the App Store. MySky uses RevenueCat solely to manage subscription status. RevenueCat receives only an anonymized app user ID to verify whether a purchase has been made — no journal content, birth data, or personal information is ever shared with RevenueCat or any other third party.
            </Text>
            <Text style={styles.paragraph}>
              No other third-party services, analytics platforms, advertising networks, or data brokers receive any information from MySky.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights & Data Deletion</Text>
            <Text style={styles.paragraph}>
              You have complete control over your data:
            </Text>
            <Text style={styles.bulletPoint}>• Access: View all your stored data anytime</Text>
            <Text style={styles.bulletPoint}>• Export: Download your chart as a PDF or create an encrypted backup</Text>
            <Text style={styles.bulletPoint}>• Delete: Permanently remove all data at any time using the in-app reset option in Privacy Settings, or by uninstalling the app</Text>
            <Text style={styles.bulletPoint}>• Portability: Take your data with you via encrypted backup</Text>
            <Text style={styles.bulletPoint}>• No account required: MySky works without creating any account</Text>
            <Text style={styles.paragraph}>
              Because all data is stored locally on your device, uninstalling the app fully removes all data. No data is retained on any server after deletion.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Children&apos;s Privacy</Text>
            <Text style={styles.paragraph}>
              MySky is intended for users aged 13 and older. We do not knowingly collect
              personal information from anyone under 13. If you are a parent or guardian
              and believe your child has provided personal information through this app,
              please contact us at brittanyapps@outlook.com so we can delete it promptly.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this privacy policy from time to time. We will notify you
              of any changes by posting the new policy in the app and updating the
              &quot;last updated&quot; date. Continued use of the app after an update constitutes
              acceptance of the revised policy.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions about this privacy policy or your data, 
              please contact us at:
            </Text>
            <Text style={styles.contactInfo}>brittanyapps@outlook.com</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              MySky - Built with privacy by design
            </Text>
          </View>
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
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: theme.spacing.xl,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.md,
  },
  paragraph: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  bulletPoint: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
  },
  contactInfo: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 14,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
});
