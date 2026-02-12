import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { logger } from '../utils/logger';
import { toLocalDateString } from '../utils/dateUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { theme } from '../constants/theme';
import StarField from './ui/StarField';
import { BirthData, HouseSystem } from '../services/astrology/types';
import { InputValidator } from '../services/astrology/inputValidator';

type BirthDataModalInitial = Partial<BirthData> & { chartName?: string };

interface BirthDataModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: BirthData, extra?: { chartName?: string }) => void;
  initialData?: BirthDataModalInitial;
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
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
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
const NOMINATIM_HEADERS = {
  'Accept-Language': 'en-US,en;q=0.9',
  // Nominatim strongly prefers an identifying UA. Some RN environments block UA,
  // but providing it as a header helps in many cases.
  'User-Agent': 'MySkyApp/1.0 (support@brittanyapps.com)',
};

// ─── Custom Time Picker (replaces broken DateTimePicker spinner on iOS) ──────
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i);       // 0..59
const PERIODS = ['AM', 'PM'] as const;

function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }

function TimeWheelColumn({ data, selected, onSelect, formatItem }: {
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
      // Small delay to let layout complete
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ 
          offset: selectedIndex * ITEM_HEIGHT, 
          animated: false 
        });
      }, 50);
    }
  }, [selectedIndex]);

  const handleMomentumScrollEnd = useCallback((e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    if (data[clampedIndex] !== selected) {
      Haptics.selectionAsync();
      onSelect(data[clampedIndex]);
    }
  }, [data, selected, onSelect]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isSelected = item === selected;
    const label = formatItem ? formatItem(item) : String(item);
    return (
      <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{
          fontSize: isSelected ? 22 : 17,
          fontWeight: isSelected ? '600' : '400',
          color: isSelected ? theme.textPrimary : 'rgba(255,255,255,0.3)',
        }}>
          {label}
        </Text>
      </View>
    );
  }, [selected, formatItem]);

  // Padding items to allow first/last items to center
  const paddingCount = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <View style={{ height: PICKER_HEIGHT, overflow: 'hidden', flex: 1 }}>
      {/* Selection highlight */}
      <View pointerEvents="none" style={{
        position: 'absolute',
        top: paddingCount * ITEM_HEIGHT,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(201, 169, 98, 0.3)',
        backgroundColor: 'rgba(201, 169, 98, 0.08)',
        zIndex: 1,
      }} />
      <FlatList
        ref={flatListRef}
        data={data as any[]}
        keyExtractor={(item) => String(item)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled={true}
        scrollEnabled={true}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{
          paddingTop: paddingCount * ITEM_HEIGHT,
          paddingBottom: paddingCount * ITEM_HEIGHT,
        }}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

function CustomTimePicker({ hour, minute, period, onTimeChange }: {
  hour: number;  // 1-12
  minute: number; // 0-59
  period: 'AM' | 'PM';
  onTimeChange: (hour: number, minute: number, period: 'AM' | 'PM') => void;
}) {
  return (
    <View style={{ flexDirection: 'row', height: PICKER_HEIGHT, paddingHorizontal: 20 }}>
      <TimeWheelColumn
        data={HOURS_12}
        selected={hour}
        onSelect={(h: number) => onTimeChange(h, minute, period)}
      />
      <View style={{ justifyContent: 'center', width: 12 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: '600', textAlign: 'center' }}>:</Text>
      </View>
      <TimeWheelColumn
        data={MINUTES}
        selected={minute}
        onSelect={(m: number) => onTimeChange(hour, m, period)}
        formatItem={pad2}
      />
      <TimeWheelColumn
        data={PERIODS}
        selected={period}
        onSelect={(p: 'AM' | 'PM') => onTimeChange(hour, minute, p)}
      />
    </View>
  );
}

// Convert 24h time to 12h format
function to12Hour(hours24: number): { hour: number; period: 'AM' | 'PM' } {
  const period: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
  let hour = hours24 % 12;
  if (hour === 0) hour = 12;
  return { hour, period };
}

