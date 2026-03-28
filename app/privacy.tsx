// File: app/privacy.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';

import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { MetallicIcon } from '../components/ui/MetallicIcon';

// ── Cinematic Palette ──
const PALETTE = {
  gold: theme.textGold,
  silverBlue: '#8BC4E8',
  emerald: '#6EBF8B',
  copper: '#CD7F5D',
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
  glassHighlight: theme.glass.highlight,
};

export default function PrivacyPolicyScreen() {
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={132} color={theme.textGold} />
          </View>

          <Text style={styles.lastUpdated}>Last updated: March 28, 2026</Text>

          {/* ── Section Wrapper Helper ── */}
          <LinearGradient colors={[theme.cardGradientStart, theme.cardGradientEnd]} style={styles.glassSection}>
            <Text style={styles.sectionTitle}>Our Commitment</Text>
            <Text style={styles.paragraph}>
              MySky is designed with privacy by design and by default. We use zero analytics SDKs, collect zero advertising identifiers, and perform zero cross-app or cross-site tracking. Your data is never sold, shared for advertising, or used for AI/ML training.
            </Text>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information We Collect</Text>
            
            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Birth Data & Charts</Text>
              <Text style={styles.paragraph}>Date, time (optional), and place of birth are stored exclusively on your device in a local SQLite database with AES-256-GCM field-level encryption on sensitive fields (birth place, coordinates, name, birth date, and birth time). Used to calculate planetary positions, house systems, and natal chart aspects via on-device Swiss Ephemeris.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Daily Check-Ins</Text>
              <Text style={styles.paragraph}>Mood scores, energy levels, stress levels, influence tags, emotional quality tags, notes, wins, and challenges are all stored locally and encrypted at rest. No raw check-in data is ever transmitted. If you opt in to the Premium AI Reflections feature, only aggregated, non-identifying statistics (trend averages, top tags, correlations) derived from check-in data are sent — never individual entries.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Journal Entries</Text>
              <Text style={styles.paragraph}>Free-text journal content is processed entirely on-device via local NLP for keyword extraction, emotion tagging, and sentiment reflection. Raw text, titles, and NLP results are encrypted at rest and never transmitted.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Sleep & Dream Logs</Text>
              <Text style={styles.paragraph}>Sleep data is stored locally on your device. Dream text, dream feelings, dream mood, dream metadata, and notes are encrypted at rest using AES-256-GCM. Sleep quality and duration are stored locally but not encrypted. Dream reflections are generated entirely on-device using symbolic pattern mapping — no AI service is involved.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Relationship Charts</Text>
              <Text style={styles.paragraph}>Synastry partner data (name, birth data) is stored locally and encrypted. Birth place fields use the same AES-256-GCM encryption as your own data.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Self-Discovery Profile Data</Text>
              <Text style={styles.paragraph}>When you use identity tools such as the Core Values Inventory, Jungian Archetype Profile, or Cognitive Style assessment, your responses and resulting profile data are stored exclusively on your device and encrypted at rest with AES-256-GCM. This data is never transmitted to any server and is never used for advertising, analytics, or AI/ML training.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Somatic & Nervous System Entries</Text>
              <Text style={styles.paragraph}>Body sensation logs (somatic map entries, body location tags, intensity ratings, linked emotions) and nervous system entries (trigger descriptions, dysregulation context, restoring practice notes) are stored locally and encrypted at rest with AES-256-GCM. This is among the most sensitive data in the app. It is never transmitted, never processed by any external service, and never shared.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Relationship Pattern Entries</Text>
              <Text style={styles.paragraph}>Self-reported relational pattern notes (recurring dynamics, communication tendencies, attachment observations) are stored locally and encrypted. No synastry or astrological matching is performed on this data.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Premium AI Features (Optional)</Text>
              <Text style={styles.paragraph}>MySky includes optional AI-powered features that transmit data to external services. AI Reflection Insights requires both a Deeper Sky subscription and account creation: aggregated behavioral statistics (mood/stress/energy trends, top tags, correlation data) are sent to a Supabase Edge Function which calls Anthropic Claude. Rate limited to 5 requests per hour. AI-enhanced dream interpretations send dream text and selected dream feelings to Google Gemini. AI pattern insights send aggregated self-knowledge context (dominant archetype, top core values, cognitive style summary, top somatic pattern, top relationship pattern tags, and check-in averages) to Google Gemini. For all AI features, raw journal text, birth data, and user identifiers are never transmitted.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>iOS Widgets</Text>
              <Text style={styles.paragraph}>If you use MySky's iOS home screen widgets, recent check-in data (mood, energy, and sleep scores) is shared with the widget extension via a sandboxed App Group container on your device. This data never leaves your device and is not transmitted to any server.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Security</Text>
            <LinearGradient colors={['rgba(110,191,139,0.10)', theme.cardGradientEnd]} style={styles.securityCard}>
              <View style={styles.securityHeader}>
                <MetallicIcon name="lock-closed-outline" size={18} color={PALETTE.emerald} />
                <Text style={[styles.securityTitle, { color: "#FFFFFF" }]}>Encryption at Rest</Text>
              </View>
              <Text style={styles.paragraph}>
                Sensitive fields — journal content, titles, birth places, dream text, mood/stress/energy scores, emotional tags, check-in notes, wins, challenges, and NLP results — use <Text style={styles.highlight}>AES-256-GCM</Text> field-level encryption. The data encryption key is stored in your device's hardware-backed SecureStore (iOS Keychain / Android Keystore).
              </Text>
            </LinearGradient>

            <LinearGradient colors={['rgba(110,191,139,0.10)', theme.cardGradientEnd]} style={[styles.securityCard, { marginTop: 12 }]}>
              <View style={styles.securityHeader}>
                <MetallicIcon name="shield-checkmark-outline" size={18} color={PALETTE.emerald} />
                <Text style={[styles.securityTitle, { color: "#FFFFFF" }]}>Tamper Detection</Text>
              </View>
              <Text style={styles.paragraph}>
                SecureStore payloads are protected with <Text style={styles.highlight}>HMAC-SHA256</Text> tamper detection using a device-unique key. Security events are logged in a rolling audit trail for your transparency.
              </Text>
            </LinearGradient>

            <LinearGradient colors={['rgba(110,191,139,0.10)', theme.cardGradientEnd]} style={[styles.securityCard, { marginTop: 12 }]}>
              <View style={styles.securityHeader}>
                <MetallicIcon name="cloud-offline-outline" size={18} color={PALETTE.emerald} />
                <Text style={[styles.securityTitle, { color: "#FFFFFF" }]}>Backup Encryption</Text>
              </View>
              <Text style={styles.paragraph}>
                Encrypted .msky backups use <Text style={styles.highlight}>AES-256-GCM with PBKDF2-SHA256</Text> key derivation (100,000 iterations) from your chosen passphrase. Backups are never uploaded to any server — you control where they go via your device's share sheet.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Third-Party Services</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>RevenueCat:</Text> Device identifier generated by the RevenueCat SDK for subscription and in-app purchase verification. No personal data is shared.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>OpenStreetMap Nominatim:</Text> Birth city text sent for geocoding to coordinates. Only the city name string is transmitted.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Supabase:</Text> Account creation (email/password) required for AI Reflection Insights. Session tokens stored in device secure storage.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Anthropic Claude:</Text> AI Reflection Insights via Supabase Edge Function. Receives only aggregated behavioral stats — never raw text, birth data, or personal notes. API key lives exclusively in the Edge Function environment.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Google Gemini:</Text> AI-enhanced dream interpretations (dream text and feelings) and pattern insights (aggregated self-knowledge context). No birth data, user identifiers, or raw journal text is transmitted.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>No Tracking</Text>
            <Text style={styles.paragraph}>
              MySky declares NSPrivacyTracking: false with an empty tracking domains list. No analytics SDKs (no Firebase, Amplitude, Mixpanel, Sentry, or Crashlytics) are included. No advertising identifiers are collected. Android explicitly blocks Camera, Microphone, Contacts, Calendar, SMS, Phone, and Location permissions.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Apple Privacy Manifest</Text>
            <Text style={styles.paragraph}>Data types declared in our Apple Privacy Manifest:</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Coarse Location:</Text> For timezone resolution via on-device tz-lookup (not GPS tracking).</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>User ID:</Text> For optional Supabase authentication only.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Purchases:</Text> For RevenueCat subscription verification.</Text>
            <Text style={styles.paragraph}>All data types are declared as not linked to identity and not used for tracking.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <Text style={styles.paragraph}>
              Under GDPR, CCPA, and applicable privacy law, you have the following rights over your personal data:
            </Text>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right of Access</Text>
              <Text style={styles.paragraph}>View all data MySky holds about you at any time via Privacy Settings, including a full data inventory, consent status, and recent security events.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Data Portability</Text>
              <Text style={styles.paragraph}>Export your complete data as a structured, machine-readable JSON archive via Privacy Settings, or as an encrypted .msky backup from the Settings tab (premium).</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Erasure</Text>
              <Text style={styles.paragraph}>Delete all personal data at any time using the "Hard Reset" option in Privacy Settings. This permanently erases all data from SQLite and SecureStore with best-effort secure deletion. Uninstalling the app also erases all locally stored data.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Rectification</Text>
              <Text style={styles.paragraph}>Update your birth data, edit or delete journal entries, modify sleep logs, and manage relationship charts at any time directly within the app.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Withdraw Consent</Text>
              <Text style={styles.paragraph}>Withdraw your data processing consent at any time via Privacy Settings. Existing data is preserved but no new personal data will be collected until consent is restored.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Restrict Processing</Text>
              <Text style={styles.paragraph}>Since all core processing happens on-device, you control it entirely. Withdrawing consent blocks all data writes until consent is restored.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Retention</Text>
            <Text style={styles.paragraph}>
              Your data is stored locally on your device for as long as you keep the app installed. Consent records expire after 365 days and will be re-requested. There is no server-side storage of personal data beyond optional Supabase authentication credentials.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Children's Privacy</Text>
            <Text style={styles.paragraph}>
              MySky is intended for users aged 17 and older. We do not knowingly collect personal information from children under 17. If we learn we have inadvertently collected data from a user under 17, we will take steps to delete that data promptly.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. When we make material changes, the "Last updated" date at the top of this page will be revised, and — if the change affects how your data is processed — we will re-request your privacy consent within the app. Continued use of MySky after a policy update constitutes acceptance of the revised terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Pressable
              style={styles.contactCard}
              onPress={() => Linking.openURL('mailto:brittanyapps@outlook.com?subject=MySky%20Privacy%20Inquiry')}
            >
              <Ionicons name="mail-outline" size={20} color={theme.textGold} />
              <Text style={styles.contactInfo}>brittanyapps@outlook.com</Text>
            </Pressable>
            <Text style={[styles.paragraph, { marginTop: 12 }]}>We respond to privacy-related inquiries within 30 days.</Text>
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
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { 
    fontSize: 16,
    color: '#FFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
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
  lastUpdated: { fontSize: 13, color: "#FFFFFF", marginBottom: 24, fontStyle: 'italic', textAlign: 'center' },
  
  section: { marginBottom: 32 },
  glassSection: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: "#FFFFFF",
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: 16,
    paddingLeft: 4,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: "#FFFFFF",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: "#FFFFFF",
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
    color: "#FFFFFF",
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 4,
  },
  highlight: { color: "#FFFFFF", fontWeight: '600' },
  boldText: { color: "#FFFFFF", fontWeight: '600' },
  
  securityCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(110,191,139,0.20)',
  },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  securityTitle: { fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderTopColor: theme.glass.highlight,
  },
  contactInfo: { fontSize: 16, color: "#FFFFFF", fontWeight: '600' },
  
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerText: { fontSize: 13, color: "#FFFFFF", fontStyle: 'italic' },
});
