/**
 * BirthDataModal
 * * Cinematic entry point for personal birth data.
 * Features custom obsidian scroll wheels and glassmorphic confirmation seal.
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
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
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';
import { BirthData, HouseSystem } from '../services/astrology/types';
import { InputValidator } from '../services/astrology/inputValidator';
import { AstrologySettingsService } from '../services/astrology/astrologySettingsService';

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
  return (y && m && d) ? new Date(y, m - 1, d) : new Date();
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
  'User-Agent': 'MySkyApp/1.0 (support@brittanyapps.com)',
};

// ─── Custom Time Picker ──────────────────────────────────────────────────────
const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
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
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: selectedIndex * ITEM_HEIGHT, animated: false });
      }, 60);
    }
  }, [selectedIndex]);

  const commitFromOffset = useCallback((offsetY: number) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    const next = data[clampedIndex];
    if (next !== selected) {
      Haptics.selectionAsync().catch(() => {});
      onSelect(next);
    }
  }, [data, selected, onSelect]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isSelected = item === selected;
    return (
      <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{
          fontSize: isSelected ? 24 : 18,
          fontWeight: isSelected ? '700' : '400',
          color: isSelected ? PALETTE.gold : 'rgba(255,255,255,0.2)',
          fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
        }}>
          {formatItem ? formatItem(item) : String(item)}
        </Text>
      </View>
    );
  }, [selected, formatItem]);

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
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
      />
    </View>
  );
}

export default function BirthDataModal({ visible, onClose, onSave, initialData }: BirthDataModalProps) {
  const [chartName, setChartName] = useState(initialData?.chartName || '');
  const [date, setDate] = useState<Date>(parseISODateToDate(initialData?.date));
  const [time, setTime] = useState<Date>(parseHHMMToDate(initialData?.time));
  const [pickerTime, setPickerTime] = useState<Date>(parseHHMMToDate(initialData?.time));
  const [hasUnknownTime, setHasUnknownTime] = useState<boolean>(initialData?.hasUnknownTime ?? false);
  const [place, setPlace] = useState<string>(initialData?.place || '');
  const [latitude, setLatitude] = useState<number>(initialData?.latitude ?? 0);
  const [longitude, setLongitude] = useState<number>(initialData?.longitude ?? 0);
  const [houseSystem, setHouseSystem] = useState<HouseSystem>(initialData?.houseSystem || 'whole-sign');
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
      setTime(pt); setPickerTime(pt);
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
    if (q.length < 3) { setShowSuggestions(false); return; }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingLocation(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const response = await fetch(`${NOMINATIM_URL}?format=json&q=${encodeURIComponent(q)}&limit=5`, {
          signal: controller.signal, headers: NOMINATIM_HEADERS,
        });
        const data = await response.json();
        if (!controller.signal.aborted) {
          setLocationSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (error) {
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
      hasUnknownTime, place, latitude, longitude, houseSystem,
    };
    const validation = InputValidator.validateBirthData(data);
    if (!validation.valid) { Alert.alert('Invalid Entry', validation.errors[0]); return; }
    Haptics.selectionAsync().catch(() => {});
    setShowConfirm(true);
  };

  const onDateChange = (event: any, selected?: Date) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (selected) setDate(selected);
  };

  // Time Picker Utils
  const t12 = useMemo(() => {
    let h = pickerTime.getHours();
    const p = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return { h, m: pickerTime.getMinutes(), p };
  }, [pickerTime]);

  const [pHour, setPHour] = useState(t12.h);
  const [pMin, setPMin] = useState(t12.m);
  const [pPer, setPPer] = useState(t12.p);

  const confirmTime = () => {
    let h24 = pPer === 'PM' ? (pHour === 12 ? 12 : pHour + 12) : (pHour === 12 ? 0 : pHour);
    const newTime = new Date();
    newTime.setHours(h24, pMin, 0, 0);
    setTime(newTime);
    setShowTimePicker(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          
          <View style={styles.header}>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={15}>
              <Ionicons name="close" size={24} color={PALETTE.textMain} />
            </Pressable>
            <Text style={styles.headerTitle}>Birth Details</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Animated.View entering={FadeInDown.delay(100)} style={styles.glassCard}>
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
                <LinearGradient colors={['rgba(139, 196, 232, 0.15)', 'rgba(2,8,23,0.50)']} style={styles.pickGradient}>
                  <Ionicons name="calendar-outline" size={18} color={PALETTE.silverBlue} />
                  <Text style={styles.pickText}>{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                </LinearGradient>
              </Pressable>

              <View style={styles.rowBetween}>
                <Text style={styles.sectionLabel}>Birth Time</Text>
                <Pressable style={styles.toggle} onPress={() => setHasUnknownTime(!hasUnknownTime)}>
                  <Ionicons name={hasUnknownTime ? "checkbox" : "square-outline"} size={18} color={hasUnknownTime ? PALETTE.gold : theme.textMuted} />
                  <Text style={styles.toggleText}>Unknown</Text>
                </Pressable>
              </View>
              
              {!hasUnknownTime && (
                <Pressable style={styles.pickButton} onPress={() => { setPHour(t12.h); setPMin(t12.m); setPPer(t12.p); setShowTimePicker(true); }}>
                  <LinearGradient colors={['rgba(232, 214, 174, 0.15)', 'rgba(2,8,23,0.50)']} style={styles.pickGradient}>
                    <Ionicons name="time-outline" size={18} color={PALETTE.gold} />
                    <Text style={styles.pickText}>{time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
                  </LinearGradient>
                </Pressable>
              )}

              <Text style={styles.sectionLabel}>Birth Location</Text>
              <View style={styles.inputContainer}>
                <TextInput 
                  style={styles.textInput} 
                  value={place} 
                  onChangeText={(t) => { setPlace(t); searchLocation(t); }} 
                  placeholder="City, State, Country" 
                  placeholderTextColor={theme.textMuted} 
                />
                {searchingLocation && <ActivityIndicator size="small" color={PALETTE.gold} style={styles.loader} />}
              </View>

              {showSuggestions && locationSuggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {locationSuggestions.map((s, i) => (
                    <Pressable key={i} style={styles.suggestion} onPress={() => {
                      setPlace(s.display_name); setLatitude(parseFloat(s.lat)); setLongitude(parseFloat(s.lon));
                      setLocationSelected(true); setShowSuggestions(false); Haptics.selectionAsync();
                    }}>
                      <Ionicons name="location-outline" size={16} color={PALETTE.silverBlue} />
                      <Text style={styles.suggestionText} numberOfLines={1}>{s.display_name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.View>

            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <LinearGradient colors={['#FFF4D6', '#C9AE78', '#6B532E']} style={styles.saveGradient}>
                <Text style={styles.saveBtnText}>Generate My Chart</Text>
              </LinearGradient>
            </Pressable>
            <Text style={styles.privacyNote}>Encrypted locally. Private by design.</Text>
          </ScrollView>
        </SafeAreaView>

        {/* --- Confirmation "Seal" Overlay --- */}
        {showConfirm && (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient colors={['rgba(7, 9, 15, 0.95)', '#020817']} style={styles.confirmOverlay}>
              <Animated.View entering={FadeInUp} style={styles.confirmCard}>
                <Ionicons name="shield-checkmark" size={48} color={PALETTE.gold} style={{ marginBottom: 16 }} />
                <Text style={styles.confirmTitle}>Verify Your Details</Text>
                <Text style={styles.confirmSub}>Birth data is locked after saving to ensure cycle accuracy.</Text>
                
                <View style={styles.sealRows}>
                  <View style={styles.sealRow}><Text style={styles.sealLabel}>DATE</Text><Text style={styles.sealValue}>{date.toLocaleDateString()}</Text></View>
                  <View style={styles.sealRow}><Text style={styles.sealLabel}>TIME</Text><Text style={styles.sealValue}>{hasUnknownTime ? 'Unknown' : time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View>
                  <View style={styles.sealRow}><Text style={styles.sealLabel}>PLACE</Text><Text style={styles.sealValue} numberOfLines={1}>{place.split(',')[0]}</Text></View>
                </View>

                <Pressable style={styles.saveBtn} onPress={() => { setShowConfirm(false); onSave({ date: toLocalDateString(date), time: hasUnknownTime ? undefined : time.toTimeString().slice(0, 5), hasUnknownTime, place, latitude, longitude, houseSystem }, { chartName }); }}>
                  <LinearGradient colors={['#FFF4D6', '#C9AE78', '#6B532E']} style={styles.saveGradient}>
                    <Text style={styles.saveBtnText}>Confirm & Secure</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={() => setShowConfirm(false)} style={{ marginTop: 20 }}><Text style={styles.backBtnText}>Edit Details</Text></Pressable>
              </Animated.View>
            </LinearGradient>
          </View>
        )}

        {/* --- iOS Time Picker Overlay --- */}
        {showTimePicker && Platform.OS === 'ios' && (
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Pressable onPress={() => setShowTimePicker(false)}><Text style={styles.pickerCancel}>Cancel</Text></Pressable>
                <Text style={styles.pickerTitle}>Set Birth Time</Text>
                <Pressable onPress={confirmTime}><Text style={styles.pickerDone}>Done</Text></Pressable>
              </View>
              <View style={styles.wheelsRow}>
                <TimeWheelColumn data={HOURS_12} selected={pHour} onSelect={setPHour} />
                <View style={styles.wheelSeparator}><Text style={styles.sepText}>:</Text></View>
                <TimeWheelColumn data={MINUTES} selected={pMin} onSelect={setPMin} formatItem={pad2} />
                <TimeWheelColumn data={PERIODS} selected={pPer} onSelect={setPPer} />
              </View>
            </View>
          </View>
        )}

        {showDatePicker && Platform.OS === 'ios' && (
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}><View style={{ width: 60 }} /><Text style={styles.pickerTitle}>Set Birth Date</Text><Pressable onPress={() => setShowDatePicker(false)}><Text style={styles.pickerDone}>Done</Text></Pressable></View>
              <DateTimePicker value={date} mode="date" display="spinner" themeVariant="dark" onChange={onDateChange} maximumDate={new Date()} />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, color: PALETTE.textMain, fontWeight: '600', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  closeBtn: { width: 44, alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 },
  
  glassCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'rgba(255,255,255,0.02)' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: PALETTE.gold, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, marginTop: 16 },
  textInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, borderWidth: 1, borderColor: PALETTE.glassBorder, padding: 16, color: PALETTE.textMain, fontSize: 16 },
  
  pickButton: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  pickGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  pickText: { color: PALETTE.textMain, fontSize: 16, fontWeight: '500' },
  
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  toggleText: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
  
  inputContainer: { position: 'relative', marginTop: 4 },
  loader: { position: 'absolute', right: 16, top: 16 },
  suggestions: { marginTop: 8, backgroundColor: 'rgba(20, 24, 34, 0.95)', borderRadius: 14, borderWidth: 1, borderColor: PALETTE.glassBorder, overflow: 'hidden' },
  suggestion: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  suggestionText: { color: theme.textSecondary, fontSize: 14, flex: 1 },

  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 32, shadowColor: PALETTE.gold, shadowOpacity: 0.2, shadowRadius: 10 },
  saveGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#020817', fontSize: 17, fontWeight: '700', fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  privacyNote: { textAlign: 'center', color: theme.textMuted, fontSize: 12, marginTop: 16, fontStyle: 'italic' },

  confirmOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  confirmCard: { width: '100%', alignItems: 'center' },
  confirmTitle: { fontSize: 28, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 8 },
  confirmSub: { fontSize: 14, color: theme.textMuted, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  sealRows: { width: '100%', gap: 16, marginBottom: 20 },
  sealRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  sealLabel: { fontSize: 11, fontWeight: '700', color: PALETTE.gold, letterSpacing: 1.5 },
  sealValue: { fontSize: 16, color: PALETTE.textMain, fontWeight: '600' },
  backBtnText: { color: theme.textMuted, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  pickerContent: { backgroundColor: '#0D1117', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, borderWidth: 1, borderColor: PALETTE.glassBorder },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  pickerTitle: { color: PALETTE.textMain, fontSize: 16, fontWeight: '600' },
  pickerDone: { color: PALETTE.gold, fontSize: 16, fontWeight: '700' },
  pickerCancel: { color: theme.textMuted, fontSize: 16 },
  wheelsRow: { flexDirection: 'row', height: PICKER_HEIGHT, paddingHorizontal: 20 },
  wheelSeparator: { justifyContent: 'center', width: 12 },
  sepText: { color: PALETTE.textMain, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  pickerSelectorOverlay: { position: 'absolute', top: (PICKER_HEIGHT - ITEM_HEIGHT) / 2, left: 0, right: 0, height: ITEM_HEIGHT, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(232,214,174,0.25)', backgroundColor: 'rgba(232,214,174,0.05)', zIndex: 1 },
});
