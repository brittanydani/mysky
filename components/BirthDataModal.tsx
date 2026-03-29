/**
 * BirthDataModal
 *
 * Cinematic entry point for personal birth data.
 * Features custom obsidian scroll wheels and glassmorphic confirmation seal.
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { SkiaGradient as LinearGradient } from './ui/SkiaGradient';
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
  gold: '#C9AE78',
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

// ─── Custom Time Picker ──────────────────────────────────────────────────────
const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'] as const;

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function TimeWheelColumn({
  data,
  selected,
  onSelect,
  formatItem,
}: {
  data: readonly number[] | readonly string[];
  selected: number | string;
  onSelect: (val: any) => void;
  formatItem?: (val: any) => string;
}) {
  const flatListRef = useRef<FlatList>(null);
  const initialScrollDone = useRef(false);
  const selectedIndex = data.indexOf(selected as never);

  useEffect(() => {
    if (flatListRef.current && selectedIndex >= 0 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 60);
    }
  }, [selectedIndex]);

  const commitFromOffset = useCallback(
    (offsetY: number) => {
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
      const next = data[clampedIndex];
      if (next !== selected) {
        Haptics.selectionAsync().catch(() => {});
        onSelect(next);
      }
    },
    [data, selected, onSelect]
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const isSelected = item === selected;
      return (
        <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
          {isSelected ? (
            <MetallicText
              color={PALETTE.gold}
              style={{
                fontSize: 24,
                fontWeight: '700',
                fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
              }}
            >
              {formatItem ? formatItem(item) : String(item)}
            </MetallicText>
          ) : (
            <Text
              style={{
                fontSize: 18,
                fontWeight: '400',
                color: 'rgba(255,255,255,0.2)',
                fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
              }}
            >
              {formatItem ? formatItem(item) : String(item)}
            </Text>
          )}
        </View>
      );
    },
    [selected, formatItem]
  );

  return (
    <View style={{ height: PICKER_HEIGHT, overflow: 'hidden', flex: 1 }}>
      <View pointerEvents="none" style={styles.pickerSelectorOverlay} />
      <FlatList
        ref={flatListRef}
        data={data as any[]}
        keyExtractor={(item) => String(item)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => commitFromOffset(e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ paddingVertical: (PICKER_HEIGHT - ITEM_HEIGHT) / 2 }}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

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
  const [pickerTime, setPickerTime] = useState<Date>(parseHHMMToDate(initialData?.time));
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
      const pt = parseHHMMToDate(initialData.time);
      setTime(pt);
      setPickerTime(pt);
      setHasUnknownTime(initialData.hasUnknownTime ?? false);
      setPlace(initialData.place || '');
      setLatitude(initialData.latitude ?? 0);
      setLongitude(initialData.longitude ?? 0);
      setLocationSelected(!!(initialData.place && initialData.latitude));
    }
  }, [visible, initialData]);

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

  const t12 = useMemo(() => {
    let h = pickerTime.getHours();
    const p = (h >= 12 ? 'PM' : 'AM') as typeof PERIODS[number];
    h = h % 12 || 12;
    return { h, m: pickerTime.getMinutes(), p };
  }, [pickerTime]);

  const [pHour, setPHour] = useState(t12.h);
  const [pMin, setPMin] = useState(t12.m);
  const [pPer, setPPer] = useState<typeof PERIODS[number]>(t12.p);

  const confirmTime = () => {
    const h24 =
      pPer === 'PM'
        ? pHour === 12
          ? 12
          : pHour + 12
        : pHour === 12
          ? 0
          : pHour;

    const newTime = new Date();
    newTime.setHours(h24, pMin, 0, 0);
    setTime(newTime);
    setPickerTime(newTime);
    setShowTimePicker(false);
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
                <LinearGradient
                  colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']}
                  style={styles.pickGradient}
                >
                  <MetallicIcon name="calendar-outline" size={18} color={PALETTE.silverBlue} />
                  <Text style={styles.pickText}>
                    {date.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </LinearGradient>
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
                  onPress={() => {
                    setPHour(t12.h);
                    setPMin(t12.m);
                    setPPer(t12.p);
                    setShowTimePicker(true);
                  }}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.01)']}
                    style={styles.pickGradient}
                  >
                    <MetallicIcon name="time-outline" size={18} color={PALETTE.gold} />
                    <Text style={styles.pickText}>
                      {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </LinearGradient>
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
            <LinearGradient colors={['rgba(7, 9, 15, 0.95)', '#020817']} style={styles.confirmOverlay}>
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
            </LinearGradient>
          </View>
        )}

        {showTimePicker && Platform.OS === 'ios' && (
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Pressable onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerCancel}>Cancel</Text>
                </Pressable>

                <Text style={styles.pickerTitle}>Set Birth Time</Text>

                <Pressable onPress={confirmTime}>
                  <MetallicText color={PALETTE.gold} style={styles.pickerDone}>Done</MetallicText>
                </Pressable>
              </View>

              <View style={styles.wheelsRow}>
                <TimeWheelColumn data={HOURS_12} selected={pHour} onSelect={setPHour} />
                <View style={styles.wheelSeparator}>
                  <Text style={styles.sepText}>:</Text>
                </View>
                <TimeWheelColumn data={MINUTES} selected={pMin} onSelect={setPMin} formatItem={pad2} />
                <TimeWheelColumn data={PERIODS} selected={pPer} onSelect={setPPer} />
              </View>
            </View>
          </View>
        )}

        {showDatePicker && Platform.OS === 'ios' && (
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
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
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
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
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: '#0D1117',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  wheelsRow: {
    flexDirection: 'row',
    height: PICKER_HEIGHT,
    paddingHorizontal: 20,
  },
  wheelSeparator: {
    justifyContent: 'center',
    width: 12,
  },
  sepText: {
    color: PALETTE.textMain,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  pickerSelectorOverlay: {
    position: 'absolute',
    top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(232,214,174,0.25)',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
});
