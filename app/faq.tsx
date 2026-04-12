// app/faq.tsx
// MySky — Frequently Asked Questions
//
// High-End "Lunar Sky" & "Midnight Slate" Aesthetic Update:
// 1. Purged generic matte grey cards and "muddy" brownish backgrounds.
// 2. Implemented "Midnight Slate" for the main FAQ anchor shell.
// 3. Refined header into a cinematic "Hardware" navigation bar.
// 4. Integrated "Velvet Glass" 1px directional light-catch borders globally.
// 5. Assigned Atmosphere Blue for technical specifications and emphasis.

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';

import { type AppTheme } from '../constants/theme';
import { SUPPORT_EMAIL } from '../constants/config';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { useAppTheme, useThemedStyles } from '../context/ThemeContext';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { MetallicText } from '../components/ui/MetallicText';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#D4AF37',       // Metallic Brand Gold
  atmosphere: '#A2C2E1', // Technical Emphasis (Icy Blue)
  slateMid: '#2C3645',   // Anchor Slate Top
  slateDeep: '#1A1E29',  // Anchor Slate Bottom
};

export default function FAQScreen({ onBack }: { onBack?: () => void } = {}) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        
        {/* Cinematic Header Bar */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }, styles.velvetBorder]}>
          <LinearGradient 
            colors={['rgba(44, 54, 69, 0.4)', 'transparent']} 
            style={StyleSheet.absoluteFill} 
          />
          <View style={styles.headerRow}>
            <Pressable
              style={styles.backButton}
              onPress={() => onBack ? onBack() : (router.canGoBack() ? router.back() : undefined)}
            >
              <MetallicIcon name="chevron-back-outline" size={22} variant="gold" />
            </Pressable>
            
            <View style={styles.titleArea}>
              <Text style={styles.headerTitle}>FAQ</Text>
              <GoldSubtitle style={styles.headerSubtitle}>Technical & Privacy Guidance</GoldSubtitle>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 60 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroIconWrap}>
            <LinearGradient
              colors={['rgba(162, 194, 225, 0.15)', 'rgba(162, 194, 225, 0.05)']}
              style={styles.heroIconCircle}
            >
              <MetallicIcon name="help-circle-outline" size={64} variant="gold" />
            </LinearGradient>
          </View>

          <Text style={styles.lastUpdated}>Last updated: April 7, 2026</Text>

          {/* Main FAQ Anchor Card */}
          <View style={[styles.faqCard, styles.velvetBorder]}>
            <LinearGradient 
              colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} 
              style={StyleSheet.absoluteFill} 
            />
            
            <View style={styles.faqContent}>
              <Text style={styles.question}>Do I need an account to use MySky?</Text>
              <Text style={styles.answer}>
                Yes. A free account is required. Your credentials live on Supabase, while all personal data stays on your device. All core features — mood tracking, journaling, sleep, AI dream interpretation, and birth charts — are available for free.
              </Text>

              <Text style={styles.question}>What's included for free vs. Deeper Sky?</Text>
              <Text style={styles.answer}>
                <MetallicText color={PALETTE.atmosphere} style={styles.highlight}>Free:</MetallicText> Personal birth chart, Big Three, daily mood/energy/stress check-ins, basic journaling, and standard AI dream interpretation.{"\n\n"}
                <MetallicText color={PALETTE.atmosphere} style={styles.highlight}>Deeper Sky:</MetallicText> Richer AI models, extended reflection trends, unlimited charts, full chakra Energy system, encrypted backup, and personalized daily guidance.
              </Text>

              <Text style={styles.question}>What data does MySky store and where?</Text>
              <Text style={styles.answer}>
                Birth data, journal entries, check-ins, and dreams are stored locally in a SQLite database. Sensitive fields are encrypted using <MetallicText color={PALETTE.atmosphere} style={styles.highlight}>AES-256-GCM</MetallicText> with keys stored in your device's hardware-backed Secure Enclave.
              </Text>

              <Text style={styles.question}>Are dream reflections powered by AI?</Text>
              <Text style={styles.answer}>
                They combine on-device symbolic analysis with an AI narrative pass from Google Gemini. We extract pattern context locally and only send dream text and feelings for the final narrative pass.
              </Text>

              <Text style={styles.question}>Is my data ever sold or shared?</Text>
              <Text style={styles.answer}>
                Never. Your data is never sold, shared for advertising, or used for AI/ML training. We do not collect advertising identifiers or perform cross-app tracking.
              </Text>

              <Text style={styles.question}>How does backup and restore work?</Text>
              <Text style={styles.answer}>
                Premium users can create an encrypted <MetallicText color={PALETTE.atmosphere} style={styles.highlight}>.msky</MetallicText> backup file protected with a passphrase. You control the destination (Files, iCloud, AirDrop). We never see your backup.
              </Text>

              <Text style={styles.question}>Is MySky a therapy substitute?</Text>
              <Text style={styles.answer}>
                No. MySky is a self-reflection tool. It does not constitute therapy, counseling, or psychological diagnosis. If you are in crisis, please call or text <MetallicText color={PALETTE.gold} style={styles.highlight}>988</MetallicText> (US).
              </Text>

              <Text style={styles.question}>Does MySky work offline?</Text>
              <Text style={styles.answer}>
                Yes. After initial sign-in, all core features work fully offline. Internet is only required for authentication, geocoding, and optional AI features.
              </Text>

              <View style={styles.supportBox}>
                <Text style={styles.supportLabel}>QUESTIONS OR PRIVACY INQUIRIES?</Text>
                <MetallicText color={PALETTE.gold} style={styles.supportEmail}>{SUPPORT_EMAIL}</MetallicText>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  safeArea: { flex: 1 },
  
  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 44 },
  titleArea: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32 },
  
  heroIconWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(162, 194, 225, 0.2)',
  },

  lastUpdated: { 
    fontSize: 11, 
    color: 'rgba(255,255,255,0.3)', 
    marginBottom: 24, 
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  faqCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 32,
  },
  faqContent: {
    padding: 28,
  },
  question: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D4AF37',
    marginTop: 24,
    marginBottom: 10,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  answer: { 
    fontSize: 15, 
    color: 'rgba(255,255,255,0.65)', 
    lineHeight: 24, 
    marginBottom: 16 
  },
  highlight: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  supportBox: {
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  supportLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  supportEmail: {
    fontSize: 16,
    fontWeight: '700',
  }
});
