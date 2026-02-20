import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import StarField from './ui/StarField';
import BirthDataModal from './BirthDataModal';
import { BirthData } from '../services/astrology/types';
import { AstrologyCalculator } from '../services/astrology/calculator';
import { localDb } from '../services/storage/localDb';
import { BackupService } from '../services/storage/backupService';
import { logger } from '../utils/logger';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (chart: any) => void;
}

export default function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<'welcome' | 'birth-data' | 'generating' | 'passphrase'>('welcome');
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [backupUri, setBackupUri] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep('welcome');
      setShowBirthModal(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleGetStarted = () => {
    Haptics.selectionAsync();
    setStep('birth-data');
    setShowBirthModal(true);
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

  const handleBirthModalClose = () => {
    // Treat closing as “back to welcome” (prevents being stuck in a dead step)
    setShowBirthModal(false);
    setStep('welcome');
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

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => {}}>
      <View style={styles.container}>
        <StarField starCount={100} />

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {step === 'welcome' && (
              <>
                <Animated.View entering={FadeInDown.delay(100).duration(800)} style={styles.welcomeContainer}>
                  <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                      <Text style={styles.logoText}>🌙</Text>
                    </View>
                  </View>

                  <Text style={styles.welcomeTitle}>Welcome to MySky</Text>
                  <Text style={styles.welcomeSubtitle}>Personal Growth, Mapped to You</Text>

                  <Text style={styles.description}>
                    MySky is a journaling and self-reflection tool. Track your emotions, discover your patterns, and grow — guided by the personalized framework of your birth chart.
                  </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.featuresContainer}>
                  <View style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="pencil" size={20} color={theme.primary} />
                    </View>
                    <Text style={styles.featureText}>Daily guided reflection & journaling</Text>
                  </View>

                  <View style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="pulse" size={20} color={theme.primary} />
                    </View>
                    <Text style={styles.featureText}>Emotional tracking & pattern analysis</Text>
                  </View>

                  <View style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="lock-closed" size={20} color={theme.primary} />
                    </View>
                    <Text style={styles.featureText}>Private & encrypted — only you can see this</Text>
                  </View>

                  <View style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Ionicons name="star" size={20} color={theme.primary} />
                    </View>
                    <Text style={styles.featureText}>Personalized by your birth chart</Text>
                  </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.ctaContainer}>
                  <Pressable style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]} onPress={handleGetStarted} accessibilityRole="button" accessibilityLabel="Get started">
                    <LinearGradient
                      colors={[...theme.goldGradient]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ctaGradient}
                    >
                      <Text style={styles.ctaText}>Get Started</Text>
                      <Ionicons name="arrow-forward" size={20} color="#1A1A1A" />
                    </LinearGradient>
                  </Pressable>

                  <Pressable style={styles.restoreButton} onPress={handleRestoreBackup} accessibilityRole="button" accessibilityLabel="Restore from backup">
                    <Ionicons name="cloud-download-outline" size={16} color={theme.primary} />
                    <Text style={styles.restoreText}>Restore from Backup</Text>
                  </Pressable>

                  <Text style={styles.privacyText}>Your birth data is stored securely on your device</Text>
                </Animated.View>
              </>
            )}

            {step === 'generating' && (
              <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.generatingContainer}>
                <View style={styles.generatingIcon}>
                  <Ionicons name="sparkles" size={48} color={theme.primary} />
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
                  <Ionicons name="lock-closed" size={48} color={theme.primary} />
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

                <Pressable style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]} onPress={handlePassphraseSubmit} accessibilityRole="button" accessibilityLabel="Restore backup">
                  <LinearGradient
                    colors={[...theme.goldGradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.ctaGradient}
                  >
                    <Text style={styles.ctaText}>Restore</Text>
                    <Ionicons name="cloud-download" size={20} color="#1A1A1A" />
                  </LinearGradient>
                </Pressable>

                <Pressable style={styles.restoreButton} onPress={() => setStep('welcome')} accessibilityRole="button" accessibilityLabel="Cancel restore">
                  <Text style={styles.restoreText}>Cancel</Text>
                </Pressable>
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>

        <BirthDataModal visible={showBirthModal} onClose={handleBirthModalClose} onSave={handleBirthDataComplete} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  welcomeContainer: { alignItems: 'center', marginBottom: theme.spacing.xl },
  logoContainer: { marginBottom: theme.spacing.xl },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  logoText: { fontSize: 48 },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: theme.primary,
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
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  featureText: { fontSize: 16, color: theme.textSecondary, flex: 1 },
  ctaContainer: { alignItems: 'center' },
  ctaButton: { width: '100%', borderRadius: theme.borderRadius.lg, overflow: 'hidden', marginBottom: theme.spacing.md, ...theme.shadows.glow },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl },
  ctaText: { fontSize: 18, fontWeight: '700', color: '#0D1421', fontFamily: 'serif', marginRight: theme.spacing.sm },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  restoreText: {
    fontSize: 14,
    color: theme.primary,
    marginLeft: theme.spacing.sm,
  },
  privacyText: { fontSize: 12, color: theme.textMuted, textAlign: 'center', paddingHorizontal: theme.spacing.lg },
  generatingContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  generatingIcon: { marginBottom: theme.spacing.xl },
  generatingTitle: { fontSize: 24, fontWeight: '700', color: theme.textPrimary, fontFamily: 'serif', marginBottom: theme.spacing.sm, textAlign: 'center' },
  generatingSubtitle: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: theme.spacing.xl, paddingHorizontal: theme.spacing.lg },
  loadingDots: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, marginHorizontal: 4 },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 1 },
  passphraseInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
});