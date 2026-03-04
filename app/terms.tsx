// File: app/terms.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../constants/theme';
import StarField from '../components/ui/StarField';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  textMain: '#FDFBF7',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

export default function TermsOfServiceScreen() {
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

            <Text style={styles.lastUpdated}>Last updated: March 3, 2026</Text>

            <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By downloading or using MySky, you agree to these Terms and our Privacy Policy. All data is stored locally with <Text style={styles.highlight}>AES-256-GCM encryption</Text>.
            </Text>

            <Text style={styles.sectionTitle}>Service Description</Text>
            <Text style={styles.paragraph}>
              MySky provides a personalized framework for growth, including mood tracking, journaling, and astrological insights. It is intended for users aged 13 and older.
            </Text>

            <View style={styles.glassCard}>
              <Text style={[styles.subHeader, { color: PALETTE.gold }]}>Free & Premium Features</Text>
              <Text style={styles.paragraph}>
                <Text style={styles.boldText}>Free:</Text> Natal Chart, Big Three, Daily check-ins, and basic guidance.
              </Text>
              <Text style={styles.paragraph}>
                <Text style={[styles.boldText, { color: PALETTE.gold }]}>Deeper Sky:</Text> Dream journal, symbolic reflections, relationship depth mapping, and full behavioral trend analysis.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Subscriptions & Payments</Text>
            <Text style={styles.paragraph}>
              Premium access is available via auto-renewing subscriptions or lifetime purchase. Manage cancellations via your device App Store settings at least 24 hours before renewal.
            </Text>

            <LinearGradient 
              colors={['rgba(205, 127, 93, 0.1)', 'rgba(20, 24, 34, 0.6)']} 
              style={styles.disclaimerCard}
            >
              <View style={styles.disclaimerHeader}>
                <Ionicons name="medical-outline" size={18} color={PALETTE.copper} />
                <Text style={[styles.subHeader, { color: PALETTE.copper, marginBottom: 0 }]}>Not Medical Advice</Text>
              </View>
              <Text style={styles.paragraph}>
                MySky does not provide medical or psychological therapy. Our content is for self-reflection only. If in crisis, please contact emergency services.
              </Text>
            </LinearGradient>

            <Text style={styles.sectionTitle}>Intellectual Property</Text>
            <Text style={styles.paragraph}>
              You retain ownership of your personal journal entries and check-ins. MySky owns the app code, design, and generalized interpretations.
            </Text>

            <Text style={styles.sectionTitle}>Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              MySky is provided "as is." We are not liable for incidental damages or choices made based on generalized reflective prompts.
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
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: PALETTE.textMain, 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) 
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  lastUpdated: { fontSize: 13, color: theme.textMuted, marginBottom: 24, fontStyle: 'italic', textAlign: 'center' },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PALETTE.gold,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginTop: 24,
    marginBottom: 12,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textMain,
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
    borderColor: PALETTE.glassBorder,
    marginVertical: 16,
  },
  disclaimerCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(205, 127, 93, 0.2)',
    marginVertical: 16,
  },
  disclaimerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  highlight: { color: PALETTE.silverBlue, fontWeight: '600' },
  boldText: { color: PALETTE.textMain, fontWeight: '600' },
  email: { color: PALETTE.gold, fontWeight: '700', fontSize: 16 },
  contactCard: { marginTop: 24, paddingBottom: 40 },
});
