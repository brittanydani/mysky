// File: app/privacy.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';

import { theme } from '../constants/theme';
import StarField from '../components/ui/StarField';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',
  silverBlue: '#8BC4E8',
  emerald: '#6EBF8B',
  copper: '#CD7F5D',
  textMain: '#FDFBF7',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

export default function PrivacyPolicyScreen() {
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lastUpdated}>Last updated: March 3, 2026</Text>

          {/* ── Section Wrapper Helper ── */}
          <LinearGradient colors={['rgba(35, 40, 55, 0.4)', 'rgba(20, 24, 34, 0.7)']} style={styles.glassSection}>
            <Text style={styles.sectionTitle}>Our Commitment</Text>
            <Text style={styles.paragraph}>
              MySky is designed with privacy by design and by default. We do not sell your data, use analytics SDKs, or track you across the web.
            </Text>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information We Collect</Text>
            
            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Birth Data & Charts</Text>
              <Text style={styles.paragraph}>Stored exclusively on your device. Used to calculate planetary positions and house systems.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Journal & Check-Ins</Text>
              <Text style={styles.paragraph}>Free-text content and mood scores are processed entirely on-device via local NLP. Raw text is never transmitted.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Premium AI (Optional)</Text>
              <Text style={styles.paragraph}>Only if you opt-in: aggregated behavioral stats (no raw text) are sent to Supabase and Anthropic to generate reflections.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Security</Text>
            <LinearGradient colors={['rgba(110, 191, 139, 0.1)', 'rgba(20, 24, 34, 0.6)']} style={styles.securityCard}>
              <View style={styles.securityHeader}>
                <Ionicons name="lock-closed" size={18} color={PALETTE.emerald} />
                <Text style={[styles.securityTitle, { color: PALETTE.emerald }]}>Encryption at Rest</Text>
              </View>
              <Text style={styles.paragraph}>
                Sensitive fields use <Text style={styles.highlight}>AES-256-GCM</Text> encryption. Keys are stored in your device’s hardware-backed SecureStore (Keychain/Keystore).
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Third-Party Services</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>RevenueCat:</Text> Anonymous ID for subscription verification.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>OpenStreetMap:</Text> City text for geocoding (coordinates only).</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Supabase/Anthropic:</Text> For premium AI insights (if opted-in).</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Pressable style={styles.contactCard} onPress={() => {/* Linking logic */}}>
              <Ionicons name="mail-outline" size={20} color={PALETTE.gold} />
              <Text style={styles.contactInfo}>brittanyapps@outlook.com</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>MySky — Privacy as a Framework</Text>
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
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: PALETTE.textMain, 
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) 
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  lastUpdated: { fontSize: 13, color: theme.textMuted, marginBottom: 24, fontStyle: 'italic', textAlign: 'center' },
  
  section: { marginBottom: 32 },
  glassSection: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    borderTopColor: PALETTE.glassHighlight,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: PALETTE.gold,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    marginBottom: 16,
    paddingLeft: 4,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textMain,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  dataBlock: {
    marginBottom: 20,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  bulletPoint: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 4,
  },
  highlight: { color: PALETTE.silverBlue, fontWeight: '600' },
  boldText: { color: PALETTE.textMain, fontWeight: '600' },
  
  securityCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(110, 191, 139, 0.2)',
  },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  securityTitle: { fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  contactInfo: { fontSize: 16, color: PALETTE.gold, fontWeight: '600' },
  
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerText: { fontSize: 13, color: theme.textMuted, fontStyle: 'italic' },
});
