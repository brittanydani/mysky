// File: app/faq.tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';

import StarField from '../components/ui/StarField';
import { theme } from '../constants/theme';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',
  silverBlue: '#8BC4E8',
  textMain: '#FDFBF7',
  glassBorder: 'rgba(255,255,255,0.06)',
};

export default function FAQScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StarField starCount={60} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/onboarding/consent' as Href))}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={24} color={PALETTE.textMain} />
          </Pressable>

          <Text style={styles.headerTitle}>FAQ</Text>

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
          <Text style={styles.lastUpdated}>Last updated: March 3, 2026</Text>

          <View style={styles.faqSection}>
            <Text style={styles.question}>Do I need an account to use MySky?</Text>
            <Text style={styles.answer}>
              No. All core features work fully offline and do not require an account. You can track your mood, sleep, journal, and use all privacy features without ever creating an account or providing an email address.
            </Text>

            <Text style={styles.question}>What data does MySky store and where?</Text>
            <Text style={styles.answer}>
              All your data—birth data, journal entries, check-ins, sleep logs, relationship charts, and settings—is stored locally on your device. Sensitive fields are encrypted at rest using <Text style={styles.highlight}>AES-256-GCM</Text>. Nothing is ever uploaded to a server. The only external network calls are geocoding lookups and subscription verification via anonymous identifiers.
            </Text>

            <Text style={styles.question}>What are premium AI Reflection Insights and what data do they use?</Text>
            <Text style={styles.answer}>
              AI Reflection Insights are an optional premium feature that requires an account. When active, only aggregated, non-identifying behavioral statistics are sent to a Supabase Edge Function to generate reflections. <Text style={styles.highlight}>Raw journal content, birth data, and personal notes are never transmitted.</Text>
            </Text>

            <Text style={styles.question}>Are dream reflections powered by AI?</Text>
            <Text style={styles.answer}>
              No. Dream reflections are generated <Text style={styles.highlight}>entirely on your device</Text> using symbolic pattern mapping. No data is sent to any AI service or external server for this feature.
            </Text>

            <Text style={styles.question}>Is my data ever sold or shared with third parties?</Text>
            <Text style={styles.answer}>
              Never. Your data is never sold, shared for advertising, or used for AI/ML training. External data flows are limited to geocoding location text and anonymous subscription verification.
            </Text>

            <Text style={styles.question}>Can I export or delete my data?</Text>
            <Text style={styles.answer}>
              Yes. Premium users can export a PDF of their natal chart and personal story. All users can permanently delete all data from Privacy Settings within the app.
            </Text>

            <Text style={styles.question}>What happens if I uninstall the app?</Text>
            <Text style={styles.answer}>
              Uninstalling the app permanently erases all locally stored data. If you created an account for AI Reflection Insights, you can request account deletion by contacting support.
            </Text>

            <Text style={styles.question}>How do I contact support or ask privacy questions?</Text>
            <Text style={styles.answer}>
              Email <Text style={styles.highlight}>brittanyapps@outlook.com</Text>. We respond to privacy-related inquiries within 30 days.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07090F' },
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
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: PALETTE.textMain, 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) 
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },

  lastUpdated: { 
    fontSize: 12, 
    color: theme.textMuted, 
    marginBottom: 32, 
    textAlign: 'center',
    fontStyle: 'italic'
  },
  faqSection: {
    gap: 8,
  },
  question: {
    fontSize: 19,
    fontWeight: '700',
    color: PALETTE.gold,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginTop: 24,
    marginBottom: 8,
    lineHeight: 26,
  },
  answer: { 
    fontSize: 15, 
    color: theme.textSecondary, 
    lineHeight: 24, 
    marginBottom: 16 
  },
  highlight: {
    color: PALETTE.silverBlue,
    fontWeight: '600',
  }
});
