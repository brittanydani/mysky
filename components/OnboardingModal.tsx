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

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

// ── Ethereal Palette ──
const ETHEREAL = {
  bgDark: '#0A0A0F',
  accentGold: 'rgba(217, 191, 140, 1)',
  etherealBlue: 'rgba(115, 166, 217, 0.15)',
  dreamViolet: 'rgba(140, 115, 191, 0.10)',
};

// ── Nominatim location search ──
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_HEADERS = {
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'MySkyApp/1.0 (brittanyapps@outlook.com)',
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

// ── Living Background ──
function LivingBackground() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 40_000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
      <View style={st.orbBlue} />
      <View style={st.orbViolet} />
    </Animated.View>
  );
}

// ── Pulsing Processing Orb ──
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
    transform: [{ scale: 0.8 + pulse.value * 0.4 }],
    opacity: 0.15 + pulse.value * 0.15,
  }));

  const innerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${pulse.value * 180}deg` }],
  }));

  const outerRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-pulse.value * 180}deg` }],
  }));

  return (
    <View style={st.processingOrbContainer}>
      <Animated.View style={[st.processingGlow, glowStyle]} />
      <Animated.View style={[st.processingInnerRing, innerRingStyle]} />
      <Animated.View style={[st.processingOuterRing, outerRingStyle]} />
      <MetallicIcon name="sparkles" size={28} color={ETHEREAL.accentGold} style={st.processingSparkle} />
    </View>
  );
}

// ── Progress Capsules ──
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
          <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.45)" />
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
        <Ionicons name={nextIcon} size={16} color={ETHEREAL.bgDark} style={{ marginLeft: 6 }} />
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
}

