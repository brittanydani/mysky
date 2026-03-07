// File: app/terms.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';

// ── Cinematic Palette ──
const PALETTE = {
  gold: theme.textGold,
  silverBlue: '#8BC4E8',
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

            <Text style={styles.lastUpdated}>Last updated: March 4, 2026</Text>

            <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By downloading or using MySky, you agree to these Terms and our Privacy Policy. All personal data is stored locally on your device with <Text style={styles.highlight}>AES-256-GCM field-level encryption</Text> and hardware-backed key storage.
            </Text>

            <Text style={styles.sectionTitle}>Service Description</Text>
            <Text style={styles.paragraph}>
              MySky provides a local-first personal framework for growth, self-reflection, and astrological insight. It is intended for users aged 13 and older. Core features work fully offline without an account.
            </Text>

            <View style={styles.glassCard}>
              <Text style={[styles.subHeader, { color: PALETTE.gold }]}>Free & Premium Features</Text>
              <Text style={styles.paragraph}>
                <Text style={styles.boldText}>Free:</Text> Natal chart visualization, Big Three, daily mood/energy/stress check-ins, basic journal, sleep quality logging, balance dashboard, 2 rotating energy domains, 1 relationship chart, 3 personal story chapters, and daily astrological context.
              </Text>
              <Text style={styles.paragraph}>
                <Text style={[styles.boldText, { color: PALETTE.gold }]}>Deeper Sky:</Text> Dream journal with symbolic reflections, extended personal reflection trends, unlimited relationship synastry, all 10 personal story chapters, growth and attachment reflections, full 7-domain energy reflection, emotional quality tagging, AI Reflection Insights, personalized daily guidance with action steps, Chiron and Node depth mapping, PDF chart export, encrypted .msky backup and restore, and extended pattern reflections.
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
                <Ionicons name="medical-outline" size={18} color={PALETTE.copper} />
                <Text style={[styles.subHeader, { color: PALETTE.copper, marginBottom: 0 }]}>Not Medical Advice</Text>
              </View>
              <Text style={styles.paragraph}>
                MySky does not provide medical, psychological, or therapeutic advice. Astrological content, dream reflections, growth insights, attachment awareness, and all other features are for self-reflection purposes only. If you are in crisis, please contact emergency services immediately.
              </Text>
            </LinearGradient>

            <Text style={styles.sectionTitle}>Intellectual Property</Text>
            <Text style={styles.paragraph}>
              You retain full ownership of your personal data, including journal entries, check-ins, sleep logs, and dream content. MySky owns the app code, design, generalized interpretations, symbolic pattern mappings, and all generated astrological content.
            </Text>

            <Text style={styles.sectionTitle}>Data & Privacy</Text>
            <Text style={styles.paragraph}>
              All core data is stored locally on your device. Sensitive fields are encrypted with AES-256-GCM. No analytics SDKs, advertising identifiers, or cross-app tracking are used. For full details, see our Privacy Policy.
            </Text>

            <Text style={styles.sectionTitle}>Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              MySky is provided "as is" without warranties of any kind. We are not liable for incidental, consequential, or indirect damages, or for any decisions or choices made based on astrological content, reflective prompts, dream interpretations, or behavioral insights provided by the app.
            </Text>

            <Text style={styles.sectionTitle}>Termination</Text>
            <Text style={styles.paragraph}>
              You may stop using MySky at any time by uninstalling the app, which permanently erases all locally stored data. If you created an account for AI Reflection Insights, you may request account deletion by contacting support.
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: theme.textPrimary, 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) 
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
    backgroundColor: 'rgba(255,255,255,0.03)',
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
