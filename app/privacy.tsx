import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';

import { theme } from '../constants/theme';
import StarField from '../components/ui/StarField';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StarField starCount={20} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/settings' as Href)}
          >
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >

          <Text style={styles.lastUpdated}>Last updated: February 20, 2026</Text>

          {/* ── 1. Introduction ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Commitment to Your Privacy</Text>
            <Text style={styles.paragraph}>
              MySky (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a personal growth and astrology reflection app. This Privacy Policy explains what information MySky collects, how it is used and protected, and your rights regarding that information. MySky is designed with privacy by design and by default, in accordance with the EU General Data Protection Regulation (GDPR), the California Consumer Privacy Act as amended by the California Privacy Rights Act (CCPA/CPRA), the Apple App Store Guidelines, and the Google Play Developer Policies.
            </Text>
            <Text style={styles.paragraph}>
              By using MySky, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with it, please do not use the app.
            </Text>
          </View>

          {/* ── 2. Data Controller ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Controller</Text>
            <Text style={styles.paragraph}>
              The data controller for MySky is:
            </Text>
            <Text style={styles.bulletPoint}>Brittany Hornick</Text>
            <Text style={styles.bulletPoint}>brittanyapps@outlook.com</Text>
            <Text style={styles.paragraph}>
              Because all personal data is stored exclusively on your device, MySky functions as a data controller only to the extent of defining what data the app processes and how. We never receive, access, or store your personal data on any server.
            </Text>
          </View>

          {/* ── 3. Information We Collect ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information We Collect</Text>
            <Text style={styles.paragraph}>
              MySky collects only the information you explicitly provide within the app. We do not collect data automatically, silently, or in the background.
            </Text>

            <Text style={styles.subSectionTitle}>Birth Data (Your Chart)</Text>
            <Text style={styles.bulletPoint}>• Birth date, birth time (optional), and birth location</Text>
            <Text style={styles.bulletPoint}>• Latitude, longitude, and timezone derived from the location you enter</Text>
            <Text style={styles.bulletPoint}>• Chart display preferences (e.g., house system)</Text>

            <Text style={styles.subSectionTitle}>Journal Entries</Text>
            <Text style={styles.bulletPoint}>• Mood selection (calm, soft, okay, heavy, stormy)</Text>
            <Text style={styles.bulletPoint}>• Entry title and free-text content</Text>
            <Text style={styles.bulletPoint}>• Moon phase at time of entry</Text>
            <Text style={styles.bulletPoint}>• On-device NLP summaries (keywords, emotional tone, sentiment) derived from your journal text — processed entirely on your device</Text>

            <Text style={styles.subSectionTitle}>Daily Check-Ins</Text>
            <Text style={styles.bulletPoint}>• Mood score (1–10), energy level, and stress level</Text>
            <Text style={styles.bulletPoint}>• Theme tags you select (e.g., relationships, career, sleep, creativity)</Text>
            <Text style={styles.bulletPoint}>• Optional notes, wins, and challenges</Text>
            <Text style={styles.bulletPoint}>• Astronomical snapshot at time of check-in (moon sign, transits, retrogrades) — computed on-device</Text>

            <Text style={styles.subSectionTitle}>Relationship Charts</Text>
            <Text style={styles.bulletPoint}>• Name, birth date, birth time, and birth location of another person (e.g., partner, friend, family member)</Text>
            <Text style={styles.bulletPoint}>• Relationship type (partner, ex, child, parent, friend, sibling, other)</Text>
            <Text style={styles.paragraph}>
              Important: When you enter another person&apos;s birth data, you are responsible for ensuring you have their permission to do so. This data is stored only on your device and is never transmitted.
            </Text>

            <Text style={styles.subSectionTitle}>Saved Insights</Text>
            <Text style={styles.bulletPoint}>• Insights you choose to save or favorite within the app</Text>

            <Text style={styles.subSectionTitle}>App Settings</Text>
            <Text style={styles.bulletPoint}>• Display preferences and configuration choices</Text>

            <Text style={styles.subSectionTitle}>What We Do Not Collect</Text>
            <Text style={styles.paragraph}>
              We do not collect device identifiers, advertising IDs, IP addresses, precise location data (beyond the birth location you enter), browsing history, contacts, photos, audio, usage analytics, crash reports sent to us, or any data beyond what you explicitly provide. We do not use analytics SDKs, advertising SDKs, or third-party behavioral tracking of any kind.
            </Text>
          </View>

          {/* ── 4. How We Use Your Information ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use Your Information</Text>
            <Text style={styles.paragraph}>
              All data processing occurs entirely on your device. Your data is used exclusively to provide and personalize the app&apos;s features:
            </Text>
            <Text style={styles.bulletPoint}>• Calculate and display your natal chart as a reflection framework</Text>
            <Text style={styles.bulletPoint}>• Generate personalized daily guidance and growth prompts</Text>
            <Text style={styles.bulletPoint}>• Provide relationship compatibility reflections</Text>
            <Text style={styles.bulletPoint}>• Track mood, energy, and stress patterns over time</Text>
            <Text style={styles.bulletPoint}>• Correlate your check-in themes with planetary transits</Text>
            <Text style={styles.bulletPoint}>• Derive on-device keyword and sentiment summaries from your journal</Text>
            <Text style={styles.bulletPoint}>• Generate your natal story narrative and PDF export</Text>
            <Text style={styles.bulletPoint}>• Map chakra and healing insights from your chart profile</Text>
            <Text style={styles.paragraph}>
              We do not use your data for advertising, marketing, profiling, research, AI/ML model training, or any purpose other than providing the app&apos;s features to you on your device.
            </Text>
          </View>

          {/* ── 5. Lawful Basis for Processing (GDPR) ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lawful Basis for Processing (GDPR)</Text>
            <Text style={styles.paragraph}>
              Under the GDPR, the lawful basis for processing your personal data is:
            </Text>
            <Text style={styles.bulletPoint}>• Consent (Article 6(1)(a)): You provide explicit consent before any personal data is collected. The app presents a consent prompt before storing birth data, journal entries, or check-ins. You may withdraw consent at any time through Privacy Settings.</Text>
            <Text style={styles.bulletPoint}>• Contract Performance (Article 6(1)(b)): Processing is necessary to deliver the app&apos;s core service — personalized chart calculation and reflection features — that you have requested.</Text>
            <Text style={styles.paragraph}>
              Birth data (date, time, location) may be considered sensitive data under certain interpretations. MySky collects this data only with your explicit consent and processes it locally on your device for the sole purpose of chart calculation.
            </Text>
          </View>

          {/* ── 6. Data Storage and Security ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Storage and Security</Text>
            <Text style={styles.paragraph}>
              Your data is stored locally on your device using multiple layers of protection:
            </Text>
            <Text style={styles.bulletPoint}>• All data is stored in a local SQLite database on your device — never on external servers</Text>
            <Text style={styles.bulletPoint}>• Sensitive fields (birth data, journal content, journal titles, relationship names, check-in notes) are encrypted at rest using AES-256-GCM</Text>
            <Text style={styles.bulletPoint}>• A unique Data Encryption Key (DEK) is generated on your device and stored in the hardware-backed keychain (iOS) or keystore (Android) via SecureStore</Text>
            <Text style={styles.bulletPoint}>• Each encrypted field uses a unique random 96-bit initialization vector (IV)</Text>
            <Text style={styles.bulletPoint}>• HMAC-SHA256 integrity verification detects any tampering with stored data</Text>
            <Text style={styles.bulletPoint}>• Your device passcode, Face ID, or fingerprint provide an additional layer of protection</Text>
            <Text style={styles.bulletPoint}>• Consent records and audit trails are encrypted and stored in the device keychain</Text>
            <Text style={styles.paragraph}>
              No personal data is transmitted to, or stored on, any server controlled by us or any third party.
            </Text>
          </View>

          {/* ── 7. Data Sharing ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Sharing</Text>
            <Text style={styles.paragraph}>
              We do not sell, rent, share, or otherwise disclose your personal information to any third party. Specifically:
            </Text>
            <Text style={styles.bulletPoint}>• No third-party advertising networks receive any data</Text>
            <Text style={styles.bulletPoint}>• No analytics or tracking services receive any data</Text>
            <Text style={styles.bulletPoint}>• No data brokers or marketing companies receive any data</Text>
            <Text style={styles.bulletPoint}>• No AI or machine learning training is performed on your data</Text>
            <Text style={styles.bulletPoint}>• We do not sell or share personal information as defined under the CCPA/CPRA</Text>
          </View>

          {/* ── 8. Third-Party Services ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Third-Party Services</Text>

            <Text style={styles.subSectionTitle}>Apple App Store / Google Play Store</Text>
            <Text style={styles.paragraph}>
              Subscription purchases are processed by Apple (App Store) or Google (Google Play). Payment information is handled entirely by the respective platform. MySky never receives or stores your payment details, credit card number, or billing address.
            </Text>

            <Text style={styles.subSectionTitle}>RevenueCat</Text>
            <Text style={styles.paragraph}>
              MySky uses RevenueCat solely to verify your subscription status. RevenueCat receives only an anonymous, randomly generated app user ID — it does not receive your name, email, birth data, journal content, or any personal information. RevenueCat&apos;s privacy policy is available at https://www.revenuecat.com/privacy.
            </Text>

            <Text style={styles.subSectionTitle}>No Other Third Parties</Text>
            <Text style={styles.paragraph}>
              No other third-party services, SDKs, APIs, analytics platforms, or external servers receive any information from MySky. The app does not make network requests to any server other than RevenueCat (for subscription verification) and the respective app store (for purchases).
            </Text>
          </View>

          {/* ── 9. PDF Export ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PDF Export</Text>
            <Text style={styles.paragraph}>
              When you export your chart as a PDF:
            </Text>
            <Text style={styles.bulletPoint}>• The PDF is generated entirely on your device</Text>
            <Text style={styles.bulletPoint}>• It is saved to your device&apos;s temporary cache, then the system share sheet opens</Text>
            <Text style={styles.bulletPoint}>• You choose where to save or share the file</Text>
            <Text style={styles.bulletPoint}>• MySky does not upload, transmit, or retain the PDF</Text>
          </View>

          {/* ── 10. Encrypted Backup (Premium) ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Encrypted Backup (Premium)</Text>
            <Text style={styles.paragraph}>
              If you choose to create an encrypted backup:
            </Text>
            <Text style={styles.bulletPoint}>• Your data is encrypted with AES-256-GCM using a passphrase you create</Text>
            <Text style={styles.bulletPoint}>• A .msky backup file is generated on your device</Text>
            <Text style={styles.bulletPoint}>• The system share sheet opens for you to choose a destination (Files, iCloud Drive, AirDrop, email, etc.)</Text>
            <Text style={styles.bulletPoint}>• MySky never uploads your backup to any server</Text>
            <Text style={styles.bulletPoint}>• You are solely responsible for the security of your backup file and passphrase</Text>
            <Text style={styles.bulletPoint}>• You can restore from a backup file at any time</Text>
          </View>

          {/* ── 11. Data Retention ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Retention</Text>
            <Text style={styles.paragraph}>
              Your data is retained on your device for as long as you use the app. We do not impose retention periods because no data is stored on our servers.
            </Text>
            <Text style={styles.bulletPoint}>• Active data: Retained on your device until you delete it or uninstall the app</Text>
            <Text style={styles.bulletPoint}>• Deleted data: When you delete a chart, journal entry, or other record via the app, it is permanently removed from the local database</Text>
            <Text style={styles.bulletPoint}>• Full data reset: You can permanently delete all data at any time using the &quot;Delete All Data&quot; option in Privacy Settings</Text>
            <Text style={styles.bulletPoint}>• Uninstall: Removing the app from your device fully erases all stored data, including the SQLite database and keychain entries</Text>
            <Text style={styles.bulletPoint}>• Consent records: Privacy consent history is stored on-device for GDPR compliance. Consent is re-requested annually or when the privacy policy version changes.</Text>
          </View>

          {/* ── 12. Your Rights ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rights</Text>
            <Text style={styles.paragraph}>
              You have the following rights, exercisable at any time through the app or by contacting us:
            </Text>

            <Text style={styles.subSectionTitle}>Under GDPR (EU/EEA/UK Residents)</Text>
            <Text style={styles.bulletPoint}>• Right of Access (Art. 15): View a summary of all data stored in the app via Privacy Settings</Text>
            <Text style={styles.bulletPoint}>• Right to Rectification (Art. 16): Edit your birth data, journal entries, and check-ins at any time</Text>
            <Text style={styles.bulletPoint}>• Right to Erasure (Art. 17): Delete individual records or all data via Privacy Settings</Text>
            <Text style={styles.bulletPoint}>• Right to Data Portability (Art. 20): Export all your data as a JSON file or encrypted backup</Text>
            <Text style={styles.bulletPoint}>• Right to Withdraw Consent (Art. 7(3)): Withdraw consent at any time through Privacy Settings; withdrawal does not affect the lawfulness of processing before withdrawal</Text>
            <Text style={styles.bulletPoint}>• Right to Restriction of Processing (Art. 18): Contact us to request restriction</Text>
            <Text style={styles.bulletPoint}>• Right to Lodge a Complaint: You may lodge a complaint with your local Data Protection Authority</Text>

            <Text style={styles.subSectionTitle}>Under CCPA/CPRA (California Residents)</Text>
            <Text style={styles.bulletPoint}>• Right to Know: You can view all categories and specific pieces of personal information the app stores</Text>
            <Text style={styles.bulletPoint}>• Right to Delete: You can delete all personal information via Privacy Settings or by uninstalling the app</Text>
            <Text style={styles.bulletPoint}>• Right to Opt-Out of Sale/Sharing: MySky does not sell or share your personal information. No opt-out is needed because no sale or sharing occurs.</Text>
            <Text style={styles.bulletPoint}>• Right to Non-Discrimination: We will not discriminate against you for exercising any of your privacy rights</Text>
            <Text style={styles.bulletPoint}>• Right to Correct: You can correct your personal information at any time within the app</Text>
            <Text style={styles.bulletPoint}>• Right to Limit Use of Sensitive Personal Information: MySky uses sensitive information (birth data) only to provide services you request</Text>

            <Text style={styles.subSectionTitle}>All Users</Text>
            <Text style={styles.bulletPoint}>• No account required: MySky works without creating any account or providing an email address</Text>
            <Text style={styles.bulletPoint}>• Offline capable: Core features work without an internet connection</Text>
            <Text style={styles.paragraph}>
              Because all data is stored locally on your device, you can exercise your rights instantly through the app without needing to contact us. However, you are welcome to email us at brittanyapps@outlook.com with any privacy-related request.
            </Text>
          </View>

          {/* ── 13. Automated Processing ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Automated Processing</Text>
            <Text style={styles.paragraph}>
              MySky performs automated calculations on your device, including natal chart computation, transit tracking, pattern correlation, and keyword extraction from journal entries. These calculations are used solely to display personalized reflections and insights within the app.
            </Text>
            <Text style={styles.paragraph}>
              No automated decisions are made that produce legal effects or similarly significant effects concerning you. All chart interpretations and insights are generalized reflection prompts — not predictions, diagnoses, or consequential decisions.
            </Text>
          </View>

          {/* ── 14. International Data Transfers ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>International Data Transfers</Text>
            <Text style={styles.paragraph}>
              MySky does not transfer your personal data internationally. All personal data remains on your device. The only cross-border data flow is the anonymized app user ID sent to RevenueCat for subscription verification, which is not personal data.
            </Text>
          </View>

          {/* ── 15. Children's Privacy ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Children&apos;s Privacy</Text>
            <Text style={styles.paragraph}>
              MySky is intended for users aged 13 and older, in compliance with the Children&apos;s Online Privacy Protection Act (COPPA) and equivalent international laws. We do not knowingly collect personal information from anyone under 13.
            </Text>
            <Text style={styles.paragraph}>
              If you are a parent or guardian and believe your child under 13 has used MySky, please contact us at brittanyapps@outlook.com. Since all data is stored locally on the child&apos;s device, you can also delete all data directly by using the &quot;Delete All Data&quot; option in Privacy Settings or by uninstalling the app.
            </Text>
          </View>

          {/* ── 16. Do Not Track ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Do Not Track Signals</Text>
            <Text style={styles.paragraph}>
              MySky does not track you in any way, so there is no tracking behavior to change in response to &quot;Do Not Track&quot; browser signals or the iOS App Tracking Transparency framework. We do not use the Identifier for Advertisers (IDFA) or any equivalent identifiers.
            </Text>
          </View>

          {/* ── 17. App Store Disclosures ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Store Privacy Disclosures</Text>
            <Text style={styles.paragraph}>
              In accordance with Apple App Store and Google Play requirements:
            </Text>
            <Text style={styles.bulletPoint}>• Data Collected: Birth data and journal/check-in content, used solely for app functionality. Per Apple&apos;s definition, this data is &quot;not collected&quot; because it never leaves your device or is made accessible to us.</Text>
            <Text style={styles.bulletPoint}>• Data Linked to You: None — we have no way to identify you or link any data to your identity</Text>
            <Text style={styles.bulletPoint}>• Data Used to Track You: None — no tracking occurs</Text>
            <Text style={styles.bulletPoint}>• Tracking: NSPrivacyTracking is set to false in our iOS Privacy Manifest</Text>
            <Text style={styles.bulletPoint}>• Required Reason APIs: MySky declares use of UserDefaults, file timestamps, disk space, and system boot time APIs with documented reasons in our Privacy Manifest, as required by Apple</Text>
          </View>

          {/* ── 18. Subscriptions ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscriptions</Text>
            <Text style={styles.paragraph}>
              MySky offers optional premium subscriptions (&quot;Deeper Sky&quot;) via the Apple App Store and Google Play Store:
            </Text>
            <Text style={styles.bulletPoint}>• Subscriptions are billed through your Apple ID or Google account</Text>
            <Text style={styles.bulletPoint}>• Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing period</Text>
            <Text style={styles.bulletPoint}>• You can manage or cancel your subscription in your device&apos;s subscription settings</Text>
            <Text style={styles.bulletPoint}>• Refunds are handled according to the applicable app store&apos;s refund policy</Text>
            <Text style={styles.bulletPoint}>• No personal data is required or collected to process your subscription — only subscription status is verified via an anonymous ID</Text>
          </View>

          {/* ── 19. Changes to This Policy ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this Privacy Policy from time to time. When we make material changes, we will:
            </Text>
            <Text style={styles.bulletPoint}>• Update the &quot;last updated&quot; date at the top of this policy</Text>
            <Text style={styles.bulletPoint}>• Present a new consent prompt in the app if the changes affect data collection or processing</Text>
            <Text style={styles.bulletPoint}>• Make the updated policy available within the app</Text>
            <Text style={styles.paragraph}>
              Continued use of MySky after a policy update constitutes acceptance of the revised policy. If you do not agree with the updated policy, you may delete your data and uninstall the app.
            </Text>
          </View>

          {/* ── 20. Contact Us ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions, concerns, or requests regarding this Privacy Policy, your data, or your privacy rights, please contact us at:
            </Text>
            <Text style={styles.contactInfo}>brittanyapps@outlook.com</Text>
            <Text style={styles.paragraph}>
              We will respond to privacy-related inquiries within 30 days, as required by applicable law.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              MySky — Built with privacy by design
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  lastUpdated: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: theme.spacing.xl,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.md,
  },
  subSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  paragraph: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  bulletPoint: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
  },
  contactInfo: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 14,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
});
