// File: app/faq.tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../constants/theme';
import { SUPPORT_EMAIL } from '../constants/config';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';

// ── Cinematic Palette ──
const PALETTE = {
  gold: theme.textGold,
  silverBlue: '#C9AE78',
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
};

export default function FAQScreen({ onBack }: { onBack?: () => void } = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <Pressable
              style={styles.backButton}
              onPress={() => onBack ? onBack() : (router.canGoBack() ? router.back() : undefined)}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back-outline" size={22} color={theme.textPrimary} />
            </Pressable>
            
            <View style={styles.titleArea}>
              <Text style={styles.headerTitle}>FAQ</Text>
              <GoldSubtitle style={styles.headerSubtitle}>Frequently Asked Questions</GoldSubtitle>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name="help-circle-outline" size={132} color={theme.textGold} />
          </View>

          <Text style={styles.lastUpdated}>Last updated: April 7, 2026</Text>

          <View style={styles.faqSection}>
            <View style={styles.faqCard}>
            <Text style={styles.question}>Do I need an account to use MySky?</Text>
            <Text style={styles.answer}>
              Yes. A free account (email and password) is required to use MySky. Your authentication credentials are stored securely on Supabase, while all personal data (journal entries, check-ins, birth data, etc.) stays on your device. Sign-up takes only a minute. All core features — mood tracking, journaling, sleep logging, AI dream interpretation, and birth chart — are available on the free plan. Free users also get 1 relationship chart. A Deeper Sky subscription is required for premium upgrades such as the richer dream model, AI Reflection Insights, and encrypted backup.
            </Text>

            <Text style={styles.question}>What's included for free vs. Deeper Sky?</Text>
            <Text style={styles.answer}>
              <Text style={styles.highlight}>Free:</Text> Personal birth chart, Big Three, daily mood/energy/stress check-ins, basic journaling, sleep quality logging, AI dream interpretation with the standard Gemini model, balance dashboard, 2 rotating energy domains, 1 relationship chart, 3 personal story chapters, and daily context with moon phase and transit awareness.{"\n\n"}
              <Text style={styles.highlight}>Deeper Sky:</Text> Dream journal with AI interpretation using a richer Gemini model, extended personal reflection trends, unlimited relationship charts, all 10 personal story chapters, growth and attachment reflections, full chakra energy reading with all 7 chakras, emotional quality tagging, AI Reflection Insights, personalized daily guidance with action steps, sensitivity and growth mapping, PDF chart export, encrypted backup and restore, and extended pattern reflections.
            </Text>

            <Text style={styles.question}>What data does MySky store and where?</Text>
            <Text style={styles.answer}>
              Most of your data — birth data, journal entries, check-ins, sleep logs, dream content, relationship charts, energy readings, and settings — is stored locally on your device in a SQLite database. Sensitive fields (journal text, birth places, coordinates, dream content, mood/stress/energy scores, emotional tags, notes, wins, and challenges) are encrypted at rest using <Text style={styles.highlight}>AES-256-GCM</Text> with keys stored in your device's hardware-backed secure storage in the iOS Keychain. Your authentication credentials are stored on Supabase. External network calls are limited to authentication, password recovery email delivery, geocoding lookups (city name only), subscription verification through RevenueCat, operational telemetry through Sentry, and optional AI features.
            </Text>

            <Text style={styles.question}>What are AI Reflection Insights and what data do they use?</Text>
            <Text style={styles.answer}>
              AI Reflection Insights are an optional premium feature. When active, only aggregated, non-identifying behavioral statistics — mood/stress/energy trends, averages, top restoring and draining tags, and correlation data — are sent to a Supabase Edge Function that calls Anthropic Claude. <Text style={styles.highlight}>Raw journal text, birth data, dream content, and personal notes are never transmitted.</Text> Requests are rate limited to 5 per hour and cached once per calendar day.
            </Text>

            <Text style={styles.question}>Are dream reflections powered by AI?</Text>
            <Text style={styles.answer}>
              Dream reflections combine on-device symbolic analysis with an AI narrative pass from Google Gemini. The app first extracts symbols, feelings, and pattern context locally, then sends only dream text and selected dream feelings for the AI interpretation. Free users use the standard Gemini model, while Deeper Sky uses a richer model for more depth.
            </Text>

            <Text style={styles.question}>How does the journal NLP analysis work?</Text>
            <Text style={styles.answer}>
              Journal entries are analyzed <Text style={styles.highlight}>entirely on your device</Text> using local NLP — keyword extraction (TF-weighted), emotion bucket scoring across 7 categories, and sentiment scoring. These are pure functions with no network calls. All results are encrypted at rest alongside your journal content.
            </Text>

            <Text style={styles.question}>Is my data ever sold or shared with third parties?</Text>
            <Text style={styles.answer}>
              Never. Your data is never sold, shared for advertising, or used for AI/ML training. MySky does not collect advertising identifiers or perform cross-app tracking. Limited disclosures to service providers include authentication (Supabase), password recovery delivery (Resend), city name geocoding (OpenStreetMap), subscription verification (RevenueCat), operational crash/error telemetry (Sentry), and optional AI features (Supabase/Anthropic/Google Gemini — aggregated stats or dream text only).
            </Text>

            <Text style={styles.question}>Can I export or delete my data?</Text>
            <Text style={styles.answer}>
              Yes. All users can export a complete structured JSON archive of all personal data via Privacy Settings, and permanently delete all data using the "Hard Reset" option. Premium users can also export a PDF of their natal chart and full personal story, and create encrypted .msky backup files protected with a passphrase of your choice (AES-256-GCM with PBKDF2-SHA256, 100,000 iterations).
            </Text>

            <Text style={styles.question}>How does backup and restore work?</Text>
            <Text style={styles.answer}>
              Premium users can create an encrypted .msky backup file protected with a passphrase you choose. The file is shared via your device's share sheet — MySky never uploads it to any server. You control where it goes (Files, iCloud Drive, AirDrop, email, etc.). To restore, pick the .msky file and enter your passphrase. Backups can also be restored during onboarding before entering birth data.
            </Text>

            <Text style={styles.question}>What astrological calculations does MySky use?</Text>
            <Text style={styles.answer}>
              MySky uses the Swiss Ephemeris (gold-standard astronomical accuracy) as its primary calculation engine, with a JavaScript fallback. All calculations run entirely on your device. Supported house systems include Placidus, Koch, Whole Sign, Equal House, Campanus, Regiomontanus, and Topocentric. Moon phases are calculated via the astronomy-engine library.
            </Text>

            <Text style={styles.question}>What happens if I uninstall the app?</Text>
            <Text style={styles.answer}>
              Uninstalling the app removes the app sandbox, including the local SQLite database. On some platforms, small secure-storage items may persist until the OS clears them, so uninstalling alone should not be treated as a guaranteed secure wipe. If you want a guaranteed local wipe of protected data, use Hard Reset before uninstalling. If you created a backup (.msky file), your data can be restored on a new installation. You can request account deletion by contacting support.
            </Text>

            <Text style={styles.question}>Is MySky a mental health app or therapy substitute?</Text>
            <Text style={styles.answer}>
              No. MySky is a self-reflection and personal growth tool. None of its features — including somatic body mapping, nervous system trigger logs, core values exercises, psychological archetype profiles, cognitive style assessments, astrological guidance, dream reflections, healing path prompts, or emotional pattern analysis — constitute therapy, counseling, psychological diagnosis, or medical advice of any kind. These tools are for self-awareness and personal exploration only.
            </Text>
            <Text style={styles.answer}>
              {'If you are in crisis or need mental health support, please reach out:\n\n'}{'• Call or text 988 (Suicide & Crisis Lifeline, US)\n'}{'• Text HOME to 741741 (Crisis Text Line)\n'}{'• Visit findahelpline.com for international resources\n'}{'• Call 911 or your local emergency number if in immediate danger'}
            </Text>

            <Text style={styles.question}>What self-discovery tools does MySky include?</Text>
            <Text style={styles.answer}>
              MySky includes tools for exploring yourself from multiple angles: a <Text style={styles.highlight}>Core Values Inventory</Text> (rank what matters most and watch contradictions surface over time), a <Text style={styles.highlight}>Jungian Archetype Profile</Text> (discover patterns like Hero, Caregiver, Seeker through reflection prompts — not birth data), a <Text style={styles.highlight}>Cognitive Style</Text> self-assessment, a <Text style={styles.highlight}>Somatic Map</Text> for tracking where emotions live in your body, and a <Text style={styles.highlight}>Trigger Log</Text> for building a personal nervous system profile. All data stays on your device, encrypted.
            </Text>

            <Text style={styles.question}>How do I manage my subscription?</Text>
            <Text style={styles.answer}>
              Deeper Sky subscriptions (monthly, yearly, or lifetime) are managed through your device's App Store or Google Play settings. Cancel at least 24 hours before renewal. Access continues through the end of your billing period. You can restore purchases at any time from the premium screen.
            </Text>

            <Text style={styles.question}>How do I contact support or ask privacy questions?</Text>
            <Text style={styles.answer}>
              Email <Text style={styles.highlight}>{SUPPORT_EMAIL}</Text>. We respond to privacy-related inquiries within 30 days.
            </Text>

            <Text style={styles.question}>How old do I need to be to use MySky?</Text>
            <Text style={styles.answer}>
              MySky is intended for users aged 17 and older. By using the app, you confirm that you meet this age requirement. We do not knowingly collect personal information from anyone under 17.
            </Text>

            <Text style={styles.question}>Does MySky work offline?</Text>
            <Text style={styles.answer}>
              Yes. After initial sign-in, all core features — daily check-ins, journaling, natal chart, dream logging, sleep tracking, somatic map, trigger log, energy readings, personal story, and self-discovery tools — work fully offline with no internet connection. The only features that require a network connection are initial authentication, city name geocoding (when entering a birth place), subscription verification (RevenueCat), and the optional AI features.
            </Text>

            <Text style={styles.question}>What happens if I withdraw my privacy consent?</Text>
            <Text style={styles.answer}>
              You can withdraw your data processing consent at any time in Privacy Settings. When consent is withdrawn, MySky stops writing new personal data but preserves your existing data so nothing is lost. You can restore consent at any time to resume full functionality. You can also perform a Hard Reset at any time to permanently erase all data.
            </Text>

            <Text style={styles.question}>Do the iOS home screen widgets share my data?</Text>
            <Text style={styles.answer}>
              No. MySky's iOS widgets display recent check-in data (mood, energy, sleep scores) using a sandboxed App Group container on your device. This data never leaves your device and is not transmitted to any server or third party.
            </Text>

            <Text style={styles.question}>Will MySky's terms or privacy policy change?</Text>
            <Text style={styles.answer}>
              We may update our Terms of Use or Privacy Policy from time to time. When material changes are made, the "Last updated" date will be revised and — if the change affects how your data is processed — we will re-request your consent within the app. We encourage you to review these documents periodically.
            </Text>

            <Text style={styles.question}>What is the Daily Reflection feature?</Text>
            <Text style={styles.answer}>
              Daily Reflection provides a rotating set of guided self-inquiry prompts drawn from a curated question library. The prompts are presented alongside your current astrological context (moon phase, active transits) to help you notice patterns connected to real-time cycles. All reflection data stays on your device and is encrypted at rest.
            </Text>

            <Text style={styles.question}>How does the Energy Tracking system work?</Text>
            <Text style={styles.answer}>
              MySky maps your chart into a chakra-based energy system. Free users see an energy snapshot with select insights, while Deeper Sky unlocks the full seven-chakra reading with body cues, triggers, guidance, and daily pattern tracking.
            </Text>

            <Text style={styles.question}>What is the Balance Dashboard?</Text>
            <Text style={styles.answer}>
              The Balance Dashboard aggregates your mood, energy, stress, and sleep data into a unified daily snapshot. It shows trends over time, highlights correlations between different data points (e.g., sleep quality vs. mood), and surfaces patterns you might not notice on your own. All correlation calculations happen on your device.
            </Text>

            <Text style={styles.question}>What is the Personal Story feature?</Text>
            <Text style={styles.answer}>
              Personal Story organizes your natal chart into narrative chapters — up to 10 total — covering themes like identity, emotional landscape, communication style, relationships, and purpose. Free users access 3 chapters; Deeper Sky unlocks all 10. Story content is generated from your birth data using on-device interpretation engines, not AI.
            </Text>

            <Text style={styles.question}>How does the Somatic Body Map work?</Text>
            <Text style={styles.answer}>
              The Somatic Map lets you log where you feel emotions in your body — selecting body regions, tagging linked emotions, and rating intensity. Over time, it builds a visual map of your embodied emotional patterns. This is among the most sensitive data in the app and is encrypted with <Text style={styles.highlight}>AES-256-GCM</Text>. It is never transmitted to any server.
            </Text>

            <Text style={styles.question}>What is the Trigger Log / Nervous System Profile?</Text>
            <Text style={styles.answer}>
              The Trigger Log helps you track emotional triggers, dysregulation patterns, and restoring practices. Over time it builds a personal nervous system profile showing what activates you, what helps you return to baseline, and how your window of tolerance shifts. All entries are encrypted at rest and never leave your device.
            </Text>

            <Text style={styles.question}>What are Relationship Patterns?</Text>
            <Text style={styles.answer}>
              Relationship Patterns is a self-reflection tool for tracking recurring relational dynamics — communication tendencies, attachment observations, and interpersonal patterns you notice over time. This is separate from the synastry chart feature and does not use birth data. All entries are stored locally and encrypted.
            </Text>

            <Text style={styles.question}>How do Relationship / Synastry Charts work?</Text>
            <Text style={styles.answer}>
              You can add a partner's birth data to generate a synastry chart showing planetary aspects between your charts. Free users get 1 relationship chart; Deeper Sky unlocks unlimited. Partner birth data is stored locally and encrypted with the same <Text style={styles.highlight}>AES-256-GCM</Text> encryption as your own data. All astrological calculations happen on-device.
            </Text>

            <Text style={styles.question}>What is the Inner World / Inner Tensions feature?</Text>
            <Text style={styles.answer}>
              Inner World visualizes the psychological forces at play in your chart — conflicting drives, unresolved tensions, and growth edges. Inner Tensions maps specific chart aspects that create internal friction (e.g., a square between your Moon and Saturn). These features use on-device chart analysis and are available to Deeper Sky subscribers.
            </Text>

            <Text style={styles.question}>What is the Sanctuary space?</Text>
            <Text style={styles.answer}>
              Sanctuary is a calming, visually immersive space within the app designed for grounding and self-regulation. It includes a breathing ring for guided breathwork, pulse monitoring visualization, and ambient cosmic scenery. No data is collected or stored from the Sanctuary — it's a tool for present-moment awareness.
            </Text>

            <Text style={styles.question}>How does AI-Enhanced Dream Interpretation work?</Text>
            <Text style={styles.answer}>
              When available, dream text and selected dream feelings are sent to Google Gemini to generate the narrative interpretation shown in the app. <Text style={styles.highlight}>No birth data, user identifiers, or other personal information is included.</Text> The app still performs on-device symbolic analysis first to extract context and guardrails. Free users use the standard Gemini model, while Deeper Sky uses a richer model for more nuance.
            </Text>

            <Text style={styles.question}>What are AI Pattern Insights?</Text>
            <Text style={styles.answer}>
              AI Pattern Insights use aggregated self-knowledge context — your dominant archetype, top core values, cognitive style summary, top somatic region, top relationship pattern tags, and check-in averages — to generate personalized cross-domain reflections via Google Gemini. <Text style={styles.highlight}>Raw journal text, birth data, dream content, and personal notes are never transmitted.</Text> This is a premium feature.
            </Text>

            <Text style={styles.question}>What is the Growth & Healing Journey feature?</Text>
            <Text style={styles.answer}>
              The Growth screen tracks your personal development journey based on patterns surfaced from your check-ins, journal entries, and self-discovery data. The Healing Journey explores sensitive growth areas connected to your chart (e.g., Chiron wound work, lunar node path). Both use on-device analysis and are part of the Deeper Sky experience.
            </Text>

            <Text style={styles.question}>How does the Daily Guidance / Today feed work?</Text>
            <Text style={styles.answer}>
              The Today screen delivers a personalized daily content loop including moon phase awareness, active transit context, energy readings, reflection prompts, and guidance tied to your chart. Free users get basic daily context; Deeper Sky unlocks personalized guidance with action steps. Content is generated on-device using your natal data and current planetary positions.
            </Text>

            <Text style={styles.question}>What is the Circadian Rhythm tracking?</Text>
            <Text style={styles.answer}>
              MySky tracks circadian patterns by analyzing the timing of your check-ins and sleep data over time. This helps surface when during the day you tend to feel most energized, most creative, or most drained. All analysis happens locally on your device.
            </Text>

            <Text style={styles.question}>Can I customize my chart settings?</Text>
            <Text style={styles.answer}>
              Yes. You can choose between multiple house systems (Placidus, Koch, Whole Sign, Equal House, Campanus, Regiomontanus, Topocentric) and adjust display preferences through the Astrology Settings and Calibration screens. If your birth time is unknown, MySky uses a specialized handler that adjusts interpretations accordingly.
            </Text>

            <Text style={styles.question}>How do notifications work?</Text>
            <Text style={styles.answer}>
              MySky can send optional local notifications for daily check-in reminders and reflection prompts. All notifications are scheduled on-device — no push notification server is used. You can configure or disable notifications in Settings.
            </Text>

            <Text style={styles.question}>What are my legal rights regarding my data?</Text>
            <Text style={styles.answer}>
              Under GDPR, CCPA/CPRA, and applicable privacy law you have the right to: access all data stored about you, export your data in a portable format, correct inaccurate data, delete all data permanently, withdraw processing consent, object to processing, restrict processing, and lodge a complaint with a supervisory authority. California residents have additional rights including the right to know what categories of personal information are collected, the right to opt out of sales (MySky never sells your data), and the right to limit use of sensitive personal information. See our full Privacy Policy for details.
            </Text>

            <Text style={styles.question}>Does MySky use cookies or web tracking?</Text>
            <Text style={styles.answer}>
              No. MySky does not use cookies, web beacons, or browser-based tracking technologies. All data is stored in a local SQLite database and the device's SecureStore. No web-based session tracking occurs.
            </Text>

            <Text style={styles.question}>What happens in a data breach?</Text>
            <Text style={styles.answer}>
              In the unlikely event of a data breach affecting personal information held by us or our service providers, we will assess it promptly and provide any legally required notices in accordance with applicable law. Because nearly all your data is stored exclusively on your device and never transmitted, the risk of a server-side breach affecting personal content is extremely limited.
            </Text>
              </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
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
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  titleArea: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginTop: 2,
    color: 'rgba(255,255,255,0.6)',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },
  heroIconWrap: {
    alignItems: 'center',
    marginBottom: 16,
    opacity: 0.95,
  },

  lastUpdated: { 
    fontSize: 12, 
    color: theme.textMuted, 
    marginBottom: 32, 
    textAlign: 'center',
    
  },
  faqSection: {
    gap: 8,
  },
  faqCard: {
    borderRadius: 24,
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  question: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.textGold,
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
