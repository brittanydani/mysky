// File: app/privacy.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { theme } from '../constants/theme';
import { SUPPORT_EMAIL } from '../constants/config';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';

// ── Cinematic Palette ──
const PALETTE = {
  gold: theme.textGold,
  silverBlue: '#C9AE78',
  emerald: '#6EBF8B',
  copper: '#CD7F5D',
  textMain: theme.textPrimary,
  glassBorder: theme.cardBorder,
  glassHighlight: theme.glass.highlight,
};

export default function PrivacyPolicyScreen({ onBack }: { onBack?: () => void } = {}) {
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
            onPress={() => onBack ? onBack() : (router.canGoBack() ? router.back() : undefined)}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back-outline" size={24} color={theme.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={132} color={theme.textGold} />
          </View>

          <Text style={styles.lastUpdated}>Last updated: April 4, 2026</Text>

          {/* ── Data Controller ── */}
          <LinearGradient colors={[theme.cardGradientStart, theme.cardGradientEnd]} style={styles.glassSection}>
            <Text style={styles.sectionTitle}>Data Controller</Text>
            <Text style={styles.paragraph}>
              MySky is developed and operated by Brittany Apps ("we," "us," or "our"). For questions or requests regarding your personal data, contact us at {SUPPORT_EMAIL}.
            </Text>
          </LinearGradient>

          {/* ── Section Wrapper Helper ── */}
          <LinearGradient colors={[theme.cardGradientStart, theme.cardGradientEnd]} style={styles.glassSection}>
            <Text style={styles.sectionTitle}>Our Commitment</Text>
            <Text style={styles.paragraph}>
              MySky is designed with privacy by design and by default. We do not use advertising SDKs, collect advertising identifiers, or perform cross-app or cross-site tracking. Your data is never sold, shared for advertising, or used for AI/ML training.
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
              <Text style={styles.paragraph}>MySky includes three optional AI-powered features that transmit data to external services:</Text>
              <Text style={styles.paragraph}><Text style={styles.boldText}>AI Reflection Insights</Text> — Requires a Deeper Sky subscription. Aggregated behavioral statistics (mood/stress/energy trends, top tags, correlation data) are sent to a Supabase Edge Function which calls Anthropic Claude. Raw journal text, birth data, dream content, and personal notes are never transmitted. Rate limited to 5 requests per hour, enforced server-side.</Text>
              <Text style={styles.paragraph}><Text style={styles.boldText}>AI-Enhanced Dream Interpretations</Text> — When available, dream text and selected dream feelings are sent to Google Gemini to generate a richer narrative interpretation. No birth data, user identifiers, or other personal information is included. This supplements the on-device dream engine; the on-device interpretation is always generated first regardless of AI availability.</Text>
              <Text style={styles.paragraph}><Text style={styles.boldText}>AI Pattern Insights</Text> — When available, aggregated self-knowledge context (dominant archetype, top core values, cognitive style summary, top somatic pattern region, top relationship pattern tags, and behavioral check-in averages) is sent to Google Gemini to generate personalized pattern reflections. Raw journal text, birth data, dream content, and personal notes are never transmitted.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>iOS Widgets</Text>
              <Text style={styles.paragraph}>If you use MySky's iOS home screen widgets, recent check-in data (mood, energy, and sleep scores) is shared with the widget extension via a sandboxed App Group container on your device. This data never leaves your device and is not transmitted to any server.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal Basis for Processing (GDPR)</Text>
            <Text style={styles.paragraph}>We process your personal data under the following legal bases:</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Consent (Art. 6(1)(a) GDPR):</Text> We collect and process your personal data only after you provide explicit consent via the in-app privacy consent flow. You may withdraw consent at any time via Privacy Settings.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Performance of a Contract (Art. 6(1)(b) GDPR):</Text> When you subscribe to Deeper Sky, we process subscription-related data (via Apple and RevenueCat) to fulfill our contractual obligations.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Legitimate Interest (Art. 6(1)(f) GDPR):</Text> We maintain security audit logs and tamper detection to protect the integrity of your locally stored data.</Text>

            <View style={[styles.dataBlock, { marginTop: 16 }]}>
              <Text style={styles.subSectionTitle}>Special Category Data</Text>
              <Text style={styles.paragraph}>Certain data you may enter — such as emotional states, somatic body sensations, nervous system triggers, and psychological self-assessments — may constitute special category data under GDPR Article 9. We process this data solely on the basis of your explicit consent and store it exclusively on your device with AES-256-GCM encryption. This data is never transmitted to any server.</Text>
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
                Sensitive fields — journal content, titles, birth places, dream text, mood/stress/energy scores, emotional tags, check-in notes, wins, challenges, and NLP results — use <Text style={styles.highlight}>AES-256-GCM</Text> field-level encryption. The data encryption key is stored in your device's hardware-backed SecureStore (iOS Keychain).
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
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>RevenueCat:</Text> Subscription and in-app purchase verification. RevenueCat receives a pseudonymous app user ID and purchase/device metadata needed to validate entitlements.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>OpenStreetMap Nominatim:</Text> Birth city text sent for geocoding to coordinates. Only the city name string is transmitted.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Supabase:</Text> A free account (email/password) is required to use MySky. Authentication credentials are stored on Supabase servers in the United States. Session tokens are stored in device secure storage. AI Reflection Insights additionally use a Supabase Edge Function.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Anthropic Claude:</Text> AI Reflection Insights via Supabase Edge Function. Receives only aggregated behavioral stats — never raw text, birth data, or personal notes. API key lives exclusively in the Edge Function environment. Anthropic servers are located in the United States.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Google Gemini:</Text> AI-enhanced dream interpretations and pattern insights. Dream text and feelings are sent for dream interpretations. Aggregated self-knowledge context (archetype, values, cognitive style, somatic patterns, relationship patterns, and check-in averages) is sent for pattern insights. No birth data, user identifiers, or raw journal text is transmitted. Google servers may be located in the United States or other countries.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Sentry:</Text> Production crash, error, and sampled performance/replay telemetry. Configured with <Text style={styles.highlight}>sendDefaultPii: false</Text>, with user objects stripped before send.</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Apple App Store / Google Play:</Text> Process subscription and in-app purchase transactions, depending on your platform. MySky does not directly collect or store payment card or billing information.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>International Data Transfers</Text>
            <Text style={styles.paragraph}>
              When you use optional AI-powered features, limited data is transmitted to servers located in the United States (Supabase, Anthropic) and potentially other countries (Google). These transfers are necessary to provide the requested service and are made on the basis of your explicit consent. All transmitted data is limited to the minimum necessary — no raw personal content, birth data, or identifying information is included.
            </Text>
            <Text style={styles.paragraph}>
              For users in the European Economic Area (EEA), United Kingdom, or Switzerland: data transfers to the United States rely on your explicit consent under GDPR Article 49(1)(a) and, where available, the service providers' adherence to Standard Contractual Clauses (SCCs) or equivalent safeguards.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>No Tracking</Text>
            <Text style={styles.paragraph}>
              MySky declares NSPrivacyTracking: false with an empty tracking domains list. No advertising identifiers are collected, and no cross-app or cross-site tracking is performed. Production builds do include Sentry for operational crash and performance monitoring, but not for advertising or behavioral profiling.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Apple Privacy Manifest</Text>
            <Text style={styles.paragraph}>Data types declared in our Apple Privacy Manifest:</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Coarse Location:</Text> For timezone resolution via on-device tz-lookup (not GPS tracking).</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>User ID:</Text> For Supabase authentication (required).</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Purchases:</Text> For RevenueCat subscription verification.</Text>
            <Text style={styles.paragraph}>All data types are declared as not linked to identity and not used for tracking.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cookies and Local Storage</Text>
            <Text style={styles.paragraph}>
              MySky does not use cookies, web beacons, or browser-based tracking technologies. All data is stored in a local SQLite database and the device's SecureStore (iOS Keychain). No web-based session tracking occurs.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Automated Decision-Making</Text>
            <Text style={styles.paragraph}>
              MySky does not engage in automated decision-making or profiling that produces legal effects or similarly significant effects on users. All reflective content, pattern analysis, and interpretations are provided for self-awareness purposes only and carry no binding or consequential effect.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <Text style={styles.paragraph}>
              Under GDPR, CCPA/CPRA, and applicable privacy law, you have the following rights over your personal data:
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
              <Text style={styles.subSectionTitle}>Right to Erasure ("Right to Be Forgotten")</Text>
              <Text style={styles.paragraph}>Delete all personal data at any time using the "Hard Reset" option in Privacy Settings. This permanently erases all data from SQLite and SecureStore with best-effort secure deletion. Because some OS keychain items can survive an uninstall, uninstalling the app alone should not be treated as a guaranteed secure wipe. To request deletion of your Supabase authentication credentials, contact us.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Rectification</Text>
              <Text style={styles.paragraph}>Update your birth data, edit or delete journal entries, modify sleep logs, and manage relationship charts at any time directly within the app.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Withdraw Consent</Text>
              <Text style={styles.paragraph}>Withdraw your data processing consent at any time via Privacy Settings. Existing data is preserved but no new personal data will be collected until consent is restored. Withdrawal of consent does not affect the lawfulness of processing based on consent before its withdrawal.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Restrict Processing</Text>
              <Text style={styles.paragraph}>Since all core processing happens on-device, you control it entirely. Withdrawing consent blocks all data writes until consent is restored.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Object</Text>
              <Text style={styles.paragraph}>You have the right to object to data processing based on legitimate interest. Since MySky processes nearly all data on-device under your explicit consent, this right is effectively exercised by withdrawing consent in Privacy Settings.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Lodge a Complaint</Text>
              <Text style={styles.paragraph}>If you believe your data protection rights have been violated, you have the right to lodge a complaint with a supervisory authority. For users in the EEA, you may contact the data protection authority in your country of residence.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right of Non-Discrimination</Text>
              <Text style={styles.paragraph}>We will not discriminate against you for exercising any of your privacy rights. Exercising your rights will not affect the quality or availability of the service.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>California Privacy Rights (CCPA/CPRA)</Text>
            <Text style={styles.paragraph}>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA):</Text>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Categories of Personal Information</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Identifiers:</Text> Email address (required for account creation).</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Personal records:</Text> Birth date, birth time, birth place (stored locally and encrypted).</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Commercial information:</Text> Subscription status (managed by Apple and RevenueCat).</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Geolocation data:</Text> Coarse location (timezone only, via on-device lookup).</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Inferences:</Text> On-device pattern analysis for self-reflection; never transmitted.</Text>
              <Text style={styles.bulletPoint}>• <Text style={styles.boldText}>Sensitive personal information:</Text> Emotional states, somatic data, psychological self-assessments (stored locally and encrypted; never transmitted except aggregated stats for opted-in AI features).</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Sale and Sharing</Text>
              <Text style={styles.paragraph}>MySky does not sell your personal information. MySky does not share your personal information for cross-context behavioral advertising. We have not sold or shared personal information in the preceding 12 months.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Know, Delete, and Correct</Text>
              <Text style={styles.paragraph}>Since all data is stored locally on your device, you can access, delete, and correct it directly via Privacy Settings and the app's editing features. For account data, contact us at {SUPPORT_EMAIL}.</Text>
            </View>

            <View style={styles.dataBlock}>
              <Text style={styles.subSectionTitle}>Right to Limit Use of Sensitive Information</Text>
              <Text style={styles.paragraph}>MySky uses sensitive personal information only for the purpose of providing the app's self-reflection features. No sensitive data is used for advertising, profiling, or any secondary purpose.</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Retention</Text>
            <Text style={styles.paragraph}>
              Most of your data is stored locally on your device until you delete it, perform a Hard Reset, or remove the app sandbox. Consent records expire after 365 days and will be re-requested. Limited server-side or service-provider data may also exist for authentication (Supabase), subscription entitlement management (RevenueCat), and operational diagnostics (Sentry). If you delete your account, authentication data is removed from Supabase within 30 days.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Children's Privacy</Text>
            <Text style={styles.paragraph}>
              MySky is intended for users aged 17 and older. We do not knowingly collect personal information from children under 17. If we learn we have inadvertently collected data from a user under 17, we will take steps to delete that data promptly. If you are a parent or guardian and believe your child has provided personal information through the app, please contact us immediately.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscriptions & Payments</Text>
            <Text style={styles.paragraph}>
              MySky offers optional auto-renewable subscriptions and a lifetime purchase ("Deeper Sky") processed through the Apple App Store or Google Play, depending on your platform. Payment is charged to your platform account at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage or cancel subscriptions in your device settings. MySky does not directly collect or store payment information.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Breach Notification</Text>
            <Text style={styles.paragraph}>
              In the unlikely event of a data breach affecting personal information held by us or our service providers, we will assess the incident promptly and provide any legally required notices to regulators and affected users in accordance with applicable law. Because the vast majority of your data is stored exclusively on your device and never transmitted, the risk of a server-side breach affecting personal content is extremely limited.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. When we make material changes, the "Last updated" date at the top of this page will be revised, and — if the change affects how your data is processed — we will re-request your privacy consent within the app. Continued use of MySky after a policy update constitutes acceptance of the revised terms. We encourage you to review this page periodically.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Pressable
              style={styles.contactCard}
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=MySky%20Privacy%20Inquiry`)}
            >
              <Ionicons name="mail-outline" size={20} color={theme.textGold} />
              <Text style={styles.contactInfo}>{SUPPORT_EMAIL}</Text>
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
    paddingTop: 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
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
  lastUpdated: { fontSize: 13, color: "#FFFFFF", marginBottom: 24, textAlign: 'center' },
  
  section: { marginBottom: 32 },
  glassSection: {
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: "#FFFFFF",
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
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(110,191,139,0.20)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  securityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  securityTitle: { fontSize: 15, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 28,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  contactInfo: { fontSize: 16, color: "#FFFFFF", fontWeight: '600' },
  
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerText: { fontSize: 13, color: "#FFFFFF",  },
});
