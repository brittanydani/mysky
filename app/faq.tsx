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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';

import { type AppTheme } from '../constants/theme';
import { SUPPORT_EMAIL } from '../constants/config';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { useThemedStyles } from '../context/ThemeContext';
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
  const styles = useThemedStyles(createStyles);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(162, 194, 225, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(168, 139, 235, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => onBack ? onBack() : (router.canGoBack() ? router.back() : undefined)}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MetallicIcon name="chevron-back-outline" size={22} variant="gold" />
          </Pressable>
        </View>
        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>FAQ</Text>
          <GoldSubtitle style={styles.headerSubtitle}>Technical &amp; Privacy Guidance</GoldSubtitle>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
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

          <Text style={styles.lastUpdated}>Last updated: April 21, 2026</Text>

          {/* Main FAQ Anchor Card */}
          <View style={[styles.faqCard, styles.velvetBorder]}>
            <LinearGradient 
              colors={['rgba(44, 54, 69, 0.85)', 'rgba(26, 30, 41, 0.40)']} 
              style={StyleSheet.absoluteFill} 
            />
            
            <View style={styles.faqContent}>
              <Text style={styles.question}>Do I need an account to use MySky?</Text>
              <Text style={styles.answer}>
                Yes. A free account is required. Your personal data is efficiently logged in offline caches on your device and seamlessly synced to the cloud. All core features — mood tracking, journaling, sleep, AI dream interpretation, and birth charts — are available for free.
              </Text>

              <Text style={styles.question}>What's included for free vs. Deeper Sky?</Text>
              <Text style={styles.answer}>
                <MetallicText color={PALETTE.atmosphere} style={styles.highlight}>Free:</MetallicText> Personal birth chart, Big Three, daily mood/energy/stress check-ins, basic journaling, and standard AI dream interpretation.{"\n\n"}
                <MetallicText color={PALETTE.atmosphere} style={styles.highlight}>Deeper Sky:</MetallicText> Richer AI models, extended reflection trends, unlimited charts, full chakra Energy system, encrypted backup, and more reflective guidance grounded in your own history.
              </Text>

              <Text style={styles.question}>What data does MySky store and where?</Text>
              <Text style={styles.answer}>
                Birth data, journal entries, check-ins, and dreams are stored locally in a SQLite database. Sensitive fields are encrypted using <MetallicText color={PALETTE.atmosphere} style={styles.highlight}>AES-256-GCM</MetallicText> with keys stored in your device's hardware-backed Secure Enclave.
              </Text>

              <Text style={styles.question}>Are dream reflections powered by AI?</Text>
              <Text style={styles.answer}>
                They combine on-device symbolic analysis with an AI narrative pass from Google Gemini. We extract pattern context locally and only send dream text and feelings for the final narrative pass. These reflections are for personal meaning-making, not diagnosis.
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

              <Text style={styles.question}>How do I cancel my Deeper Sky subscription?</Text>
              <Text style={styles.answer}>
                {'On iOS: open the Settings app → tap your Apple ID → Subscriptions → MySky → Cancel.\n\nOn Android: open the Play Store → Profile → Payments & subscriptions → Subscriptions → MySky → Cancel.\n\nCancellation takes effect at the end of the current billing period. You keep access to premium features until that date.'}
              </Text>

              <Text style={styles.question}>Can I restore my subscription on a new device?</Text>
              <Text style={styles.answer}>
                Yes. Sign in with the same account used to purchase Deeper Sky, then tap "Restore Purchases" in the Premium screen. Your subscription will be recognized automatically. Make sure you are signed into the same Apple ID or Google account used at purchase.
              </Text>

              <Text style={styles.question}>What happens to my data if I delete the app?</Text>
              <Text style={styles.answer}>
                Deleting the app may leave the local database behind depending on system settings. For a guaranteed full wipe, go to Settings → Privacy & Data → Hard Reset before uninstalling. This cryptographically destroys your encryption key and purges the database — data becomes irrecoverable.
              </Text>

              <Text style={styles.question}>How do I delete my account?</Text>
              <Text style={styles.answer}>
                {`Perform a Hard Reset first (Settings → Privacy & Data → Hard Reset) to erase all on-device data. Then email us at ${SUPPORT_EMAIL} to request deletion of your Supabase authentication account. We'll confirm deletion within 5 business days.`}
              </Text>

              <Text style={styles.question}>Can I use MySky on multiple devices?</Text>
              <Text style={styles.answer}>
                Your MySky account is the source of truth. When you sign in on a new device, your synced data is restored from your account automatically. This device keeps a local encrypted cache for speed and offline access, but switching accounts does not merge personal data between users.
              </Text>

              <Text style={styles.question}>What AI models does MySky use?</Text>
              <Text style={styles.answer}>
                Dream interpretation and AI Reflection Insights use Google Gemini. Free accounts use the standard Gemini model. Deeper Sky subscribers access a richer model with more nuanced and contextual responses. AI features are always optional — they only activate on your explicit tap.
              </Text>

              <Text style={styles.question}>What gets sent to AI when I use dream interpretation?</Text>
              <Text style={styles.answer}>
                Only your dream text and the feelings you tagged. No birth data, location, identity, account email, somatic logs, or other personal context is included. Pattern context (symbols, archetypes) is extracted on-device first; only the minimal narrative payload is transmitted.
              </Text>

              <Text style={styles.question}>How does astrology work in MySky?</Text>
              <Text style={styles.answer}>
                MySky uses the Swiss Ephemeris library — the same planetary calculation engine used by professional astrological software — running entirely on-device. Planetary positions, house cusps, and aspects are computed locally from your birth date, time, and location. No data is sent to a server for chart calculations.
              </Text>

              <Text style={styles.question}>What is the difference between house systems?</Text>
              <Text style={styles.answer}>
                MySky defaults to Whole Sign houses, which assigns one full zodiac sign per house starting from your Ascendant sign. This is one of the oldest and most widely used systems. Other systems (Placidus, Koch, Equal House) divide the sky differently based on time and geography. The house system affects house cusp positions but not planetary sign placements.
              </Text>

              <Text style={styles.question}>What if I don't know my birth time?</Text>
              <Text style={styles.answer}>
                Check "I don't know" when entering birth details. MySky will use solar noon as a placeholder. Your Sun, Moon, and most planetary signs will still be accurate. Your Ascendant, Midheaven, and house placements will be approximate. The Moon sign may also be uncertain if you were born near a Moon sign change.
              </Text>

              <Text style={styles.question}>What is somatic body mapping?</Text>
              <Text style={styles.answer}>
                Somatic body mapping lets you log where you feel emotions, stress, or tension in your body by tapping a body diagram. Over time, patterns emerge — for example, consistently feeling anxiety in your chest or tension in your shoulders. This is a self-awareness tool, not a medical or therapeutic diagnosis.
              </Text>

              <Text style={styles.question}>What is the nervous system trigger log?</Text>
              <Text style={styles.answer}>
                The trigger log lets you record situations, thoughts, or sensations that activate your nervous system — fight, flight, freeze, or fawn responses. Logging these over time helps you recognize personal patterns. All entries are encrypted and stored locally only.
              </Text>

              <Text style={styles.question}>How do I update my birth data or relationship charts?</Text>
              <Text style={styles.answer}>
                To update your own birth data, go to Settings → Birth Data. For relationship charts, open the chart from the Relationships screen and tap Edit. Your chart will regenerate immediately after saving.
              </Text>

              <Text style={styles.question}>How do I export or share my birth chart?</Text>
              <Text style={styles.answer}>
                Deeper Sky subscribers can export a PDF of their birth chart via the chart screen using the export button. Use your device's share sheet to send it to Files, email, AirDrop, or any app. Free users can take screenshots of their chart.
              </Text>

              <Text style={styles.question}>What is the encrypted .msky backup file?</Text>
              <Text style={styles.answer}>
                A .msky file is a full encrypted snapshot of your MySky database protected by a passphrase you choose. It is created and decrypted entirely on-device — we never have access to it. Store it in iCloud Drive, a Files folder, or anywhere you keep important documents. If you forget the passphrase, the backup cannot be recovered by anyone.
              </Text>

              <Text style={styles.question}>What platforms does MySky support?</Text>
              <Text style={styles.answer}>
                MySky is available on iOS (iPhone and iPad) and Android. The minimum supported iOS version is iOS 16. Some features — such as encrypted backup — rely on platform-specific secure hardware and may behave slightly differently between iOS and Android.
              </Text>

              <Text style={styles.question}>Why does MySky require an account if everything is stored locally?</Text>
              <Text style={styles.answer}>
                A free account serves three purposes: it enables subscription restoration across devices, it gates optional network features (AI interpretation, geocoding), and it provides a way to recover Deeper Sky access on a new device. Your account stores only your email and subscription status — no personal reflection data.
              </Text>

              <Text style={styles.question}>I'm having trouble signing in. What should I do?</Text>
              <Text style={styles.answer}>
                {`Tap "Forgot Password" on the sign-in screen to receive a reset link. Make sure you're using the email address you registered with. If the issue persists, email us at ${SUPPORT_EMAIL} with your device model and iOS/Android version.`}
              </Text>

              <Text style={styles.question}>How do I report a bug or send feedback?</Text>
              <Text style={styles.answer}>
                {`Email us at ${SUPPORT_EMAIL}. Include a description of the issue, your device model, OS version, and app version (found in Settings → About). Screenshots or screen recordings are always helpful.`}
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
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  glowOrb: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.6 },

  velvetBorder: {
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderRightColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },

  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea: { paddingHorizontal: 24, paddingBottom: 8 },
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -1,
  },
  headerSubtitle: { marginBottom: 4 },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  
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
