// File: app/settings/notifications.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NotificationEngine } from '../../utils/NotificationEngine';
import { MetallicText } from '../../components/ui/MetallicText';

// ── Persistence keys ──────────────────────────────────────────────────────────
const KEYS = {
  enabled:        'notif_enabled',
  morningHour:    'notif_morning_hour',
  morningMinute:  'notif_morning_minute',
  eveningHour:    'notif_evening_hour',
  eveningMinute:  'notif_evening_minute',
  morningUnknown: 'notif_morning_unknown',
  eveningUnknown: 'notif_evening_unknown',
};

function makeTime(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NotificationSettings() {
  const router = useRouter();
  const [isRhythmEnabled, setIsRhythmEnabled] = useState(false);

  const [morningTime, setMorningTime] = useState(makeTime(8, 0));
  const [eveningTime, setEveningTime] = useState(makeTime(20, 0));
  const [morningUnknown, setMorningUnknown] = useState(false);
  const [eveningUnknown, setEveningUnknown] = useState(false);

  // iOS: which picker is currently expanded; also tracked as pending before confirmation
  const [activePicker, setActivePicker] = useState<'morning' | 'evening' | null>(null);
  const [pendingTime, setPendingTime] = useState<Date | null>(null);

  // ── Load persisted prefs on mount ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const [en, mh, mm, eh, em, mu, eu] = await Promise.all([
        SecureStore.getItemAsync(KEYS.enabled),
        SecureStore.getItemAsync(KEYS.morningHour),
        SecureStore.getItemAsync(KEYS.morningMinute),
        SecureStore.getItemAsync(KEYS.eveningHour),
        SecureStore.getItemAsync(KEYS.eveningMinute),
        SecureStore.getItemAsync(KEYS.morningUnknown),
        SecureStore.getItemAsync(KEYS.eveningUnknown),
      ]);
      setIsRhythmEnabled(en === 'true');
      if (mh !== null && mm !== null) setMorningTime(makeTime(Number(mh), Number(mm)));
      if (eh !== null && em !== null) setEveningTime(makeTime(Number(eh), Number(em)));
      if (mu !== null) setMorningUnknown(mu === 'true');
      if (eu !== null) setEveningUnknown(eu === 'true');
    };
    load();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const savePrefs = useCallback(async (
    mt: Date, et: Date, mu: boolean, eu: boolean,
  ) => {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.morningHour,    String(mt.getHours())),
      SecureStore.setItemAsync(KEYS.morningMinute,  String(mt.getMinutes())),
      SecureStore.setItemAsync(KEYS.eveningHour,    String(et.getHours())),
      SecureStore.setItemAsync(KEYS.eveningMinute,  String(et.getMinutes())),
      SecureStore.setItemAsync(KEYS.morningUnknown, String(mu)),
      SecureStore.setItemAsync(KEYS.eveningUnknown, String(eu)),
    ]);
  }, []);

  /** Cancel existing schedule and re-apply with current time prefs. */
  const reschedule = useCallback(async (
    mt: Date, et: Date, mu: boolean, eu: boolean,
  ) => {
    await NotificationEngine.clearAllSchedules();
    if (!mu) await NotificationEngine.scheduleMorningRhythm(mt.getHours(), mt.getMinutes());
    if (!eu) await NotificationEngine.scheduleEveningRhythm(et.getHours(), et.getMinutes());
    await Promise.all([
      savePrefs(mt, et, mu, eu),
      SecureStore.setItemAsync(KEYS.enabled, 'true'),
    ]);
  }, [savePrefs]);

  // ── Master toggle ──────────────────────────────────────────────────────────
  const toggleRhythm = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRhythmEnabled(value);
    if (value) {
      const hasPermission = await NotificationEngine.requestPermissions();
      if (!hasPermission) {
        setIsRhythmEnabled(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      await reschedule(morningTime, eveningTime, morningUnknown, eveningUnknown);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Promise.all([
        NotificationEngine.clearAllSchedules(),
        SecureStore.setItemAsync(KEYS.enabled, 'false'),
      ]);
    }
  };

  // ── Time picker callbacks ──────────────────────────────────────────────────
  const applyTime = useCallback(async (slot: 'morning' | 'evening', time: Date) => {
    if (slot === 'morning') {
      setMorningTime(time);
      if (isRhythmEnabled) await reschedule(time, eveningTime, morningUnknown, eveningUnknown);
      else await savePrefs(time, eveningTime, morningUnknown, eveningUnknown);
    } else {
      setEveningTime(time);
      if (isRhythmEnabled) await reschedule(morningTime, time, morningUnknown, eveningUnknown);
      else await savePrefs(morningTime, time, morningUnknown, eveningUnknown);
    }
  }, [isRhythmEnabled, morningTime, eveningTime, morningUnknown, eveningUnknown, reschedule, savePrefs]);

  const handlePickerChange = (
    slot: 'morning' | 'evening',
    event: DateTimePickerEvent,
    selected?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
      if (event.type === 'dismissed' || !selected) return;
      applyTime(slot, selected);
    } else {
      // iOS: accumulate changes; confirm on "Done"
      if (selected) setPendingTime(selected);
    }
  };

  const confirmIOSTime = async () => {
    const slot = activePicker;
    const time = pendingTime ?? (slot === 'morning' ? morningTime : eveningTime);
    setActivePicker(null);
    setPendingTime(null);
    if (!slot) return;
    Haptics.selectionAsync();
    await applyTime(slot, time);
  };

  const openPicker = (slot: 'morning' | 'evening') => {
    Haptics.selectionAsync();
    setPendingTime(slot === 'morning' ? morningTime : eveningTime);
    setActivePicker(prev => (prev === slot ? null : slot));
  };

  // ── Unknown-time toggle ────────────────────────────────────────────────────
  const toggleUnknown = async (slot: 'morning' | 'evening') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePicker(null);
    setPendingTime(null);
    const mu = slot === 'morning' ? !morningUnknown : morningUnknown;
    const eu = slot === 'evening' ? !eveningUnknown : eveningUnknown;
    if (slot === 'morning') setMorningUnknown(mu);
    else setEveningUnknown(eu);
    if (isRhythmEnabled) await reschedule(morningTime, eveningTime, mu, eu);
    else await savePrefs(morningTime, eveningTime, mu, eu);
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderSlot = (slot: 'morning' | 'evening') => {
    const isMorning = slot === 'morning';
    const time        = isMorning ? morningTime    : eveningTime;
    const unknown     = isMorning ? morningUnknown : eveningUnknown;
    const isOpen      = activePicker === slot;
    const pending     = isOpen ? (pendingTime ?? time) : time;

    return (
      <View style={[styles.card, !isRhythmEnabled && styles.cardDisabled]}>

        {/* Time row */}
        <View style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, unknown && styles.dimText]}>
              {isMorning ? 'Wake Prompt' : 'Evening Seal'}
            </Text>
            <Text style={styles.subtitle}>
              {isMorning ? 'Dream recall & rest log' : 'Mood, energy & stress markers'}
            </Text>
          </View>
          <Pressable
            style={[styles.timeBadge, (unknown || !isRhythmEnabled) && styles.timeBadgeDim]}
            onPress={() => !unknown && isRhythmEnabled && openPicker(slot)}
            disabled={unknown || !isRhythmEnabled}
          >
            {(unknown || !isRhythmEnabled) ? (
              <Text style={[styles.timeText, styles.dimText]}>
                {unknown ? '—' : formatTime(time)}
              </Text>
            ) : (
              <MetallicText color="#D9BF8C" style={styles.timeText}>
                {formatTime(time)}
              </MetallicText>
            )}
          </Pressable>
        </View>

        {/* Inline/modal picker */}
        {isOpen && (
          <View>
            <DateTimePicker
              value={pending}
              mode="time"
              display={Platform.OS === 'android' ? 'default' : 'spinner'}
              onChange={(e, d) => handlePickerChange(slot, e, d)}
              textColor="#FFFFFF"
              themeVariant="dark"
              style={Platform.OS === 'ios' ? styles.picker : undefined}
            />
            {Platform.OS === 'ios' && (
              <Pressable style={styles.doneButton} onPress={confirmIOSTime}>
                <MetallicText color="#D9BF8C" style={styles.doneText}>Done</MetallicText>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Unknown time option */}
        <Pressable style={styles.unknownRow} onPress={() => toggleUnknown(slot)}>
          <View style={[styles.checkbox, unknown && styles.checkboxActive]}>
            {unknown && <MetallicText color="#D9BF8C" style={styles.checkmark}>✓</MetallicText>}
          </View>
          <Text style={styles.unknownLabel}>
            {isMorning ? "I don't know my wake time" : "I don't know my evening routine"}
          </Text>
        </Pressable>
      </View>
    );
  };

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      <View style={styles.header}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); router.back(); }}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Daily Rhythm</Text>

        {/* Master enable toggle */}
        <Text style={styles.sectionLabel}>LOCAL TRIGGERS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Enable Check-in Prompts</Text>
              <Text style={styles.subtitle}>
                Schedule local reminders directly on this device.
              </Text>
            </View>
            <Switch
              value={isRhythmEnabled}
              onValueChange={toggleRhythm}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#D9BF8C' }}
              thumbColor={isRhythmEnabled ? '#050507' : '#FFF'}
              ios_backgroundColor="rgba(255,255,255,0.1)"
            />
          </View>
        </View>

        {/* Morning slot */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>MORNING · SUBCONSCIOUS RECALL</Text>
        {renderSlot('morning')}

        {/* Evening slot */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>EVENING · INTERNAL WEATHER</Text>
        {renderSlot('evening')}

        <Text style={styles.privacyNote}>
          All prompts are scheduled directly on your device's hardware. We do not use
          external servers to track your activity or send push notifications.
        </Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  ambientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backArrow: { color: '#FFF', fontSize: 36, fontWeight: '300', lineHeight: 40 },
  headerTitle: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },

  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 8,
  },

  card: { borderRadius: 24, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)' },
  cardDisabled: { opacity: 0.45 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textContainer: { flex: 1, paddingRight: 16 },
  title: { fontSize: 16, color: '#FFF', fontWeight: '500', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  dimText: { color: 'rgba(255,255,255,0.25)' },

  timeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(217,191,140,0.35)',
    backgroundColor: 'rgba(217,191,140,0.07)',
  },
  timeBadgeDim: {
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
  },
  timeText: { fontSize: 15, color: '#FFFFFF', fontWeight: '500', letterSpacing: 0.5 },

  picker: { marginTop: 8 },
  doneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(217,191,140,0.12)',
  },
  doneText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 16 },

  unknownRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: '#D9BF8C',
    backgroundColor: 'rgba(217,191,140,0.15)',
  },
  checkmark: { fontSize: 12, color: '#C9AE78', lineHeight: 14 },
  unknownLabel: { fontSize: 13, color: 'rgba(255,255,255,0.45)', flex: 1 },

  privacyNote: {
    marginTop: 28,
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
});
