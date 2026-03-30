// File: components/OnboardingModal.tsx
// Ethereal Onboarding Flow — cinematic, one-question-at-a-time initiation
// Strategy: single question per screen, slow crossfade transitions, living background, processing climax

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';

import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import SkiaMetallicPill from './ui/SkiaMetallicPill';
import TermsConsentModal from './TermsConsentModal';

import { BirthData, HouseSystem, NatalChart } from '../services/astrology/types';
import { AstrologyCalculator } from '../services/astrology/calculator';
import { InputValidator } from '../services/astrology/inputValidator';
import { localDb } from '../services/storage/localDb';
import { BackupService } from '../services/storage/backupService';
import { toLocalDateString } from '../utils/dateUtils';
import { logger } from '../utils/logger';
import { MetallicIcon } from './ui/MetallicIcon';
import { MetallicText } from './ui/MetallicText';
import Constants from 'expo-constants';

const DISPLAY = Platform.select({ ios: 'SFProDisplay-Regular', android: 'sans-serif', default: 'System' });
const DISPLAY_SEMIBOLD = Platform.select({ ios: 'SFProDisplay-Semibold', android: 'sans-serif-medium', default: 'System' });
const DISPLAY_BOLD = Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' });

// ── Velvet Tech Palette ──
const VELVET = {
  bgOled: '#000000',
  accentPrimary: '#FFFFFF', // Clean, high-contrast white
  accentCyan: '#00E5FF', // High-tech data glow
  etherealBlue: 'rgba(0, 150, 255, 0.4)', // Deep aurora blue
  dreamViolet: 'rgba(138, 43, 226, 0.3)', // Deep aurora purple
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassFill: 'rgba(255, 255, 255, 0.04)',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255, 255, 255, 0.5)',
};

// ── Nominatim location search ──
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const _bundleId = Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.mysky.app';
const NOMINATIM_HEADERS = {
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': `MySkyApp/1.0 (${_bundleId})`,
};

interface LocationSuggestion {
  place_id?: string | number;
  display_name: string;
  lat: string;
  lon: string;
}

// ── Step Types ──
type OnboardingStep = 'welcome' | 'name' | 'birthDate' | 'birthTime' | 'location' | 'processing' | 'passphrase';

const STEP_PROGRESS_INDEX: Record<OnboardingStep, number> = {
  welcome: -1,
  name: 0,
  birthDate: 1,
  birthTime: 2,
  location: 3,
  processing: -1,
  passphrase: -1,
};

// ── Living Background (Aurora Velvet Glass) ──
function LivingBackground() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 60_000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <View style={st.orbBlue} />
        <View style={st.orbViolet} />
      </Animated.View>
      {/* Massive blur to create the velvet glass nebula effect */}
      <BlurView intensity={120} tint="dark" style={StyleSheet.absoluteFill} />
    </View>
  );
}

// ── Pulsing Processing Orb (High-Tech Scanner) ──
function ProcessingOrb() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.8 + pulse.value * 0.5 }],
    opacity: 0.1 + pulse.value * 0.2,
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${pulse.value * 360}deg` }],
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-pulse.value * 180}deg` }],
  }));

  return (
    <View style={st.processingOrbContainer}>
      <Animated.View style={[st.processingGlow, glowStyle]} />
      <Animated.View style={[st.processingInnerRing, innerRingStyle]} />
      <Animated.View style={[st.processingOuterRing, outerRingStyle]} />
      <Ionicons name="scan-outline" size={32} color={VELVET.accentCyan} style={st.processingSparkle} />
    </View>
  );
}

