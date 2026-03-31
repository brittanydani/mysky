/**
 * BirthDataModal
 *
 * Cinematic entry point for personal birth data.
 * Features custom obsidian scroll wheels and glassmorphic confirmation seal.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

import { theme } from '../constants/theme';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import SkiaMetallicPill from './ui/SkiaMetallicPill';
import MySkyCompassSkia from './skia/MySkyCompassSkia';
import MySkyVerifySealSkia from './skia/MySkyVerifySealSkia';
import { BirthData, HouseSystem } from '../services/astrology/types';
import { InputValidator } from '../services/astrology/inputValidator';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#C5B5A1',
  silverBlue: '#8BC4E8',
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
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
  const [chartName, setChartName] = useState(initialData?.chartName || '');
  const [date, setDate] = useState<Date>(parseISODateToDate(initialData?.date));
  const [time, setTime] = useState<Date>(parseHHMMToDate(initialData?.time));
  const [hasUnknownTime, setHasUnknownTime] = useState<boolean>(initialData?.hasUnknownTime ?? false);
  const [place, setPlace] = useState<string>(initialData?.place || '');
  const [latitude, setLatitude] = useState<number>(initialData?.latitude ?? 0);
  const [longitude, setLongitude] = useState<number>(initialData?.longitude ?? 0);
  const [houseSystem] = useState<HouseSystem>(initialData?.houseSystem || 'whole-sign');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (visible && initialData) {
      setChartName(initialData.chartName || '');
      setDate(parseISODateToDate(initialData.date));
      setTime(parseHHMMToDate(initialData.time));
      setHasUnknownTime(initialData.hasUnknownTime ?? false);
      setPlace(initialData.place || '');
      setLatitude(initialData.latitude ?? 0);
      setLongitude(initialData.longitude ?? 0);
      setLocationSelected(!!(initialData.place && initialData.latitude));
    }
  }, [visible, initialData]);

  // Cleanup pending search timeout and in-flight request on unmount or when modal closes
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

  const handleSave = () => {
    if (!place || !locationSelected) {
      Alert.alert('Incomplete Data', 'Please select a specific location from the suggestions.');
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
      Alert.alert('Invalid Entry', validation.errors[0]);
      return;
    }

    Haptics.selectionAsync().catch(() => {});
    setShowConfirm(true);
  };

  const onDateChange = (_event: any, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  const onTimeChange = (_event: any, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowTimePicker(false);
    if (selected) setTime(selected);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.container}>
        <SkiaDynamicCosmos fill="#020817" />

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(100)} style={styles.glassCard}>
              {!hideClose && (
                <View style={styles.header}>
                  <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
                    <Ionicons name="close-outline" size={24} color={theme.textPrimary} />
                  </Pressable>
                </View>
              )}

              <View style={[styles.logoContainer, { alignItems: 'center' }]}>
                <MySkyCompassSkia size={160} />
              </View>

              <Text style={styles.mainTitle}>{title || 'Birth Details'}</Text>

              <Text style={styles.sectionLabel}>Name (Local Only)</Text>
              <TextInput
                style={styles.textInput}
                value={chartName}
                onChangeText={setChartName}
                placeholder="Name your profile..."
                placeholderTextColor={theme.textMuted}
              />

              <Text style={styles.sectionLabel}>Birth Date</Text>
              <Pressable style={styles.pickButton} onPress={() => setShowDatePicker(true)}>
                <View style={styles.pickGradient}>
                  <MetallicIcon name="calendar-outline" size={18} color={PALETTE.silverBlue} />
                  <Text style={styles.pickText}>
                    {date.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.rowBetween}>
                <Text style={styles.sectionLabel}>Birth Time</Text>
                <Pressable style={styles.toggle} onPress={() => setHasUnknownTime(!hasUnknownTime)}>
                  {hasUnknownTime ? (
                    <MetallicIcon name="checkbox-outline" size={18} color={PALETTE.gold} />
                  ) : (
                    <Ionicons name="square-outline" size={18} color={theme.textMuted} />
                  )}
                  <Text style={styles.toggleText}>Unknown</Text>
                </Pressable>
              </View>

              {!hasUnknownTime && (
                <Pressable
                  style={styles.pickButton}
                  onPress={() => setShowTimePicker(true)}
                >
                    <View style={styles.pickGradient}>
                    <MetallicIcon name="time-outline" size={18} color={PALETTE.gold} />
                    <Text style={styles.pickText}>
                      {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                </Pressable>
              )}

              <Text style={styles.sectionLabel}>Birth Location</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
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
              </View>

              {showSuggestions && locationSuggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {locationSuggestions.map((s, i) => (
                    <Pressable
                      key={`${s.place_id ?? s.display_name}-${i}`}
                      style={styles.suggestion}
                      onPress={() => {
                        setPlace(s.display_name);
                        setLatitude(parseFloat(s.lat));
                        setLongitude(parseFloat(s.lon));
                        setLocationSelected(true);
                        setShowSuggestions(false);
                        Haptics.selectionAsync().catch(() => {});
                      }}
                    >
                      <MetallicIcon name="location-outline" size={16} color={PALETTE.silverBlue} />
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {s.display_name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.View>

            <View style={{ marginTop: 32 }}>
              <SkiaMetallicPill label="Generate My Data" onPress={handleSave} borderRadius={16} />
            </View>

            <Text style={styles.privacyNote}>Encrypted locally. Private by design.</Text>

            {onRestore && (
              <Pressable style={styles.restoreBtn} onPress={onRestore}>
                <MetallicText color={PALETTE.gold} style={styles.restoreText}>Restore Data</MetallicText>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>

        {showConfirm && (
          <View style={StyleSheet.absoluteFill}>
            <View style={[styles.confirmOverlay, { backgroundColor: 'rgba(0,0,0,0.96)' }]}>
              <Animated.View entering={FadeInUp} style={styles.confirmCard}>
                <MySkyVerifySealSkia 
                  size={96} 
                  style={{ marginBottom: 16 }} 
                />

                <Text style={styles.confirmTitle}>Verify Your Details</Text>
                <Text style={styles.confirmSub}>
                  Birth data is locked after saving to ensure cycle accuracy.
                </Text>

                <View style={styles.sealRows}>
                  <View style={styles.sealRow}>
                    <MetallicText color={PALETTE.gold} style={styles.sealLabel}>DATE</MetallicText>
                    <Text style={styles.sealValue}>{date.toLocaleDateString()}</Text>
                  </View>

                  <View style={styles.sealRow}>
                    <MetallicText color={PALETTE.gold} style={styles.sealLabel}>TIME</MetallicText>
                    <Text style={styles.sealValue}>
                      {hasUnknownTime
                        ? 'Unknown'
                        : time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>

                  <View style={styles.sealRow}>
                    <MetallicText color={PALETTE.gold} style={styles.sealLabel}>PLACE</MetallicText>
                    <Text style={styles.sealValue} numberOfLines={1}>
                      {place.split(',')[0]}
                    </Text>
                  </View>
                </View>

                <SkiaMetallicPill
                  label="Confirm & Secure"
                  onPress={() => {
                    setShowConfirm(false);
                    onSave(
                      {
                        date: toLocalDateString(date),
                        time: hasUnknownTime ? undefined : time.toTimeString().slice(0, 5),
                        hasUnknownTime,
                        place,
                        latitude,
                        longitude,
                        houseSystem,
                      },
                      { chartName }
                    );
                  }}
                  borderRadius={16}
                />

                <Pressable onPress={() => setShowConfirm(false)} style={{ marginTop: 20 }}>
                  <Text style={styles.backBtnText}>Edit Details</Text>
                </Pressable>
              </Animated.View>
            </View>
          </View>
        )}

        {showTimePicker && Platform.OS === 'ios' && (
          <View style={StyleSheet.absoluteFill}>
            <Pressable
              style={styles.pickerScrim}
              onPress={() => setShowTimePicker(false)}
            />
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <View style={{ width: 60 }} />
                <Text style={styles.pickerTitle}>Set Birth Time</Text>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <MetallicText color={PALETTE.gold} style={styles.pickerDone}>Done</MetallicText>
                </Pressable>
              </View>

              <View style={styles.timePickerCard}>
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="spinner"
                  themeVariant="dark"
                  textColor="#FFFFFF"
                  onChange={onTimeChange}
                  style={styles.nativePicker}
                />
              </View>
            </View>
          </View>
        )}

        {showTimePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={time}
            mode="time"
            onChange={onTimeChange}
          />
        )}

        {showDatePicker && Platform.OS === 'ios' && (
          <View style={StyleSheet.absoluteFill}>
            <Pressable
              style={styles.pickerScrim}
              onPress={() => setShowDatePicker(false)}
            />
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <View style={{ width: 60 }} />
                <Text style={styles.pickerTitle}>Set Birth Date</Text>
                <Pressable onPress={() => setShowDatePicker(false)}>
                  <MetallicText color={PALETTE.gold} style={styles.pickerDone}>Done</MetallicText>
                </Pressable>
              </View>

              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                themeVariant="dark"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            </View>
          </View>
        )}

        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020817',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  glassCard: {},
  logoContainer: {
    marginTop: -60,
    marginBottom: 70,
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    alignSelf: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.5,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    marginTop: -48,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(201, 174, 120, 0.75)',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 16,
    opacity: 0.85,
  },
  textInput: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    color: 'rgba(226,232,240,0.9)',
    fontSize: 16,
  },
  pickButton: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pickGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  pickText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  toggleText: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    position: 'relative',
    marginTop: 4,
  },
  loader: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  suggestions: {
    marginTop: 8,
    backgroundColor: 'rgba(20, 24, 34, 0.95)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
    overflow: 'hidden',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  privacyNote: {
    textAlign: 'center',
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 16,
    fontStyle: 'italic',
  },
  restoreBtn: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  restoreText: {
    color: PALETTE.gold,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  confirmOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F5F5F7',
    marginBottom: 8,
  },
  confirmSub: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sealRows: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
  },
  sealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sealLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.gold,
    letterSpacing: 1.5,
  },
  sealValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  backBtnText: {
    color: theme.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  pickerScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerSheet: {
    backgroundColor: '#0D1117',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: PALETTE.glassBorder,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  pickerTitle: {
    color: PALETTE.textMain,
    fontSize: 16,
    fontWeight: '600',
  },
  pickerDone: {
    color: PALETTE.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  pickerCancel: {
    color: theme.textMuted,
    fontSize: 16,
  },
  timePickerCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: PALETTE.glassBorder,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  nativePicker: {
    width: '100%',
  },
});
