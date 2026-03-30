// File: components/OnboardingModal.tsx
// Ethereal Onboarding Flow — cinematic, one-question-at-a-time initiation
// Strategy: single question per screen, slow crossfade transitions, living background, processing climax

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';

import { LinearGradient } from 'expo-linear-gradient';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import { MetallicIcon } from './ui/MetallicIcon';
import SkiaMetallicPill from './ui/SkiaMetallicPill';
import { useRouter, Href } from 'expo-router';
import { theme } from '../constants/theme';

import { BirthData, HouseSystem, NatalChart } from '../services/astrology/types';
import { AstrologyCalculator } from '../services/astrology/calculator';
import { InputValidator } from '../services/astrology/inputValidator';
import { localDb } from '../services/storage/localDb';
import { BackupService } from '../services/storage/backupService';
import { toLocalDateString } from '../utils/dateUtils';
import { logger } from '../utils/logger';
import Constants from 'expo-constants';

const ONBOARDING_RETURN_STEP_KEY = 'msky_onboarding_return_step';

const DISPLAY = Platform.select({ ios: 'SFProDisplay-Regular', android: 'sans-serif', default: 'System' });
const DISPLAY_SEMIBOLD = Platform.select({ ios: 'SFProDisplay-Semibold', android: 'sans-serif-medium', default: 'System' });
const DISPLAY_BOLD = Platform.select({ ios: 'SFProDisplay-Bold', android: 'sans-serif-bold', default: 'System' });

// ── Liquid Mirror Gold Palette ──
const PREMIUM = {
  bgOled: '#020817',
  titanium: '#C5B5A1',
  // Nebula orb fills — Champagne Gold + Amethyst Purple for volumetric depth
  titaniumGlow: 'rgba(197, 181, 161, 0.12)',   // Champagne — refined Titanium warmth
  starlight:    'rgba(79,  79,  127, 0.10)',    // Amethyst Purple — deep volumetric void
  // Laser-Etched White Gold border
  glassBorder: 'rgba(255, 253, 235, 0.2)',
  glassFill: 'rgba(15, 15, 15, 0.4)',
  textMain: '#F5F5F7',
  textMuted: '#86868B',
};

// 6-stop horizontal Liquid Mirror Gold gradient
const LIQUID_GOLD: readonly [string, string, ...string[]] = [
  '#FFFFFF',   // 0 — Specular white glint
  '#F7E7C2',   // 1 — Champagne gold
  '#EED9A7',   // 2 — Base gold
  '#CFAE73',   // 3 — Amber mid-tone
  '#9B7A46',   // 4 — Deep bronze shadow
] as const;

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

type OnboardingStep = 'welcome' | 'terms' | 'name' | 'birthDate' | 'birthTime' | 'location' | 'processing' | 'passphrase';

const STEP_PROGRESS_INDEX: Record<OnboardingStep, number> = {
  welcome: -1,
  terms: -1,
  name: 0,
  birthDate: 1,
  birthTime: 2,
  location: 3,
  processing: -1,
  passphrase: -1,
};

const CONSENT_LINKS: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; route: Href }[] = [
  { title: 'Terms of Use (EULA)', subtitle: 'Review our service agreement', icon: 'document-text-outline', route: '/terms' as Href },
  { title: 'Privacy Policy', subtitle: 'How we secure your chart data', icon: 'shield-checkmark-outline', route: '/privacy' as Href },
  { title: 'FAQ', subtitle: 'Common technical questions', icon: 'help-circle-outline', route: '/faq' as Href },
];

// ── Living Volumetric Nebula ──
function LivingBackground() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 80_000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: PREMIUM.bgOled }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <View style={st.orbTitanium} />
        <View style={st.orbStarlight} />
      </Animated.View>
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
    </View>
  );
}

// ── Precision High-Tech Scanner ──
function ProcessingOrb() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + pulse.value * 0.3 }],
    opacity: 0.1 + pulse.value * 0.3,
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
      <Ionicons name="scan-outline" size={36} color={PREMIUM.titanium} style={st.processingSparkle} />
    </View>
  );
}

