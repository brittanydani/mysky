// File: components/OnboardingModal.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import SkiaMetallicPill from './ui/SkiaMetallicPill';
import BirthDataModal from './BirthDataModal';
import TermsConsentModal from './TermsConsentModal';

import { BirthData } from '../services/astrology/types';
import { AstrologyCalculator } from '../services/astrology/calculator';
import { localDb } from '../services/storage/localDb';
import { BackupService } from '../services/storage/backupService';
import { logger } from '../utils/logger';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (chart: any) => void;

  // NEW: Terms is handled inside onboarding
  needsTermsConsent?: boolean;
  onTermsConsent?: (granted: boolean) => void;
}

export default function OnboardingModal({
  visible,
  onComplete,
  needsTermsConsent = false,
  onTermsConsent,
}: OnboardingModalProps) {
  const [step, setStep] = useState<'welcome' | 'birth-data' | 'generating' | 'passphrase'>('welcome');
  const [showBirthModal, setShowBirthModal] = useState(false);

  // NEW
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [backupUri, setBackupUri] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep('welcome');
      setShowBirthModal(false);
      setShowTermsModal(false);
      setBackupUri(null);
      setPassphrase('');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const openBirthFlow = () => {
    setStep('birth-data');
    setShowBirthModal(true);
  };

  const handleGetStarted = () => {
    Haptics.selectionAsync().catch(() => {});

    // If terms not accepted yet, show terms FIRST
    if (needsTermsConsent) {
      setShowTermsModal(true);
      return;
    }

    openBirthFlow();
  };

  const handleRestoreBackup = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      const uri = await BackupService.pickBackupFile();
      if (!uri) return;
      setBackupUri(uri);
      setPassphrase('');
      setStep('passphrase');
    } catch (error) {
      logger.error('Failed to pick backup file:', error);
    }
  };

  const handlePassphraseSubmit = async () => {
    if (!backupUri || !passphrase || passphrase.trim().length < 8) {
      Alert.alert('Invalid Passphrase', 'Passphrase must be at least 8 characters.');
      return;
    }
    setStep('generating');
    try {
      await BackupService.restoreFromBackupFile(backupUri, passphrase);
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const birthData = {
          date: charts[0].birthDate,
          time: charts[0].birthTime,
          hasUnknownTime: charts[0].hasUnknownTime,
          place: charts[0].birthPlace,
          latitude: charts[0].latitude,
          longitude: charts[0].longitude,
          houseSystem: charts[0].houseSystem,
          timezone: charts[0].timezone,
        };
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        timeoutRef.current = setTimeout(() => {
          onComplete(chart);
        }, 900);
      } else {
        Alert.alert('No Charts Found', 'The backup did not contain any chart data.', [
          { text: 'OK', onPress: () => setStep('welcome') },
        ]);
      }
    } catch (error) {
      logger.error('Failed to restore backup:', error);
      Alert.alert('Restore Failed', 'Could not restore from backup. Please check your passphrase and try again.', [
        { text: 'OK', onPress: () => setStep('welcome') },
      ]);
    }
  };

  // IMPORTANT: birth data is REQUIRED — user can't close this modal.
  const handleBirthModalClose = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      'Birth details required',
      'To set up MySky, please enter your birth details. You can update them later in Settings.',
      [{ text: 'OK', onPress: () => setShowBirthModal(true) }]
    );

    // keep it open / re-open
    setShowBirthModal(true);
    setStep('birth-data');
  };

  const handleBirthDataComplete = async (birthData: BirthData, extra?: { chartName?: string }) => {
    setShowBirthModal(false);
    setStep('generating');

    try {
      const chart = await Promise.resolve(AstrologyCalculator.generateNatalChart(birthData));

      const savedChart = {
        id: chart.id,
        name: extra?.chartName ?? chart.name,
        birthDate: chart.birthData.date,
        birthTime: chart.birthData.time,
        hasUnknownTime: chart.birthData.hasUnknownTime,
        birthPlace: chart.birthData.place,
        latitude: chart.birthData.latitude,
        longitude: chart.birthData.longitude,
        houseSystem: chart.birthData.houseSystem,
        timezone: chart.birthData.timezone,
        createdAt: chart.createdAt,
        updatedAt: chart.updatedAt,
        isDeleted: false,
      };

      await localDb.saveChart(savedChart);

      timeoutRef.current = setTimeout(() => {
        onComplete(chart);
      }, 900);
    } catch (error) {
      logger.error('Failed to generate chart:', error);
      Alert.alert('Something went wrong', 'We could not create your chart. Please try again.', [
        { text: 'OK', onPress: () => setStep('welcome') },
      ]);
    }
  };

  const handleTermsDecision = async (granted: boolean) => {
    try {
      // If they decline, keep modal open (cannot proceed)
      if (!granted) {
        onTermsConsent?.(false);
        setShowTermsModal(true);
        return;
      }

      onTermsConsent?.(true);
      setShowTermsModal(false);

      // Proceed directly into required birth flow
      openBirthFlow();
    } catch (e) {
      logger.error('Terms decision failed:', e);
      if (granted) {
        setShowTermsModal(false);
        openBirthFlow();
      } else {
        setShowTermsModal(true);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => {}}>
        <View style={styles.container}>
          <SkiaDynamicCosmos fill="#020817" />

          <SafeAreaView edges={['top']} style={styles.safeArea}>
            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {step === 'welcome' && (
                <>
                  <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.welcomeContainer}>
                    <View style={[styles.logoContainer, { marginBottom: 8, alignItems: 'center' }]}>
                      <Image
                        source={require('../assets/images/mysky_logo.png')}
                        style={{ width: 220, height: 220, resizeMode: 'contain' }}
                        accessibilityLabel="MySky logo"
                      />
                    </View>

                    <Text style={styles.welcomeTitle}>Welcome to MySky</Text>
                    <Text style={styles.welcomeSubtitle}>Personal Growth, Mapped to You</Text>

                    <Text style={styles.description}>
                      Track your mood, sleep, and energy, journal your thoughts, and uncover personal patterns over time.
                    </Text>
                  </Animated.View>

                  <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.featuresContainer}>
                    <View style={styles.feature}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="pencil" size={20} color={theme.textGold} />
                      </View>
                      <Text style={styles.featureText}>Daily journaling & guided reflection</Text>
                    </View>

                    <View style={styles.feature}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="pulse" size={20} color={theme.textGold} />
                      </View>
                      <Text style={styles.featureText}>Mood, sleep & energy tracking</Text>
                    </View>

                    <View style={styles.feature}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="analytics" size={20} color={theme.textGold} />
                      </View>
                      <Text style={styles.featureText}>Pattern insights drawn from your own data</Text>
                    </View>

                    <View style={styles.feature}>
                      <View style={styles.featureIcon}>
                        <Ionicons name="lock-closed" size={20} color={theme.textGold} />
                      </View>
                      <Text style={styles.featureText}>Private & encrypted — only on your device</Text>
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.ctaContainer}>
                    <SkiaMetallicPill
                      label="Get Started"
                      onPress={handleGetStarted}
                      style={{ marginBottom: theme.spacing.md }}
                    />

                    <Pressable style={styles.restoreButton} onPress={handleRestoreBackup} accessibilityRole="button" accessibilityLabel="Restore from backup">
                      <Ionicons name="cloud-download-outline" size={16} color={theme.textGold} />
                      <Text style={styles.restoreText}>Restore from Backup</Text>
                    </Pressable>
                  </Animated.View>
                </>
              )}

              {step === 'generating' && (
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.generatingContainer}>
                  <View style={styles.generatingIcon}>
                    <Ionicons name="sparkles" size={48} color={theme.textGold} />
                  </View>

                  <Text style={styles.generatingTitle}>Setting Up Your Profile</Text>
                  <Text style={styles.generatingSubtitle}>Personalizing your reflection framework…</Text>

                  <View style={styles.loadingDots}>
                    <View style={[styles.dot, styles.dot1]} />
                    <View style={[styles.dot, styles.dot2]} />
                    <View style={[styles.dot, styles.dot3]} />
                  </View>
                </Animated.View>
              )}

              {step === 'passphrase' && (
                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.generatingContainer}>
                  <View style={styles.generatingIcon}>
                    <Ionicons name="lock-closed" size={48} color={theme.textGold} />
                  </View>

                  <Text style={styles.generatingTitle}>Enter Backup Passphrase</Text>
                  <Text style={styles.generatingSubtitle}>This is the passphrase you set when you created the backup.</Text>

                  <TextInput
                    style={styles.passphraseInput}
                    value={passphrase}
                    onChangeText={setPassphrase}
                    placeholder="Enter passphrase"
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handlePassphraseSubmit}
                  />

                  <SkiaMetallicPill
                    label="Restore"
                    onPress={handlePassphraseSubmit}
                    icon={<Ionicons name="cloud-download" size={20} color="#020817" />}
                    style={{ marginBottom: theme.spacing.md }}
                  />

                  <Pressable style={styles.restoreButton} onPress={() => setStep('welcome')} accessibilityRole="button" accessibilityLabel="Cancel restore">
                    <Text style={styles.restoreText}>Cancel</Text>
                  </Pressable>
                </Animated.View>
              )}
            </ScrollView>
          </SafeAreaView>

          {/* Terms inside onboarding (after Welcome) */}
          {showTermsModal && (
            <TermsConsentModal visible onConsent={handleTermsDecision} />
          )}

          {/* Birth data is REQUIRED: onClose won't let user exit */}
          <BirthDataModal
            visible={showBirthModal}
            hideClose={true}
            title="Birth Details"
            onClose={handleBirthModalClose}
            onSave={handleBirthDataComplete}
          />
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  welcomeContainer: { alignItems: 'center', marginBottom: theme.spacing.xl },
  logoContainer: { marginBottom: 0 },
  
  
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    marginTop: -64,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: theme.textGold,
    fontStyle: 'italic',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  featuresContainer: { marginBottom: theme.spacing.xl },
  feature: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg, paddingHorizontal: theme.spacing.md },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  featureText: { fontSize: 16, color: theme.textSecondary, flex: 1 },
  ctaContainer: { alignItems: 'center' },
  ctaButton: {
    width: '100%',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadows.glow,
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#020817', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), marginRight: theme.spacing.sm },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  restoreText: {
    fontSize: 14,
    color: theme.textGold,
    marginLeft: theme.spacing.sm,
  },
  
  generatingContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  generatingIcon: { marginBottom: theme.spacing.xl },
  generatingTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), marginBottom: theme.spacing.sm, textAlign: 'center' },
  generatingSubtitle: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: theme.spacing.xl, paddingHorizontal: theme.spacing.lg },
  loadingDots: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.textGold, marginHorizontal: 4 },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 1 },
  passphraseInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
});
