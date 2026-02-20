import React, { useEffect, useState } from 'react';
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
  privacyPolicyUrl?: string; // optional, safer than hardcoding
  contactEmail?: string; // optional
}

export default function PrivacyConsentModal({
  visible,
  onConsent,
  privacyPolicyUrl,
  contactEmail,
}: PrivacyConsentModalProps) {
  const [showFullPolicy, setShowFullPolicy] = useState(false);

  useEffect(() => {
    if (!visible) setShowFullPolicy(false);
  }, [visible]);

  const handleAccept = () => {
    Haptics.selectionAsync().catch(() => {});
    onConsent(true);
  };

  const handleDecline = () => {
    Haptics.selectionAsync().catch(() => {});
    onConsent(false);
  };

  const openPrivacyPolicyLink = async () => {
    if (!privacyPolicyUrl) return;
    try {
      const ok = await Linking.canOpenURL(privacyPolicyUrl);
      if (ok) await Linking.openURL(privacyPolicyUrl);
    } catch (e) {
      logger.error('Failed to open privacy policy URL', e);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={handleDecline}>
      <View style={styles.container}>
        <StarField starCount={50} />

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {!showFullPolicy ? (
              <>
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
                      <Text style={styles.dataText}>Journal entries you create</Text>
                    </View>
                  </View>

                  <View style={styles.dataSection}>
                    <Text style={styles.sectionTitle}>How We Protect It</Text>
                    <View style={styles.dataItem}>
                      <Ionicons name="phone-portrait-outline" size={20} color={theme.primary} />
                      <Text style={styles.dataText}>Stored locally on your device</Text>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                      <Text style={styles.dataText}>Encrypted using device security</Text>
                    </View>
                    <View style={styles.dataItem}>
                      <Ionicons name="ban-outline" size={20} color={theme.primary} />
                      <Text style={styles.dataText}>Never sold or shared</Text>
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

                  <Pressable style={styles.policyLink} onPress={() => setShowFullPolicy(true)} accessibilityRole="button" accessibilityLabel="View full privacy policy">
                    <Text style={styles.policyLinkText}>View Full Privacy Policy</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                  </Pressable>

                  {!!privacyPolicyUrl && (
                    <Pressable style={styles.policyLink} onPress={openPrivacyPolicyLink} accessibilityRole="button" accessibilityLabel="Open privacy policy in browser">
                      <Text style={styles.policyLinkText}>Open policy in browser</Text>
                      <Ionicons name="open-outline" size={16} color={theme.primary} />
                    </Pressable>
                  )}
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.buttonsContainer}>
                  <Pressable style={({ pressed }) => [styles.acceptButton, pressed && styles.buttonPressed]} onPress={handleAccept} accessibilityRole="button" accessibilityLabel="I agree to privacy policy">
                    <LinearGradient
                      colors={[...theme.goldGradient]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="checkmark" size={20} color="#1A1A1A" />
                      <Text style={styles.acceptButtonText}>I Agree</Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable style={({ pressed }) => [styles.declineButton, pressed && styles.buttonPressed]} onPress={handleDecline} accessibilityRole="button" accessibilityLabel="Decline privacy policy">
                    <Text style={styles.declineButtonText}>Not Now</Text>
                  </Pressable>
                </Animated.View>
              </>
            ) : (
              <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.policyContainer}>
                <View style={styles.policyHeader}>
                  <Pressable style={styles.backButton} onPress={() => setShowFullPolicy(false)} accessibilityRole="button" accessibilityLabel="Go back to privacy overview">
                    <Ionicons name="arrow-back" size={24} color={theme.primary} />
                  </Pressable>
                  <Text style={styles.policyTitle}>Privacy Policy</Text>
                </View>

                <View style={styles.policyContent}>
                  <Text style={styles.policySection}>
                    <Text style={styles.policySectionTitle}>Data Collection{'\n'}</Text>
                    MySky collects only the information you explicitly provide: birth data (date, time, location), journal entries and mood selections, daily check-ins (mood, energy, stress, theme tags, notes), and relationship chart data you enter for others. We do not collect device identifiers, advertising IDs, or any data beyond what you provide.
                  </Text>

                  <Text style={styles.policySection}>
                    <Text style={styles.policySectionTitle}>Encryption &amp; Storage{'\n'}</Text>
                    All sensitive fields (journal content, birth data, relationship names, check-in notes) are encrypted at rest using AES-256-GCM. Encryption keys are stored in your device's hardware-backed keychain via SecureStore. All data lives on your device — it is never uploaded to external servers unless you explicitly create an encrypted backup.
                  </Text>

                  <Text style={styles.policySection}>
                    <Text style={styles.policySectionTitle}>Subscriptions{'\n'}</Text>
                    Subscription purchases are processed by Apple or Google. MySky uses RevenueCat solely to verify subscription status. RevenueCat receives only an anonymous app user ID — never your journal, birth data, or any personal information.
                  </Text>

                  <Text style={styles.policySection}>
                    <Text style={styles.policySectionTitle}>Data Usage{'\n'}</Text>
                    We do not sell, share, or monetize your personal information. We do not use advertising SDKs, analytics trackers, or third-party behavioral tracking of any kind. Your data is used only to provide app features on your device.
                  </Text>

                  <Text style={styles.policySection}>
                    <Text style={styles.policySectionTitle}>Your Rights (GDPR &amp; CCPA){'\n'}</Text>
                    You can access, export, correct, and permanently delete all your data at any time through Privacy Settings. No account is required. Consent can be withdrawn at any time. Uninstalling the app removes all data from your device.
                  </Text>

                  <Text style={styles.policySection}>
                    <Text style={styles.policySectionTitle}>Contact{'\n'}</Text>
                    {contactEmail ? `For privacy questions, contact us at ${contactEmail}` : 'For privacy questions, contact us at brittanyapps@outlook.com'}
                  </Text>
                </View>

                <Pressable style={styles.policyCloseButton} onPress={() => setShowFullPolicy(false)} accessibilityRole="button" accessibilityLabel="Close privacy policy">
                  <Text style={styles.policyCloseText}>Close</Text>
                </Pressable>
              </Animated.View>
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
  policyLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.md, marginTop: theme.spacing.md },
  policyLinkText: { fontSize: 14, color: theme.primary, marginRight: theme.spacing.xs },
  buttonsContainer: { gap: theme.spacing.md },
  acceptButton: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', ...theme.shadows.glow },
  declineButton: { borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', paddingVertical: theme.spacing.lg, alignItems: 'center' },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl },
  acceptButtonText: { fontSize: 16, fontWeight: '600', color: '#0D1421', marginLeft: theme.spacing.sm },
  declineButtonText: { fontSize: 16, fontWeight: '600', color: theme.textSecondary },
  policyContainer: { flex: 1 },
  policyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xl },
  backButton: { padding: theme.spacing.sm, marginRight: theme.spacing.md },
  policyTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, fontFamily: 'serif' },
  policyContent: { flex: 1 },
  policySection: { fontSize: 14, color: theme.textSecondary, lineHeight: 20, marginBottom: theme.spacing.lg },
  policySectionTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  policyCloseButton: { backgroundColor: 'rgba(201, 169, 98, 0.1)', borderRadius: theme.borderRadius.lg, paddingVertical: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.lg },
  policyCloseText: { fontSize: 16, fontWeight: '600', color: theme.primary },
});