// Convert 12h time to 24h
function to24Hour(hour: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function BirthDataModal({ visible, onClose, onSave, initialData }: BirthDataModalProps) {
  const [chartName, setChartName] = useState(initialData?.chartName || '');

  const [date, setDate] = useState<Date>(parseISODateToDate(initialData?.date));
  const [time, setTime] = useState<Date>(parseHHMMToDate(initialData?.time));
  // Separate picker state to avoid re-render issues with DateTimePicker
  const [pickerTime, setPickerTime] = useState<Date>(parseHHMMToDate(initialData?.time));
  const [hasUnknownTime, setHasUnknownTime] = useState<boolean>(initialData?.hasUnknownTime ?? false);

  const [place, setPlace] = useState<string>(initialData?.place || '');
  const [latitude, setLatitude] = useState<number>(initialData?.latitude ?? 0);
  const [longitude, setLongitude] = useState<number>(initialData?.longitude ?? 0);
  const [timezone, setTimezone] = useState<string>(initialData?.timezone || '');

  const houseSystem: HouseSystem = initialData?.houseSystem || 'whole-sign';

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      // reset suggestion UI when closed
      setShowSuggestions(false);
      setLocationSuggestions([]);
      setSearchingLocation(false);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = null;
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
      // Reset initialization flag when modal closes
      hasInitializedRef.current = false;
      return;
    }

    // Only sync initialData once when modal first opens
    if (visible && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (initialData) {
        setChartName(initialData.chartName || '');
        setDate(parseISODateToDate(initialData.date));
        const parsedTime = parseHHMMToDate(initialData.time);
        setTime(parsedTime);
        setPickerTime(parsedTime);
        setHasUnknownTime(initialData.hasUnknownTime ?? false);

        setPlace(initialData.place || '');
        setLatitude(initialData.latitude ?? 0);
        setLongitude(initialData.longitude ?? 0);
        setTimezone(initialData.timezone || '');

        // houseSystem is read-only here; user changes it in Settings
        setLocationSelected(
          Boolean(
            initialData.place &&
              typeof initialData.latitude === 'number' &&
              typeof initialData.longitude === 'number'
          )
        );
      }
    }
  }, [visible, initialData]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  const searchLocation = (query: string) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    setLocationSelected(false);

    const q = query.trim();
    if (q.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingLocation(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(q)}&limit=5`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: NOMINATIM_HEADERS,
        });

        if (!response.ok) throw new Error('Search failed');
        const data = (await response.json()) as LocationSuggestion[];

        if (!controller.signal.aborted) {
          setLocationSuggestions(Array.isArray(data) ? data : []);
          setShowSuggestions(true);
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          logger.error('Location search failed:', error);
          setLocationSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchingLocation(false);
          abortControllerRef.current = null;
        }
      }
    }, 450);
  };

  const selectLocation = (suggestion: LocationSuggestion) => {
    Haptics.selectionAsync();
    setPlace(suggestion.display_name);
    setLatitude(Number.parseFloat(suggestion.lat));
    setLongitude(Number.parseFloat(suggestion.lon));
    setShowSuggestions(false);
    setLocationSelected(true);
  };

  const birthData: BirthData = useMemo(
    () => ({
      date: toLocalDateString(date),
      time: hasUnknownTime ? undefined : time.toTimeString().slice(0, 5),
      hasUnknownTime,
      place: place.trim(),
      latitude,
      longitude,
      houseSystem,
      timezone: timezone.trim() ? timezone.trim() : undefined,
    }),
    [date, time, hasUnknownTime, place, latitude, longitude, houseSystem, timezone]
  );

  const handleSave = () => {
    if (!birthData.place) {
      Alert.alert('Missing Information', 'Please enter your birth location.');
      return;
    }
    if (!locationSelected) {
      Alert.alert('Confirm Location', 'Please select a location from the suggestions for accurate coordinates.');
      return;
    }

    const validation = InputValidator.validateBirthData(birthData);
    if (!validation.valid) {
      Alert.alert('Invalid Birth Data', validation.errors.join('\n'));
      return;
    }

    onSave(birthData, { chartName: chartName.trim() || undefined });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const formatTime = (t: Date) =>
    t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    // On Android, picker closes automatically; on iOS we have a Done button
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selected) {
      setDate(new Date(selected));
    }
  };

  // Custom picker state (12h format)
  const currentTime12 = to12Hour(pickerTime.getHours());
  const [pickerHour, setPickerHour] = useState(currentTime12.hour);
  const [pickerMinute, setPickerMinute] = useState(pickerTime.getMinutes());
  const [pickerPeriod, setPickerPeriod] = useState<'AM' | 'PM'>(currentTime12.period);

  const onTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android only - iOS uses custom picker now
    if (Platform.OS !== 'ios') {
      setShowTimePicker(false);
      if (selected && !isNaN(selected.getTime())) {
        const newTime = new Date();
        newTime.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setTime(newTime);
        setPickerTime(newTime);
      }
    }
  };

  const handleCustomTimeChange = (hour: number, minute: number, period: 'AM' | 'PM') => {
    setPickerHour(hour);
    setPickerMinute(minute);
    setPickerPeriod(period);
    logger.info('[BirthDataModal] Custom picker changed', { hour, minute, period });
  };

  const handleTimePickerDone = () => {
    const hours24 = to24Hour(pickerHour, pickerPeriod);
    const newTime = new Date();
    newTime.setHours(hours24, pickerMinute, 0, 0);
    logger.info('[BirthDataModal] Done pressed, committing time', { 
      hour: pickerHour, minute: pickerMinute, period: pickerPeriod, hours24,
      newTime: newTime.toISOString()
    });
    setTime(newTime);
    setPickerTime(newTime);
    setShowTimePicker(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <StarField starCount={30} />

        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Birth Information</Text>
            <View style={styles.closeButton} />
          </Animated.View>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Name Field (local only) */}
              <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>Name (Optional)</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={chartName}
                    onChangeText={setChartName}
                    placeholder="Enter a name for this chart"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </Animated.View>

              {/* Date */}
              <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>Birth Date</Text>
                <Pressable style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
                  <LinearGradient
                    colors={['rgba(201, 169, 98, 0.15)', 'rgba(201, 169, 98, 0.05)']}
                    style={styles.dateTimeGradient}
                  >
                    <Ionicons name="calendar" size={20} color={theme.primary} />
                    <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              {/* Time */}
              <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
                <View style={styles.timeHeader}>
                  <Text style={styles.sectionTitle}>Birth Time</Text>
                  <Pressable
                    style={styles.unknownTimeToggle}
                    onPress={() => {
                      setHasUnknownTime((v) => !v);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Ionicons
                      name={hasUnknownTime ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={hasUnknownTime ? theme.primary : theme.textMuted}
                    />
                    <Text style={styles.unknownTimeText}>Unknown time</Text>
                  </Pressable>
                </View>

                {!hasUnknownTime ? (
                  <Pressable style={styles.dateTimeButton} onPress={() => {
                    setPickerTime(time);
                    const t12 = to12Hour(time.getHours());
                    setPickerHour(t12.hour);
                    setPickerMinute(time.getMinutes());
                    setPickerPeriod(t12.period);
                    setShowTimePicker(true);
                  }}>
                    <LinearGradient
                      colors={['rgba(201, 169, 98, 0.15)', 'rgba(201, 169, 98, 0.05)']}
                      style={styles.dateTimeGradient}
                    >
                      <Ionicons name="time" size={20} color={theme.primary} />
                      <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
                    </LinearGradient>
                  </Pressable>
                ) : (
                  <Text style={styles.warningText}>
                    Rising sign and house-based insights require an exact birth time.
                  </Text>
                )}
              </Animated.View>

              {/* Location */}
              <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>Birth Location</Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={place}
                    onChangeText={(text) => {
                      setPlace(text);
                      searchLocation(text);
                    }}
                    placeholder="Enter city, state, country"
                    placeholderTextColor={theme.textMuted}
                  />
                  {searchingLocation && (
                    <ActivityIndicator size="small" color={theme.primary} style={styles.searchIndicator} />
                  )}
                </View>

                {showSuggestions && (
                  <View style={styles.suggestionsContainer}>
                    {locationSuggestions.length > 0 ? (
                      locationSuggestions.map((s, idx) => (
                        <Pressable
                          key={String(s.place_id ?? idx)}
                          style={styles.suggestionItem}
                          onPress={() => selectLocation(s)}
                        >
                          <Ionicons name="location-outline" size={16} color={theme.textMuted} />
                          <Text style={styles.suggestionText} numberOfLines={2}>
                            {s.display_name}
                          </Text>
                        </Pressable>
                      ))
                    ) : (
                      <View style={styles.noResultsContainer}>
                        <Ionicons name="search-outline" size={20} color={theme.textMuted} />
                        <Text style={styles.noResultsText}>No matches found. Try “City, Country”.</Text>
                      </View>
                    )}
                  </View>
                )}

                {!locationSelected && place.trim().length >= 3 && (
                  <Text style={styles.warningText}>Select a suggestion to lock in accurate coordinates.</Text>
                )}
              </Animated.View>

              {/* Timezone */}
              <Animated.View entering={FadeInDown.delay(540).duration(600)} style={styles.section}>
                <Text style={styles.sectionTitle}>Timezone (Optional)</Text>
                <Text style={styles.sectionSubtitle}>
                  For exact accuracy, enter an IANA timezone like “America/Detroit”.
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={timezone}
                    onChangeText={setTimezone}
                    placeholder="America/Detroit"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
                  />
                </View>
              </Animated.View>

              {/* Save */}
              <Animated.View entering={FadeInUp.delay(600).duration(600)} style={styles.saveContainer}>
                <Pressable
                  style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
                  onPress={handleSave}
                >
                  <LinearGradient
                    colors={['#E8D5A8', '#C9A962', '#B8994F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveGradient}
                  >
                    <Text style={styles.saveButtonText}>Save Birth Data</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </ScrollView>

            {showDatePicker && Platform.OS !== 'ios' && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(new Date().getFullYear() - 115, 0, 1)}
              />
            )}

            {showTimePicker && Platform.OS !== 'ios' && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* iOS Date Picker Overlay - outside KeyboardAvoidingView */}
        {showDatePicker && Platform.OS === 'ios' && (
          <Pressable style={styles.pickerOverlay} onPress={() => setShowDatePicker(false)}>
            <Pressable style={styles.pickerContainer} onPress={(e) => e.stopPropagation()}>
              <View style={styles.pickerHeader}>
                <Pressable onPress={() => setShowDatePicker(false)} hitSlop={20}>
                  <Text style={styles.pickerDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                style={{ backgroundColor: 'transparent' }}
                themeVariant="dark"
                maximumDate={new Date()}
                minimumDate={new Date(new Date().getFullYear() - 115, 0, 1)}
              />
            </Pressable>
          </Pressable>
        )}

        {/* iOS Time Picker Overlay - Custom scroll wheels */}
        {showTimePicker && Platform.OS === 'ios' && (
          <View style={styles.pickerOverlay}>
            <Pressable style={{ flex: 1 }} onPress={() => setShowTimePicker(false)} />
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Pressable onPress={() => setShowTimePicker(false)} hitSlop={20}>
                  <Text style={[styles.pickerDone, { color: theme.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleTimePickerDone} hitSlop={20}>
                  <Text style={styles.pickerDone}>Done</Text>
                </Pressable>
              </View>
              <CustomTimePicker
                hour={pickerHour}
                minute={pickerMinute}
                period={pickerPeriod}
                onTimeChange={handleCustomTimeChange}
              />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, fontFamily: 'serif' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  section: { marginTop: theme.spacing.xl },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: 'serif',
  },
  sectionSubtitle: { fontSize: 13, color: theme.textMuted, marginBottom: theme.spacing.md },
  inputContainer: { position: 'relative' },
  textInput: {
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    color: theme.textPrimary,
  },
  searchIndicator: { position: 'absolute', right: theme.spacing.lg, top: '50%', marginTop: -10 },
  dateTimeButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  dateTimeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  dateTimeText: { fontSize: 16, color: theme.textPrimary, marginLeft: theme.spacing.md, flex: 1 },
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  unknownTimeToggle: { flexDirection: 'row', alignItems: 'center' },
  unknownTimeText: { fontSize: 14, color: theme.textSecondary, marginLeft: theme.spacing.sm },
  warningText: { marginTop: theme.spacing.sm, color: theme.warning, fontSize: 12, lineHeight: 18 },
  suggestionsContainer: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionText: { fontSize: 14, color: theme.textSecondary, marginLeft: theme.spacing.md, flex: 1 },
  noResultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    justifyContent: 'center',
  },
  noResultsText: { fontSize: 14, color: theme.textMuted, marginLeft: theme.spacing.sm, textAlign: 'center' },
  saveContainer: { marginTop: theme.spacing.xl },
  saveButton: { borderRadius: theme.borderRadius.lg, overflow: 'hidden', ...theme.shadows.glow },
  saveButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  saveGradient: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl, alignItems: 'center' },
  saveButtonText: { fontSize: 18, fontWeight: '700', color: '#0D1421', fontFamily: 'serif' },
  pickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: theme.backgroundSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerDone: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.primary,
  },
});