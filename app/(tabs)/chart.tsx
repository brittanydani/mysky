import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import NatalChartWheel from '../../components/ui/NatalChartWheel';
import { localDb } from '../../services/storage/localDb';
import { NatalChart, PlanetPlacement, Aspect, HouseCusp } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { ChartDisplayManager } from '../../services/astrology/chartDisplayManager';
import { HOUSE_MEANINGS } from '../../services/astrology/constants';
import { detectChartPatterns, ChartPatterns } from '../../services/astrology/chartPatterns';
import { getChironInsightFromChart, ChironInsight } from '../../services/journal/chiron';
import { getNodeInsight, NodeInsight } from '../../services/journal/nodes';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import { parseLocalDate } from '../../utils/dateUtils';

// ── Colors per element ──
const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#E07A7A',
  Earth: '#6EBF8B',
  Air: '#8BC4E8',
  Water: '#7A8BE0',
};

// ── Aspect nature colors ──
const ASPECT_NATURE_COLORS: Record<string, string> = {
  Harmonious: '#6EBF8B',
  Challenging: '#E07A7A',
  Neutral: '#C9A962',
};

type TabKey = 'planets' | 'houses' | 'aspects' | 'patterns';

export default function ChartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('planets');

  useEffect(() => {
    loadChart();
  }, []);

  const loadChart = async () => {
    try {
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const saved = charts[0];
        const birthData = {
          date: saved.birthDate,
          time: saved.birthTime,
          hasUnknownTime: saved.hasUnknownTime,
          place: saved.birthPlace,
          latitude: saved.latitude,
          longitude: saved.longitude,
          houseSystem: saved.houseSystem,
        };
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        chart.id = saved.id;
        chart.name = saved.name;
        chart.createdAt = saved.createdAt;
        chart.updatedAt = saved.updatedAt;
        setUserChart(chart);
      }
    } catch (error) {
      logger.error('Failed to load chart:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayChart = userChart
    ? ChartDisplayManager.formatChartWithTimeWarnings(userChart)
    : null;

  // ── All planet rows ──
  const planetRows = useMemo(() => {
    if (!userChart) return [];
    const list: { label: string; p: PlanetPlacement }[] = [
      { label: 'Sun', p: userChart.sun },
      { label: 'Moon', p: userChart.moon },
      { label: 'Mercury', p: userChart.mercury },
      { label: 'Venus', p: userChart.venus },
      { label: 'Mars', p: userChart.mars },
      { label: 'Jupiter', p: userChart.jupiter },
      { label: 'Saturn', p: userChart.saturn },
      { label: 'Uranus', p: userChart.uranus },
      { label: 'Neptune', p: userChart.neptune },
      { label: 'Pluto', p: userChart.pluto },
    ];
    if (userChart.ascendant) list.push({ label: 'Ascendant', p: userChart.ascendant });
    if (userChart.midheaven) list.push({ label: 'Midheaven', p: userChart.midheaven });
    return list;
  }, [userChart]);

  // ── Sensitive points (Chiron, North Node, South Node) from enhanced planets ──
  const sensitivePoints = useMemo(() => {
    if (!userChart?.planets) return [];
    const points: { label: string; iconName: string; sign: string; degree: number; minute: number; house?: number; retrograde: boolean }[] = [];
    for (const p of userChart.planets) {
      const name = p.planet.toLowerCase();
      const deg = Math.floor(p.degree);
      const min = Math.round((p.degree % 1) * 60);
      if (name === 'chiron') {
        points.push({ label: 'Chiron', iconName: 'key-outline', sign: p.sign, degree: deg, minute: min, house: p.house, retrograde: p.retrograde });
      }
      if (name === 'north node' || name === 'northnode' || name === 'true node') {
        points.push({ label: 'North Node', iconName: 'arrow-up-circle-outline', sign: p.sign, degree: deg, minute: min, house: p.house, retrograde: p.retrograde });
      }
      if (name === 'south node' || name === 'southnode') {
        points.push({ label: 'South Node', iconName: 'arrow-down-circle-outline', sign: p.sign, degree: deg, minute: min, house: p.house, retrograde: p.retrograde });
      }
    }
    return points;
  }, [userChart]);

  // ── Chiron & Node insights (premium) ──
  const chironInsight = useMemo<ChironInsight | null>(() => {
    if (!userChart || !isPremium) return null;
    return getChironInsightFromChart(userChart);
  }, [userChart, isPremium]);

  const nodeInsight = useMemo<NodeInsight | null>(() => {
    if (!userChart || !isPremium) return null;
    return getNodeInsight(userChart);
  }, [userChart, isPremium]);

  // ── Sorted aspects (tightest first), gated by premium ──
  const FREE_ASPECT_TYPES = new Set(['conjunction', 'opposition', 'trine', 'square']);
  const sortedAspects = useMemo(() => {
    if (!userChart) return [];
    const all = [...userChart.aspects].sort((a, b) => a.orb - b.orb);
    if (isPremium) return all;
    return all.filter(a => FREE_ASPECT_TYPES.has(a.type.name.toLowerCase()));
  }, [userChart, isPremium]);

  const hiddenAspectCount = useMemo(() => {
    if (!userChart || isPremium) return 0;
    return userChart.aspects.length - sortedAspects.length;
  }, [userChart, isPremium, sortedAspects]);

  // ── Chart pattern analysis ──
  const chartPatterns = useMemo<ChartPatterns | null>(() => {
    if (!userChart) return null;
    return detectChartPatterns(userChart);
  }, [userChart]);

    // ── Part of Fortune (free) ──
    const partOfFortune = useMemo(() => {
      if (!userChart || !userChart.partOfFortune) return null;
      return userChart.partOfFortune;
    }, [userChart]);

    // ── Dominant Planet (free) ──
    const dominantPlanet = useMemo(() => {
      if (!userChart || !userChart.planets) return null;
      // Count occurrences by planet
      const planetCounts: Record<string, number> = {};
      for (const p of userChart.planets) {
        planetCounts[p.planet] = (planetCounts[p.planet] || 0) + 1;
      }
      // Find planet with max count
      let maxPlanet = '';
      let maxCount = 0;
      for (const [planet, count] of Object.entries(planetCounts)) {
        if (count > maxCount) {
          maxPlanet = planet;
          maxCount = count;
        }
      }
      return userChart.planets.find(p => p.planet === maxPlanet) || null;
    }, [userChart]);
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StarField starCount={30} />
        <Text style={styles.loadingText}>Loading natal chart…</Text>
      </View>
    );
  }

  if (!userChart) {
    return (
      <View style={[styles.container, styles.center]}>
        <StarField starCount={30} />
        <Text style={styles.loadingText}>No chart found. Create your chart from Home.</Text>
        <Pressable style={styles.goHomeBtn} onPress={() => router.push('/' as Href)}>
          <Text style={styles.goHomeText}>Go to Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StarField starCount={30} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 0 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <Text style={styles.title}>Natal Chart</Text>
            <Text style={styles.subtitle}>
              {userChart.name || 'Your Chart'} · Born{' '}
              {parseLocalDate(userChart.birthData.date).toLocaleDateString()}
            </Text>
          </Animated.View>

          {/* ── Birth time warning ── */}
          {displayChart?.warnings.length ? (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle" size={18} color={theme.warning} />
              <Text style={styles.warningText}>{displayChart.warnings[0]}</Text>
            </View>
          ) : null}

          {/* ── Chart Wheel ── */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={{ alignItems: 'center', width: '100%' }}>
            <NatalChartWheel chart={userChart} showAspects={true} />
          </Animated.View>

          {/* ── Big Three Summary ── */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ width: '100%' }}>
            <LinearGradient
              colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
              style={styles.bigThreeCard}
            >
              <View style={styles.bigThreeRow}>
                <View style={styles.bigThreeItem}>
                  <Text style={styles.bigThreeLabel}>☉ Sun</Text>
                  <Text style={styles.bigThreeSign}>
                    {userChart.sun.sign.symbol} {userChart.sun.sign.name}
                  </Text>
                  <Text style={styles.bigThreeDeg}>
                    {userChart.sun.degree}°{userChart.sun.minute}' · House {userChart.sun.house}
                  </Text>
                </View>
                <View style={styles.bigThreeItem}>
                  <Text style={styles.bigThreeLabel}>☽ Moon</Text>
                  <Text style={styles.bigThreeSign}>
                    {userChart.moon.sign.symbol} {userChart.moon.sign.name}
                  </Text>
                  <Text style={styles.bigThreeDeg}>
                    {userChart.moon.degree}°{userChart.moon.minute}' · House {userChart.moon.house}
                  </Text>
                </View>
                {userChart.ascendant && (
                  <View style={styles.bigThreeItem}>
                    <Text style={styles.bigThreeLabel}>AC Rising</Text>
                    <Text style={styles.bigThreeSign}>
                      {userChart.ascendant.sign.symbol} {userChart.ascendant.sign.name}
                    </Text>
                    <Text style={styles.bigThreeDeg}>
                      {userChart.ascendant.degree}°{userChart.ascendant.minute}'
                    </Text>
                  </View>
                )}
              </View>
              {userChart.midheaven && (
                <View style={styles.mcRow}>
                  <Text style={styles.mcLabel}>MC Midheaven</Text>
                  <Text style={styles.mcValue}>
                    {userChart.midheaven.sign.symbol} {userChart.midheaven.sign.name} {userChart.midheaven.degree}°{userChart.midheaven.minute}'
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ── Chiron & Nodes (Premium) ── */}
          {isPremium && sensitivePoints.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250).duration(600)} style={{ width: '100%' }}>
              <LinearGradient
                colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                style={styles.sensitiveCard}
              >
                <Text style={styles.sensitiveTitle}>Sensitive Points</Text>
                <View style={styles.sensitiveGrid}>
                  {sensitivePoints.map((pt) => (
                    <View key={pt.label} style={styles.sensitiveItem}>
                      <Ionicons name={pt.iconName as any} size={24} color={theme.primary} style={{ marginBottom: 4 }} />
                      <Text style={styles.sensitiveName}>{pt.label}</Text>
                      <Text style={styles.sensitiveSign}>{pt.sign}</Text>
                      <Text style={styles.sensitiveDeg}>
                        {pt.degree}°{pt.minute}'{pt.house ? ` · H${pt.house}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
                {chironInsight && (
                  <View style={styles.insightBox}>
                    <Text style={styles.insightLabel}>Chiron Theme</Text>
                    <Text style={styles.insightTitle}>{chironInsight.title}</Text>
                    <Text style={styles.insightText}>{chironInsight.theme}</Text>
                  </View>
                )}
                {nodeInsight && (
                  <View style={styles.insightBox}>
                    <Text style={styles.insightLabel}>Node Axis</Text>
                    <Text style={styles.insightText}>{nodeInsight.fusionLine}</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          )}

          {/* Free user upsell for Chiron & Nodes */}
          {!isPremium && sensitivePoints.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250).duration(600)} style={{ width: '100%' }}>
              <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                <LinearGradient
                  colors={['rgba(201,169,98,0.1)', 'rgba(201,169,98,0.05)']}
                  style={styles.sensitiveUpsell}
                >
                  <Ionicons name="sparkles" size={16} color={theme.primary} />
                  <Text style={styles.sensitiveUpsellText}>
                    Unlock Chiron & Node insights with Deeper Sky
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* ── Tab Switcher ── */}
          <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.tabRow}>
            {(['planets', 'houses', 'aspects', 'patterns'] as TabKey[]).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'planets' ? `Planets (${planetRows.length})`
                    : tab === 'houses' ? `Houses (${userChart.houseCusps.length})`
                    : tab === 'aspects' ? `Aspects (${sortedAspects.length})`
                    : 'Patterns'}
                </Text>
              </Pressable>
            ))}
          </Animated.View>

          {/* ── Planets Table ── */}
          {activeTab === 'planets' && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              {/* Table header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 140 }]}>Planet</Text>
                <Text style={[styles.th, { flex: 2 }]}>Sign</Text>
                <Text style={[styles.th, { flex: 1 }]}>Deg</Text>
                <Text style={[styles.th, { flex: 1 }]}>House</Text>
              </View>

              {planetRows.map((row, idx) => {
                const elColor = ELEMENT_COLORS[row.p.sign.element] || theme.textSecondary;
                return (
                  <LinearGradient
                    key={row.label}
                    colors={
                      idx % 2 === 0
                        ? ['rgba(30,45,71,0.5)', 'rgba(26,39,64,0.3)']
                        : ['rgba(26,39,64,0.4)', 'rgba(20,30,46,0.3)']
                    }
                    style={styles.tableRow}
                  >
                    <View style={[styles.td, { width: 140, flexDirection: 'row', alignItems: 'center' }]}>
                      <Text style={styles.planetSymbol}>{row.p.planet.symbol}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planetName}>{row.label}</Text>
                        {row.p.isRetrograde && (
                          <Text style={styles.retroLabel}>℞ Retrograde</Text>
                        )}
                      </View>
                    </View>
                    <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                      <Text style={[styles.signSymbol, { color: elColor }]}>{row.p.sign.symbol}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.signName, { color: elColor }]}>{row.p.sign.name}</Text>
                        <Text style={styles.elementLabel}>{row.p.sign.element} · {row.p.sign.modality}</Text>
                      </View>
                    </View>
                    <View style={[styles.td, { flex: 1 }]}>
                      <Text style={styles.degreeText}>{row.p.degree}°</Text>
                      <Text style={styles.minuteText}>{row.p.minute}'</Text>
                    </View>
                    <View style={[styles.td, { flex: 1, alignItems: 'center' }]}>
                      <Text style={styles.houseNum}>{row.p.house || '—'}</Text>
                    </View>
                  </LinearGradient>
                );
              })}

              {/* Sensitive Points: Chiron, North Node */}
              {sensitivePoints.length > 0 && (
                <>
                  <View style={styles.pointsDivider}>
                    <Text style={styles.pointsLabel}>Sensitive Points</Text>
                  </View>
                  {sensitivePoints.map((pt, idx) => (
                    <LinearGradient
                      key={pt.label}
                      colors={
                        idx % 2 === 0
                          ? ['rgba(30,45,71,0.5)', 'rgba(26,39,64,0.3)']
                          : ['rgba(26,39,64,0.4)', 'rgba(20,30,46,0.3)']
                      }
                      style={styles.tableRow}
                    >
                      <View style={[styles.td, { width: 140, flexDirection: 'row', alignItems: 'center' }]}>
                        <Ionicons name={pt.iconName as any} size={20} color={theme.primary} style={{ marginRight: 10, width: 28 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.planetName}>{pt.label}</Text>
                          {pt.retrograde && (
                            <Text style={styles.retroLabel}>℞ Retrograde</Text>
                          )}
                        </View>
                      </View>
                      <View style={[styles.td, { flex: 2 }]}>
                        <Text style={styles.signName}>{pt.sign}</Text>
                      </View>
                      <View style={[styles.td, { flex: 1 }]}>
                        <Text style={styles.degreeText}>{pt.degree}°</Text>
                        <Text style={styles.minuteText}>{pt.minute}'</Text>
                      </View>
                      <View style={[styles.td, { flex: 1, alignItems: 'center' }]}>
                        <Text style={styles.houseNum}>{pt.house || '—'}</Text>
                      </View>
                    </LinearGradient>
                  ))}
                </>
              )}
            </Animated.View>
          )}

          {/* ── Houses Table ── */}
          {activeTab === 'houses' && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              {userChart.houseCusps.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="alert-circle-outline" size={32} color={theme.textMuted} />
                  <Text style={styles.emptyText}>
                    House positions require a known birth time.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 1 }]}>House</Text>
                    <Text style={[styles.th, { flex: 2 }]}>Sign</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Degree</Text>
                    <Text style={[styles.th, { flex: 3 }]}>Theme</Text>
                  </View>

                  {userChart.houseCusps.map((cusp: HouseCusp, idx: number) => {
                    const houseInfo = HOUSE_MEANINGS[cusp.house as keyof typeof HOUSE_MEANINGS];
                    const elColor = ELEMENT_COLORS[cusp.sign.element] || theme.textSecondary;
                    const deg = Math.floor(cusp.longitude % 30);
                    const min = Math.floor((cusp.longitude % 1) * 60);

                    return (
                      <LinearGradient
                        key={cusp.house}
                        colors={
                          idx % 2 === 0
                            ? ['rgba(30,45,71,0.5)', 'rgba(26,39,64,0.3)']
                            : ['rgba(26,39,64,0.4)', 'rgba(20,30,46,0.3)']
                        }
                        style={styles.tableRow}
                      >
                        <View style={[styles.td, { flex: 1, alignItems: 'center' }]}>
                          <Text style={styles.houseNumLarge}>{cusp.house}</Text>
                        </View>
                        <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                          <Text style={[styles.signSymbol, { color: elColor }]}>{cusp.sign.symbol}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.signName, { color: elColor }]}>{cusp.sign.name}</Text>
                          </View>
                        </View>
                        <View style={[styles.td, { flex: 1 }]}>
                          <Text style={styles.degreeText}>{deg}°{min}'</Text>
                        </View>
                        <View style={[styles.td, { flex: 3 }]}>
                          <Text style={styles.houseTheme}>{houseInfo?.theme || ''}</Text>
                        </View>
                      </LinearGradient>
                    );
                  })}
                </>
              )}
            </Animated.View>
          )}

          {/* ── Aspects Table ── */}
          {activeTab === 'aspects' && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>
              {sortedAspects.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="git-network-outline" size={32} color={theme.textMuted} />
                  <Text style={styles.emptyText}>No aspects found.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 2 }]}>Planet 1</Text>
                    <Text style={[styles.th, { flex: 2 }]}>Aspect</Text>
                    <Text style={[styles.th, { flex: 2 }]}>Planet 2</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Orb</Text>
                  </View>

                  {sortedAspects.map((asp: Aspect, idx: number) => {
                    const natureColor = ASPECT_NATURE_COLORS[asp.type.nature] || theme.textSecondary;
                    return (
                      <LinearGradient
                        key={`${asp.planet1.name}-${asp.type.name}-${asp.planet2.name}`}
                        colors={
                          idx % 2 === 0
                            ? ['rgba(30,45,71,0.5)', 'rgba(26,39,64,0.3)']
                            : ['rgba(26,39,64,0.4)', 'rgba(20,30,46,0.3)']
                        }
                        style={styles.tableRow}
                      >
                        <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                          <Text style={styles.aspectPlanetSymbol}>{asp.planet1.symbol}</Text>
                          <Text style={styles.aspectPlanetName}>{asp.planet1.name}</Text>
                        </View>
                        <View style={[styles.td, { flex: 2, alignItems: 'center' }]}>
                          <Text style={[styles.aspectSymbol, { color: natureColor }]}>{asp.type.symbol}</Text>
                          <Text style={[styles.aspectName, { color: natureColor }]}>{asp.type.name}</Text>
                          <Text style={[styles.aspectNature, { color: natureColor }]}>{asp.type.nature}</Text>
                        </View>
                        <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                          <Text style={styles.aspectPlanetSymbol}>{asp.planet2.symbol}</Text>
                          <Text style={styles.aspectPlanetName}>{asp.planet2.name}</Text>
                        </View>
                        <View style={[styles.td, { flex: 1, alignItems: 'center' }]}>
                          <Text style={[
                            styles.orbText,
                            { color: asp.orb < 2 ? '#6EBF8B' : asp.orb < 5 ? theme.primary : theme.textSecondary }
                          ]}>
                            {asp.orb.toFixed(1)}°
                          </Text>
                          {asp.isApplying && <Text style={styles.applyingLabel}>applying</Text>}
                        </View>
                      </LinearGradient>
                    );
                  })}

                  {/* Legend */}
                  <View style={styles.legend}>
                    <Text style={styles.legendTitle}>Aspect Legend</Text>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: '#6EBF8B' }]} />
                      <Text style={styles.legendText}>Harmonious (trines, sextiles)</Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: '#E07A7A' }]} />
                      <Text style={styles.legendText}>Challenging (squares, oppositions)</Text>
                    </View>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: '#C9A962' }]} />
                      <Text style={styles.legendText}>Neutral (conjunctions)</Text>
                    </View>
                    <Text style={styles.legendNote}>
                      Tighter orbs (lower numbers) = stronger influence
                    </Text>
                  </View>

                  {/* Premium upsell for hidden advanced aspects */}
                  {!isPremium && hiddenAspectCount > 0 && (
                    <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                      <LinearGradient
                        colors={['rgba(201,169,98,0.1)', 'rgba(201,169,98,0.05)']}
                        style={styles.aspectUpsell}
                      >
                        <Ionicons name="sparkles" size={16} color={theme.primary} />
                        <Text style={styles.aspectUpsellText}>
                          {hiddenAspectCount} more subtle aspect{hiddenAspectCount > 1 ? 's' : ''} — sextiles, quincunxes, and more
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                      </LinearGradient>
                    </Pressable>
                  )}
                </>
              )}
            </Animated.View>
          )}

          {/* ── Patterns Tab ── */}
          {activeTab === 'patterns' && chartPatterns && (
            <Animated.View entering={FadeInDown.delay(300).duration(500)}>

              {/* Chart Ruler */}
              {chartPatterns.chartRuler && (
                <LinearGradient
                  colors={['rgba(201,169,98,0.15)', 'rgba(30,45,71,0.6)']}
                  style={styles.patternCard}
                >
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternIcon}>👑</Text>
                    <Text style={styles.patternTitle}>Chart Ruler</Text>
                  </View>
                  <View style={styles.patternHighlight}>
                    <Text style={styles.patternHighlightText}>
                      {chartPatterns.chartRuler.planetSymbol} {chartPatterns.chartRuler.planet} in{' '}
                      {chartPatterns.chartRuler.rulerSignSymbol} {chartPatterns.chartRuler.rulerSign}
                      {' · '}House {chartPatterns.chartRuler.rulerHouse}
                    </Text>
                  </View>
                  <Text style={styles.patternDesc}>{chartPatterns.chartRuler.description}</Text>
                  <View style={styles.tooltipBox}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                    <Text style={styles.tooltipText}>
                      Your chart ruler is the planet that rules your rising sign ({chartPatterns.chartRuler.risingSymbol}{' '}
                      {chartPatterns.chartRuler.risingSign}). Its placement colors your entire life path.
                    </Text>
                  </View>
                </LinearGradient>
              )}

                {/* Part of Fortune (free) */}
                {partOfFortune && (
                  <LinearGradient
                    colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                    style={styles.patternCard}
                  >
                    <View style={styles.patternHeader}>
                      <Ionicons name="sunny-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                      <Text style={styles.patternTitle}>Part of Fortune</Text>
                    </View>
                    <View style={styles.patternHighlight}>
                      <Text style={styles.patternHighlightText}>
                        {partOfFortune.sign?.symbol} {partOfFortune.sign?.name} · {Math.floor(partOfFortune.degree)}°
                        {partOfFortune.house ? ` · House ${partOfFortune.house}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.patternDesc}>
                      The Part of Fortune marks where you find ease, flow, and natural abundance. Its sign and house placement show where you can access joy and resilience most easily.
                    </Text>
                    <View style={styles.tooltipBox}>
                      <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                      <Text style={styles.tooltipText}>
                        This point is calculated from your Sun, Moon, and Ascendant. It highlights your most effortless channel for well-being.
                      </Text>
                    </View>
                  </LinearGradient>
                )}

                {/* Dominant Planet (free) */}
                {dominantPlanet && (
                  <LinearGradient
                    colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                    style={styles.patternCard}
                  >
                    <View style={styles.patternHeader}>
                      <Text style={styles.patternIcon}>🌟</Text>
                      <Text style={styles.patternTitle}>Dominant Planet</Text>
                    </View>
                    <View style={styles.patternHighlight}>
                      <Text style={styles.patternHighlightText}>
                        {dominantPlanet.planet} in {dominantPlanet.sign?.name} · {Math.floor(dominantPlanet.degree)}°
                        {dominantPlanet.house ? ` · House ${dominantPlanet.house}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.patternDesc}>
                      Your dominant planet is the one most active in your chart. Its themes tend to color your personality, motivations, and life path more than others.
                    </Text>
                    <View style={styles.tooltipBox}>
                      <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                      <Text style={styles.tooltipText}>
                        This is determined by the planet with the most placements or strongest presence in your chart.
                      </Text>
                    </View>
                  </LinearGradient>
                )}

              {/* Stelliums */}
              {chartPatterns.stelliums.length > 0 && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                  style={styles.patternCard}
                >
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternIcon}>{chartPatterns.stelliums.some(s => s.type === 'combined') ? '◈' : '🔥'}</Text>
                    <Text style={styles.patternTitle}>
                      {chartPatterns.stelliums.length === 1
                        ? chartPatterns.stelliums[0].cardTitle
                        : `Emphasis Areas`}
                    </Text>
                  </View>
                  {/* Free: show first stellium basics only */}
                  {(isPremium ? chartPatterns.stelliums : chartPatterns.stelliums.slice(0, 1)).map((s, i) => (
                    <View key={`${s.type}-${s.label}`} style={[styles.stelliumItem, i > 0 && styles.stelliumDivider]}>
                      <View style={styles.stelliumBadge}>
                        <Text style={styles.stelliumBadgeText}>
                          {s.planets.length} planets in {s.label}
                        </Text>
                        <Text style={styles.stelliumType}>
                          {s.type === 'combined' ? 'Focused Concentration' : s.type === 'sign' ? 'Sign Emphasis' : 'House Emphasis'}
                        </Text>
                      </View>
                      <View style={styles.stelliumPlanets}>
                        {s.planets.map((p) => (
                          <View key={p} style={styles.stelliumChip}>
                            <Text style={styles.stelliumChipText}>{p}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={styles.patternDesc}>{s.description}</Text>
                      {isPremium && (
                        <>
                          {s.subtitle ? (
                            <Text style={styles.stelliumSubtitle}>{s.subtitle}</Text>
                          ) : null}
                          {s.narrative ? (
                            <Text style={styles.patternDesc}>{s.narrative}</Text>
                          ) : null}
                          {s.elementCloser ? (
                            <Text style={styles.patternAnnotation}>{s.elementCloser}</Text>
                          ) : null}
                          {s.planetMixNote ? (
                            <Text style={styles.patternAnnotation}>{s.planetMixNote}</Text>
                          ) : null}
                          {s.retroNote ? (
                            <Text style={styles.patternAnnotation}>{s.retroNote}</Text>
                          ) : null}
                        </>
                      )}
                    </View>
                  ))}
                  {isPremium && chartPatterns.stelliumOverflow && (
                    <Text style={styles.overflowNote}>Other areas also show notable concentration.</Text>
                  )}
                  {!isPremium && chartPatterns.stelliums.length > 1 && (
                    <Pressable onPress={() => router.push('/(tabs)/premium' as Href)} style={styles.patternUpsell}>
                      <Ionicons name="lock-closed" size={14} color={theme.primary} />
                      <Text style={styles.patternUpsellText}>
                        {chartPatterns.stelliums.length - 1} more pattern{chartPatterns.stelliums.length > 2 ? 's' : ''} — unlock with Deeper Sky
                      </Text>
                    </Pressable>
                  )}
                  <View style={styles.tooltipBox}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                    <Text style={styles.tooltipText}>
                      An emphasis appears when three or more planets occupy the same sign or life area. These patterns highlight focus, not fate.
                    </Text>
                  </View>
                </LinearGradient>
              )}

              {/* Conjunction Clusters */}
              {chartPatterns.conjunctionClusters.length > 0 && (
                <LinearGradient
                  colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                  style={styles.patternCard}
                >
                  <View style={styles.patternHeader}>
                    <Text style={styles.patternIcon}>⚡</Text>
                    <Text style={styles.patternTitle}>
                      Conjunction Cluster{chartPatterns.conjunctionClusters.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  {isPremium ? (
                    chartPatterns.conjunctionClusters.map((c, i) => (
                      <View key={i} style={[styles.stelliumItem, i > 0 && styles.stelliumDivider]}>
                        <View style={styles.stelliumPlanets}>
                          {c.planets.map((p) => (
                            <View key={p} style={[styles.stelliumChip, { backgroundColor: 'rgba(201,169,98,0.15)' }]}>
                              <Text style={[styles.stelliumChipText, { color: theme.primary }]}>{p}</Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.clusterOrb}>Tightest orb: {c.tightestOrb.toFixed(1)}°</Text>
                        <Text style={styles.patternDesc}>{c.description}</Text>
                      </View>
                    ))
                  ) : (
                    <Pressable onPress={() => router.push('/(tabs)/premium' as Href)} style={styles.patternUpsell}>
                      <Ionicons name="lock-closed" size={14} color={theme.primary} />
                      <Text style={styles.patternUpsellText}>
                        {chartPatterns.conjunctionClusters.length} conjunction cluster{chartPatterns.conjunctionClusters.length > 1 ? 's' : ''} — unlock with Deeper Sky
                      </Text>
                    </Pressable>
                  )}
                  <View style={styles.tooltipBox}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                    <Text style={styles.tooltipText}>
                      Planets within 10° of each other merge their energies, creating a concentrated force in your chart.
                    </Text>
                  </View>
                </LinearGradient>
              )}

              {/* Retrograde Emphasis */}
              <LinearGradient
                colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                style={styles.patternCard}
              >
                <View style={styles.patternHeader}>
                  <Text style={styles.patternIcon}>℞</Text>
                  <Text style={styles.patternTitle}>Retrograde Emphasis</Text>
                </View>
                {chartPatterns.retrogradeEmphasis.count > 0 ? (
                  <>
                    <View style={styles.stelliumPlanets}>
                      {chartPatterns.retrogradeEmphasis.planets.map((p) => (
                        <View key={p} style={[styles.stelliumChip, { backgroundColor: 'rgba(224,122,122,0.12)' }]}>
                          <Text style={[styles.stelliumChipText, { color: '#E07A7A' }]}>{p} ℞</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.retroCount}>
                      {chartPatterns.retrogradeEmphasis.count} of 8 planets retrograde
                    </Text>
                  </>
                ) : (
                  <Text style={styles.retroCount}>No natal retrogrades — all planets direct</Text>
                )}
                <Text style={styles.patternDesc}>{chartPatterns.retrogradeEmphasis.description}</Text>
                <View style={styles.tooltipBox}>
                  <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                  <Text style={styles.tooltipText}>
                    Retrograde planets (excluding Sun & Moon, which never retrograde) internalize their energy, inviting deeper reflection.
                  </Text>
                </View>
              </LinearGradient>

              {/* Element Balance */}
              <LinearGradient
                colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                style={styles.patternCard}
              >
                <View style={styles.patternHeader}>
                  <Text style={styles.patternIcon}>🌊</Text>
                  <Text style={styles.patternTitle}>Element Balance</Text>
                </View>
                <View style={styles.elementGrid}>
                  {Object.entries(chartPatterns.elementBalance.counts).map(([el, count]) => {
                    const maxCount = Math.max(...Object.values(chartPatterns.elementBalance.counts));
                    const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    const isDominant = el === chartPatterns.elementBalance.dominant;
                    return (
                      <View key={el} style={styles.elementRow}>
                        <Text style={[styles.elementName, isDominant && { color: ELEMENT_COLORS[el], fontWeight: '700' }]}>
                          {el}
                        </Text>
                        <View style={styles.elementBarBg}>
                          <View
                            style={[
                              styles.elementBarFill,
                              { width: `${barWidth}%`, backgroundColor: ELEMENT_COLORS[el] || theme.primary },
                            ]}
                          />
                        </View>
                        <Text style={[styles.elementCount, isDominant && { color: ELEMENT_COLORS[el] }]}>
                          {count}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.dominantLabel}>
                  Dominant: <Text style={{ color: ELEMENT_COLORS[chartPatterns.elementBalance.dominant], fontWeight: '700' }}>
                    {chartPatterns.elementBalance.dominant}
                  </Text>
                </Text>
                {chartPatterns.elementBalance.missing && (
                  <Text style={styles.missingLabel}>
                    Missing: <Text style={{ color: '#E07A7A' }}>{chartPatterns.elementBalance.missing}</Text>
                  </Text>
                )}
                <Text style={styles.patternDesc}>{chartPatterns.elementBalance.description}</Text>
              </LinearGradient>

              {/* Modality Balance */}
              <LinearGradient
                colors={['rgba(30,45,71,0.8)', 'rgba(26,39,64,0.6)']}
                style={styles.patternCard}
              >
                <View style={styles.patternHeader}>
                  <Text style={styles.patternIcon}>⚙️</Text>
                  <Text style={styles.patternTitle}>Modality Balance</Text>
                </View>
                <View style={styles.elementGrid}>
                  {Object.entries(chartPatterns.modalityBalance.counts).map(([mod, count]) => {
                    const maxCount = Math.max(...Object.values(chartPatterns.modalityBalance.counts));
                    const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    const isDominant = mod === chartPatterns.modalityBalance.dominant;
                    const modColor = isDominant ? theme.primary : theme.textSecondary;
                    return (
                      <View key={mod} style={styles.elementRow}>
                        <Text style={[styles.elementName, isDominant && { color: modColor, fontWeight: '700' }]}>
                          {mod}
                        </Text>
                        <View style={styles.elementBarBg}>
                          <View
                            style={[
                              styles.elementBarFill,
                              { width: `${barWidth}%`, backgroundColor: isDominant ? theme.primary : theme.textMuted },
                            ]}
                          />
                        </View>
                        <Text style={[styles.elementCount, isDominant && { color: modColor }]}>
                          {count}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.dominantLabel}>
                  Dominant: <Text style={{ color: theme.primary, fontWeight: '700' }}>
                    {chartPatterns.modalityBalance.dominant}
                  </Text>
                </Text>
                <Text style={styles.patternDesc}>{chartPatterns.modalityBalance.description}</Text>
              </LinearGradient>

              {/* ── Chiron Insight (Premium) ── */}
              {chironInsight && (
                <LinearGradient
                  colors={['rgba(122,139,224,0.12)', 'rgba(30,45,71,0.6)']}
                  style={styles.patternCard}
                >
                  <View style={styles.patternHeader}>
                    <Ionicons name="key-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.patternTitle}>Chiron — {chironInsight.title}</Text>
                  </View>
                  <Text style={styles.patternDesc}>{chironInsight.description}</Text>
                  <View style={styles.insightBox}>
                    <Text style={styles.insightLabel}>Integration Theme</Text>
                    <Text style={styles.insightHighlight}>{chironInsight.integrationTheme}</Text>
                  </View>
                  <View style={styles.insightBox}>
                    <Text style={styles.insightLabel}>Body Awareness</Text>
                    <Text style={styles.insightText}>{chironInsight.bodyAwareness}</Text>
                  </View>
                </LinearGradient>
              )}

              {/* ── Node Axis Insight (Premium) ── */}
              {nodeInsight && (
                <LinearGradient
                  colors={['rgba(110,191,139,0.12)', 'rgba(30,45,71,0.6)']}
                  style={styles.patternCard}
                >
                  <View style={styles.patternHeader}>
                    <Ionicons name="swap-vertical-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.patternTitle}>Node Axis</Text>
                  </View>
                  <View style={styles.nodeRow}>
                    <View style={styles.nodeHalf}>
                      <Text style={styles.nodeDirection}>↓ South Node</Text>
                      <Text style={styles.nodeTitle}>{nodeInsight.southNode.title}</Text>
                      <Text style={styles.nodeTheme}>{nodeInsight.southNode.theme}</Text>
                    </View>
                    <View style={styles.nodeArrow}>
                      <Ionicons name="arrow-forward" size={16} color={theme.primary} />
                    </View>
                    <View style={styles.nodeHalf}>
                      <Text style={styles.nodeDirection}>↑ North Node</Text>
                      <Text style={styles.nodeTitle}>{nodeInsight.northNode.title}</Text>
                      <Text style={styles.nodeTheme}>{nodeInsight.northNode.theme}</Text>
                    </View>
                  </View>
                  <View style={styles.insightBox}>
                    <Text style={styles.insightText}>{nodeInsight.fusionLine}</Text>
                  </View>
                </LinearGradient>
              )}

              {/* Chiron/Node upsell for free users */}
              {!isPremium && (
                <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                  <LinearGradient
                    colors={['rgba(201,169,98,0.1)', 'rgba(201,169,98,0.05)']}
                    style={styles.patternCard}
                  >
                    <View style={styles.patternHeader}>
                      <Ionicons name="sparkles" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                      <Text style={[styles.patternTitle, { color: theme.primary }]}>Chiron & Node Depth</Text>
                    </View>
                    <Text style={styles.patternDesc}>
                      Discover your sensitivity patterns, growth direction, and integration themes with Deeper Sky.
                    </Text>
                  </LinearGradient>
                </Pressable>
              )}

              {/* No patterns fallback */}
              {chartPatterns.stelliums.length === 0 &&
                chartPatterns.conjunctionClusters.length === 0 &&
                !chartPatterns.chartRuler &&
                chartPatterns.retrogradeEmphasis.count === 0 &&
                !chironInsight &&
                !nodeInsight && (
                <View style={styles.emptyState}>
                  <Ionicons name="sparkles-outline" size={32} color={theme.textMuted} />
                  <Text style={styles.emptyText}>
                    Your chart has a balanced distribution — no extreme concentrations detected.
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.textSecondary, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 32 },
  goHomeBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, backgroundColor: 'rgba(201,169,98,0.15)' },
  goHomeText: { color: theme.primary, fontWeight: '700' },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.lg, alignItems: 'center' },

  // Header
  header: { alignItems: 'center', marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl, width: '100%' },
  title: { fontSize: 28, fontWeight: '700', color: theme.textPrimary, fontFamily: 'serif', letterSpacing: 0.5, textAlign: 'center' },
  subtitle: { color: theme.textSecondary, fontSize: 13, marginTop: 4, fontStyle: 'italic', textAlign: 'center' },

  // Warning
  warningBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,179,0,0.1)', borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.lg, width: '100%' },
  warningText: { color: theme.textSecondary, fontSize: 13, marginLeft: 8, flex: 1, textAlign: 'center' },

  // Big Three
  bigThreeCard: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, marginBottom: theme.spacing.lg, width: '100%', alignItems: 'center' },
  bigThreeRow: { flexDirection: 'row', justifyContent: 'space-evenly' },
  bigThreeItem: { alignItems: 'center', flex: 1 },
  bigThreeLabel: { color: theme.textMuted, fontSize: 12, letterSpacing: 0.5, textAlign: 'center' },
  bigThreeSign: { color: theme.textPrimary, fontWeight: '700', fontSize: 16, marginTop: 4, textAlign: 'center' },
  bigThreeDeg: { color: theme.textSecondary, fontSize: 11, marginTop: 2, textAlign: 'center' },
  mcRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', width: '100%' },
  mcLabel: { color: theme.textMuted, fontSize: 12, marginRight: 8, textAlign: 'center' },
  mcValue: { color: theme.primary, fontWeight: '600', fontSize: 14, textAlign: 'center' },

  // Sensitive Points Card (premium)
  sensitiveCard: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, marginBottom: theme.spacing.lg, width: '100%', alignItems: 'center' },
  sensitiveTitle: { color: theme.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.md, textAlign: 'center' },
  sensitiveGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: theme.spacing.lg, marginBottom: theme.spacing.md },
  sensitiveItem: { alignItems: 'center', minWidth: 90 },
  sensitiveSymbol: { fontSize: 22, color: theme.primary, marginBottom: 4 },
  sensitiveName: { color: theme.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  sensitiveSign: { color: theme.textSecondary, fontSize: 13, fontWeight: '500', marginTop: 2, textAlign: 'center' },
  sensitiveDeg: { color: theme.textMuted, fontSize: 11, marginTop: 1, textAlign: 'center' },
  sensitiveUpsell: { flexDirection: 'row', alignItems: 'center', borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.lg, gap: 8 },
  sensitiveUpsellText: { flex: 1, color: theme.primary, fontSize: 13, fontStyle: 'italic', lineHeight: 18 },

  // Insight boxes (reused in Sensitive Points + Patterns)
  insightBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginTop: theme.spacing.sm, width: '100%' },
  insightLabel: { color: theme.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, textAlign: 'center' },
  insightTitle: { color: theme.primary, fontSize: 15, fontWeight: '600', fontFamily: 'serif', textAlign: 'center' },
  insightText: { color: theme.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  insightHighlight: { color: theme.primary, fontSize: 14, fontWeight: '600', fontStyle: 'italic', textAlign: 'center' },

  // Node axis layout
  nodeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
  nodeHalf: { flex: 1, alignItems: 'center' },
  nodeArrow: { paddingHorizontal: theme.spacing.sm },
  nodeDirection: { color: theme.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  nodeTitle: { color: theme.textPrimary, fontSize: 14, fontWeight: '600', fontFamily: 'serif', textAlign: 'center' },
  nodeTheme: { color: theme.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 2, fontStyle: 'italic' },

  // Sensitive points divider (planets tab)
  pointsDivider: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm, paddingBottom: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(201,169,98,0.15)' },
  pointsLabel: { color: theme.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },

  // Tabs
  tabRow: { flexDirection: 'row', marginBottom: theme.spacing.lg, borderRadius: theme.borderRadius.lg, backgroundColor: 'rgba(26,39,64,0.5)', padding: 4, width: '100%' },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: theme.borderRadius.md },
  tabBtnActive: { backgroundColor: 'rgba(201,169,98,0.2)' },
  tabText: { color: theme.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: theme.primary },

  // Table
  tableHeader: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(201,169,98,0.15)', width: '100%' },
  th: { color: theme.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 14, borderRadius: 8, marginBottom: 2, width: '100%' },
  td: { justifyContent: 'center', alignItems: 'center' },

  // Planets
  planetSymbol: { fontSize: 20, color: theme.primary, marginRight: 10, width: 28, textAlign: 'center' },
  signSymbol: { fontSize: 18, marginRight: 6, width: 24, textAlign: 'center' },
  planetName: { color: theme.textPrimary, fontWeight: '600', fontSize: 14, textAlign: 'center' },
  retroLabel: { color: theme.warning, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  signName: { fontWeight: '600', fontSize: 14, textAlign: 'center' },
  elementLabel: { color: theme.textMuted, fontSize: 10, textAlign: 'center' },
  degreeText: { color: theme.textPrimary, fontWeight: '600', fontSize: 14, textAlign: 'center' },
  minuteText: { color: theme.textSecondary, fontSize: 11, textAlign: 'center' },
  houseNum: { color: theme.textPrimary, fontWeight: '700', fontSize: 16, textAlign: 'center' },

  // Houses
  houseNumLarge: { color: theme.primary, fontWeight: '700', fontSize: 18, textAlign: 'center' },
  houseTheme: { color: theme.textSecondary, fontSize: 12, lineHeight: 16, textAlign: 'center' },

  // Aspects
  aspectPlanetSymbol: { fontSize: 16, color: theme.primary, marginRight: 6, width: 24, textAlign: 'center' },
  aspectPlanetName: { color: theme.textPrimary, fontWeight: '600', fontSize: 13, textAlign: 'center' },
  aspectSymbol: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  aspectName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  aspectNature: { fontSize: 9, fontStyle: 'italic', textAlign: 'center' },
  orbText: { fontWeight: '700', fontSize: 14, textAlign: 'center' },
  applyingLabel: { color: theme.textMuted, fontSize: 9, fontStyle: 'italic', textAlign: 'center' },

  // Legend
  legend: { marginTop: theme.spacing.lg, padding: theme.spacing.lg, borderRadius: theme.borderRadius.lg, backgroundColor: 'rgba(26,39,64,0.4)', alignItems: 'center' },
  legendTitle: { color: theme.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: theme.spacing.md, textAlign: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, justifyContent: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { color: theme.textSecondary, fontSize: 13, textAlign: 'center' },
  legendNote: { color: theme.textMuted, fontSize: 11, fontStyle: 'italic', marginTop: theme.spacing.sm, textAlign: 'center' },

  // Aspect upsell
  aspectUpsell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    gap: 8,
  },
  aspectUpsellText: {
    flex: 1,
    color: theme.primary,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
  },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: theme.textMuted, fontSize: 14, marginTop: 12, textAlign: 'center' },

  // Patterns
  patternCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  patternIcon: { fontSize: 20, marginRight: 10 },
  patternTitle: {
    color: theme.textPrimary,
    fontWeight: '700',
    fontSize: 17,
    textAlign: 'center',
  },
  patternHighlight: {
    backgroundColor: 'rgba(201,169,98,0.12)',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.md,
    alignSelf: 'center',
  },
  patternHighlightText: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  patternDesc: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  tooltipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginTop: theme.spacing.md,
  },
  tooltipText: {
    color: theme.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  stelliumItem: { marginBottom: theme.spacing.sm },
  stelliumDivider: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  stelliumBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 6,
  },
  stelliumBadgeText: {
    color: theme.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  stelliumType: {
    color: theme.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 2,
  },
  stelliumSubtitle: {
    color: theme.primary,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  patternAnnotation: {
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  patternUpsell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  patternUpsellText: {
    fontSize: 13,
    color: theme.primary,
    fontWeight: '500',
  },
  overflowNote: {
    color: theme.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  stelliumPlanets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
    justifyContent: 'center',
  },
  stelliumChip: {
    backgroundColor: 'rgba(110,191,139,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
  },
  stelliumChipText: {
    color: '#6EBF8B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  clusterOrb: {
    color: theme.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 4,
    textAlign: 'center',
  },
  retroCount: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  elementGrid: { marginBottom: theme.spacing.sm },
  elementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  elementName: {
    color: theme.textSecondary,
    fontSize: 13,
    width: 70,
    textAlign: 'center',
  },
  elementBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  elementBarFill: {
    height: 8,
    borderRadius: 4,
  },
  elementCount: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    width: 20,
    textAlign: 'right',
  },
  dominantLabel: {
    color: theme.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  missingLabel: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
});
