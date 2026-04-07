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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/core';
import { EncryptedAsyncStorage } from '../services/storage/encryptedAsyncStorage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';

import { SkiaDynamicCosmos } from '../components/ui/SkiaDynamicCosmos';
import { GoldSubtitle } from '../components/ui/GoldSubtitle';
import { MetallicText } from '../components/ui/MetallicText';
import { MetallicIcon } from '../components/ui/MetallicIcon';
import {
  loadReflections,
  loadReflectionDrafts,
  ReflectionAnswer,
  ReflectionDraftAnswer,
} from '../services/insights/dailyReflectionService';
import {
  VALUES_THEME_MAP,
  syncCoreValuesFromReflections,
} from '../services/insights/reflectionProfileSync';

const STORAGE_KEY = '@mysky:core_values';
const MAX_TOP = 5;
const DYNAMIC_MAP_WINDOW_DAYS = 21;
const MAP_TOP_ANCHOR_WEIGHTS = [4.6, 4.1, 3.6, 3.1, 2.6];
const MAP_SELECTED_WEIGHT = 0.35;

const PALETTE = {
  gold: '#D9BF8C',
  silverBlue: '#C9AE78',
  copper: '#CD7F5D',
  textMain: '#FFFFFF',
  textMuted: 'rgba(226,232,240,0.45)',
  glassBorder: 'rgba(255,255,255,0.08)',
  bg: '#020817',
};

const ALL_VALUES = [
  'Autonomy',    'Creativity',   'Connection',  'Growth',
  'Security',    'Adventure',    'Honesty',     'Loyalty',
  'Achievement', 'Compassion',   'Solitude',    'Freedom',
  'Purpose',     'Play',         'Stability',   'Courage',
  'Integrity',   'Curiosity',    'Presence',    'Balance',
  'Wisdom',      'Service',      'Family',      'Nature',
  'Justice',     'Excellence',   'Belonging',   'Expression',
  'Mastery',     'Health',       'Simplicity',  'Leadership',
  'Humor',       'Abundance',    'Faith',
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
  { pair: ['Excellence', 'Simplicity'], name: "The Perfection Paradox", desc: "The relentless drive to be exceptional while longing for an uncomplicated, unencumbered life." },
  { pair: ['Leadership', 'Belonging'], name: "The Authority Paradox", desc: "Stepping into a role that sets you apart from the very community you want to belong to." },
  { pair: ['Mastery', 'Humor'], name: "The Lightness Paradox", desc: "The pull between taking your craft with total seriousness and not taking life too seriously at all." },
  { pair: ['Freedom', 'Family'], name: "The Roots Paradox", desc: "The longing for open horizons in tension with the pull of belonging to something rooted and permanent." },
];

interface State {
  selected: string[];
  topFive: string[];
  customValues?: string[];
}

type ValueReflectionAnswer = ReflectionAnswer | ReflectionDraftAnswer;

function buildReflectionAnswerKey(
  answer: Pick<ValueReflectionAnswer, 'category' | 'date' | 'questionId'>,
): string {
  return `${answer.date}:${answer.category}:${answer.questionId}`;
}

function mergeValueReflectionAnswers(
  sealedAnswers: ReflectionAnswer[],
  draftAnswers: ReflectionDraftAnswer[],
): ValueReflectionAnswer[] {
  const merged = new Map<string, ValueReflectionAnswer>();

  for (const answer of sealedAnswers) {
    if (answer.category !== 'values') continue;
    merged.set(buildReflectionAnswerKey(answer), answer);
  }

  for (const answer of draftAnswers) {
    if (answer.category !== 'values') continue;
    merged.set(buildReflectionAnswerKey(answer), answer);
  }

  return [...merged.values()];
}

function getDaysAgo(dateKey: string, now = new Date()): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return DYNAMIC_MAP_WINDOW_DAYS + 1;

  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const answerDay = new Date(year, month - 1, day);
  const diffMs = currentDay.getTime() - answerDay.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