export default function OnboardingModal({
  visible,
  onComplete,
  needsTermsConsent = false,
  onTermsConsent,
}: OnboardingModalProps) {
  // ── Step state ──
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [showTermsModal, setShowTermsModal] = useState(false);

  // ── User data (inline — no external BirthDataModal) ──
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

  // ── Reset everything when modal hides; refresh date/time defaults when it opens ──
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
      // Refresh the time default so the picker reflects "now" rather than the
      // stale time captured when the component first mounted.
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

  // ── Navigation helpers ──
  const STEP_ORDER: OnboardingStep[] = ['name', 'birthDate', 'birthTime', 'location', 'processing'];

  const goToStep = (next: OnboardingStep) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep(next);
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) goToStep(STEP_ORDER[idx - 1]);
  };

  // ── Welcome → Name ──
  const handleGetStarted = () => {
    Haptics.selectionAsync().catch(() => {});
    if (needsTermsConsent) {
      setShowTermsModal(true);
      return;
    }
    goToStep('name');
  };

  // ── Name → Birth Date ──
  const handleNameContinue = () => {
    if (!userName.trim()) return;
    Haptics.selectionAsync().catch(() => {});
    goToStep('birthDate');
  };

  // ── Birth Date → Birth Time ──
  const handleDateContinue = () => {
    Haptics.selectionAsync().catch(() => {});
    goToStep('birthTime');
  };

  // ── Birth Time → Location ──
  const handleTimeContinue = () => {
    Haptics.selectionAsync().catch(() => {});
    goToStep('location');
  };

  // ── "I don't know my birth time" ──
  const handleUnknownTime = () => {
    Haptics.selectionAsync().catch(() => {});
    setHasUnknownTime(true);
    goToStep('location');
  };

  // ── Location → Processing (Calculate Chart) ──
  const handleCalculateChart = async () => {
    if (!locationSelected || !locationPlace.trim()) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
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

      // Processing climax — 4 second delay for the cinematic effect
      timeoutRef.current = setTimeout(() => {
        onComplete(chart);
      }, 4000);
    } catch (error) {
      logger.error('Failed to generate chart:', error);
      Alert.alert('Something went wrong', 'We could not create your chart. Please try again.', [
        { text: 'OK', onPress: () => goToStep('location') },
      ]);
    }
  };

  // ── Location search (Nominatim) ──
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

  // ── Backup restore ──
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

  // ── Terms consent ──
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

  // ── Derived state ──
  const showProgress = STEP_PROGRESS_INDEX[step] >= 0;

  // ════════════════════════════════════════════════════════════════════════
  // ── Render ──
  // ════════════════════════════════════════════════════════════════════════

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={() => {}}>
      <View style={st.container}>
        <SkiaDynamicCosmos fill="#0A0A0F" />
        <LivingBackground />

        <SafeAreaView edges={['top', 'bottom']} style={st.safeArea}>
          {/* ── Progress Indicator (hidden on welcome/processing/passphrase) ── */}
          {showProgress && (
            <Animated.View entering={FadeIn.duration(600)} exiting={FadeOut.duration(300)}>
              <ProgressIndicator currentIndex={STEP_PROGRESS_INDEX[step]} />
            </Animated.View>
          )}

          {/* ── Step Content ── */}
          <View style={st.contentArea}>

            {/* ══════ WELCOME ══════ */}
            {step === 'welcome' && (
              <View style={st.centeredFlex}>
                <Animated.View entering={FadeInDown.delay(100).duration(900)} style={st.welcomeContainer}>
                  <View style={st.logoContainer}>
                    <Image
                      source={require('../assets/images/mysky_logo.png')}
                      style={st.logo}
                      accessibilityLabel="MySky logo"
                    />
                  </View>
                  <Text style={st.welcomeTitle}>Welcome to MySky</Text>
                  <MetallicText style={st.welcomeSubtitle} color={ETHEREAL.accentGold}>Personal Growth, Mapped to You</MetallicText>
                  <Text style={st.welcomeDescription}>
                    Track your mood, sleep, and energy, journal your thoughts, and uncover personal patterns over time.
                  </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(400).duration(700)} style={st.featuresContainer}>
                  {[
                    { icon: 'pencil' as const, text: 'Daily journaling & guided reflection' },
                    { icon: 'pulse' as const, text: 'Mood, sleep & energy tracking' },
                    { icon: 'analytics' as const, text: 'Pattern insights drawn from your own data' },
                    { icon: 'lock-closed' as const, text: 'Private & encrypted — only on your device' },
                  ].map((item, i) => (
                    <View key={i} style={st.feature}>
                      <View style={st.featureIcon}>
                        <MetallicIcon name={item.icon} size={18} color={ETHEREAL.accentGold} />
                      </View>
                      <Text style={st.featureText}>{item.text}</Text>
                    </View>
                  ))}
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(700).duration(600)} style={st.ctaContainer}>
                  <SkiaMetallicPill
                    label="Get Started"
                    onPress={handleGetStarted}
                    style={{ marginBottom: theme.spacing.md }}
                  />
                  <Pressable style={st.restoreButton} onPress={handleRestoreBackup} accessibilityRole="button" accessibilityLabel="Restore from backup">
                    <MetallicIcon name="cloud-download-outline" size={16} color={ETHEREAL.accentGold} />
                    <MetallicText style={st.restoreText} color={ETHEREAL.accentGold}>Restore from Backup</MetallicText>
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
                      placeholderTextColor="rgba(255,255,255,0.18)"
                      autoFocus
                      returnKeyType="next"
                      maxLength={30}
                      onSubmitEditing={handleNameContinue}
                      autoCapitalize="words"
                      autoCorrect={false}
                      selectionColor={ETHEREAL.accentGold}
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
                    Used to calculate your core architectural blueprint.
                  </Text>

                  <View style={st.datePickerCard}>
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
                  </View>
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
                    Exact time reveals your rising sign and house placements.
                  </Text>

                  <View style={st.datePickerCard}>
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
                  </View>

                  {/* Premium "I don't know" button */}
                  <Pressable
                    style={({ pressed }) => [st.unknownTimeButton, pressed && { opacity: 0.7 }]}
                    onPress={handleUnknownTime}
                    accessibilityRole="button"
                    accessibilityLabel="I don't know my exact birth time"
                  >
                    <MetallicText style={st.unknownTimeText} color={ETHEREAL.accentGold}>I don't know my exact birth time</MetallicText>
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
                  <Text style={st.etherealQuestion}>Where did the stars align?</Text>
                  <Text style={st.etherealSubtext}>
                    City of birth sets the geographical coordinates for your chart.
                  </Text>

                  {/* Search input */}
                  <View style={st.locationSearchRow}>
                    <MetallicIcon name="search" size={18} color={ETHEREAL.accentGold} />
                    <TextInput
                      style={st.locationInput}
                      value={locationQuery}
                      onChangeText={(t) => {
                        setLocationQuery(t);
                        searchLocation(t);
                      }}
                      placeholder="Search city..."
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      autoFocus
                      returnKeyType="search"
                      autoCapitalize="words"
                      autoCorrect={false}
                      selectionColor={ETHEREAL.accentGold}
                    />
                    {searchingLocation && (
                      <ActivityIndicator size="small" color={ETHEREAL.accentGold} />
                    )}
                  </View>

                  {/* Location suggestions */}
                  {locationSuggestions.length > 0 && !locationSelected && (
                    <View style={st.suggestionsContainer}>
                      {locationSuggestions.map((suggestion, idx) => {
                        const parts = suggestion.display_name.split(', ');
                        const city = parts.slice(0, 2).join(', ');
                        const country = parts[parts.length - 1] || '';
                        return (
                          <React.Fragment key={suggestion.place_id ?? idx}>
                            {idx > 0 && <View style={st.suggestionDivider} />}
                            <Pressable
                              style={({ pressed }) => [st.suggestionRow, pressed && { backgroundColor: 'rgba(255,255,255,0.04)' }]}
                              onPress={() => handleSelectLocation(suggestion)}
                              accessibilityRole="button"
                            >
                              <View>
                                <Text style={st.suggestionCity}>{city}</Text>
                                <Text style={st.suggestionCountry}>{country}</Text>
                              </View>
                            </Pressable>
                          </React.Fragment>
                        );
                      })}
                    </View>
                  )}

                  {/* Selected location confirmation */}
                  {locationSelected && (
                    <Animated.View entering={FadeIn.duration(400)} style={st.locationConfirmed}>
                      <MetallicIcon name="checkmark-circle" size={18} color={ETHEREAL.accentGold} />
                      <Text style={st.locationConfirmedText} numberOfLines={2}>
                        {locationPlace}
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(400).duration(600)}>
                  <BottomNav canGoBack={true} isNextDisabled={!locationSelected} nextLabel="Calculate Chart" nextIcon="sparkles" onBack={goBack} onNext={handleCalculateChart} />
                </Animated.View>
              </ScrollView>
            )}

            {/* ══════ PROCESSING CLIMAX ══════ */}
            {step === 'processing' && (
              <View style={st.centeredFlex}>
                <Animated.View entering={FadeIn.delay(100).duration(1000)} style={st.processingContainer}>
                  <ProcessingOrb />
                  <View style={st.processingTextGroup}>
                    <MetallicText style={st.processingLabel} color={ETHEREAL.accentGold}>CALCULATING COSMIC BLUEPRINT</MetallicText>
                    <Text style={st.processingMessage}>
                      {userName.trim()
                        ? `Mapping your subconscious, ${userName.trim()}`
                        : 'Aligning planetary transits'}
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
                    <MetallicIcon name="lock-closed" size={40} color={ETHEREAL.accentGold} />
                  </View>
                  <Text style={st.etherealQuestion}>Enter Backup Passphrase</Text>
                  <Text style={st.etherealSubtext}>
                    This is the passphrase you set when you created the backup.
                  </Text>
                  <TextInput
                    style={st.passphraseInput}
                    value={passphrase}
                    onChangeText={setPassphrase}
                    placeholder="Enter passphrase"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handlePassphraseSubmit}
                    selectionColor={ETHEREAL.accentGold}
                  />
                  <SkiaMetallicPill
                    label="Restore"
                    onPress={handlePassphraseSubmit}
                    icon={<Ionicons name="cloud-download" size={20} color="#0A0A0F" />}
                    style={{ marginBottom: theme.spacing.md }}
                  />
                  <Pressable style={st.restoreButton} onPress={() => setStep('welcome')} accessibilityRole="button" accessibilityLabel="Cancel restore">
                    <Text style={st.restoreText}>Cancel</Text>
                  </Pressable>
                </Animated.View>
              </View>
            )}
          </View>
        </SafeAreaView>

        {/* Terms inside onboarding (after Welcome) */}
        {showTermsModal && (
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
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  safeArea: { flex: 1 },

  // ── Living Background Orbs ──
  orbBlue: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: ETHEREAL.etherealBlue,
    top: -200,
    right: -100,
  },
  orbViolet: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: ETHEREAL.dreamViolet,
    bottom: -100,
    left: -150,
  },

  // ── Progress Capsules ──
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    paddingTop: 20,
    gap: 8,
  },
  progressCapsule: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  progressCapsuleActive: {
    backgroundColor: ETHEREAL.accentGold,
  },
  progressCapsuleInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
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

  // ── Welcome ──
  welcomeContainer: { alignItems: 'center', marginBottom: 24 },
  logoContainer: { marginBottom: 8, alignItems: 'center' },
  logo: { width: 220, height: 220, resizeMode: 'contain' },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    fontFamily: SERIF,
    marginBottom: 8,
    textAlign: 'center',
    marginTop: -64,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: ETHEREAL.accentGold,
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: SERIF,
  },
  welcomeDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  featuresContainer: { marginBottom: 24 },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(217,191,140,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: { fontSize: 16, color: 'rgba(255,255,255,0.6)', flex: 1 },
  ctaContainer: { alignItems: 'center' },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  restoreText: {
    fontSize: 14,
    color: ETHEREAL.accentGold,
    marginLeft: 8,
  },

  // ── Single Question Layout (shared across steps) ──
  singleQuestionContainer: {
    alignItems: 'flex-start',
    width: '100%',
  },
  etherealQuestion: {
    fontSize: 34,
    fontWeight: '300',
    color: '#FFFFFF',
    fontFamily: SERIF,
    marginBottom: 24,
    lineHeight: 44,
  },
  etherealSubtext: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 24,
    lineHeight: 22,
  },

  // ── Name Input — Underline ──
  nameInputWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  nameInput: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 12,
    fontSize: 30,
    fontWeight: '400',
    color: ETHEREAL.accentGold,
    fontFamily: SERIF,
  },
  inputUnderline: {
    height: 1,
    width: '100%',
    marginTop: 4,
  },
  inputUnderlineActive: {
    backgroundColor: ETHEREAL.accentGold,
  },
  inputUnderlineInactive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ── Date / Time Picker Card ──
  datePickerCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },

  // ── Unknown Time Button ──
  unknownTimeButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  unknownTimeText: {
    fontSize: 13,
    fontWeight: '500',
    color: ETHEREAL.accentGold,
    textAlign: 'center',
  },

  // ── Location Search ──
  locationSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  locationInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  suggestionsContainer: {
    marginTop: 12,
    width: '100%',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  suggestionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 20,
  },
  suggestionRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  suggestionCity: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  suggestionCountry: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.45)',
  },
  locationConfirmed: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  locationConfirmedText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },

  // ── Bottom Navigation ──
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 24,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ETHEREAL.accentGold,
    paddingHorizontal: 32,
    height: 56,
    borderRadius: 28,
    shadowColor: ETHEREAL.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
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
    color: ETHEREAL.bgDark,
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
    marginBottom: 40,
  },
  processingGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ETHEREAL.accentGold,
  },
  processingInnerRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(217,191,140,0.5)',
  },
  processingOuterRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  processingSparkle: {
    zIndex: 1,
  },
  processingTextGroup: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  processingLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    color: ETHEREAL.accentGold,
    marginBottom: 12,
    textAlign: 'center',
  },
  processingMessage: {
    fontSize: 20,
    fontWeight: '400',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.75)',
    fontFamily: SERIF,
    textAlign: 'center',
    lineHeight: 28,
  },

  // ── Passphrase ──
  passphraseIconWrap: {
    marginBottom: 24,
  },
  passphraseInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
});