// ── Editorial Progress Indicator ──
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

// ── Solid Titanium Bottom Navigation ──
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
  const nextScale = useSharedValue(1);
  const nextAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nextScale.value }],
  }));

  return (
    <View style={st.bottomNav}>
      {canGoBack ? (
        <Pressable
          style={({ pressed }) => [st.backButton, pressed && { opacity: 0.7 }]}
          onPress={onBack}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back-outline" size={24} color={PREMIUM.textMain} />
        </Pressable>
      ) : <View style={{ width: 50 }} />}

      <View style={{ flex: 1 }} />

      <Animated.View style={[st.nextButton, isNextDisabled && st.nextButtonDisabled, nextAnimStyle]}>
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, height: '100%' }}
          onPressIn={() => { if (!isNextDisabled) nextScale.value = withSpring(0.97, { mass: 0.5, stiffness: 400 }); }}
          onPressOut={() => { nextScale.value = withSpring(1.0, { mass: 0.5, stiffness: 400 }); }}
          onPress={onNext}
          disabled={isNextDisabled}
        >
          {!isNextDisabled && (
            <LinearGradient
              colors={LIQUID_GOLD}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.nextButtonGradient}
            />
          )}
          <Text style={[st.nextButtonText, isNextDisabled && { color: PREMIUM.textMuted }]}>{nextLabel}</Text>
          <Ionicons name={nextIcon} size={18} color={isNextDisabled ? PREMIUM.textMuted : '#000000'} style={{ marginLeft: 8 }} />
        </Pressable>
      </Animated.View>
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
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');

  const [userName, setUserName] = useState('');
  const [birthDate, setBirthDate] = useState<Date>(new Date());
  const [birthTime, setBirthTime] = useState<Date>(new Date());
  const [hasUnknownTime, setHasUnknownTime] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationPlace, setLocationPlace] = useState('');
  const [locationLat, setLocationLat] = useState(0);
  const [locationLon, setLocationLon] = useState(0);
  const [locationSelected, setLocationSelected] = useState(false);

  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [backupUri, setBackupUri] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [isNameFocused, setIsNameFocused] = useState(false);

  // Guard: prevents blur/pressOut from firing "I Agree" while navigating to a legal screen
  const navigatingLegalRef = useRef(false);

  // ── Hardware Tactility: Scale animations ──
  const ctaScale = useSharedValue(1);
  const ctaAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: ctaScale.value }] }));

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Restore persisted step when modal becomes visible (survives unmount during legal screen nav)
  useEffect(() => {
    const restoreStep = async () => {
      if (!visible) return;
      try {
        const savedStep = await EncryptedAsyncStorage.getItem(ONBOARDING_RETURN_STEP_KEY);
        if (
          savedStep === 'welcome' ||
          savedStep === 'terms' ||
          savedStep === 'name' ||
          savedStep === 'birthDate' ||
          savedStep === 'birthTime' ||
          savedStep === 'location' ||
          savedStep === 'passphrase'
        ) {
          setStep(savedStep as OnboardingStep);
          await EncryptedAsyncStorage.removeItem(ONBOARDING_RETURN_STEP_KEY);
        }
      } catch {}
    };
    restoreStep();
  }, [visible]);

  const STEP_ORDER: OnboardingStep[] = ['terms', 'name', 'birthDate', 'birthTime', 'location', 'processing'];

  const goToStep = (next: OnboardingStep) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStep(next);
  };

  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) goToStep(STEP_ORDER[idx - 1]);
  };

  const handleGetStarted = () => {
    Haptics.selectionAsync().catch(() => {});
    goToStep('terms');
  };

  const handleTermsAccept = () => {
    // Block if we're mid-navigation to a legal screen (blur can misfire as a tap)
    if (navigatingLegalRef.current) return;
    Haptics.selectionAsync().catch(() => {});
    onTermsConsent?.(true);
    goToStep('name');
  };

  const openConsentRoute = useCallback(async (route: Href) => {
    // Lock the accept button BEFORE any async work so blur events are blocked
    navigatingLegalRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await EncryptedAsyncStorage.setItem(ONBOARDING_RETURN_STEP_KEY, step);
      router.push(route);
    } catch { Alert.alert('Unable to open', 'Please try again.'); }
    // Release after a generous delay so the transition animation completes
    setTimeout(() => { navigatingLegalRef.current = false; }, 800);
  }, [router, step]);

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
    Keyboard.dismiss();
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



  const showProgress = STEP_PROGRESS_INDEX[step] >= 0;

  if (!visible) return null;

  return (
    <View style={st.modalOverlay}>
      <View style={st.container}>
        
        {/* Deep Stack Background */}
        <LivingBackground />
        
        {/* Stars sit ON TOP of the nebula blur, but UNDER the UI */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <SkiaDynamicCosmos fill="transparent" />
        </View>

        <SafeAreaView edges={['top', 'bottom']} style={st.safeArea}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
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
                    <Text style={st.welcomeSubtitle}>Your private self-pattern tracker</Text>
                    <Text style={st.welcomeDescription}>
                      Track sleep, mood, dreams, and relationships so you can understand yourself over time.
                    </Text>
                  </Animated.View>

                  {/* Clean, flush feature list. Removed the distracting individual glass cards. */}
                  <Animated.View entering={FadeInUp.delay(400).duration(700)} style={st.featuresContainer}>
                    {[
                      { icon: 'pencil-outline' as const, text: 'Daily journaling and dream reflection' },
                      { icon: 'pulse-outline' as const, text: 'Sleep, mood, and energy tracking' },
                      { icon: 'analytics-outline' as const, text: 'Weekly pattern shifts and recurring themes' },
                      { icon: 'lock-closed-outline' as const, text: 'Private by design, encrypted on-device' },
                    ].map((item, i) => (
                      <View key={i} style={st.featureRow}>
                        <View style={st.featureIcon}>
                          <Ionicons name={item.icon} size={22} color={PREMIUM.titanium} />
                        </View>
                        <Text style={st.featureText}>{item.text}</Text>
                      </View>
                    ))}
                  </Animated.View>

                  <Animated.View entering={FadeInUp.delay(700).duration(600)} style={st.ctaContainer}>
                    <Animated.View style={[st.primaryActionBtn, ctaAnimStyle]}>
                      <Pressable
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                        onPressIn={() => { ctaScale.value = withSpring(0.97, { mass: 0.5, stiffness: 400 }); Haptics.selectionAsync().catch(() => {}); }}
                        onPressOut={() => { ctaScale.value = withSpring(1.0, { mass: 0.5, stiffness: 400 }); }}
                        onPress={handleGetStarted}
                      >
                        <LinearGradient
                          colors={LIQUID_GOLD}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={st.liquidGoldFill}
                        />
                        <Text style={st.primaryActionBtnText}>Get Started</Text>
                        <Ionicons name="arrow-forward-outline" size={18} color="#000000" style={{ marginLeft: 10 }} />
                      </Pressable>
                    </Animated.View>
                    <Pressable style={st.restoreButton} onPress={handleRestoreBackup} accessibilityRole="button">
                      <Ionicons name="cloud-download-outline" size={16} color={PREMIUM.textMuted} />
                      <Text style={st.restoreText}>Restore from Backup</Text>
                    </Pressable>
                  </Animated.View>
                </View>
              )}

              {/* ══════ TERMS CONSENT ══════ */}
              {step === 'terms' && (
                <View style={st.centeredFlex}>
                  <Animated.View entering={FadeInDown.delay(100).duration(700)} style={st.termsContainer}>
                    <Text style={st.termsTitle}>Before you continue</Text>
                    <Text style={st.termsBody}>
                      To provide personalized insights, we need you to review and accept our data framework.
                    </Text>

                    <View style={st.termsLinksBlock}>
                      {CONSENT_LINKS.map((l) => (
                        <Pressable
                          key={l.title}
                          onPress={() => openConsentRoute(l.route)}
                          accessibilityRole="link"
                          style={({ pressed }) => [st.termsLinkRow, pressed && { opacity: 0.7 }]}
                        >
                          <View style={st.termsLinkLeft}>
                            <View style={st.termsLinkIcon}>
                              <MetallicIcon name={l.icon} size={18} color={theme.growth ?? PREMIUM.titanium} />
                            </View>
                            <View>
                              <Text style={st.termsLinkTitle}>{l.title}</Text>
                              <Text style={st.termsLinkSubtitle}>{l.subtitle}</Text>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward-outline" size={18} color={PREMIUM.textMuted} />
                        </Pressable>
                      ))}
                    </View>

                    <Text style={st.termsFootnote}>You can view these anytime in Settings.</Text>
                  </Animated.View>

                  <Animated.View entering={FadeInUp.delay(500).duration(600)} style={st.ctaContainerFixed}>
                    <SkiaMetallicPill
                      label="I Agree"
                      onPress={handleTermsAccept}
                      borderRadius={16}
                    />
                  </Animated.View>
                </View>
              )}

              {/* ══════ NAME ══════ */}
              {step === 'name' && (
                <Pressable style={st.centeredFlex} onPress={Keyboard.dismiss} accessible={false}>
                  <Animated.View entering={FadeIn.delay(100).duration(900)} style={st.singleQuestionContainer}>
                    <Text style={st.etherealQuestion}>What should we call you?</Text>
                    <View style={st.nameInputWrapper}>
                      <TextInput
                        style={st.nameInput}
                        value={userName}
                        onChangeText={setUserName}
                        placeholder="Your name"
                        placeholderTextColor={PREMIUM.textMuted}
                        autoFocus
                        returnKeyType="next"
                        maxLength={30}
                        onSubmitEditing={handleNameContinue}
                        autoCapitalize="words"
                        autoCorrect={false}
                        selectionColor={PREMIUM.titanium}
                        textAlign="center"
                        onFocus={() => setIsNameFocused(true)}
                        onBlur={() => setIsNameFocused(false)}
                      />
                      {isNameFocused ? (
                        <LinearGradient
                          colors={LIQUID_GOLD}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={st.inputUnderline}
                        />
                      ) : (
                        <View style={[st.inputUnderline, userName.trim() ? st.inputUnderlineActive : st.inputUnderlineInactive]} />
                      )}
                    </View>
                  </Animated.View>
                  <Animated.View entering={FadeInUp.delay(400).duration(600)}>
                    <BottomNav canGoBack={false} isNextDisabled={!userName.trim()} nextLabel="Continue" nextIcon="arrow-forward" onBack={goBack} onNext={handleNameContinue} />
                  </Animated.View>
                </Pressable>
              )}

              {/* ══════ BIRTH DATE ══════ */}
              {step === 'birthDate' && (
                <Pressable style={st.centeredFlex} onPress={Keyboard.dismiss} accessible={false}>
                  <Animated.View entering={FadeIn.delay(100).duration(900)} style={st.singleQuestionContainer}>
                    <Text style={st.etherealQuestion}>When did your journey begin?</Text>
                    <Text style={st.etherealSubtext}>
                      Used to accurately map your internal weather and profile.
                    </Text>

                    <BlurView intensity={30} tint="dark" style={st.glassCard}>
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
                </Pressable>
              )}

              {/* ══════ BIRTH TIME ══════ */}
              {step === 'birthTime' && (
                <Pressable style={st.centeredFlex} onPress={Keyboard.dismiss} accessible={false}>
                  <Animated.View entering={FadeIn.delay(100).duration(900)} style={st.singleQuestionContainer}>
                    <Text style={st.etherealQuestion}>What time did you arrive?</Text>
                    <Text style={st.etherealSubtext}>
                      Precision helps us personalize your data patterns.
                    </Text>

                    <View style={st.timePickerCard}>
                      <DateTimePicker
                        value={birthTime}
                        mode="time"
                        display="default"
                        onChange={(_e: DateTimePickerEvent, selected?: Date) => {
                          if (selected) {
                            setBirthTime(selected);
                            setHasUnknownTime(false);
                          }
                        }}
                        themeVariant="dark"
                        style={st.nativeTimePicker}
                      />
                    </View>

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
                </Pressable>
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

                    <BlurView intensity={30} tint="dark" style={st.locationSearchRow}>
                      <Ionicons name="search-outline" size={20} color={PREMIUM.titanium} />
                      <TextInput
                        style={st.locationInput}
                        value={locationQuery}
                        onChangeText={(t) => {
                          setLocationQuery(t);
                          searchLocation(t);
                        }}
                        placeholder="Search city..."
                        placeholderTextColor={PREMIUM.textMuted}
                        autoFocus
                        returnKeyType="search"
                        autoCapitalize="words"
                        autoCorrect={false}
                        selectionColor={PREMIUM.titanium}
                      />
                      {searchingLocation && (
                        <ActivityIndicator size="small" color={PREMIUM.titanium} />
                      )}
                    </BlurView>

                    {locationSuggestions.length > 0 && !locationSelected && (
                      <BlurView intensity={40} tint="dark" style={st.suggestionsContainer}>
                        {locationSuggestions.map((suggestion, idx) => {
                          const parts = suggestion.display_name.split(', ');
                          const city = parts.slice(0, 2).join(', ');
                          const country = parts[parts.length - 1] || '';
                          return (
                            <React.Fragment key={suggestion.place_id ?? idx}>
                              {idx > 0 && <View style={st.suggestionDivider} />}
                              <Pressable
                                style={({ pressed }) => [st.suggestionRow, pressed && { backgroundColor: PREMIUM.glassFill }]}
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
                        <Ionicons name="checkmark-circle-outline" size={20} color={PREMIUM.titanium} />
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
                <Pressable style={st.centeredFlex} onPress={Keyboard.dismiss} accessible={false}>
                  <Animated.View entering={FadeIn.delay(100).duration(800)} style={st.singleQuestionContainer}>
                    <View style={st.passphraseIconWrap}>
                      <Ionicons name="lock-closed-outline" size={32} color={PREMIUM.titanium} />
                    </View>
                    <Text style={st.etherealQuestion}>Enter Encryption Key</Text>
                    <Text style={st.etherealSubtext}>
                      Provide the passphrase used to secure your backup.
                    </Text>
                    
                    <BlurView intensity={30} tint="dark" style={st.passphraseInputWrapper}>
                      <TextInput
                        style={st.passphraseInput}
                        value={passphrase}
                        onChangeText={setPassphrase}
                        placeholder="Enter passphrase"
                        placeholderTextColor={PREMIUM.textMuted}
                        secureTextEntry
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handlePassphraseSubmit}
                        selectionColor={PREMIUM.titanium}
                      />
                    </BlurView>

                    <Animated.View style={[st.primaryActionBtn, { width: '100%', marginBottom: 16 }, ctaAnimStyle]}>
                      <Pressable
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}
                        onPressIn={() => { ctaScale.value = withSpring(0.97, { mass: 0.5, stiffness: 400 }); }}
                        onPressOut={() => { ctaScale.value = withSpring(1.0, { mass: 0.5, stiffness: 400 }); }}
                        onPress={handlePassphraseSubmit}
                      >
                        <LinearGradient
                          colors={LIQUID_GOLD}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={st.liquidGoldFill}
                        />
                        <Text style={st.primaryActionBtnText}>Decrypt & Restore</Text>
                      </Pressable>
                    </Animated.View>

                    <Pressable style={[st.restoreButton, { alignSelf: 'center' }]} onPress={() => setStep('welcome')}>
                      <Text style={st.restoreText}>Cancel</Text>
                    </Pressable>
                  </Animated.View>
                </Pressable>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>


      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ── Styles ──
// ════════════════════════════════════════════════════════════════════════════

const st = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  container: { flex: 1, backgroundColor: PREMIUM.bgOled },
  safeArea: { flex: 1 },

  // ── Living Nebula Orbs ──
  orbTitanium: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: PREMIUM.titaniumGlow,
    top: -250,
    right: -200,
  },
  orbStarlight: {
    position: 'absolute',
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: PREMIUM.starlight,
    bottom: -150,
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
    backgroundColor: PREMIUM.titanium,
    shadowColor: PREMIUM.titanium,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  progressCapsuleInactive: {
    backgroundColor: PREMIUM.glassBorder,
  },

  // ── Content Layout ──
  contentArea: {
    flex: 1,
    paddingHorizontal: 32,
  },
  centeredFlex: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },

  // ── Welcome (Left-aligned, refined hierarchy) ──
  welcomeContainer: { alignItems: 'flex-start', marginBottom: 40, width: '100%' },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: PREMIUM.textMain,
    fontFamily: DISPLAY_BOLD,
    marginBottom: 8,
    textAlign: 'left',
    letterSpacing: -0.7,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PREMIUM.titanium,
    marginBottom: 16,
    textAlign: 'left',
    fontFamily: DISPLAY_SEMIBOLD,
    letterSpacing: 0.5,
  },
  welcomeDescription: {
    fontSize: 16,
    color: PREMIUM.textMuted,
    textAlign: 'left',
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: DISPLAY,
  },
  
  // ── Feature List (Clean flush text, no cluttered boxes) ──
  featuresContainer: { marginBottom: 48, gap: 16 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: 16,
    width: 32,
    alignItems: 'center',
  },
  featureText: { 
    fontSize: 16, 
    fontWeight: '500',
    color: PREMIUM.textMain, 
    flex: 1,
    fontFamily: DISPLAY_SEMIBOLD,
  },
  
  ctaContainer: { alignItems: 'center', width: '100%' },
  ctaContainerFixed: { alignItems: 'center', width: '100%', paddingTop: 24, paddingBottom: 16 },

  // ── Terms Consent (inline step) ──
  termsContainer: { alignItems: 'flex-start', width: '100%', marginBottom: 32 },
  termsTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: PREMIUM.textMain,
    fontFamily: DISPLAY_BOLD,
    marginBottom: 12,
    letterSpacing: -0.7,
  },
  termsBody: {
    fontSize: 16,
    color: PREMIUM.textMuted,
    lineHeight: 24,
    fontFamily: DISPLAY,
    marginBottom: 24,
  },
  termsLinksBlock: { width: '100%', gap: 12, marginBottom: 24 },
  termsLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  termsLinkLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  termsLinkIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginRight: 14,
  },
  termsLinkTitle: { fontSize: 16, fontWeight: '700', color: PREMIUM.textMain, fontFamily: DISPLAY_SEMIBOLD },
  termsLinkSubtitle: { fontSize: 13, color: PREMIUM.textMuted, fontFamily: DISPLAY, marginTop: 2 },
  termsFootnote: { fontSize: 12, color: PREMIUM.textMuted, fontFamily: DISPLAY, textAlign: 'center', width: '100%' },
  
  // ── Liquid Mirror Gold Primary Action Button ──
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
    height: 56,
    borderRadius: 28,
    marginBottom: 20,
    // Deep shadow anchored to the bronze end of the gradient
    shadowColor: '#9B7A46',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  liquidGoldFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
  },
  primaryActionBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryActionBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000000', // OLED black for maximum hardware tactility
    fontFamily: DISPLAY_BOLD,
    letterSpacing: 0.3,
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
    color: PREMIUM.textMuted,
    marginLeft: 8,
    fontFamily: DISPLAY_SEMIBOLD,
  },

  // ── Single Question Layout ──
  singleQuestionContainer: {
    alignItems: 'center', // Centered for the input flow
    width: '100%',
  },
  etherealQuestion: {
    fontSize: 34,
    fontWeight: '800',
    color: PREMIUM.textMain,
    fontFamily: DISPLAY_BOLD,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -0.7,
  },
  etherealSubtext: {
    fontSize: 15,
    color: PREMIUM.textMuted,
    marginBottom: 40,
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: DISPLAY,
  },

  // ── Centered Name Input ──
  nameInputWrapper: {
    width: '80%', // Constrained width so the line isn't massive
    marginBottom: 24,
    alignItems: 'center',
  },
  nameInput: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 8,
    fontSize: 32,
    fontWeight: '700',
    color: PREMIUM.textMain,
    fontFamily: DISPLAY_BOLD,
    textAlign: 'center',
  },
  inputUnderline: {
    height: 2,
    width: '100%',
    marginTop: 8,
  },
  inputUnderlineActive: {
    backgroundColor: '#F5F5F7', // High-contrast Off-White — crisp anchor line
    shadowColor: '#F5F5F7',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  inputUnderlineInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // ── Glass Card (Pickers) ──
  glassCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
    backgroundColor: PREMIUM.glassFill,
    padding: 12,
    alignItems: 'center',
  },
  // ── Time Picker Card — no BlurView, no overflow, nothing that can block native gestures ──
  timePickerCard: {
    width: '100%',
    minHeight: 216,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeTimePicker: {
    width: '100%',
    height: 216,
  },

  unknownTimeButton: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  unknownTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: PREMIUM.titanium,
    fontFamily: DISPLAY_SEMIBOLD,
  },

  // ── Location Search ──
  locationSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
    backgroundColor: PREMIUM.glassFill,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    overflow: 'hidden',
  },
  locationInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: PREMIUM.textMain,
    fontFamily: DISPLAY_SEMIBOLD,
  },
  suggestionsContainer: {
    marginTop: 12,
    width: '100%',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
    backgroundColor: PREMIUM.glassFill,
    overflow: 'hidden',
  },
  suggestionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: PREMIUM.glassBorder,
    marginLeft: 16,
  },
  suggestionRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  suggestionCity: {
    fontSize: 16,
    fontWeight: '600',
    color: PREMIUM.textMain,
    marginBottom: 4,
    fontFamily: DISPLAY_SEMIBOLD,
  },
  suggestionCountry: {
    fontSize: 14,
    fontWeight: '400',
    color: PREMIUM.textMuted,
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
    color: PREMIUM.textMain,
    flex: 1,
    fontFamily: DISPLAY_SEMIBOLD,
  },

  // ── Bottom Navigation (Solid Titanium Action) ──
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
    backgroundColor: PREMIUM.glassFill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    overflow: 'hidden',
    height: 50,
    borderRadius: 25,
    shadowColor: '#9B7A46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
  },
  nextButtonDisabled: {
    opacity: 0.35,
    backgroundColor: PREMIUM.glassFill,
    borderColor: PREMIUM.glassBorder,
    borderWidth: 1,
    shadowOpacity: 0,
  },
  nextButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    fontFamily: DISPLAY_BOLD,
    letterSpacing: 0.2,
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
    backgroundColor: PREMIUM.titanium,
    shadowColor: PREMIUM.titanium,
    shadowOpacity: 1,
    shadowRadius: 40,
  },
  processingInnerRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: PREMIUM.titanium,
    borderStyle: 'dashed',
  },
  processingOuterRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: PREMIUM.glassBorder,
  },
  processingSparkle: {
    zIndex: 1,
  },
  processingTextGroup: {
    alignItems: 'center',
  },
  processingLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    color: PREMIUM.titanium,
    marginBottom: 12,
    fontFamily: DISPLAY_BOLD,
  },
  processingMessage: {
    fontSize: 22,
    fontWeight: '600',
    color: PREMIUM.textMain,
    fontFamily: DISPLAY_SEMIBOLD,
    textAlign: 'center',
  },

  // ── Passphrase ──
  passphraseIconWrap: {
    marginBottom: 20,
  },
  passphraseInputWrapper: {
    width: '100%',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PREMIUM.glassBorder,
    backgroundColor: PREMIUM.glassFill,
    overflow: 'hidden',
    marginBottom: 32,
  },
  passphraseInput: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 17,
    fontWeight: '500',
    color: PREMIUM.textMain,
    textAlign: 'center',
    fontFamily: DISPLAY_SEMIBOLD,
  },
});