function buildDynamicMapValues(
  allValues: string[],
  selected: string[],
  topFive: string[],
  answers: ValueReflectionAnswer[],
): string[] {
  const scoreByValue = new Map<string, number>();

  for (const value of allValues) {
    let score = selected.includes(value) ? MAP_SELECTED_WEIGHT : 0;
    const topIndex = topFive.indexOf(value);
    if (topIndex >= 0) {
      score += MAP_TOP_ANCHOR_WEIGHTS[topIndex] ?? MAP_TOP_ANCHOR_WEIGHTS[MAP_TOP_ANCHOR_WEIGHTS.length - 1];
    }
    scoreByValue.set(value, score);
  }

  for (const answer of answers) {
    const daysAgo = getDaysAgo(answer.date);
    if (daysAgo > DYNAMIC_MAP_WINDOW_DAYS) continue;

    const theme = VALUES_THEME_MAP.find(
      ({ range }) => answer.questionId >= range[0] && answer.questionId <= range[1],
    );
    if (!theme) continue;

    const intensity = (answer.scaleValue ?? 0) / 3;
    if (intensity <= 0) continue;

    const recencyWeight = 0.35 + 0.65 * ((DYNAMIC_MAP_WINDOW_DAYS - daysAgo + 1) / (DYNAMIC_MAP_WINDOW_DAYS + 1));
    const contribution = (intensity * recencyWeight) / theme.values.length;

    for (const value of theme.values) {
      scoreByValue.set(value, (scoreByValue.get(value) ?? 0) + contribution);
    }
  }

  return allValues
    .map((value, baseIndex) => ({
      value,
      score: scoreByValue.get(value) ?? 0,
      topIndex: topFive.indexOf(value),
      selectedIndex: selected.indexOf(value),
      baseIndex,
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;

      const leftTopIndex = left.topIndex >= 0 ? left.topIndex : Number.MAX_SAFE_INTEGER;
      const rightTopIndex = right.topIndex >= 0 ? right.topIndex : Number.MAX_SAFE_INTEGER;
      if (leftTopIndex !== rightTopIndex) return leftTopIndex - rightTopIndex;

      const leftSelectedIndex = left.selectedIndex >= 0 ? left.selectedIndex : Number.MAX_SAFE_INTEGER;
      const rightSelectedIndex = right.selectedIndex >= 0 ? right.selectedIndex : Number.MAX_SAFE_INTEGER;
      if (leftSelectedIndex !== rightSelectedIndex) return leftSelectedIndex - rightSelectedIndex;

      return left.baseIndex - right.baseIndex;
    })
    .slice(0, MAX_TOP)
    .map((entry) => entry.value);
}

const CoreValuesConstellation = ({
  mapValues,
  activeParadoxes,
}: {
  mapValues: string[];
  activeParadoxes: typeof VALUE_PARADOXES;
}) => {
  const size = 280;
  const center = size / 2;
  const orbitRadius = 96;
  const ringCount = 3;
  const slotCount = Math.max(mapValues.length, MAX_TOP);

  const points = mapValues.map((value, index) => {
    const angle = (Math.PI * 2 * index) / slotCount - Math.PI / 2;
    const x = center + Math.cos(angle) * orbitRadius;
    const y = center + Math.sin(angle) * orbitRadius;
    const labelX = center + Math.cos(angle) * (orbitRadius + 28);
    const labelY = center + Math.sin(angle) * (orbitRadius + 28);

    return {
      value,
      rank: index + 1,
      x,
      y,
      labelX,
      labelY,
      textAnchor: (labelX > center + 10 ? 'start' : labelX < center - 10 ? 'end' : 'middle') as 'start' | 'middle' | 'end',
    };
  });

  const pointMap = new Map(points.map(point => [point.value, point]));
  const paradoxLines = activeParadoxes
    .map(paradox => {
      const start = pointMap.get(paradox.pair[0]);
      const end = pointMap.get(paradox.pair[1]);
      if (!start || !end) return null;
      return { key: paradox.name, start, end };
    })
    .filter((line): line is { key: string; start: (typeof points)[number]; end: (typeof points)[number] } => Boolean(line));

  return (
    <View style={styles.constellationCard}>
      <View style={styles.constellationHeader}>
        <MetallicIcon name="analytics-outline" size={18} color={PALETTE.gold} />
        <MetallicText style={styles.constellationTitle} color={PALETTE.gold}>VALUES MAP</MetallicText>
      </View>

      <View style={styles.constellationFrame}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgLinearGradient id="constellationGlow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="rgba(217,191,140,0.34)" />
              <Stop offset="1" stopColor="rgba(140,190,170,0.2)" />
            </SvgLinearGradient>
          </Defs>

          {Array.from({ length: ringCount }).map((_, index) => (
            <Circle
              key={index}
              cx={center}
              cy={center}
              r={32 + index * 26}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />
          ))}

          {points.map(point => (
            <Line
              key={`axis-${point.value}`}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          ))}

          {paradoxLines.map(line => (
            <Line
              key={line.key}
              x1={line.start.x}
              y1={line.start.y}
              x2={line.end.x}
              y2={line.end.y}
              stroke="rgba(205,127,93,0.75)"
              strokeWidth="2"
            />
          ))}

          <Circle cx={center} cy={center} r={26} fill="rgba(255,255,255,0.05)" stroke="rgba(217,191,140,0.18)" strokeWidth="1" />
          <SvgText x={center} y={center - 2} fontSize="8" fontWeight="800" fill="rgba(255,255,255,0.68)" textAnchor="middle">
            NORTH
          </SvgText>
          <SvgText x={center} y={center + 10} fontSize="8" fontWeight="800" fill="rgba(255,255,255,0.68)" textAnchor="middle">
            STAR
          </SvgText>

          {points.map(point => (
            <React.Fragment key={point.value}>
              <Circle cx={point.x} cy={point.y} r={15 - (point.rank - 1)} fill="url(#constellationGlow)" stroke="rgba(217,191,140,0.9)" strokeWidth="1.2" />
              <SvgText x={point.x} y={point.y + 3} fontSize="10" fontWeight="800" fill={PALETTE.bg} textAnchor="middle">
                {String(point.rank)}
              </SvgText>
              <SvgText
                x={point.labelX}
                y={point.labelY}
                fontSize="10"
                fontWeight="700"
                fill="rgba(255,255,255,0.88)"
                textAnchor={point.textAnchor}
              >
                {point.value.toUpperCase()}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </View>

      <Text style={styles.constellationHint}>
        Your sealed North Star anchors the map, and recent values reflections can subtly shift it day to day. Copper links mark active paradoxes currently pulling against each other.
      </Text>
    </View>
  );
};

export default function CoreValuesScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ selected: [], topFive: [] });
  const [saved, setSaved] = useState(false);
  const [valueReflectionAnswers, setValueReflectionAnswers] = useState<ValueReflectionAnswer[]>([]);
  const [customValueInput, setCustomValueInput] = useState('');
  const [showCustomValueInput, setShowCustomValueInput] = useState(false);
  const [editingCustomValue, setEditingCustomValue] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      syncCoreValuesFromReflections({ includeDrafts: true })
        .catch(() => {})
        .then(() => EncryptedAsyncStorage.getItem(STORAGE_KEY))
        .then((raw) => {
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as Partial<State>;
              setState({
                selected: Array.isArray(parsed.selected) ? parsed.selected : [],
                topFive: Array.isArray(parsed.topFive) ? parsed.topFive.slice(0, MAX_TOP) : [],
                customValues: Array.isArray(parsed.customValues) ? parsed.customValues : [],
              });
              setSaved(true);
            } catch {
              setState({ selected: [], topFive: [], customValues: [] });
              setSaved(false);
            }
            return;
          }
          setState({ selected: [], topFive: [], customValues: [] });
          setSaved(false);
        });

      Promise.all([loadReflections(), loadReflectionDrafts()]).then(([reflData, draftAnswers]) => {
        const mergedValueAnswers = mergeValueReflectionAnswers(reflData.answers, draftAnswers);
        setValueReflectionAnswers(mergedValueAnswers);
      }).catch(() => {});
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

  const closeCustomValueComposer = () => {
    setCustomValueInput('');
    setShowCustomValueInput(false);
    setEditingCustomValue(null);
  };

  const saveCustomValue = () => {
    const trimmed = customValueInput.trim();
    if (!trimmed) return;

    setState((prev) => {
      const customValues = prev.customValues ?? [];
      const normalized = trimmed.toLowerCase();
      const duplicate = customValues.find((value) => value !== editingCustomValue && value.trim().toLowerCase() === normalized);
      if (duplicate) return prev;

      const nextCustomValues = editingCustomValue
        ? customValues.map((value) => (value === editingCustomValue ? trimmed : value))
        : [...customValues, trimmed];

      const nextSelected = editingCustomValue
        ? prev.selected.map((value) => (value === editingCustomValue ? trimmed : value))
        : (prev.selected.includes(trimmed) ? prev.selected : [...prev.selected, trimmed]);

      const nextTopFive = editingCustomValue
        ? prev.topFive.map((value) => (value === editingCustomValue ? trimmed : value))
        : prev.topFive;

      return {
        ...prev,
        customValues: nextCustomValues,
        selected: nextSelected,
        topFive: nextTopFive,
      };
    });

    closeCustomValueComposer();
    setSaved(false);
  };

  const promptCustomValueAction = (value: string) => {
    const isTop = state.topFive.includes(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert('Custom Value', `Manage "${value}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: isTop ? 'Remove From Top 5' : 'Mark Top 5',
        onPress: () => toggleTop(value),
      },
      {
        text: 'Edit',
        onPress: () => {
          setCustomValueInput(value);
          setShowCustomValueInput(true);
          setEditingCustomValue(value);
        },
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setState((prev) => ({
            ...prev,
            customValues: (prev.customValues ?? []).filter((candidate) => candidate !== value),
            selected: prev.selected.filter((candidate) => candidate !== value),
            topFive: prev.topFive.filter((candidate) => candidate !== value),
          }));
          if (editingCustomValue === value) closeCustomValueComposer();
          setSaved(false);
        },
      },
    ]);
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
      await EncryptedAsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSaved(true);
    } catch {
      Alert.alert('Error', 'Could not save. Please try again.');
    }
  };

  const handleClose = () => {
    Haptics.selectionAsync().catch(() => {});
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/inner-world');
  };

  // Find active paradoxes based on Top 5 values
  const allValueOptions = useMemo(() => {
    const customValues = state.customValues ?? [];
    return [...ALL_VALUES, ...customValues.filter((value) => !ALL_VALUES.includes(value))];
  }, [state.customValues]);

  const mapValues = useMemo(() => {
    return buildDynamicMapValues(allValueOptions, state.selected, state.topFive, valueReflectionAnswers);
  }, [allValueOptions, state.selected, state.topFive, valueReflectionAnswers]);

  const activeParadoxes = useMemo(() => {
    return VALUE_PARADOXES.filter(p => 
      mapValues.includes(p.pair[0]) && mapValues.includes(p.pair[1])
    );
  }, [mapValues]);

  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />
      <LinearGradient colors={['rgba(217, 191, 140, 0.08)', 'transparent']} style={styles.topGlow} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={styles.closeIcon}>×</Text>
          </Pressable>
        </View>

        <View style={styles.titleArea}>
          <Text style={styles.headerTitle}>Core Values</Text>
          <GoldSubtitle style={styles.headerSubtitle}>The architecture of your choices</GoldSubtitle>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {state.topFive.length > 0 && (
            <Animated.View layout={Layout.springify()} entering={FadeInDown.delay(80).duration(500)}>
              <CoreValuesConstellation mapValues={mapValues} activeParadoxes={activeParadoxes} />
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(140).duration(600)}>
            <Text style={styles.sectionLabel}>TAP TO SELECT · HOLD BUILT-INS TO MARK TOP 5 · HOLD CUSTOM VALUES TO MANAGE</Text>
          </Animated.View>

          {/* Value Cloud */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.chipsWrap}>
            {allValueOptions.map((value) => {
              const isSelected = state.selected.includes(value);
              const isTop = state.topFive.includes(value);
              const isCustom = (state.customValues ?? []).includes(value);
              return (
                <Pressable
                  key={value}
                  style={[
                    styles.chip,
                    isCustom && styles.customChip,
                    isSelected && styles.chipSelected,
                    isTop && styles.chipTop,
                  ]}
                  onPress={() => toggleSelected(value)}
                  onLongPress={() => {
                    if (isCustom) {
                      promptCustomValueAction(value);
                      return;
                    }
                    toggleTop(value);
                  }}
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
            {showCustomValueInput ? (
              <View style={styles.customComposer}>
                <TextInput
                  style={styles.customComposerInput}
                  value={customValueInput}
                  onChangeText={setCustomValueInput}
                  placeholder="Type your own value..."
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  autoFocus
                  maxLength={40}
                  returnKeyType="done"
                  onSubmitEditing={saveCustomValue}
                />
                <Pressable hitSlop={8} onPress={() => {
                  if (customValueInput.trim()) saveCustomValue();
                  else closeCustomValueComposer();
                }}>
                  <Ionicons name={customValueInput.trim() ? 'checkmark-circle' : 'close-circle'} size={18} color={customValueInput.trim() ? PALETTE.gold : 'rgba(255,255,255,0.3)'} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.chip, styles.customChip, styles.addCustomChip]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowCustomValueInput(true);
                  setCustomValueInput('');
                  setEditingCustomValue(null);
                }}
              >
                <Ionicons name="add-outline" size={14} color={PALETTE.gold} style={{ marginRight: 6 }} />
                <MetallicText style={styles.chipText} color={PALETTE.gold}>Custom value</MetallicText>
              </Pressable>
            )}
          </Animated.View>

          {/* Top 5 North Star Summary */}
          {mapValues.length > 0 && (
            <Animated.View layout={Layout.springify()} entering={FadeInDown.duration(400)}>
              <LinearGradient colors={['rgba(217,191,140,0.15)', 'rgba(10,10,12,0.85)']} style={styles.summaryCard}>
              
              <View style={styles.summaryHeaderRow}>
                <MetallicIcon name="compass-outline" size={18} color={PALETTE.gold} />
                <MetallicText style={styles.summaryTitle} color={PALETTE.gold}>LIVE VALUES RANKING ({mapValues.length}/{MAX_TOP})</MetallicText>
              </View>

              <View style={styles.topList}>
                {mapValues.map((v, i) => (
                  <Animated.View key={v} layout={Layout.springify()} style={styles.topItemRow}>
                    <View style={styles.topNumberBadge}>
                      <MetallicText style={styles.topNumberText} color={PALETTE.gold}>{i + 1}</MetallicText>
                    </View>
                    <Text style={styles.topItemText}>{v}</Text>
                  </Animated.View>
                ))}
              </View>
              
              {state.topFive.length < MAX_TOP ? (
                <Text style={styles.summaryHint}>Long-press selected values to strengthen your sealed North Star. Daily reflections can still shift the live ranking.</Text>
              ) : (
                <Text style={styles.summaryHint}>Your sealed North Star anchors this list, while recent reflections can move the live order day to day.</Text>
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

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Sticky bottom seal button */}
        {state.topFive.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.sealBar}>
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
  customChip: { borderStyle: 'dashed' },
  addCustomChip: { borderColor: 'rgba(217,191,140,0.28)' },
  chipSelected: { borderColor: 'rgba(217,191,140,0.4)', backgroundColor: 'rgba(217,191,140,0.1)' },
  chipTop: { borderColor: PALETTE.gold, backgroundColor: PALETTE.gold },
  chipText: { fontSize: 12, color: PALETTE.textMuted, fontWeight: '500' },
  chipTextSelected: { color: PALETTE.gold, fontWeight: '600' },
  chipTextTop: { color: PALETTE.bg, fontWeight: '800' },
  customComposer: {
    minWidth: 210,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  customComposerInput: { minWidth: 150, flex: 1, color: PALETTE.textMain, fontSize: 12, paddingVertical: 0 },

  summaryCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(217,191,140,0.3)', padding: 28, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.02)' },
  summaryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  summaryTitle: { fontSize: 11, color: PALETTE.gold, fontWeight: '800', letterSpacing: 1.5 },
  
  topList: { gap: 12 },
  topItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  topNumberBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(217,191,140,0.2)', justifyContent: 'center', alignItems: 'center' },
  topNumberText: { color: PALETTE.gold, fontSize: 11, fontWeight: '800' },
  topItemText: { fontSize: 16, color: PALETTE.textMain, fontWeight: '600' },
  
  summaryHint: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 20, textAlign: 'center' },

  constellationCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(217,191,140,0.2)',
    padding: 24,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  constellationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  constellationTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  constellationFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(4,11,24,0.8)',
    paddingVertical: 12,
    marginBottom: 14,
  },
  constellationHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
    textAlign: 'center',
  },

  // Paradox Engine Cards
  paradoxCard: { borderRadius: 24, borderWidth: 1, borderColor: 'rgba(205, 127, 93, 0.3)', padding: 28, marginBottom: 20, backgroundColor: 'rgba(205, 127, 93, 0.05)' },
  paradoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  paradoxEyebrow: { fontSize: 10, color: PALETTE.copper, fontWeight: '800', letterSpacing: 1.5 },
  paradoxTitle: { fontSize: 20, color: PALETTE.textMain, fontWeight: '700', marginBottom: 10 },
  paradoxBody: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginBottom: 16 },
  paradoxFooter: { fontSize: 12, color: PALETTE.textMuted, lineHeight: 18, borderTopWidth: 1, borderTopColor: 'rgba(205, 127, 93, 0.2)', paddingTop: 16 },

  promptCard: { borderRadius: 24, padding: 28, marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: PALETTE.glassBorder },
  promptText: { fontSize: 13, color: PALETTE.textMuted, lineHeight: 20, textAlign: 'center' },

  sealBar: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(2,8,23,0.95)' },
  saveBtn: { height: 52, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(217,191,140,0.5)', justifyContent: 'center', alignItems: 'center' },
  saveBtnDone: { borderColor: 'rgba(140,190,170,0.4)' },
  saveBtnText: { fontSize: 14, color: PALETTE.gold, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
});
