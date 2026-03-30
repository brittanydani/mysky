// File: app/faq.tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { theme } from '../constants/theme';
import { SUPPORT_EMAIL } from '../constants/config';

// ── Cinematic Palette ──
const PALETTE = {
  gold: theme.textGold,
  silverBlue: '#8BC4E8',
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
};

export default function FAQScreen() {
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
            <Ionicons name="chevron-back-outline" size={24} color={theme.textPrimary} />
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
          <View style={styles.heroIconWrap}>
            <Ionicons name="help-circle-outline" size={132} color={theme.textGold} />
          </View>

          <Text style={styles.lastUpdated}>Last updated: March 15, 2026</Text>

          <View style={styles.faqSection}>
            <View style={styles.faqCard}>
            <Text style={styles.question}>Do I need an account to use MySky?</Text>
            <Text style={styles.answer}>
              Yes. A free account is required to use MySky. Sign-up takes only an email address and is used to sync and protect your data. All core features — mood tracking, journaling, sleep logging, birth chart, and relationships — are available on the free plan. A Deeper Sky subscription is required for premium features such as dream analysis, AI Reflection Insights, and encrypted backup.
            </Text>

            <Text style={styles.question}>What's included for free vs. Deeper Sky?</Text>
            <Text style={styles.answer}>
              <Text style={styles.highlight}>Free:</Text> Personal birth chart, Big Three, daily mood/energy/stress check-ins, basic journaling, sleep quality logging, balance dashboard, 2 rotating energy domains, 1 relationship chart, 3 personal story chapters, and daily context with moon phase and transit awareness.{"\n\n"}
              <Text style={styles.highlight}>Deeper Sky:</Text> Dream journal with symbolic reflections, extended personal reflection trends, unlimited relationship charts, all 10 personal story chapters, growth and attachment reflections, full 5-domain energy reflection, emotional quality tagging, AI Reflection Insights, personalized daily guidance with action steps, sensitivity and growth mapping, PDF chart export, encrypted backup and restore, and extended pattern reflections.
            </Text>

            <Text style={styles.question}>What data does MySky store and where?</Text>
            <Text style={styles.answer}>
              All your data — birth data, journal entries, check-ins, sleep logs, dream content, relationship charts, energy readings, and settings — is stored locally on your device in a SQLite database. Sensitive fields (journal text, birth places, coordinates, dream content, mood/stress/energy scores, emotional tags, notes, wins, and challenges) are encrypted at rest using <Text style={styles.highlight}>AES-256-GCM</Text> with keys stored in your device's hardware-backed secure enclave (iOS Keychain / Android Keystore). Nothing is uploaded to a server. The only external network calls are geocoding lookups (city name only) and anonymous subscription verification.
            </Text>

            <Text style={styles.question}>What are AI Reflection Insights and what data do they use?</Text>
            <Text style={styles.answer}>
              AI Reflection Insights are an optional premium feature that requires an account. When active, only aggregated, non-identifying behavioral statistics — mood/stress/energy trends, averages, top restoring and draining tags, and correlation data — are sent to a Supabase Edge Function that calls Anthropic Claude. <Text style={styles.highlight}>Raw journal text, birth data, dream content, and personal notes are never transmitted.</Text> Requests are rate limited to 5 per hour and cached once per calendar day.
            </Text>

            <Text style={styles.question}>Are dream reflections powered by AI?</Text>
            <Text style={styles.answer}>
              No. Dream reflections are generated <Text style={styles.highlight}>entirely on your device</Text> using symbolic pattern mapping with a Jungian archetype dictionary. Text signals, feelings, check-in context, and history are blended with weighted scoring. No data is sent to any AI service or external server for this feature.
            </Text>

            <Text style={styles.question}>How does the journal NLP analysis work?</Text>
            <Text style={styles.answer}>
              Journal entries are analyzed <Text style={styles.highlight}>entirely on your device</Text> using local NLP — keyword extraction (TF-weighted), emotion bucket scoring across 7 categories, and sentiment scoring. These are pure functions with no network calls. All results are encrypted at rest alongside your journal content.
            </Text>

            <Text style={styles.question}>Is my data ever sold or shared with third parties?</Text>
            <Text style={styles.answer}>
              Never. Your data is never sold, shared for advertising, or used for AI/ML training. MySky uses zero analytics SDKs and collects zero advertising identifiers. External data flows are limited to city name geocoding (OpenStreetMap), anonymous subscription verification (RevenueCat), and optional AI reflections (Supabase/Anthropic — aggregated stats only).
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
              Uninstalling the app permanently erases all locally stored data (SQLite database and SecureStore). If you created a backup (.msky file), your data can be restored on a new installation. If you created an account for AI Reflection Insights, you can request account deletion by contacting support.
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
              Yes. All core features — daily check-ins, journaling, natal chart, dream logging, sleep tracking, somatic map, trigger log, energy readings, personal story, and self-discovery tools — work fully offline with no internet connection. The only features that require a network connection are city name geocoding (when entering a birth place), subscription verification (RevenueCat), and the optional AI Reflection Insights.
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

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center', borderRadius: 22, backgroundColor: 'rgba(15, 15, 15, 0.45)', borderWidth: 1, borderColor: 'rgba(197, 181, 161, 0.25)',
  },
  headerTitle: { 
    fontSize: 16,
    color: '#FFF',
    
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.6,
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
    fontStyle: 'italic'
  },
  faqSection: {
    gap: 8,
  },
  faqCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
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
