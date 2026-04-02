// app/core-values.tsx
// MySky — Core Values Inventory
// Users select values that resonate and mark their top 5.
// All data stored locally via AsyncStorage.

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';

const STORAGE_KEY = '@mysky:core_values';
const MAX_TOP = 5;

const PALETTE = {
  gold: '#D9BF8C',
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  textMain: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#020817',
};

const ALL_VALUES = [
  'Autonomy',    'Creativity',   'Connection',  'Growth',
  'Security',    'Adventure',    'Honesty',     'Loyalty',
  'Achievement', 'Compassion',   'Solitude',    'Freedom',
  'Purpose',     'Play',         'Stability',   'Courage',
  'Integrity',   'Curiosity',    'Presence',    'Balance',
];

// --- The Paradox Engine ---
// Maps known psychological tensions between values
const VALUE_PARADOXES = [
  { pair: ['Security', 'Adventure'], name: "The Explorer's Paradox", desc: "A deep pull between the need for a safe harbor and the call of the unknown." },
  { pair: ['Autonomy', 'Connection'], name: "The Intimacy Paradox", desc: "Balancing the fierce need for independence with the profound desire to belong." },
  { pair: ['Stability', 'Growth'], name: "The Evolution Paradox", desc: "The tension between preserving the foundation you've built and dismantling it to evolve." },
  { pair: ['Achievement', 'Play'], name: "The Presence Paradox", desc: "Striving tirelessly for future goals while trying to remain joyful in the current moment." },
  { pair: ['Honesty', 'Compassion'], name: "The Truth Paradox", desc: "Navigating the razor edge between radical candor and protecting the feelings of those you love." },
  { pair: ['Solitude', 'Connection'], name: "The Hermit's Paradox", desc: "Recharging in isolation while craving the warmth of being deeply seen by others." },
];

interface State {
  selected: string[];
  topFive: string[];
}