// ── Progress Capsules (Editorial Lines) ──
function ProgressIndicator({ currentIndex }: { currentIndex: number }) {
  return (
    <View style={st.progressRow}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            st.progressCapsule,
            i <= currentIndex ? st.progressCapsuleActive : st.progressCapsuleInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ── Bottom Navigation Bar ──
function BottomNav({
  canGoBack,
  isNextDisabled,
  nextLabel,
  nextIcon,
  onBack,
  onNext,
}: {
  canGoBack: boolean;
  isNextDisabled: boolean;
  nextLabel: string;
  nextIcon: React.ComponentProps<typeof Ionicons>['name'];
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <View style={st.bottomNav}>
      {canGoBack ? (
        <Pressable
          style={({ pressed }) => [st.backButton, pressed && { opacity: 0.7 }]}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back-outline" size={24} color={VELVET.textMain} />
        </Pressable>
      ) : <View style={{ width: 56 }} />}

      <View style={{ flex: 1 }} />

      <Pressable
        style={({ pressed }) => [
          st.nextButton,
          isNextDisabled && st.nextButtonDisabled,
          pressed && !isNextDisabled && st.nextButtonPressed,
        ]}
        onPress={onNext}
        disabled={isNextDisabled}
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
      >
        <Text style={st.nextButtonText}>{nextLabel}</Text>
        <Ionicons name={nextIcon} size={18} color={VELVET.bgOled} style={{ marginLeft: 8 }} />
      </Pressable>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── Main Component ──
// ════════════════════════════════════════════════════════════════════════════

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (chart: NatalChart) => void;
  needsTermsConsent?: boolean;
  onTermsConsent?: (granted: boolean) => void;
  onRequestTermsConsent?: () => void;
}

export default function OnboardingModal({
  visible,
  onComplete,
  needsTermsConsent = false,
  onTermsConsent,
  onRequestTermsConsent,
}: OnboardingModalProps) {
  // ── Step state ──
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [showTermsModal, setShowTermsModal] = useState(false);

  // ── User data ──
  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [birthTime, setBirthTime] = useState<Date>(new Date());
  const [hasUnknownTime, setHasUnknownTime] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationPlace, setLocationPlace] = useState('');
  const [locationLat, setLocationLat] = useState(0);
  const [locationLon, setLocationLon] = useState(0);
  const [locationSelected, setLocationSelected] = useState(false);

  // ── Location search state ──
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Backup restore state ──
  const [backupUri, setBackupUri] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep('welcome');
      setShowTermsModal(false);
      setUserName('');
      setBirthDate(new Date());
      setBirthTime(new Date());
      setHasUnknownTime(false);
      setLocationQuery('');
      setLocationPlace('');
      setLocationLat(0);
      setLocationLon(0);
      setLocationSelected(false);
      setLocationSuggestions([]);
      setBackupUri(null);
      setPassphrase('');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      timeoutRef.current = null;
    } else {
      setBirthDate(new Date());
      setBirthTime(new Date());
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const STEP_ORDER: OnboardingStep[] = ['name', 'birthDate', 'birthTime', 'location', 'processing'];

  const goToStep = (next: OnboardingStep) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep(next);
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) goToStep(STEP_ORDER[idx - 1]);
  };

  const prevNeedsTermsRef = useRef(needsTermsConsent);
  useEffect(() => {
    const wasNeeded = prevNeedsTermsRef.current;
    prevNeedsTermsRef.current = needsTermsConsent;
    if (wasNeeded && !needsTermsConsent && step === 'welcome') {
      goToStep('name');
    }
  }, [needsTermsConsent, step]);

  const handleGetStarted = () => {
    Haptics.selectionAsync().catch(() => {});
    if (needsTermsConsent) {
      if (onRequestTermsConsent) {
        onRequestTermsConsent();
      } else {
        setShowTermsModal(true);
      }
      return;
    }
    goToStep('name');
  };

  const handleNameContinue = () => {
    if (!userName.trim()) return;
    Haptics.selectionAsync().catch(() => {});
    goToStep('birthDate');
  };

  const handleDateContinue = () => {
    Haptics.selectionAsync().catch(() => {});
    goToStep('birthTime');
  };

  const handleTimeContinue = () => {
    Haptics.selectionAsync().catch(() => {});
    goToStep('location');
  };

  const handleUnknownTime = () => {
    Haptics.selectionAsync().catch(() => {});
    setHasUnknownTime(true);
    goToStep('location');
  };

  const handleCalculateChart = async () => {
    if (!locationSelected || !locationPlace.trim()) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    goToStep('processing');

    try {
      if (userName.trim()) {
        await EncryptedAsyncStorage.setItem('msky_user_name', userName.trim());
      }

      const birthData: BirthData = {
        date: toLocalDateString(birthDate),
        time: hasUnknownTime ? undefined : birthTime.toTimeString().slice(0, 5),
        hasUnknownTime,
        place: locationPlace,
        latitude: locationLat,
        longitude: locationLon,
        houseSystem: 'whole-sign' as HouseSystem,
      };

      const validation = InputValidator.validateBirthData(birthData);
      if (!validation.valid) {
        Alert.alert('Invalid Entry', validation.errors[0], [
          { text: 'OK', onPress: () => goToStep('location') },
        ]);
        return;
      }

      const chart = AstrologyCalculator.generateNatalChart(birthData);

      const savedChart = {
        id: chart.id,
        name: chart.name,
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
      }, 4000);
    } catch (error) {
      logger.error('Failed to generate chart:', error);
      Alert.alert('Something went wrong', 'We could not create your profile. Please try again.', [
        { text: 'OK', onPress: () => goToStep('location') },
      ]);
    }
  };

  const searchLocation = useCallback((query: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    setLocationSelected(false);

    const q = query.trim();
    if (q.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingLocation(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(
          `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(q)}&limit=5`,
          {
            signal: controller.signal,
            headers: NOMINATIM_HEADERS,
          }
        );
        if (!response.ok) {
          throw new Error(`Nominatim error ${response.status}`);
        }
        const data = await response.json();

        if (!controller.signal.aborted) {
          setLocationSuggestions(Array.isArray(data) ? data : []);
        }
      } catch {
        setLocationSuggestions([]);
      } finally {
        setSearchingLocation(false);
      }
    }, 500);
  }, []);

  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    Haptics.selectionAsync().catch(() => {});
    setLocationQuery(suggestion.display_name);
    setLocationPlace(suggestion.display_name);
    setLocationLat(parseFloat(suggestion.lat));
    setLocationLon(parseFloat(suggestion.lon));
    setLocationSelected(true);
    setLocationSuggestions([]);
    Keyboard.dismiss();
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
    setStep('processing');
    try {
      await BackupService.restoreFromBackupFile(backupUri, passphrase);
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const birthDataFromChart = {
          date: charts[0].birthDate,
          time: charts[0].birthTime,
          hasUnknownTime: charts[0].hasUnknownTime,
          place: charts[0].birthPlace,
          latitude: charts[0].latitude,
          longitude: charts[0].longitude,
          houseSystem: charts[0].houseSystem,
          timezone: charts[0].timezone,
        };
        const chart = AstrologyCalculator.generateNatalChart(birthDataFromChart);
        timeoutRef.current = setTimeout(() => {
          onComplete(chart);
        }, 900);
      } else {
        Alert.alert('No Data Found', 'The backup did not contain any profile data.', [
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

  const handleTermsDecision = async (granted: boolean) => {
    try {
      if (!granted) {
        onTermsConsent?.(false);
        setShowTermsModal(true);
        return;
      }
      onTermsConsent?.(true);
      setShowTermsModal(false);
      goToStep('name');
    } catch (e) {
      logger.error('Terms decision failed:', e);
      if (granted) {
        setShowTermsModal(false);
        goToStep('name');
      } else {
        setShowTermsModal(true);
      }
    }
  };

  const showProgress = STEP_PROGRESS_INDEX[step] >= 0;

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => {}}>
      <View style={st.container}>
        <SkiaDynamicCosmos fill={VELVET.bgOled} />
        <LivingBackground />

        <SafeAreaView edges={['top', 'bottom']} style={st.safeArea}>
          {showProgress && (
            <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(300)}>
              <ProgressIndicator currentIndex={STEP_PROGRESS_INDEX[step]} />
            </Animated.View>
          )}

          <View style={st.contentArea}>

            {/* ══════ WELCOME ══════ */}
            {step === 'welcome' && (
              <View style={st.centeredFlex}>
                <Animated.View entering={FadeInDown.delay(100).duration(900)} style={st.welcomeContainer}>
                  <Text style={st.welcomeTitle}>Welcome to MySky</Text>
                  <Text style={st.welcomeSubtitle}>Personal Growth, Mapped to You</Text>
                  <Text style={st.welcomeDescription}>
                    Track your mood, sleep, and energy, journal your thoughts, and uncover personal patterns over time.
                  </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(400).duration(700)} style={st.featuresContainer}>
                  {[
                    { icon: 'pencil-outline' as const, text: 'Daily journaling & reflection' },
                    { icon: 'pulse-outline' as const, text: 'Mood, sleep & energy tracking' },
                    { icon: 'analytics-outline' as const, text: 'Pattern insights drawn from data' },
                    { icon: 'lock-closed-outline' as const, text: 'Private & encrypted on-device' },
                  ].map((item, i) => (
                    <BlurView intensity={20} tint="dark" key={i} style={st.featureCard}>
                      <View style={st.featureIcon}>
                        <Ionicons name={item.icon} size={20} color={VELVET.accentPrimary} />
                      </View>
                      <Text style={st.featureText}>{item.text}</Text>
                    </BlurView>
                  ))}
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(700).duration(600)} style={st.ctaContainer}>
                  <Pressable
                    style={({ pressed }) => [st.primaryActionBtn, pressed && st.primaryActionBtnPressed]}
                    onPress={handleGetStarted}
                  >
                    <Text style={st.primaryActionBtnText}>Get Started</Text>
                    <Ionicons name="arrow-forward" size={18} color={VELVET.bgOled} style={{ marginLeft: 8 }} />
                  </Pressable>
                  <Pressable style={st.restoreButton} onPress={handleRestoreBackup} accessibilityRole="button">
                    <Ionicons name="cloud-download-outline" size={16} color={VELVET.textMuted} />
                    <Text style={st.restoreText}>Restore from Backup</Text>
                  </Pressable>
                </Animated.View>
              </View>
            )}

            {/* ══════ NAME ══════ */}
            {step === 'name' && (
              <View style={st.centeredFlex}>
                <Animated.View entering={FadeIn.delay(100).duration(900)} style={st.singleQuestionContainer}>
                  <Text style={st.etherealQuestion}>What should we call you?</Text>
                  <View style={st.nameInputWrapper}>
                    <TextInput
                      style={st.nameInput}
                      value={userName}
                      onChangeText={setUserName}
                      placeholder="Your name"
                      placeholderTextColor={VELVET.textMuted}
                      autoFocus
                      returnKeyType="next"
                      maxLength={30}
                      onSubmitEditing={handleNameContinue}
                      autoCapitalize="words"
                      autoCorrect={false}
                      selectionColor={VELVET.accentCyan}
                    />
                    <View style={[st.inputUnderline, userName.trim() ? st.inputUnderlineActive : st.inputUnderlineInactive]} />
                  </View>
                </Animated.View>
                <Animated.View entering={FadeInUp.delay(400).duration(600)}>
                  <BottomNav canGoBack={false} isNextDisabled={!userName.trim()} nextLabel="Continue" nextIcon="arrow-forward" onBack={goBack} onNext={handleNameContinue} />
                </Animated.View>
              </View>
            )}

            {/* ══════ BIRTH DATE ══════ */}
            {step === 'birthDate' && (
              <View style={st.centeredFlex}>
                <Animated.View entering={FadeIn.delay(100).duration(900)} style={st.singleQuestionContainer}>
                  <Text style={st.etherealQuestion}>When did your journey begin?</Text>
                  <Text style={st.etherealSubtext}>
                    Used to accurately map your internal weather and profile.
                  </Text>

                  <BlurView intensity={25} tint="dark" style={st.glassCard}>
                    <DateTimePicker
                      value={birthDate}
                      mode="date"
                      display="spinner"
                      onChange={(_e: DateTimePickerEvent, selected?: Date) => {
                        if (selected) setBirthDate(selected);
                      }}
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 0, 1)}
                      themeVariant="dark"
                      textColor="#FFFFFF"
                      style={{ width: '100%' }}
                    />
                  </BlurView>
                </Animated.View>
                <Animated.View entering={FadeInUp.delay(400).duration(600)}>
                  <BottomNav canGoBack={true} isNextDisabled={false} nextLabel="Continue" nextIcon="arrow-forward" onBack={goBack} onNext={handleDateContinue} />
                </Animated.View>
              </View>
            )}

            {/* ══════ BIRTH TIME ══════ */}
            {step === 'birthTime' && (
              <View style={st.centeredFlex}>
                <Animated.View entering={FadeIn.delay(100).duration(900)} style={st.singleQuestionContainer}>
                  <Text style={st.etherealQuestion}>What time did you arrive?</Text>
                  <Text style={st.etherealSubtext}>
                    Precision helps us personalize your data patterns.
                  </Text>

                  <BlurView intensity={25} tint="dark" style={st.glassCard}>
                    <DateTimePicker
                      value={birthTime}
                      mode="time"
                      display="spinner"
                      onChange={(_e: DateTimePickerEvent, selected?: Date) => {
                        if (selected) {
                          setBirthTime(selected);
                          setHasUnknownTime(false);
                        }
                      }}
                      themeVariant="dark"
                      textColor="#FFFFFF"
                      style={{ width: '100%' }}
                    />
                  </BlurView>

                  <Pressable
                    style={({ pressed }) => [st.unknownTimeButton, pressed && { opacity: 0.7 }]}
                    onPress={handleUnknownTime}
                  >
                    <Text style={st.unknownTimeText}>I don't know my exact birth time</Text>
                  </Pressable>
                </Animated.View>
                <Animated.View entering={FadeInUp.delay(400).duration(600)}>
                  <BottomNav canGoBack={true} isNextDisabled={false} nextLabel="Continue" nextIcon="arrow-forward" onBack={goBack} onNext={handleTimeContinue} />
                </Animated.View>
              </View>
            )}

            {/* ══════ LOCATION ══════ */}
            {step === 'location' && (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
              >
                <Animated.View entering={FadeIn.delay(100).duration(900)} style={st.singleQuestionContainer}>
                  <Text style={st.etherealQuestion}>Where did your journey begin?</Text>
                  <Text style={st.etherealSubtext}>
                    City of birth roots your profile baseline.
                  </Text>

                  <BlurView intensity={20} tint="dark" style={st.locationSearchRow}>
                    <Ionicons name="search-outline" size={20} color={VELVET.accentPrimary} />
                    <TextInput
                      style={st.locationInput}
                      value={locationQuery}
                      onChangeText={(t) => {
                        setLocationQuery(t);
                        searchLocation(t);
                      }}
                      placeholder="Search city..."
                      placeholderTextColor={VELVET.textMuted}
                      autoFocus
                      returnKeyType="search"
                      autoCapitalize="words"
                      autoCorrect={false}
                      selectionColor={VELVET.accentCyan}
                    />
                    {searchingLocation && (
                      <ActivityIndicator size="small" color={VELVET.accentPrimary} />
                    )}
                  </BlurView>

                  {locationSuggestions.length > 0 && !locationSelected && (
                    <BlurView intensity={30} tint="dark" style={st.suggestionsContainer}>
                      {locationSuggestions.map((suggestion, idx) => {
                        const parts = suggestion.display_name.split(', ');
                        const city = parts.slice(0, 2).join(', ');
                        const country = parts[parts.length - 1] || '';
                        return (
                          <React.Fragment key={suggestion.place_id ?? idx}>
                            {idx > 0 && <View style={st.suggestionDivider} />}
                            <Pressable
                              style={({ pressed }) => [st.suggestionRow, pressed && { backgroundColor: VELVET.glassFill }]}
                              onPress={() => handleSelectLocation(suggestion)}
                            >
                              <View>
                                <Text style={st.suggestionCity}>{city}</Text>
                                <Text style={st.suggestionCountry}>{country}</Text>
                              </View>
                            </Pressable>
                          </React.Fragment>
                        );
                      })}
                    </BlurView>
                  )}

                  {locationSelected && (
                    <Animated.View entering={FadeIn.duration(400)} style={st.locationConfirmed}>
                      <Ionicons name="checkmark-circle-outline" size={20} color={VELVET.accentCyan} />
                      <Text style={st.locationConfirmedText} numberOfLines={2}>
                        {locationPlace}
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(400).duration(600)}>
                  <BottomNav canGoBack={true} isNextDisabled={!locationSelected} nextLabel="Create Profile" nextIcon="sparkles" onBack={goBack} onNext={handleCalculateChart} />
                </Animated.View>
              </ScrollView>
            )}

            {/* ══════ PROCESSING CLIMAX ══════ */}
            {step === 'processing' && (
              <View style={st.centeredFlex}>
                <Animated.View entering={FadeIn.delay(100).duration(1000)} style={st.processingContainer}>
                  <ProcessingOrb />
                  <View style={st.processingTextGroup}>
                    <Text style={st.processingLabel}>COMPILING DATA</Text>
                    <Text style={st.processingMessage}>
                      {userName.trim()
                        ? `Mapping telemetry for ${userName.trim()}`
                        : 'Analyzing core patterns'}
                    </Text>
                  </View>
                </Animated.View>
              </View>
            )}

            {/* ══════ PASSPHRASE (Restore) ══════ */}
            {step === 'passphrase' && (
              <View style={st.centeredFlex}>
                <Animated.View entering={FadeIn.delay(100).duration(800)} style={st.singleQuestionContainer}>
                  <View style={st.passphraseIconWrap}>
                    <Ionicons name="lock-closed-outline" size={32} color={VELVET.accentPrimary} />
                  </View>
                  <Text style={st.etherealQuestion}>Enter Encryption Key</Text>
                  <Text style={st.etherealSubtext}>
                    Provide the passphrase used to secure your backup.
                  </Text>
                  
                  <BlurView intensity={20} tint="dark" style={st.passphraseInputWrapper}>
                    <TextInput
                      style={st.passphraseInput}
                      value={passphrase}
                      onChangeText={setPassphrase}
                      placeholder="Enter passphrase"
                      placeholderTextColor={VELVET.textMuted}
                      secureTextEntry
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handlePassphraseSubmit}
                      selectionColor={VELVET.accentCyan}
                    />
                  </BlurView>

                  <Pressable
                    style={({ pressed }) => [st.primaryActionBtn, { width: '100%', marginBottom: 16 }, pressed && st.primaryActionBtnPressed]}
                    onPress={handlePassphraseSubmit}
                  >
                    <Text style={st.primaryActionBtnText}>Decrypt & Restore</Text>
                  </Pressable>

                  <Pressable style={[st.restoreButton, { alignSelf: 'center' }]} onPress={() => setStep('welcome')}>
                    <Text style={st.restoreText}>Cancel</Text>
                  </Pressable>
                </Animated.View>
              </View>
            )}
          </View>
        </SafeAreaView>

        {showTermsModal && !onRequestTermsConsent && (
          <TermsConsentModal visible onConsent={handleTermsDecision} />
        )}
      </View>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── Styles ──
