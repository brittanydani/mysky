import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
            onPress={() => router.back()}
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
            <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
            
            <Text style={styles.sectionTitle}>Welcome to MySky</Text>
            <Text style={styles.paragraph}>
              These Terms of Service govern your use of the MySky mobile application and related services. By using MySky, you agree to these terms.
            </Text>

            <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By downloading, installing, or using MySky, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the app.
            </Text>

            <Text style={styles.sectionTitle}>Description of Service</Text>
            <Text style={styles.paragraph}>
              MySky is an astrological companion app that provides:{'\n'}
              • Personalized astrological insights and interpretations{'\n'}
              • Birth chart storage and analysis{'\n'}
              • Journal and mood tracking features{'\n'}
              • Premium features including encrypted backup and extended content
            </Text>

            <Text style={styles.sectionTitle}>User Accounts</Text>
            <Text style={styles.paragraph}>
              • You are responsible for maintaining the confidentiality of your account{'\n'}
              • You must provide accurate and complete information{'\n'}
              • You are responsible for all activities under your account{'\n'}
              • You must notify us immediately of any unauthorized use
            </Text>

            <Text style={styles.sectionTitle}>Subscriptions and Payments</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Premium Subscriptions:</Text> MySky offers premium subscriptions with additional features. Subscriptions automatically renew unless cancelled.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Billing:</Text> You will be charged through your App Store or Google Play account. Prices may vary by location.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Cancellation:</Text> You may cancel your subscription at any time through your device&apos;s subscription settings. Cancellation takes effect at the end of the current billing period.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Refunds:</Text> Refunds are handled according to App Store and Google Play policies.
            </Text>

            <Text style={styles.sectionTitle}>Acceptable Use</Text>
            <Text style={styles.paragraph}>
              You agree not to:{'\n'}
              • Use the app for any illegal or unauthorized purpose{'\n'}
              • Attempt to gain unauthorized access to our systems{'\n'}
              • Interfere with or disrupt the app&apos;s functionality{'\n'}
              • Share your account credentials with others{'\n'}
              • Use the app to harm, harass, or impersonate others
            </Text>

            <Text style={styles.sectionTitle}>Content and Intellectual Property</Text>
            <Text style={styles.paragraph}>
              • All app content, including text, graphics, and software, is owned by MySky or our licensors{'\n'}
              • You retain ownership of your personal data and journal entries{'\n'}
              • You grant us a license to use your data to provide our services{'\n'}
              • You may not copy, modify, or distribute our content without permission
            </Text>

            <Text style={styles.sectionTitle}>Disclaimer</Text>
            <Text style={styles.paragraph}>
              MySky is for entertainment and self-reflection purposes only. Astrological content should not be used as a substitute for professional advice regarding health, finance, relationships, or other important life decisions.
            </Text>

            <Text style={styles.sectionTitle}>Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              MySky and its creators are not liable for any indirect, incidental, special, or consequential damages arising from your use of the app. Our total liability is limited to the amount you paid for the service.
            </Text>

            <Text style={styles.sectionTitle}>Data and Privacy</Text>
            <Text style={styles.paragraph}>
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
            </Text>

            <Text style={styles.sectionTitle}>Termination</Text>
            <Text style={styles.paragraph}>
              We may terminate or suspend your account at any time for violation of these terms. You may delete your account at any time through the app settings.
            </Text>

            <Text style={styles.sectionTitle}>Changes to Terms</Text>
            <Text style={styles.paragraph}>
              We may update these Terms of Service from time to time. We will notify you of material changes through the app or by email. Continued use constitutes acceptance of the new terms.
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
