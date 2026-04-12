/**
 * BirthDataModal
 *
 * Clean birth data entry screen.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { toLocalDateString } from '../utils/dateUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MetallicText } from './ui/MetallicText';
import { MetallicIcon } from './ui/MetallicIcon';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

import { LinearGradient } from 'expo-linear-gradient';
import { type AppTheme } from '../constants/theme';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import { BirthData, HouseSystem } from '../services/astrology/types';
import { InputValidator } from '../services/astrology/inputValidator';
import { useAppTheme, useThemedStyles, useThemePreference } from '../context/ThemeContext';

const PALETTE_DARK = {
  gold: '#C5B5A1',
  silverBlue: '#A2C2E1',
  textMain: '#FFFFFF',
  glassBorder: 'rgba(255,255,255,0.08)',
  surface: 'rgba(255,255,255,0.04)',
};
const PALETTE_LIGHT = {
  gold: '#D4AF37',
  silverBlue: '#D4AF37',
  textMain: '#1A1815',
  glassBorder: 'rgba(0,0,0,0.04)',
  surface: 'rgba(0,0,0,0.03)',
};

type BirthDataModalInitial = Partial<BirthData> & { chartName?: string };

interface BirthDataModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: BirthData, extra?: { chartName?: string }) => void;
  initialData?: BirthDataModalInitial;
  hideClose?: boolean;
  title?: string;
  onRestore?: () => void;
}

interface LocationSuggestion {
  place_id?: string | number;
  display_name: string;
  lat: string;
  lon: string;
}

function parseISODateToDate(isoDate?: string): Date {
  if (!isoDate) return new Date();
  const [y, m, d] = isoDate.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : new Date();
}

function parseHHMMToDate(hhmm?: string): Date {
  const now = new Date();
  if (!hhmm) return now;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isFinite(h) && Number.isFinite(m)) {
    const t = new Date(now);
    t.setHours(h, m, 0, 0);
    return t;
  }
  return now;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const _bundleId = Constants.expoConfig?.ios?.bundleIdentifier ?? 'com.mysky.app';
const NOMINATIM_HEADERS = {
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': `MySkyApp/1.0 (${_bundleId})`,
};

export default function BirthDataModal({
  visible,
  onClose,
  onSave,
  initialData,
  hideClose,
  title,
  onRestore,
}: BirthDataModalProps) {
  const theme = useAppTheme();
  const PALETTE = theme.isDark ? PALETTE_DARK : PALETTE_LIGHT;
  const styles = useThemedStyles(createStyles);
  const { resolvedMode } = useThemePreference();
  const [chartName, setChartName] = useState(initialData?.chartName || '');
  const [date, setDate] = useState<Date>(parseISODateToDate(initialData?.date));
  const [time, setTime] = useState<Date>(parseHHMMToDate(initialData?.time));
  const [hasUnknownTime, setHasUnknownTime] = useState<boolean>(initialData?.hasUnknownTime ?? false);
  const [place, setPlace] = useState<string>(initialData?.place || '');
  const [latitude, setLatitude] = useState<number>(initialData?.latitude ?? 0);
  const [longitude, setLongitude] = useState<number>(initialData?.longitude ?? 0);
  const [houseSystem] = useState<HouseSystem>(initialData?.houseSystem || 'whole-sign');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (visible) {
      setChartName(initialData?.chartName || '');
      setDate(parseISODateToDate(initialData?.date));
      setTime(parseHHMMToDate(initialData?.time));
      setHasUnknownTime(initialData?.hasUnknownTime ?? false);
      setPlace(initialData?.place || '');
      setLatitude(initialData?.latitude ?? 0);
      setLongitude(initialData?.longitude ?? 0);
      setLocationSelected(!!(initialData?.place && initialData?.latitude != null));
      setLocationSuggestions([]);
      setShowSuggestions(false);
      setShowDatePicker(false);
      setSaveError(null);
      setIsSaving(false);
    }
  }, [visible, initialData]);

  useEffect(() => {
    if (!visible) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [visible]);

  const searchLocation = (query: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    setLocationSelected(false);

    const q = query.trim();
    if (q.length < 3) {
      setShowSuggestions(false);
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
          setShowSuggestions(false);
          return;
        }
        const data = await response.json();

        if (!controller.signal.aborted) {
          setLocationSuggestions(Array.isArray(data) ? data : []);
          setShowSuggestions(true);
        }
      } catch {
        setShowSuggestions(false);
      } finally {
        setSearchingLocation(false);
      }
    }, 500);
  };

  const handleGenerate = async () => {
    setSaveError(null);
    if (!place || !locationSelected) {
      setSaveError('Please search for and select a location from the suggestions.');
      return;
    }

    const data: BirthData = {
      date: toLocalDateString(date),
      time: hasUnknownTime ? undefined : time.toTimeString().slice(0, 5),
      hasUnknownTime,
      place,
      latitude,
      longitude,
      houseSystem,
    };

    const validation = InputValidator.validateBirthData(data);
    if (!validation.valid) {
      setSaveError(validation.errors[0]);
      return;
    }

    setIsSaving(true);
    Haptics.selectionAsync().catch(() => {});
    try {
      await Promise.resolve(onSave(data, { chartName }));
    } catch {
      setSaveError('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const onDateChange = (_event: any, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.container}>
        <SkiaDynamicCosmos fill={theme.background} />

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(80)} style={styles.titleSection}>
              <View style={styles.titleRow}>
                <Text style={styles.mainTitle}>{title || 'Birth Details'}</Text>
                {!hideClose && (
                  <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
                    <Ionicons name="close-outline" size={26} color={theme.textPrimary} />
                  </Pressable>
                )}
              </View>
              <Text style={styles.subtitle}>Your data stays private and encrypted on your device.</Text>
            </Animated.View>

            {/* Name */}
            <Animated.View entering={FadeInDown.delay(120)} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={chartName}
                onChangeText={setChartName}
                placeholder="Your name or a nickname"
                placeholderTextColor={theme.textMuted}
              />
            </Animated.View>

            {/* Birth Date */}
            <Animated.View entering={FadeInDown.delay(160)} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Birth Date</Text>
              <Pressable style={styles.selectButton} onPress={() => setShowDatePicker(true)}>
                <MetallicIcon name="calendar-outline" size={18} color={PALETTE.silverBlue} />
                <Text style={styles.selectButtonText}>
                  {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
                <Ionicons name="chevron-forward-outline" size={16} color={theme.textMuted} />
              </Pressable>
            </Animated.View>

            {/* Birth Time */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Birth Time</Text>
                <Pressable style={styles.unknownToggle} onPress={() => setHasUnknownTime(!hasUnknownTime)}>
                  <View style={[styles.checkbox, hasUnknownTime && styles.checkboxChecked]}>
                    {hasUnknownTime && <Ionicons name="checkmark-outline" size={12} color="#020817" />}
                  </View>
                  <Text style={styles.unknownLabel}>I don't know</Text>
                </Pressable>
              </View>

              {!hasUnknownTime && (
                <View style={styles.timeRow}>
                  {/* Hour */}
                  <View style={styles.timeColumn}>
                    <Pressable
                      style={styles.timeArrow}
                      onPress={() => {
                        const d = new Date(time);
                        d.setHours((d.getHours() + 1) % 24);
                        setTime(d);
                        Haptics.selectionAsync().catch(() => {});
                      }}
                    >
                      <Ionicons name="chevron-up-outline" size={22} color={PALETTE.gold} />
                    </Pressable>
                    <Text style={styles.timeDigit}>{String(time.getHours() % 12 || 12).padStart(2, '0')}</Text>
                    <Pressable
                      style={styles.timeArrow}
                      onPress={() => {
                        const d = new Date(time);
                        d.setHours((d.getHours() - 1 + 24) % 24);
                        setTime(d);
                        Haptics.selectionAsync().catch(() => {});
                      }}
                    >
                      <Ionicons name="chevron-down-outline" size={22} color={PALETTE.gold} />
                    </Pressable>
                  </View>

                  <Text style={styles.timeColon}>:</Text>

                  {/* Minute */}
                  <View style={styles.timeColumn}>
                    <Pressable
                      style={styles.timeArrow}
                      onPress={() => {
                        const d = new Date(time);
                        d.setMinutes((d.getMinutes() + 1) % 60);
                        setTime(d);
                        Haptics.selectionAsync().catch(() => {});
                      }}
                    >
                      <Ionicons name="chevron-up-outline" size={22} color={PALETTE.gold} />
                    </Pressable>
                    <Text style={styles.timeDigit}>{String(time.getMinutes()).padStart(2, '0')}</Text>
                    <Pressable
                      style={styles.timeArrow}
                      onPress={() => {
                        const d = new Date(time);
                        d.setMinutes((d.getMinutes() - 1 + 60) % 60);
                        setTime(d);
                        Haptics.selectionAsync().catch(() => {});
                      }}
                    >
                      <Ionicons name="chevron-down-outline" size={22} color={PALETTE.gold} />
                    </Pressable>
                  </View>

                  {/* AM/PM */}
                  <Pressable
                    style={styles.amPmButton}
                    onPress={() => {
                      const d = new Date(time);
                      d.setHours((d.getHours() + 12) % 24);
                      setTime(d);
                      Haptics.selectionAsync().catch(() => {});
                    }}
                  >
                    <Text style={styles.amPmText}>{time.getHours() < 12 ? 'AM' : 'PM'}</Text>
                  </Pressable>
                </View>
              )}

              {hasUnknownTime && (
                <View style={styles.unknownTimeNote}>
                  <Text style={styles.unknownTimeNoteText}>Chart will use solar noon. House cusps less precise.</Text>
                </View>
              )}
            </Animated.View>

            {/* Location */}
            <Animated.View entering={FadeInDown.delay(240)} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Birth Location</Text>
              <View style={styles.inputWrap}>
                <MetallicIcon name="location-outline" size={17} color={PALETTE.silverBlue} style={styles.inputIcon} />
                <TextInput
                  style={styles.locationInput}
                  value={place}
                  onChangeText={(t) => {
                    setPlace(t);
                    searchLocation(t);
                  }}
                  placeholder="City, State, Country"
                  placeholderTextColor={theme.textMuted}
                />
                {searchingLocation && (
                  <ActivityIndicator size="small" color={PALETTE.gold} style={styles.loader} />
                )}
                {locationSelected && !searchingLocation && (
                  <Ionicons name="checkmark-circle-outline" size={18} color="#6EBF8B" style={styles.loader} />
                )}
              </View>

              {showSuggestions && locationSuggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {locationSuggestions.map((s, i) => (
                    <Pressable
                      key={`${s.place_id ?? s.display_name}-${i}`}
                      style={[styles.suggestion, i < locationSuggestions.length - 1 && styles.suggestionBorder]}
                      onPress={() => {
                        setPlace(s.display_name);
                        setLatitude(parseFloat(s.lat));
                        setLongitude(parseFloat(s.lon));
                        setLocationSelected(true);
                        setShowSuggestions(false);
                        Haptics.selectionAsync().catch(() => {});
                      }}
                    >
                      <Text style={styles.suggestionText} numberOfLines={1}>{s.display_name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.View>

            {/* Error */}
            {saveError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
                <Text style={styles.errorText}>{saveError}</Text>
              </View>
            )}

            {/* Generate Button */}
            <Animated.View entering={FadeInDown.delay(280)} style={styles.generateWrap}>
              {isSaving ? (
                <View style={styles.savingRow}>
                  <ActivityIndicator color={PALETTE.gold} />
                  <Text style={styles.savingText}>Generating your chart…</Text>
                </View>
              ) : (
                <Pressable
                  onPress={handleGenerate}
                  accessibilityRole="button"
                  accessibilityLabel="Generate My Data"
                  style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.85 }]}
                >
                  <LinearGradient
                    colors={['#D4AF37', '#A07840', '#D4AF37']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.generateBtnGradient}
                  >
                    <Text style={styles.generateBtnText}>Generate My Data</Text>
                  </LinearGradient>
                </Pressable>
              )}
            </Animated.View>

            <Text style={styles.privacyNote}>Stored locally. Never shared.</Text>

            {onRestore && (
              <Pressable style={styles.restoreBtn} onPress={onRestore}>
                <MetallicText color={PALETTE.gold} style={styles.restoreText}>Restore from Backup</MetallicText>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>

        {/* Date Picker — iOS bottom sheet */}
        {showDatePicker && Platform.OS === 'ios' && (
          <View style={StyleSheet.absoluteFill}>
            <Pressable style={styles.pickerScrim} onPress={() => setShowDatePicker(false)} />
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <View style={{ width: 60 }} />
                <Text style={styles.pickerTitle}>Birth Date</Text>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <MetallicText color={PALETTE.gold} style={styles.pickerDone}>Done</MetallicText>
                </Pressable>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                themeVariant={resolvedMode}
                textColor="#FFFFFF"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            </View>
          </View>
        )}

      </View>
    </Modal>
  );
}

const createStyles = (theme: AppTheme) => {
  const PALETTE = theme.isDark ? PALETTE_DARK : PALETTE_LIGHT;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
  },
  titleSection: {
    marginBottom: 32,
    marginTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.isDark ? 'rgba(197, 181, 161, 0.8)' : 'rgba(212, 175, 55, 0.9)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: PALETTE.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: theme.textPrimary,
    fontSize: 16,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: PALETTE.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  selectButtonText: {
    flex: 1,
    color: theme.textPrimary,
    fontSize: 16,
  },
  unknownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: PALETTE.gold,
    borderColor: PALETTE.gold,
  },
  unknownLabel: {
    fontSize: 13,
    color: theme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,24,21,0.5)',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PALETTE.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    paddingVertical: 10,
  },
  timeColumn: {
    alignItems: 'center',
    width: 64,
  },
  timeArrow: {
    padding: 6,
  },
  timeDigit: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    minWidth: 52,
    textAlign: 'center',
  },
  timeColon: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,24,21,0.3)',
    marginBottom: 2,
  },
  amPmButton: {
    marginLeft: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  },
  amPmText: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.gold,
    letterSpacing: 1,
  },
  unknownTimeNote: {
    marginTop: 10,
    backgroundColor: 'rgba(197,181,161,0.06)',
    borderRadius: 10,
    padding: 12,
  },
  unknownTimeNoteText: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    paddingHorizontal: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 14,
    color: theme.textPrimary,
    fontSize: 16,
  },
  loader: {
    marginLeft: 8,
  },
  suggestions: {
    marginTop: 6,
    backgroundColor: theme.isDark ? 'rgba(12, 18, 32, 0.97)' : PALETTE.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    overflow: 'hidden',
  },
  suggestion: {
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  },
  suggestionText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: theme.error,
    fontSize: 13,
    flex: 1,
  },
  generateWrap: {
    marginTop: 8,
    marginBottom: 4,
  },
  generateBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  generateBtnGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: {
    color: '#0D0A06',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  savingText: {
    color: PALETTE.gold,
    fontSize: 15,
    fontWeight: '500',
  },
  privacyNote: {
    textAlign: 'center',
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 14,
  },
  restoreBtn: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  restoreText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  pickerScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  pickerSheet: {
    backgroundColor: theme.isDark ? '#0D1117' : PALETTE.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  },
  pickerTitle: {
    color: theme.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  pickerDone: {
    color: PALETTE.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  });
};