// ════════════════════════════════════════════════════════════════════════════

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: VELVET.bgOled },
  safeArea: { flex: 1 },

  // ── Living Background Orbs ──
  orbBlue: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: VELVET.etherealBlue,
    top: -200,
    right: -150,
  },
  orbViolet: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: VELVET.dreamViolet,
    bottom: -100,
    left: -200,
  },

  // ── Progress Capsules (Editorial) ──
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingTop: 20,
    gap: 6,
  },
  progressCapsule: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  progressCapsuleActive: {
    backgroundColor: VELVET.accentPrimary,
  },
  progressCapsuleInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // ── Content Layout ──
  contentArea: {
    flex: 1,
    paddingHorizontal: 32,
  },
  centeredFlex: {
    flex: 1,
    justifyContent: 'center',
  },

  // ── Welcome (Left-aligned, strong hierarchy) ──
  welcomeContainer: { alignItems: 'flex-start', marginBottom: 32, width: '100%' },
  welcomeTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: VELVET.textMain,
    fontFamily: DISPLAY_BOLD,
    marginBottom: 8,
    textAlign: 'left',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: VELVET.accentCyan,
    marginBottom: 16,
    textAlign: 'left',
    fontFamily: DISPLAY_SEMIBOLD,
    letterSpacing: 0.5,
  },
  welcomeDescription: {
    fontSize: 16,
    color: VELVET.textMuted,
    textAlign: 'left',
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: DISPLAY,
  },
  
  featuresContainer: { marginBottom: 32, gap: 12 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VELVET.glassBorder,
    backgroundColor: VELVET.glassFill,
    overflow: 'hidden',
  },
  featureIcon: {
    marginRight: 16,
  },
  featureText: { 
    fontSize: 15, 
    fontWeight: '500',
    color: VELVET.textMain, 
    flex: 1,
    fontFamily: DISPLAY_SEMIBOLD,
  },
  
  ctaContainer: { alignItems: 'center', width: '100%' },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VELVET.accentPrimary,
    width: '100%',
    height: 56,
    borderRadius: 28,
    marginBottom: 16,
  },
  primaryActionBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  primaryActionBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: VELVET.bgOled,
    fontFamily: DISPLAY_BOLD,
  },
  
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: VELVET.textMuted,
    marginLeft: 8,
    fontFamily: DISPLAY_SEMIBOLD,
  },

  // ── Single Question Layout ──
  singleQuestionContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  etherealQuestion: {
    fontSize: 34,
    fontWeight: '800',
    color: VELVET.textMain,
    fontFamily: DISPLAY_BOLD,
    marginBottom: 12,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  etherealSubtext: {
    fontSize: 16,
    color: VELVET.textMuted,
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: DISPLAY,
  },

  // ── Name Input ──
  nameInputWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  nameInput: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 8,
    fontSize: 32,
    fontWeight: '700',
    color: VELVET.textMain,
    fontFamily: DISPLAY_BOLD,
  },
  inputUnderline: {
    height: 2,
    width: '100%',
    marginTop: 8,
  },
  inputUnderlineActive: {
    backgroundColor: VELVET.accentCyan,
    shadowColor: VELVET.accentCyan,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  inputUnderlineInactive: {
    backgroundColor: VELVET.glassBorder,
  },

  // ── Glass Card (Pickers) ──
  glassCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: VELVET.glassBorder,
    backgroundColor: VELVET.glassFill,
    padding: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },

  unknownTimeButton: {
    marginTop: 20,
    alignSelf: 'flex-start',
    paddingVertical: 12,
  },
  unknownTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: VELVET.textMuted,
    fontFamily: DISPLAY_SEMIBOLD,
  },

  // ── Location Search ──
  locationSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VELVET.glassBorder,
    backgroundColor: VELVET.glassFill,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    overflow: 'hidden',
  },
  locationInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: VELVET.textMain,
    fontFamily: DISPLAY_SEMIBOLD,
  },
  suggestionsContainer: {
    marginTop: 12,
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VELVET.glassBorder,
    backgroundColor: VELVET.glassFill,
    overflow: 'hidden',
  },
  suggestionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: VELVET.glassBorder,
    marginLeft: 16,
  },
  suggestionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  suggestionCity: {
    fontSize: 16,
    fontWeight: '600',
    color: VELVET.textMain,
    marginBottom: 4,
    fontFamily: DISPLAY_SEMIBOLD,
  },
  suggestionCountry: {
    fontSize: 14,
    fontWeight: '400',
    color: VELVET.textMuted,
    fontFamily: DISPLAY,
  },
  locationConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
    paddingHorizontal: 4,
  },
  locationConfirmedText: {
    fontSize: 15,
    fontWeight: '500',
    color: VELVET.textMain,
    flex: 1,
    fontFamily: DISPLAY_SEMIBOLD,
  },

  // ── Bottom Navigation ──
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 24,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: VELVET.glassFill,
    borderWidth: 1,
    borderColor: VELVET.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: VELVET.accentPrimary,
    paddingHorizontal: 28,
    height: 50,
    borderRadius: 25,
  },
  nextButtonDisabled: {
    opacity: 0.3,
  },
  nextButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: VELVET.bgOled,
    fontFamily: DISPLAY_BOLD,
  },

  // ── Processing Climax ──
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingOrbContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  processingGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: VELVET.accentCyan,
    shadowColor: VELVET.accentCyan,
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  processingInnerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: VELVET.accentCyan,
    borderStyle: 'dashed',
  },
  processingOuterRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: VELVET.glassBorder,
  },
  processingSparkle: {
    zIndex: 1,
  },
  processingTextGroup: {
    alignItems: 'center',
  },
  processingLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    color: VELVET.textMuted,
    marginBottom: 12,
    fontFamily: DISPLAY_BOLD,
  },
  processingMessage: {
    fontSize: 22,
    fontWeight: '600',
    color: VELVET.textMain,
    fontFamily: DISPLAY_SEMIBOLD,
    textAlign: 'center',
  },

  // ── Passphrase ──
  passphraseIconWrap: {
    marginBottom: 20,
  },
  passphraseInputWrapper: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: VELVET.glassBorder,
    backgroundColor: VELVET.glassFill,
    overflow: 'hidden',
    marginBottom: 32,
  },
  passphraseInput: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 17,
    fontWeight: '500',
    color: VELVET.textMain,
    textAlign: 'center',
    fontFamily: DISPLAY_SEMIBOLD,
  },
});
