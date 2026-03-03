// components/PrivacyConsentModal.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import StarField from './ui/StarField';
import { logger } from '../utils/logger';

interface PrivacyConsentModalProps {
  visible: boolean;
  onConsent: (granted: boolean) => void;
  privacyPolicyUrl?: string;
  contactEmail?: string;
}

export default function PrivacyConsentModal({
  visible,
  onConsent,
  privacyPolicyUrl,
  contactEmail,
}: PrivacyConsentModalProps) {
  const email = contactEmail ?? 'brittanyapps@outlook.com';
  const [showFullPolicy, setShowFullPolicy] = useState(false);

  useEffect(() => {
    if (!visible) setShowFullPolicy(false);
  }, [visible]);

  const handleAccept = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onConsent(true);
  }, [onConsent]);

  const handleDecline = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onConsent(false);
  }, [onConsent]);

  const openPrivacyPolicyLink = useCallback(async () => {
    if (!privacyPolicyUrl) return;
    try {
      const ok = await Linking.canOpenURL(privacyPolicyUrl);
      if (ok) await Linking.openURL(privacyPolicyUrl);
    } catch (e) {
      logger.error('Failed to open privacy policy URL', e);
    }
  }, [privacyPolicyUrl]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={handleDecline}
    >
      <View style={styles.container}>
        <StarField starCount={50} />

        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {!showFullPolicy ? (
              <>
                {/* ── Summary view ── */}
                <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.headerContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="shield-checkmark" size={48} color={theme.primary} />
                  </View>
                  <Text style={styles.title}>Your Privacy Matters</Text>
                  <Text style={styles.subtitle}>We&apos;re committed to protecting your personal information</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.contentContainer}>
                  <View style={styles.dataSection}>
                    <Text style={styles.sectionTitle}>What We Collect</Text>
                    <View style={styles.dataItem}>
                      <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                      <Text style={styles.dataText}>Birth date, time, and location</Text>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="book-outline" size={20} color={theme.primary} />
                      <Text style={styles.dataText}>Journal entries, mood &amp; sleep logs</Text>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="mail-outline" size={20} color={theme.primary} />
                      <Text style={styles.dataText}>Email address (optional, for AI features)</Text>
                    </View>
                  </View>

                  <View style={styles.dataSection}>
                    <Text style={styles.sectionTitle}>How We Protect It</Text>
                    <View style={styles.dataItem}>
                      <Ionicons name="phone-portrait-outline" size={20} color={theme.primary} />
                      <Text style={styles.dataText}>Core data stored locally on your device</Text>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                      <Text style={styles.dataText}>Encrypted with AES-256-GCM</Text>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="ban-outline" size={20} color={theme.primary} />
                      <Text style={styles.dataText}>Never sold or shared for ads</Text>
                    </View>
                  </View>

                  <View style={styles.dataSection}>
                    <Text style={styles.sectionTitle}>Your Rights</Text>
                    <View style={styles.dataItem}>
                      <Ionicons name="download-outline" size={20} color={theme.primary} />
                      <Text style={styles.dataText}>Export your data anytime</Text>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="trash-outline" size={20} color={theme.primary} />
                      <Text style={styles.dataText}>Delete all data anytime</Text>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.policyLink, pressed && styles.linkPressed]}
                    onPress={() => setShowFullPolicy(true)}
                    accessibilityRole="button"
                    accessibilityLabel="View full privacy policy"
                  >
                    <Text style={styles.policyLinkText}>View Full Privacy Policy</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                  </Pressable>

                  {!!privacyPolicyUrl && (
                    <Pressable
                      style={({ pressed }) => [styles.policyLink, pressed && styles.linkPressed]}
                      onPress={openPrivacyPolicyLink}
                      accessibilityRole="button"
                      accessibilityLabel="Open privacy policy in browser"
                    >
                      <Text style={styles.policyLinkText}>Open policy in browser</Text>
                      <Ionicons name="open-outline" size={16} color={theme.primary} />
                    </Pressable>
                  )}

                  <View style={styles.buttonsContainer}>
                    <Pressable
                      style={({ pressed }) => [styles.declineButton, pressed && styles.buttonPressed]}
                      onPress={handleDecline}
                      accessibilityRole="button"
                      accessibilityLabel="Decline"
                    >
                      <Text style={styles.declineButtonText}>Not now</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [styles.acceptButton, pressed && styles.buttonPressed]}
                      onPress={handleAccept}
                      accessibilityRole="button"
                      accessibilityLabel="Accept"
                    >
                      <LinearGradient
                        colors={[theme.primary, theme.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                      >
                        <Ionicons name="checkmark-circle-outline" size={18} color="#0D1421" />
                        <Text style={styles.acceptButtonText}>I agree</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </Animated.View>
              </>
            ) : (
              <>
                {/* ── Full policy view ── */}
                <Animated.View entering={FadeInUp.duration(400)} style={styles.policyHeader}>
                  <Pressable
                    style={({ pressed }) => [styles.backButton, pressed && styles.linkPressed]}
                    onPress={() => setShowFullPolicy(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                  >
                    <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
                  </Pressable>
                  <Text style={styles.policyTitle}>Privacy Policy</Text>
                </Animated.View>

                <Text style={[styles.policySection, { fontStyle: 'italic', color: theme.textMuted }]}>
                  Last updated: March 2, 2026
                </Text>

                <Text style={styles.policySectionTitle}>Our Commitment to Your Privacy</Text>
                <Text style={styles.policySection}>MySky (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a personal growth and wellness app for mood tracking, sleep tracking, journaling, and self-reflection. This Privacy Policy explains what information MySky processes, how it is used and protected, and your rights regarding that information. MySky is designed with privacy by design and by default, and we aim to meet applicable privacy requirements (including GDPR and CCPA/CPRA where relevant).</Text>
                <Text style={styles.policySection}>By using MySky, you acknowledge that you have read and understood this Privacy Policy. If you do not agree with it, please do not use the app.</Text>

                <Text style={styles.policySectionTitle}>Data Controller</Text>
                <Text style={styles.policySection}>The data controller for MySky is:</Text>
                <Text style={styles.policySection}>Brittany Hornick{'\n'}{email}</Text>
                <Text style={styles.policySection}>Most personal data is stored exclusively on your device. However, if you create an optional account to use premium AI features, certain data is stored on Supabase servers as described below. In all cases, raw journal content, birth data, and personal notes are never transmitted to any external server.</Text>

                <Text style={styles.policySectionTitle}>Information We Collect</Text>
                <Text style={styles.policySection}>MySky collects only the information you explicitly provide within the app. We do not collect data automatically, silently, or in the background.</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Birth Data (Your Chart):</Text> Birth date, birth time (optional), and birth location; latitude, longitude, and timezone derived from the location you enter; chart display preferences (e.g., house system).</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Journal Entries:</Text> Mood selection, entry title and free-text content, moon phase at time of entry, on-device NLP summaries (keywords, emotional tone, sentiment) derived from your journal text &mdash; processed entirely on your device.</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Daily Check-Ins:</Text> Mood score, energy level, stress level, theme tags, optional notes, wins, challenges, and an astronomical snapshot at time of check-in (moon sign, transits, retrogrades) &mdash; all computed on-device.</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Sleep Tracking:</Text> Nightly sleep quality rating, duration, wake feeling, dream quality, optional dream journal note (encrypted), and on-device symbolic dream reflections. One entry per night.</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Relationship Charts:</Text> Name, birth date, birth time, and birth location of another person; relationship type. When you enter another person&apos;s birth data, you are responsible for ensuring you have their permission. This data is stored only on your device and is never transmitted.</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Saved Insights:</Text> Personalized daily guidance automatically saved on your device (greetings, reflection messages, journal prompts, growth themes); insights you mark as favorites.</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>App Settings:</Text> Display preferences and configuration choices.</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Optional Account (Premium AI Features):</Text> If you choose to create an account to unlock AI-generated reflections, we collect your email address and a password (hashed &mdash; never stored in plain text). Your account is managed by Supabase. No other personal information is required to create an account. An account is never required to use the core app features (chart, journal, mood tracking, sleep, relationships).</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>What We Do Not Collect:</Text> We do not collect advertising identifiers (such as IDFA), device identifiers for tracking, IP addresses (beyond what is incidentally transmitted during geocoding lookups), precise location data (beyond the birth location you enter), browsing history, contacts, photos, audio, usage analytics, crash reports sent to us, or any data beyond what you explicitly provide. We do not use analytics SDKs, advertising SDKs, or third-party behavioral tracking of any kind.</Text>

                <Text style={styles.policySectionTitle}>How We Use Your Information</Text>
                <Text style={styles.policySection}>All core data processing occurs entirely on your device. Your data is used exclusively to provide and personalize the app&apos;s features: track mood, energy, stress, and sleep patterns; analyze behavioral trends; derive on-device keyword and sentiment summaries; calculate and display your chart; generate personalized daily guidance and growth prompts; provide relationship compatibility reflections; correlate your check-in themes with planetary transits; generate your personal story narrative and PDF export; generate symbolic dream reflections &mdash; all on-device. For premium AI features (if you create an account), aggregated behavioral statistics are sent to a cloud service to generate AI-written reflections. We do not use your data for advertising, marketing, third-party profiling, research, AI/ML model training, or any purpose other than providing the app&apos;s features to you.</Text>

                <Text style={styles.policySectionTitle}>Lawful Basis for Processing (GDPR)</Text>
                <Text style={styles.policySection}>Under the GDPR, the lawful basis for processing your personal data is: Consent (Article 6(1)(a)): You provide explicit consent before any personal data is collected. The app presents a consent prompt before storing birth data, journal entries, or check-ins. You may withdraw consent at any time through Privacy Settings. Contract Performance (Article 6(1)(b)): Processing is necessary to deliver the app&apos;s core service &mdash; personalized chart calculation and reflection features &mdash; that you have requested. Birth data (date, time, location) may be considered sensitive data under certain interpretations. MySky collects this data only with your explicit consent and processes it locally on your device for the sole purpose of chart calculation.</Text>

                <Text style={styles.policySectionTitle}>Data Storage and Security</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>On-Device (all users):</Text> All core app data &mdash; charts, journal entries, check-ins, sleep logs, relationship charts, and saved insights &mdash; is stored in a local SQLite database on your device and never uploaded. Sensitive fields are encrypted at rest using AES-256-GCM; a unique Data Encryption Key (DEK) is generated on your device and stored in the hardware-backed keychain (iOS) or keystore (Android) via SecureStore; each encrypted field uses a unique random 96-bit initialization vector (IV); HMAC-SHA256 integrity verification detects tampering. Your device passcode, Face ID, or fingerprint provide an additional layer of protection.</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Server-Side (optional, premium account holders only):</Text> If you create an account, your email address and hashed password are stored in Supabase&apos;s authentication system. If you use AI Reflection Insights, aggregated behavioral statistics (mood/energy/stress trend averages and anonymous theme-tag correlations) are sent to a Supabase Edge Function, which calls the Anthropic API. Raw journal content, notes, and birth data are never transmitted. If you rate dream reflections, your personalized preference weights (numerical scores only &mdash; no raw dream text) are stored in Supabase to improve future suggestions.</Text>

                <Text style={styles.policySectionTitle}>Data Sharing</Text>
                <Text style={styles.policySection}>We do not sell, rent, or share your personal information for advertising, marketing, or analytics. We disclose limited data only to the service providers listed below for app functionality. No third-party advertising networks, analytics, data brokers, marketing companies, or AI/machine learning training receive any data. We do not sell or share personal information as defined under the CCPA/CPRA.</Text>

                <Text style={styles.policySectionTitle}>Third-Party Services</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Apple App Store / Google Play Store:</Text> Subscription purchases are processed by Apple or Google. Payment information is handled entirely by the respective platform. MySky never receives or stores your payment details, credit card number, or billing address.</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>RevenueCat:</Text> Used solely to verify your subscription status and unlock premium features. RevenueCat receives an anonymous app user identifier and subscription/entitlement information needed to verify premium access. It does not receive your journal content, birth data, check-ins, or sleep logs. (https://www.revenuecat.com/privacy)</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Geocoding (OpenStreetMap Nominatim):</Text> When you enter a birth city or location, the app uses OpenStreetMap&apos;s Nominatim geocoding service to convert that location into geographic coordinates. This request includes the location text you type and standard network metadata (such as your IP address). No birth date, birth time, journal content, or other personal data is transmitted as part of this request. (https://osmfoundation.org/wiki/Privacy_Policy)</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Supabase:</Text> Used for optional account authentication and, for premium users, to host the Edge Function that processes AI reflection requests and to store personalized dream model preference weights. Supabase stores your email address and hashed password if you create an account. Supabase infrastructure is hosted on AWS. (https://supabase.com/privacy)</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Anthropic (Claude AI):</Text> Used exclusively via the Supabase Edge Function to generate AI Reflection Insights for premium users. Anthropic receives only aggregated behavioral statistics (mood/energy/stress trends, theme-tag correlations) &mdash; no email, birth data, journal content, or directly identifying information. Anthropic&apos;s API key is stored exclusively in the Edge Function environment and is never accessible by your device. (https://www.anthropic.com/privacy)</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>No Other Third Parties:</Text> Beyond the services listed above, the app does not make network requests to any external server. No analytics SDKs, advertising networks, data brokers, or behavioral tracking tools are used.</Text>

                <Text style={styles.policySectionTitle}>PDF Export</Text>
                <Text style={styles.policySection}>When you export your chart as a PDF: the PDF is generated entirely on your device; it is saved to your device&apos;s temporary cache, then the system share sheet opens; you choose where to save or share the file; MySky does not upload, transmit, or retain the PDF.</Text>

                <Text style={styles.policySectionTitle}>Encrypted Backup (Premium)</Text>
                <Text style={styles.policySection}>If you choose to create an encrypted backup: your data is encrypted with AES-256-GCM using a passphrase you create; the backup includes your charts, journal entries, mood &amp; energy check-ins, sleep entries, relationship charts, saved daily insights and favorites, and app settings; a .msky backup file is generated on your device; the system share sheet opens for you to choose a destination; MySky never uploads your backup to any server; you are solely responsible for the security of your backup file and passphrase; you can restore from a backup file at any time.</Text>

                <Text style={styles.policySectionTitle}>Data Retention</Text>
                <Text style={styles.policySection}>On-device data is retained for as long as you use the app. Active data: retained until you delete it or uninstall the app. Deleted data: permanently removed from the local database. Full data reset: available at any time via the &ldquo;Delete All Data&rdquo; option in Privacy Settings. Uninstall: removing the app fully erases all on-device data. Account data: if you delete your account, your email and hashed password are removed from Supabase. Dream model weights are deleted with your account. Consent records: stored on-device for GDPR compliance; re-requested annually or when the policy version changes.</Text>

                <Text style={styles.policySectionTitle}>Your Rights</Text>
                <Text style={styles.policySection}><Text style={styles.bold}>Under GDPR (EU/EEA/UK Residents):</Text> Right of Access, Right to Rectification, Right to Erasure, Right to Data Portability, Right to Withdraw Consent, Right to Restriction of Processing, Right to Lodge a Complaint. <Text style={styles.bold}>Under CCPA/CPRA (California Residents):</Text> Right to Know, Right to Delete, Right to Opt-Out of Sale/Sharing, Right to Non-Discrimination, Right to Correct, Right to Limit Use of Sensitive Personal Information. <Text style={styles.bold}>All Users:</Text> No account required for core features; offline capable. You can exercise most rights instantly through the app. For account data (email, dream model) contact us at {email} to request deletion. We will respond to privacy-related inquiries within 30 days.</Text>

                <Text style={styles.policySectionTitle}>Automated Processing &amp; Profiling</Text>
                <Text style={styles.policySection}>MySky performs automated calculations on your device, including chart computation, transit tracking, pattern correlation, keyword extraction from journal entries, and symbolic dream reflections. For premium users, aggregated behavioral statistics are processed by the Anthropic API to generate personalized reflection copy. Under GDPR, this constitutes automated profiling. However, these insights are intended solely for personal self-reflection and do not produce legal effects or similarly significant effects concerning you. No automated decisions are made about your creditworthiness, employment, health treatment, or any other consequential outcome. All interpretations are generalized reflection prompts &mdash; not predictions, diagnoses, or consequential decisions.</Text>

                <Text style={styles.policySectionTitle}>International Data Transfers</Text>
                <Text style={styles.policySection}>On-device data does not leave your device. For premium account holders: Supabase (hosted on AWS) and Anthropic may process data in the United States or other jurisdictions. Supabase provides Standard Contractual Clauses (SCCs) for GDPR compliance. Anthropic processes data in accordance with its privacy policy. RevenueCat and Nominatim may also process data internationally.</Text>

                <Text style={styles.policySectionTitle}>Children&apos;s Privacy</Text>
                <Text style={styles.policySection}>MySky is intended for users aged 13 and older, in compliance with the Children&apos;s Online Privacy Protection Act (COPPA) and equivalent international laws. We do not knowingly collect personal information from anyone under 13. If you are a parent or guardian and believe your child under 13 has used MySky, please contact us at {email}. You can delete all on-device data directly by using the &ldquo;Delete All Data&rdquo; option in Privacy Settings or by uninstalling the app.</Text>

                <Text style={styles.policySectionTitle}>Do Not Track Signals</Text>
                <Text style={styles.policySection}>MySky does not track you in any way, so there is no tracking behavior to change in response to &ldquo;Do Not Track&rdquo; browser signals or the iOS App Tracking Transparency framework. We do not use the Identifier for Advertisers (IDFA) or any equivalent identifiers.</Text>

                <Text style={styles.policySectionTitle}>App Store Privacy Disclosures</Text>
                <Text style={styles.policySection}>In accordance with Apple App Store and Google Play requirements: Birth data, journal and check-in content, and sleep logs are stored exclusively on your device with AES-256-GCM encryption &mdash; this data never leaves your device. When you enter a birth city, that text is sent to Nominatim for geocoding (Coarse Location &mdash; Not Linked to Identity &mdash; App Functionality). RevenueCat uses an anonymous identifier for purchase verification (User ID &mdash; Not Linked to Identity &mdash; App Functionality). Subscription purchases are processed by Apple or Google via RevenueCat (Purchases &mdash; Not Linked to Identity &mdash; App Functionality). If you create an account, your email is linked to your identity and used for authentication. No tracking occurs. NSPrivacyTracking is set to false in our iOS Privacy Manifest. Required Reason APIs are declared with documented reasons in our Privacy Manifest.</Text>

                <Text style={styles.policySectionTitle}>Subscriptions</Text>
                <Text style={styles.policySection}>MySky offers optional premium access (&ldquo;Deeper Sky&rdquo;) via the Apple App Store and Google Play Store. Premium access may be purchased as an auto-renewing subscription (monthly or yearly) or as a one-time lifetime purchase. Subscriptions are billed through your Apple ID or Google account and renew automatically unless cancelled at least 24 hours before the end of the current billing period. Lifetime purchases are a one-time payment and do not renew. Refunds are handled according to the applicable app store&apos;s refund policy. No personal data is required or collected to process purchases &mdash; only premium status is verified via an anonymous identifier.</Text>

                <Text style={styles.policySectionTitle}>Changes to This Policy</Text>
                <Text style={styles.policySection}>We may update this Privacy Policy from time to time. When we make material changes, we will update the &ldquo;last updated&rdquo; date at the top of this policy and present a new consent prompt in the app if the changes affect data collection or processing. If you do not agree with the updated policy, you may withdraw consent in Privacy Settings, delete your data, and uninstall the app.</Text>

                <Text style={styles.policySectionTitle}>Contact Us</Text>
                <Text style={styles.policySection}>If you have any questions, concerns, or requests regarding this Privacy Policy, your data, or your privacy rights, please contact us at: {email}. We will respond to privacy-related inquiries within 30 days, as required by applicable law.</Text>

                {!!privacyPolicyUrl && (
                  <Pressable
                    style={({ pressed }) => [styles.policyLink, pressed && styles.linkPressed]}
                    onPress={openPrivacyPolicyLink}
                    accessibilityRole="button"
                    accessibilityLabel="Open privacy policy in browser"
                  >
                    <Text style={styles.policyLinkText}>Open policy in browser</Text>
                    <Ionicons name="open-outline" size={16} color={theme.primary} />
                  </Pressable>
                )}

                <Text style={[styles.policySection, { textAlign: 'center', fontStyle: 'italic', marginTop: 24 }]}>
                  MySky &mdash; Built with privacy by design
                </Text>

                <Pressable
                  style={({ pressed }) => [styles.policyCloseButton, pressed && styles.buttonPressed]}
                  onPress={() => setShowFullPolicy(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close privacy policy"
                >
                  <Text style={styles.policyCloseText}>Close</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xl, paddingTop: 85 },

  // Summary view
  headerContainer: { alignItems: 'center', marginBottom: theme.spacing.xl },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.glow,
  },
  title: { fontSize: 28, fontWeight: '700', color: theme.textPrimary, fontFamily: 'serif', marginBottom: theme.spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', paddingHorizontal: theme.spacing.md },
  contentContainer: { marginBottom: theme.spacing.xl },
  dataSection: { marginBottom: theme.spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginBottom: theme.spacing.md },
  dataItem: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, paddingLeft: theme.spacing.sm },
  dataText: { fontSize: 14, color: theme.textSecondary, marginLeft: theme.spacing.sm, flex: 1 },
  buttonsContainer: { gap: theme.spacing.md },
  acceptButton: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', ...theme.shadows.glow },
  declineButton: { borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', paddingVertical: theme.spacing.lg, alignItems: 'center' },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl },
  acceptButtonText: { fontSize: 16, fontWeight: '600', color: '#0D1421', marginLeft: theme.spacing.sm },
  declineButtonText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },

  // Shared
  policyLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.md, marginTop: theme.spacing.sm },
  linkPressed: { opacity: 0.7 },
  policyLinkText: { fontSize: 14, color: theme.primary, marginRight: theme.spacing.xs },

  // Full policy view
  policyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  backButton: { padding: theme.spacing.sm, marginRight: theme.spacing.md },
  policyTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, fontFamily: 'serif' },
  bold: { fontWeight: 'bold' },
  policySection: { fontSize: 14, color: theme.textSecondary, lineHeight: 20, marginBottom: theme.spacing.lg },
  policySectionTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, marginBottom: theme.spacing.sm },
  policyCloseButton: {
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  policyCloseText: { fontSize: 16, fontWeight: '600', color: theme.primary },
});
