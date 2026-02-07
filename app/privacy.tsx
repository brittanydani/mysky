import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import { theme } from '../constants/theme';
import StarField from '../components/ui/StarField';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
        }} 
      />
      
      <StarField starCount={20} />
      
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last updated: February 5, 2026</Text>

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
              MySky collects only the information you provide:
            </Text>
            <Text style={styles.bulletPoint}>• Birth date, time, and location for astrological calculations</Text>
            <Text style={styles.bulletPoint}>• Journal entries you create</Text>
            <Text style={styles.bulletPoint}>• App preferences and settings</Text>
            <Text style={styles.paragraph}>
              We do not collect any other personal information, device identifiers, or tracking data.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              Your birth information is used solely to:
            </Text>
            <Text style={styles.bulletPoint}>• Generate accurate astrological charts and calculations</Text>
            <Text style={styles.bulletPoint}>• Provide personalized cosmic insights and guidance</Text>
            <Text style={styles.bulletPoint}>• Create relationship compatibility analyses</Text>
            <Text style={styles.paragraph}>
              We do not use your data for advertising, marketing, or any other purposes.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Storage and Security</Text>
            <Text style={styles.paragraph}>
              Your data is stored locally on your device using encrypted storage:
            </Text>
            <Text style={styles.bulletPoint}>• All personal data is encrypted using your device&apos;s security system</Text>
            <Text style={styles.bulletPoint}>• Data is stored in your device&apos;s secure keychain/keystore</Text>
            <Text style={styles.bulletPoint}>• No personal information is uploaded to external servers by default</Text>
            <Text style={styles.bulletPoint}>• Encrypted backup is optional and requires explicit consent</Text>
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
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <Text style={styles.paragraph}>
              You have complete control over your data:
            </Text>
            <Text style={styles.bulletPoint}>• Access: View all your stored data anytime</Text>
            <Text style={styles.bulletPoint}>• Export: Download your data in a readable format</Text>
            <Text style={styles.bulletPoint}>• Delete: Permanently remove all data from the app</Text>
            <Text style={styles.bulletPoint}>• Portability: Take your data with you</Text>
            <Text style={styles.paragraph}>
              These rights can be exercised through the Privacy Settings in the app.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Encrypted Backup (Optional)</Text>
            <Text style={styles.paragraph}>
              If you choose to enable encrypted backup:
            </Text>
            <Text style={styles.bulletPoint}>• Your data is encrypted before it leaves your device</Text>
            <Text style={styles.bulletPoint}>• Protected by a passphrase you create</Text>
            <Text style={styles.bulletPoint}>• Stored in your cloud drive for backup and restore</Text>
            <Text style={styles.bulletPoint}>• Used only for backup and restore across devices</Text>
            <Text style={styles.bulletPoint}>• Can be disabled and deleted at any time</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Children&apos;s Privacy</Text>
            <Text style={styles.paragraph}>
              MySky is not intended for children under 13. We do not knowingly collect 
              personal information from children under 13.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this privacy policy from time to time. We will notify you 
              of any changes by posting the new policy in the app and updating the 
              &quot;last updated&quot; date.
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.sm,
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
