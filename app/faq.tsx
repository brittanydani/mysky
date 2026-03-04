// File: app/faq.tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';

import StarField from '../components/ui/StarField';
import { theme } from '../constants/theme';

export default function FAQScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StarField starCount={10} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/settings' as Href))}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
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

          <Text style={styles.question}>Do I need an account to use MySky?</Text>
          <Text style={styles.answer}>
            No. All core features work fully offline and do not require an account. You can track your mood, sleep, journal, and use all privacy features without ever creating an account or providing an email address.
          </Text>

          <Text style={styles.question}>What data does MySky store and where?</Text>
          <Text style={styles.answer}>
            All your data—birth data, journal entries, check-ins, sleep logs, relationship charts, and settings—is stored locally on your device. Sensitive fields are encrypted at rest using AES-256-GCM. Nothing is uploaded to any server unless you opt in to premium AI features.
          </Text>

          <Text style={styles.question}>What are premium AI features and what data do they use?</Text>
          <Text style={styles.answer}>
            Premium AI-generated reflection features are optional and require creating an account. If you opt in, your email and a hashed password are stored with our authentication provider (Supabase). Only aggregated, non-identifying behavioral data (such as mood/energy/stress averages and theme-tag correlations) is sent to Supabase and Anthropic (Claude AI) to generate AI-written reflections. Raw journal content, birth data, and personal notes are never transmitted to any external server.
          </Text>

          <Text style={styles.question}>Is my data ever sold or used for advertising or third-party AI training?</Text>
          <Text style={styles.answer}>
            Never. Your data is never sold, shared for advertising, or used for third-party AI/ML training. Aggregated data sent for premium AI features is used only to generate your own reflections and is never used for broader model training.
          </Text>

          <Text style={styles.question}>Can I export or delete my data?</Text>
          <Text style={styles.answer}>
            Yes. You can export your data as a PDF or encrypted backup at any time. You can also permanently delete all your data from within the app, or by uninstalling the app.
          </Text>

          <Text style={styles.question}>What happens if I uninstall the app?</Text>
          <Text style={styles.answer}>
            Uninstalling the app permanently erases all locally stored data, including your encrypted database and keychain entries. If you have a premium account, you can delete your account data from within the app or by contacting support.
          </Text>

          <Text style={styles.question}>How do I contact support or ask privacy questions?</Text>
          <Text style={styles.answer}>
            Email brittanyapps@outlook.com. We respond to privacy-related inquiries within 30 days.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },

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
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif' },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },

  lastUpdated: { fontSize: 12, color: theme.textMuted, marginBottom: theme.spacing.xl, textAlign: 'center' },
  question: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  answer: { fontSize: 15, color: theme.textSecondary, lineHeight: 22, marginBottom: theme.spacing.md },
});