export default function CoreValuesScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ selected: [], topFive: [] });
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            setState(parsed);
            // Do NOT auto-seal on load — seal state only set by explicit user action
          } catch {}
        }
      });
    }, []),
  );

  const toggleSelected = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setState((prev) => {
      const isSelected = prev.selected.includes(value);
      const newSelected = isSelected
        ? prev.selected.filter((v) => v !== value)
        : [...prev.selected, value];
      const newTopFive = prev.topFive.filter((v) => newSelected.includes(v));
      return { selected: newSelected, topFive: newTopFive };
    });
    setSaved(false);
  };

  const toggleTop = (value: string) => {
    if (!state.selected.includes(value)) return;
    
    setState((prev) => {
      const isTop = prev.topFive.includes(value);
      if (isTop) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        return { ...prev, topFive: prev.topFive.filter((v) => v !== value) };
      }
      if (prev.topFive.length >= MAX_TOP) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return prev;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return { ...prev, topFive: [...prev.topFive, value] };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSaved(true);
    } catch {
      Alert.alert('Error', 'Could not save. Please try again.');
    }
  };

  // Find active paradoxes based on Top 5 values
  const activeParadoxes = useMemo(() => {
    return VALUE_PARADOXES.filter(p => 
      state.topFive.includes(p.pair[0]) && state.topFive.includes(p.pair[1])
    );
  }, [state.topFive]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient colors={['rgba(217, 191, 140, 0.08)', 'transparent']} style={styles.topGlow} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); router.back(); }}
          >
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Core Values</Text>
          <GoldSubtitle style={styles.headerSubtitle}>The architecture of your choices</GoldSubtitle>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <Animated.View entering={FadeInDown.delay(140).duration(600)}>
            <Text style={styles.sectionLabel}>TAP TO SELECT · HOLD TO MARK TOP 5</Text>
          </Animated.View>

          {/* Value Cloud */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.chipsWrap}>
            {ALL_VALUES.map((value) => {
              const isSelected = state.selected.includes(value);
              const isTop = state.topFive.includes(value);
              return (
                <Pressable
                  key={value}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                    isTop && styles.chipTop,
                  ]}
                  onPress={() => toggleSelected(value)}
                  onLongPress={() => toggleTop(value)}
                >
                  {isTop && <Ionicons name="star-outline" size={10} color={PALETTE.bg} style={{ marginRight: 6 }} />}
                  {isTop ? (
                    <Text style={[styles.chipText, styles.chipTextTop]}>{value}</Text>
                  ) : isSelected ? (
                    <MetallicText style={styles.chipText} color={PALETTE.gold}>{value}</MetallicText>
                  ) : (
                    <Text style={styles.chipText}>{value}</Text>
                  )}
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Top 5 North Star Summary */}
          {state.topFive.length > 0 && (
            <Animated.View layout={Layout.springify()} entering={FadeInDown.duration(400)}>
              <LinearGradient colors={['rgba(217,191,140,0.15)', 'rgba(10,10,12,0.85)']} style={styles.summaryCard}>
              
              <View style={styles.summaryHeaderRow}>
                <MetallicIcon name="compass-outline" size={18} color={PALETTE.gold} />
                <MetallicText style={styles.summaryTitle} color={PALETTE.gold}>YOUR NORTH STAR ({state.topFive.length}/{MAX_TOP})</MetallicText>
              </View>

              <View style={styles.topList}>
                {state.topFive.map((v, i) => (
                  <Animated.View key={v} layout={Layout.springify()} style={styles.topItemRow}>
                    <View style={styles.topNumberBadge}>
                      <MetallicText style={styles.topNumberText} color={PALETTE.gold}>{i + 1}</MetallicText>
                    </View>
                    <Text style={styles.topItemText}>{v}</Text>
                  </Animated.View>
                ))}
              </View>
              
              {state.topFive.length < MAX_TOP && (
                <Text style={styles.summaryHint}>Long-press a selected value to elevate it to your Top 5.</Text>
              )}
              </LinearGradient>
            </Animated.View>
          )}

          {/* The Paradox Engine Insight */}
          {activeParadoxes.map((paradox, index) => (
            <Animated.View key={paradox.name} layout={Layout.springify()} entering={FadeIn.delay(index * 150).duration(600)}>
              <View style={styles.paradoxCard}>
              <View style={styles.paradoxHeader}>
                <MetallicIcon name="git-compare-outline" size={16} color={PALETTE.copper} />
                <MetallicText style={styles.paradoxEyebrow} color={PALETTE.copper}>CORE PARADOX DETECTED</MetallicText>
              </View>
              <Text style={styles.paradoxTitle}>{paradox.name}</Text>
              <Text style={styles.paradoxBody}>{paradox.desc}</Text>
              <Text style={styles.paradoxFooter}>
                When making decisions, notice which of these two values you are sacrificing. Growth lives in balancing this tension.
              </Text>
              </View>
            </Animated.View>
          ))}

          {/* Generic Reflection (if no paradoxes exist yet but they have selected values) */}
          {state.selected.length >= 3 && activeParadoxes.length === 0 && (
            <Animated.View layout={Layout.springify()} entering={FadeInDown.duration(400)} style={styles.promptCard}>
              <Text style={styles.promptText}>
                When two values you hold pull in opposite directions, that's where your most difficult—and important—decisions live.
              </Text>
            </Animated.View>
          )}

          {/* Save Button */}
          {state.topFive.length > 0 && (
            <Animated.View layout={Layout.springify()} entering={FadeInDown.delay(200).duration(600)} style={styles.saveRow}>
              <Pressable
                style={[styles.saveBtn, saved && styles.saveBtnDone]}
                onPress={handleSave}
                onLongPress={() => {
                  if (saved) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    setSaved(false);
                  }
                }}
              >
                <LinearGradient
                  colors={saved ? ['rgba(140,190,170,0.3)', 'rgba(140,190,170,0.1)'] : ['rgba(217,191,140,0.3)', 'rgba(217,191,140,0.1)']}
                  style={StyleSheet.absoluteFill}
                />
                <MetallicText style={styles.saveBtnText} color={saved ? '#8CBEAA' : PALETTE.gold}>
                  {saved ? '✓ Values Sealed · Hold to Edit' : 'Seal My Values'}
                </MetallicText>
              </Pressable>
            </Animated.View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  safeArea: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 340 },

  header:      { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 8 },
  titleArea:   { paddingHorizontal: 24, paddingBottom: 8 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  closeIcon:   { color: '#FFF', fontSize: 24, lineHeight: 28 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },
  headerTitle: { fontSize: 34, color: PALETTE.textMain, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 14 },

  sectionLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, fontWeight: '800', marginBottom: 16 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'rgba(255,255,255,0.03)' },
  chipSelected: { borderColor: 'rgba(217,191,140,0.4)', backgroundColor: 'rgba(217,191,140,0.1)' },
  chipTop: { borderColor: PALETTE.gold, backgroundColor: PALETTE.gold },
  chipText: { fontSize: 12, color: PALETTE.textMuted, fontWeight: '500' },
  chipTextSelected: { color: PALETTE.gold, fontWeight: '600' },
  chipTextTop: { color: PALETTE.bg, fontWeight: '800' },

  summaryCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(217,191,140,0.3)', padding: 28, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.02)' },
  summaryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  summaryTitle: { fontSize: 11, color: PALETTE.gold, fontWeight: '800', letterSpacing: 1.5 },
  
  topList: { gap: 12 },
  topItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  topNumberBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(217,191,140,0.2)', justifyContent: 'center', alignItems: 'center' },
  topNumberText: { color: PALETTE.gold, fontSize: 11, fontWeight: '800' },
  topItemText: { fontSize: 16, color: PALETTE.textMain, fontWeight: '600' },
  
  summaryHint: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 20, textAlign: 'center' },

  // Paradox Engine Cards
  paradoxCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(205, 127, 93, 0.3)', padding: 28, marginBottom: 20, backgroundColor: 'rgba(205, 127, 93, 0.05)' },
  paradoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  paradoxEyebrow: { fontSize: 10, color: PALETTE.copper, fontWeight: '800', letterSpacing: 1.5 },
  paradoxTitle: { fontSize: 20, color: PALETTE.textMain, fontWeight: '700', marginBottom: 10 },
  paradoxBody: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginBottom: 16 },
  paradoxFooter: { fontSize: 12, color: PALETTE.textMuted, lineHeight: 18, borderTopWidth: 1, borderTopColor: 'rgba(205, 127, 93, 0.2)', paddingTop: 16 },

  promptCard: { borderRadius: 24, padding: 28, marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: PALETTE.glassBorder },
  promptText: { fontSize: 13, color: PALETTE.textMuted, lineHeight: 20, textAlign: 'center' },

  saveRow: { alignItems: 'center', marginTop: 12 },
  saveBtn: { height: 52, paddingHorizontal: 44, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(217,191,140,0.5)', justifyContent: 'center', alignItems: 'center' },
  saveBtnDone: { borderColor: 'rgba(140,190,170,0.4)' },
  saveBtnText: { fontSize: 14, color: PALETTE.gold, fontWeight: '800', letterSpacing: 0.5 },
});
