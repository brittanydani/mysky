// File: app/(tabs)/relationships.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import BirthDataModal from '../../components/BirthDataModal';
import { localDb } from '../../services/storage/localDb';
import { SavedChart, RelationshipChart, generateId } from '../../services/storage/models';
import { BirthData, NatalChart } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { SynastryEngine, SynastryReport, SynastryAspect } from '../../services/astrology/synastryEngine';
import { RelationshipInsightGenerator, RelationshipInsight } from '../../services/astrology/relationshipInsights';
import { PremiumRelationshipService, RelationshipComparison } from '../../services/premium/relationshipCharts';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import NeedsComparison from '../../components/ui/NeedsComparison';
import AspectRow from '../../components/ui/AspectRow';
import NatalChartWheel from '../../components/ui/NatalChartWheel';

// ── Cinematic Palette ──
const PALETTE = {
  gold: '#E8D6AE',         // Champagne gold
  silverBlue: '#D1D5DB',   // Silver
  platinum: '#C3CAD6',     // Cross-aspects
  copper: '#CD7F5D',
  emerald: '#6EBF8B',
  rose: '#D4A3B3',
  textMain: '#F0EAD6',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.12)',
};

type ViewMode = 'list' | 'detail';
type RelationshipType = 'partner' | 'ex' | 'child' | 'parent' | 'friend' | 'sibling' | 'other';

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  partner: 'Partner',
  ex: 'Ex',
  child: 'Child',
  parent: 'Parent',
  friend: 'Friend',
  sibling: 'Sibling',
  other: 'Other',
};

const RELATIONSHIP_ICONS: Record<RelationshipType, keyof typeof Ionicons.glyphMap> = {
  partner: 'heart',
  ex: 'heart-dislike',
  child: 'happy',
  parent: 'people',
  friend: 'people-circle',
  sibling: 'git-branch',
  other: 'person',
};

export default function RelationshipsScreen() {
  const { isPremium } = usePremium();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [loading, setLoading] = useState(true);
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [savedUserChart, setSavedUserChart] = useState<SavedChart | null>(null);
  const [relationships, setRelationships] = useState<RelationshipChart[]>([]);
  
  // Detail view state
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipChart | null>(null);
  const [selectedChart, setSelectedChart] = useState<NatalChart | null>(null);
  const [synastryReport, setSynastryReport] = useState<SynastryReport | null>(null);
  const [relationshipInsight, setRelationshipInsight] = useState<RelationshipInsight | null>(null);
  const [comparison, setComparison] = useState<RelationshipComparison | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'aspects' | 'dynamics'>('overview');
  const [filterMode, setFilterMode] = useState({ person1: true, person2: true, cross: true });
  const [summaryPerson, setSummaryPerson] = useState<'you' | 'them'>('them');
  
  // Synastry preview for list cards
  const [synastryPreviews, setSynastryPreviews] = useState<Record<string, { aspects: SynastryAspect[]; connection: string }>>({});

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingRelationType, setAddingRelationType] = useState<RelationshipType>('partner');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      await localDb.initialize();
      
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const saved = charts[0];
        setSavedUserChart(saved);
        
        const birthData: BirthData = {
          date: saved.birthDate,
          time: saved.birthTime,
          hasUnknownTime: saved.hasUnknownTime,
          place: saved.birthPlace,
          latitude: saved.latitude,
          longitude: saved.longitude,
          timezone: saved.timezone,
          houseSystem: saved.houseSystem,
        };
        
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        chart.id = saved.id;
        chart.name = saved.name || 'You';
        setUserChart(chart);
        
        const rels = await localDb.getRelationshipCharts(saved.id);
        setRelationships(rels);

        const previews: Record<string, { aspects: SynastryAspect[]; connection: string }> = {};
        for (const rel of rels) {
          try {
            const relBirthData: BirthData = {
              date: rel.birthDate,
              time: rel.birthTime,
              hasUnknownTime: rel.hasUnknownTime,
              place: rel.birthPlace,
              latitude: rel.latitude,
              longitude: rel.longitude,
              timezone: rel.timezone,
            };
            const otherChart = AstrologyCalculator.generateNatalChart(relBirthData);
            otherChart.name = rel.name;
            const report = SynastryEngine.calculateSynastry(chart, otherChart);
            
            const topAspects = report.aspects.filter(a => a.strength === 'strong').slice(0, 3);
            if (topAspects.length < 3) {
              const moderate = report.aspects.filter(a => a.strength === 'moderate' && !topAspects.includes(a)).slice(0, 3 - topAspects.length);
              topAspects.push(...moderate);
            }
            previews[rel.id] = { aspects: topAspects, connection: report.primaryConnection };
          } catch (e) {
            logger.error(`Failed to compute synastry preview for ${rel.name}:`, e);
          }
        }
        setSynastryPreviews(previews);
      }
    } catch (error) {
      logger.error('Failed to load relationships data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canAddMore = useCallback(() => {
    return PremiumRelationshipService.canAddChart(relationships.length, isPremium);
  }, [relationships.length, isPremium]);

  const handleAddRelationship = (type: RelationshipType) => {
    if (!canAddMore()) {
      Alert.alert(
        'One more connection',
        'Your free chart includes one relationship. Deeper Sky lets you explore unlimited connections.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Learn more', onPress: () => router.push('/(tabs)/premium' as Href) },
        ]
      );
      return;
    }
    
    setAddingRelationType(type);
    setShowAddModal(true);
    Haptics.selectionAsync().catch(() => {});
  };

  const handleSaveNewRelationship = async (birthData: BirthData, extra?: { chartName?: string }) => {
    if (!savedUserChart) return;
    
    try {
      const now = new Date().toISOString();
      const newRelationship: RelationshipChart = {
        id: generateId(),
        name: extra?.chartName || 'Someone Special',
        relationship: addingRelationType,
        birthDate: birthData.date,
        birthTime: birthData.time,
        hasUnknownTime: birthData.hasUnknownTime,
        birthPlace: birthData.place,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
        userChartId: savedUserChart.id,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      };
      
      await localDb.saveRelationshipChart(newRelationship);
      setRelationships(prev => [newRelationship, ...prev]);
      setShowAddModal(false);

      if (userChart) {
        try {
          const otherChart = AstrologyCalculator.generateNatalChart(birthData);
          otherChart.name = extra?.chartName || 'Someone Special';
          const report = SynastryEngine.calculateSynastry(userChart, otherChart);
          const topAspects = report.aspects.filter(a => a.strength === 'strong').slice(0, 3);
          if (topAspects.length < 3) {
            const moderate = report.aspects.filter(a => a.strength === 'moderate' && !topAspects.includes(a)).slice(0, 3 - topAspects.length);
            topAspects.push(...moderate);
          }
          setSynastryPreviews(prev => ({
            ...prev,
            [newRelationship.id]: { aspects: topAspects, connection: report.primaryConnection },
          }));
        } catch {}
      }

      handleSelectRelationship(newRelationship);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      logger.error('Failed to save relationship:', error);
      Alert.alert('Error', 'Failed to save relationship. Please try again.');
    }
  };

  const handleSelectRelationship = async (rel: RelationshipChart) => {
    if (!userChart) return;
    
    try {
      Haptics.selectionAsync().catch(() => {});
    
      const birthData: BirthData = {
        date: rel.birthDate, time: rel.birthTime, hasUnknownTime: rel.hasUnknownTime,
        place: rel.birthPlace, latitude: rel.latitude, longitude: rel.longitude, timezone: rel.timezone,
      };
    
      const otherChart = AstrologyCalculator.generateNatalChart(birthData);
      otherChart.name = rel.name;
    
      const synastry = SynastryEngine.calculateSynastry(userChart, otherChart);
      const insight = RelationshipInsightGenerator.generateRelationshipInsight(
        userChart, otherChart,
        rel.relationship === 'child' || rel.relationship === 'parent' ? 'parent-child' : 
          rel.relationship === 'partner' || rel.relationship === 'ex' ? 'romantic' : 'friendship',
        userChart.name || 'You', rel.name
      );

      setSelectedRelationship(rel);
      setSelectedChart(otherChart);
      setSynastryReport(synastry);
      setRelationshipInsight(insight);
      setViewMode('detail');
    
      if (isPremium) {
        const comp = PremiumRelationshipService.generateComparison(userChart, otherChart, rel.relationship, isPremium, synastry);
        setComparison(comp);
      }
    } catch (error) {
      logger.error('Failed to load relationship detail:', error);
      Alert.alert('Error', 'Failed to load relationship details. Please try again.');
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setSelectedRelationship(null);
    setSelectedChart(null);
    setSynastryReport(null);
    setRelationshipInsight(null);
    setComparison(null);
    setActiveTab('overview');
    setFilterMode({ person1: true, person2: true, cross: true });
    setSummaryPerson('them');
  };

  const handleDeleteRelationship = () => {
    if (!selectedRelationship) return;
    confirmDeleteRelationship(selectedRelationship, true);
  };

  const confirmDeleteRelationship = (rel: RelationshipChart, fromDetail: boolean = false) => {
    Alert.alert(
      'Remove Relationship',
      `Remove ${rel.name} from your relationships? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await localDb.deleteRelationshipChart(rel.id);
              setRelationships(prev => prev.filter(r => r.id !== rel.id));
              if (fromDetail) handleBack();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch (error) {
              logger.error('Failed to delete relationship:', error);
            }
          },
        },
      ]
    );
  };

  const handleLongPressRelationship = (rel: RelationshipChart) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      rel.name,
      RELATIONSHIP_LABELS[rel.relationship],
      [
        { text: 'View', onPress: () => handleSelectRelationship(rel) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDeleteRelationship(rel, false) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none"><SkiaDynamicCosmos /></View>
        <ActivityIndicator size="large" color={PALETTE.gold} />
        <Text style={styles.loadingText}>Loading relationships...</Text>
      </View>
    );
  }

  if (!userChart) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none"><SkiaDynamicCosmos /></View>
        <Ionicons name="people" size={56} color={theme.textMuted} style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>Create Your Profile First</Text>
        <Text style={styles.emptySubtitle}>Set up your birth data on the Home screen to explore relationship dynamics</Text>
      </View>
    );
  }

  // ── DETAIL VIEW ──
  if (viewMode === 'detail' && selectedRelationship && selectedChart && synastryReport) {
    const userName = userChart?.name || 'You';
    const summaryChart = summaryPerson === 'you' ? userChart : selectedChart;

    return (
      <View style={styles.container}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none"><SkiaDynamicCosmos /></View>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          
          <View style={styles.detailHeader}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={PALETTE.textMain} />
            </Pressable>
            <View style={styles.detailHeaderCenter}>
              <Text style={styles.detailTitle}>Relationship Chart</Text>
              <Text style={styles.detailSubtitle}>{userName} + {selectedRelationship.name}</Text>
            </View>
            <Pressable onPress={handleDeleteRelationship} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={22} color={PALETTE.copper} />
            </Pressable>
          </View>

          <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScrollContent}>

            {/* Person selector */}
            <View style={styles.personSelectorRow}>
              <Pressable
                style={[styles.personPill, summaryPerson === 'you' && { borderColor: `${PALETTE.gold}60`, backgroundColor: `${PALETTE.gold}15` }]}
                onPress={() => { setSummaryPerson('you'); Haptics.selectionAsync().catch(() => {}); }}
              >
                <Ionicons name="person" size={13} color={summaryPerson === 'you' ? PALETTE.gold : theme.textMuted} />
                <Text style={[styles.personPillText, summaryPerson === 'you' && { color: PALETTE.gold }]}>{userName}</Text>
              </Pressable>

              <Pressable
                style={[styles.personPill, styles.personPillPartner, summaryPerson === 'them' && { borderColor: `${PALETTE.silverBlue}60`, backgroundColor: `${PALETTE.silverBlue}15` }]}
                onPress={() => { setSummaryPerson('them'); Haptics.selectionAsync().catch(() => {}); }}
              >
                <Ionicons name="layers-outline" size={13} color={summaryPerson === 'them' ? PALETTE.silverBlue : theme.textMuted} />
                <Text style={[styles.personPillText, summaryPerson === 'them' && { color: PALETTE.silverBlue }]}>{selectedRelationship.name}</Text>
                <Text style={styles.personPillType}>{RELATIONSHIP_LABELS[selectedRelationship.relationship]}</Text>
              </Pressable>

              <Pressable style={styles.personPillAdd} onPress={() => handleBack()}>
                <Text style={styles.personPillAddText}>+ Add</Text>
              </Pressable>
            </View>

            {/* Filter pills */}
            <View style={styles.filterRow}>
              {([
                { key: 'person1' as const, label: 'Your planets', activeColor: PALETTE.gold },
                { key: 'person2' as const, label: `${selectedRelationship.name}'s`, activeColor: PALETTE.silverBlue },
                { key: 'cross' as const, label: 'Cross-aspects', activeColor: PALETTE.platinum },
              ] as const).map(pill => {
                const active = filterMode[pill.key];
                return (
                  <Pressable
                    key={pill.key}
                    style={[styles.filterPill, active && { borderColor: `${pill.activeColor}60`, backgroundColor: `${pill.activeColor}15` }]}
                    onPress={() => {
                      setFilterMode(prev => ({ ...prev, [pill.key]: !prev[pill.key] }));
                      Haptics.selectionAsync().catch(() => {});
                    }}
                  >
                    <View style={[styles.filterDot, active && { backgroundColor: pill.activeColor }]} />
                    <Text style={[styles.filterPillText, active && { color: pill.activeColor }]}>{pill.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Synastry chart wheel */}
            <View style={{ marginVertical: 12 }}>
              <NatalChartWheel
                chart={userChart!}
                overlayChart={selectedChart && selectedRelationship ? selectedChart : undefined}
                overlayName={selectedRelationship?.name}
                filterMode={filterMode}
                showAspects
              />
            </View>

            {/* Summary Bar */}
            {summaryChart && (
              <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.summaryBar}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryIcon}>☉ Sun</Text>
                  <Text style={styles.summarySign}>{(summaryChart as any).sun?.sign?.name ?? '—'}</Text>
                  <Text style={styles.summaryDetail}>
                    {typeof (summaryChart as any).sun?.degree === 'number' ? `${Math.floor((summaryChart as any).sun.degree)}°` : ''}
                  </Text>
                </View>
                <View style={styles.summarySep} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryIcon}>☽ Moon</Text>
                  <Text style={styles.summarySign}>{(summaryChart as any).moon?.sign?.name ?? '—'}</Text>
                  <Text style={styles.summaryDetail}>
                    {typeof (summaryChart as any).moon?.degree === 'number' ? `${Math.floor((summaryChart as any).moon.degree)}°` : ''}
                  </Text>
                </View>
                <View style={styles.summarySep} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryIcon}>AC Rising</Text>
                  <Text style={styles.summarySign}>{(summaryChart as any).ascendant?.sign?.name ?? '—'}</Text>
                  <Text style={styles.summaryDetail}>
                    {(summaryChart as any).ascendant?.degree != null ? `${Math.floor((summaryChart as any).ascendant.degree)}°` : ''}
                  </Text>
                </View>
              </LinearGradient>
            )}

            {/* Tabs */}
            <View style={styles.tabBar}>
              {(['overview', 'aspects', 'dynamics'] as const).map(tab => (
                <Pressable
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => { setActiveTab(tab); Haptics.selectionAsync().catch(() => {}); }}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {activeTab === 'overview' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <LinearGradient colors={['rgba(110, 191, 139, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.insightCardGradient}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Ionicons name="heart" size={20} color={PALETTE.emerald} />
                    <Text style={styles.insightCardTitle}>Your Connection</Text>
                  </View>
                  <Text style={styles.insightCardText}>{synastryReport.primaryConnection}</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(139, 196, 232, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.insightCardGradient}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Ionicons name="trending-up" size={20} color={PALETTE.silverBlue} />
                    <Text style={styles.insightCardTitle}>Your Growth Edge</Text>
                  </View>
                  <Text style={styles.insightCardText}>{synastryReport.primaryChallenge}</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(232, 214, 174, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.insightCardGradient}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Ionicons name="pulse" size={20} color={PALETTE.gold} />
                    <Text style={styles.insightCardTitle}>Overall Dynamic</Text>
                  </View>
                  <Text style={styles.insightCardText}>{synastryReport.overallDynamic}</Text>
                </LinearGradient>

                {isPremium && comparison && (
                  <>
                    <Text style={styles.sectionHeader}>What Each Person Needs</Text>
                    <NeedsComparison person1Name={userChart.name || 'You'} person1Needs={comparison.person1Needs} person2Name={selectedRelationship.name} person2Needs={comparison.person2Needs} />
                    <View style={styles.reminderCard}>
                      <Text style={styles.reminderText}>"{comparison.reminder}"</Text>
                    </View>
                  </>
                )}

                {!isPremium && (
                  <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                    <LinearGradient colors={['rgba(232, 214, 174, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.upsellGradient}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Ionicons name="sparkles" size={18} color={PALETTE.gold} />
                        <Text style={styles.upsellTitle}>There's more between you</Text>
                      </View>
                      <Text style={styles.upsellText}>Communication styles, emotional needs comparison, and healing paths for this relationship — with Deeper Sky.</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.gold }}>See the full picture</Text>
                        <Ionicons name="arrow-forward" size={16} color={PALETTE.gold} />
                      </View>
                    </LinearGradient>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {activeTab === 'aspects' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <Text style={styles.sectionHeader}>Key Aspects</Text>
                {synastryReport.connectionAspects.slice(0, isPremium ? 10 : 2).map((a, i) => <AspectRow key={`conn-${i}`} description={`Your ${a.person1Planet.planet.name} ${a.aspectType.symbol} their ${a.person2Planet.planet.name}`} title={a.title} category={a.category} strength={a.strength} detail={a.description} />)}
                {synastryReport.chemistryAspects.slice(0, isPremium ? 10 : 2).map((a, i) => <AspectRow key={`chem-${i}`} description={`Your ${a.person1Planet.planet.name} ${a.aspectType.symbol} their ${a.person2Planet.planet.name}`} title={a.title} category={a.category} strength={a.strength} detail={a.description} />)}
                {synastryReport.challengeAspects.slice(0, isPremium ? 10 : 2).map((a, i) => <AspectRow key={`grow-${i}`} description={`Your ${a.person1Planet.planet.name} ${a.aspectType.symbol} their ${a.person2Planet.planet.name}`} title={a.title} category={a.category} strength={a.strength} detail={a.description} />)}

                {!isPremium && synastryReport.aspects.length > 4 && (
                  <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                    <LinearGradient colors={['rgba(232, 214, 174, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.upsellGradient}>
                      <Text style={styles.upsellTitle}>+{synastryReport.aspects.length - 4} more planetary connections</Text>
                      <Text style={styles.upsellText}>Deeper aspects reveal hidden dynamics — the subtle threads that make this relationship unique.</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.gold }}>Unlock all aspects</Text>
                        <Ionicons name="arrow-forward" size={16} color={PALETTE.gold} />
                      </View>
                    </LinearGradient>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {activeTab === 'dynamics' && relationshipInsight && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.dynamicCard}>
                  <Text style={styles.dynamicLabel}>How You Show Love</Text>
                  <Text style={styles.dynamicText}>{relationshipInsight.dynamics.howYouShowLove}</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.dynamicCard}>
                  <Text style={styles.dynamicLabel}>How {selectedRelationship.name} Feels Safe</Text>
                  <Text style={styles.dynamicText}>{relationshipInsight.dynamics.howTheyFeelSafe}</Text>
                </LinearGradient>

                {relationshipInsight.dynamics.whereYouMisreadEachOther.length > 0 && (
                  <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.dynamicCard}>
                    <Text style={styles.dynamicLabel}>Where You Might Misread Each Other</Text>
                    {relationshipInsight.dynamics.whereYouMisreadEachOther.map((item, i) => (
                      <View key={i} style={styles.bulletItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </LinearGradient>
                )}

                <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.dynamicCard}>
                  <Text style={styles.dynamicLabel}>How to Repair After Conflict</Text>
                  <Text style={styles.dynamicText}>{relationshipInsight.dynamics.howToRepairConflict}</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.dynamicCard}>
                  <Text style={styles.dynamicLabel}>Emotional Pacing</Text>
                  <Text style={styles.dynamicText}>{relationshipInsight.dynamics.differentEmotionalPacing}</Text>
                </LinearGradient>

                {isPremium && comparison && (
                  <>
                    <Text style={styles.sectionHeader}>Communication Styles</Text>
                    <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.dynamicCard}>
                      <Text style={styles.dynamicLabel}>Your Style</Text>
                      <Text style={styles.dynamicText}>{comparison.communicationDynamics.person1Style}</Text>
                      <Text style={[styles.dynamicLabel, { marginTop: 16 }]}>Their Style</Text>
                      <Text style={styles.dynamicText}>{comparison.communicationDynamics.person2Style}</Text>
                      <Text style={[styles.dynamicLabel, { marginTop: 16 }]}>The Dynamic</Text>
                      <Text style={styles.dynamicText}>{comparison.communicationDynamics.dynamicDescription}</Text>
                    </LinearGradient>

                    <Text style={styles.sectionHeader}>Tips for Connection</Text>
                    <View style={styles.tipCard}>
                      <Ionicons name="bulb" size={20} color={PALETTE.gold} />
                      <Text style={styles.tipText}>{comparison.communicationDynamics.tipForPerson1}</Text>
                    </View>
                  </>
                )}
              </Animated.View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── LIST VIEW ──
  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none"><SkiaDynamicCosmos /></View>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Relationships</Text>
          <Text style={styles.subtitle}>Understanding, not compatibility scores</Text>
        </Animated.View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {relationships.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <Text style={styles.listSectionTitle}>Your People</Text>
              {relationships.map(rel => {
                const preview = synastryPreviews[rel.id];
                return (
                  <Pressable key={rel.id} onPress={() => handleSelectRelationship(rel)} onLongPress={() => handleLongPressRelationship(rel)}>
                    <LinearGradient colors={['rgba(14,24,48,0.40)', 'rgba(2,8,23,0.60)']} style={styles.relationshipCardGradient}>
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.relationshipIcon}>
                          <Ionicons name={RELATIONSHIP_ICONS[rel.relationship]} size={22} color={PALETTE.gold} />
                        </View>
                        <View style={styles.relationshipInfo}>
                          <Text style={styles.relationshipName}>{rel.name}</Text>
                          <Text style={styles.relationshipType}>{RELATIONSHIP_LABELS[rel.relationship]}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                      </View>

                      {preview && preview.aspects.length > 0 && (
                        <View style={styles.previewSection}>
                          <View style={styles.previewDivider} />
                          {preview.aspects.map((aspect, i) => {
                            const catColors: Record<string, string> = { connection: PALETTE.emerald, chemistry: PALETTE.rose, growth: PALETTE.silverBlue, challenge: PALETTE.copper };
                            const catColor = catColors[aspect.category] || theme.textMuted;
                            return (
                              <View key={i} style={styles.previewAspectRow}>
                                <View style={[styles.previewDot, { backgroundColor: catColor }]} />
                                <Text style={styles.previewPlanets} numberOfLines={1}>{aspect.person1Planet.planet.name} {aspect.aspectType.symbol} {aspect.person2Planet.planet.name}</Text>
                                <Text style={[styles.previewCategory, { color: catColor }]}>{aspect.category}</Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={[styles.listSectionTitle, relationships.length === 0 && { marginTop: 0 }]}>
              {relationships.length > 0 ? 'Add Another' : 'Add a Relationship'}
            </Text>
            <Text style={styles.listSectionSubtitle}>Compare charts to understand your dynamics</Text>

            <View style={styles.typeGrid}>
              {(['partner', 'parent', 'child', 'friend', 'sibling', 'other'] as RelationshipType[]).map(type => (
                <Pressable key={type} style={styles.typeButton} onPress={() => handleAddRelationship(type)}>
                  <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={styles.typeIconContainer}>
                    <Ionicons name={RELATIONSHIP_ICONS[type]} size={24} color={PALETTE.silverBlue} />
                  </LinearGradient>
                  <Text style={styles.typeLabel}>{RELATIONSHIP_LABELS[type]}</Text>
                </Pressable>
              ))}
            </View>

            {!isPremium && (
              <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                <View style={styles.limitIndicator}>
                  <Ionicons name="sparkles" size={14} color={PALETTE.gold} />
                  <Text style={styles.limitText}>
                    {relationships.length === 0 ? 'Free includes 1 relationship chart · Deeper Sky unlocks unlimited' : 'Deeper Sky unlocks unlimited charts'}
                  </Text>
                </View>
              </Pressable>
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={{ marginTop: 32 }}>
            <LinearGradient colors={['rgba(35, 40, 55, 0.3)', 'rgba(2,8,23,0.50)']} style={styles.discoverSection}>
              <Text style={styles.discoverTitle}>What You'll Discover</Text>
              
              <View style={styles.discoverItem}>
                <Ionicons name="chatbubbles" size={20} color={PALETTE.silverBlue} />
                <View style={styles.discoverContent}>
                  <Text style={styles.discoverItemTitle}>Communication Styles</Text>
                  <Text style={styles.discoverItemText}>How you each process and express</Text>
                </View>
              </View>

              <View style={styles.discoverItem}>
                <Ionicons name="heart" size={20} color={PALETTE.rose} />
                <View style={styles.discoverContent}>
                  <Text style={styles.discoverItemTitle}>Emotional Needs</Text>
                  <Text style={styles.discoverItemText}>What makes each person feel safe</Text>
                </View>
              </View>

              <View style={styles.discoverItem}>
                <Ionicons name="git-merge" size={20} color={PALETTE.copper} />
                <View style={styles.discoverContent}>
                  <Text style={styles.discoverItemTitle}>Sources of Ease & Tension</Text>
                  <Text style={styles.discoverItemText}>Where you flow and where you grow</Text>
                </View>
              </View>

              <View style={styles.discoverItem}>
                <Ionicons name="refresh" size={20} color={PALETTE.emerald} />
                <View style={styles.discoverContent}>
                  <Text style={styles.discoverItemTitle}>Repair Strategies</Text>
                  <Text style={styles.discoverItemText}>How to reconnect after conflict</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      <BirthDataModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveNewRelationship}
        initialData={undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020817' },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 40 },
  safeArea: { flex: 1 },
  loadingText: { marginTop: 16, color: theme.textMuted, fontSize: 15, fontStyle: 'italic' },
  emptyTitle: { marginTop: 16, fontSize: 24, fontWeight: '600', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  emptySubtitle: { marginTop: 12, fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 34, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: theme.textSecondary, fontStyle: 'italic', marginTop: 6 },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  
  listSectionTitle: { fontSize: 22, color: PALETTE.textMain, marginTop: 24, marginBottom: 6, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  listSectionSubtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 20 },
  
  relationshipCardGradient: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, borderTopColor: PALETTE.glassHighlight, marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  relationshipIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(232, 214, 174, 0.1)', justifyContent: 'center', alignItems: 'center' },
  relationshipInfo: { flex: 1, marginLeft: 16 },
  relationshipName: { fontSize: 18, fontWeight: '600', color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }), marginBottom: 2 },
  relationshipType: { fontSize: 13, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  typeButton: { width: '33.33%', padding: 6 },
  typeIconContainer: { borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: PALETTE.glassBorder },
  typeLabel: { marginTop: 10, fontSize: 13, color: theme.textSecondary, textAlign: 'center', fontWeight: '500' },
  
  limitIndicator: { marginTop: 20, padding: 16, backgroundColor: 'rgba(232, 214, 174, 0.1)', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(232,214,174,0.18)' },
  limitText: { fontSize: 13, color: PALETTE.gold, textAlign: 'center', fontWeight: '600' },
  
  discoverSection: { padding: 24, borderRadius: 24, borderWidth: 1, borderColor: PALETTE.glassBorder },
  discoverTitle: { fontSize: 20, color: PALETTE.textMain, marginBottom: 20, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  discoverItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  discoverContent: { flex: 1, marginLeft: 16 },
  discoverItemTitle: { fontSize: 15, fontWeight: '600', color: PALETTE.textMain, marginBottom: 4 },
  discoverItemText: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },

  // Detail view styles
  detailHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
  backButton: { padding: 8 },
  detailHeaderCenter: { flex: 1, alignItems: 'center' },
  detailTitle: { fontSize: 18, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  detailSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 4, fontStyle: 'italic' },
  deleteButton: { padding: 8 },
  detailScroll: { flex: 1 },
  detailScrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  personSelectorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  personPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'rgba(255,255,255,0.04)' },
  personPillPartner: { flex: 1 },
  personPillActive: { borderColor: 'rgba(230, 213, 184, 0.4)', backgroundColor: 'rgba(230, 213, 184, 0.1)' },
  personPillText: { fontSize: 14, fontWeight: '600', color: theme.textMuted },
  personPillType: { fontSize: 11, color: theme.textMuted, fontStyle: 'italic', marginLeft: 4 },
  personPillAdd: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(230, 213, 184, 0.3)', borderStyle: 'dashed' },
  personPillAddText: { fontSize: 14, fontWeight: '600', color: PALETTE.gold },

  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginVertical: 16 },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, backgroundColor: 'rgba(255,255,255,0.04)' },
  filterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  filterPillText: { fontSize: 12, color: theme.textMuted, fontWeight: '600' },

  summaryBar: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, borderTopColor: PALETTE.glassHighlight, paddingVertical: 20, paddingHorizontal: 12, marginTop: 12, marginBottom: 24 },
  summaryCol: { flex: 1, alignItems: 'center', gap: 4 },
  summarySep: { width: 1, height: 48, backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },
  summaryIcon: { fontSize: 11, color: theme.textMuted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  summarySign: { fontSize: 16, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  summaryDetail: { fontSize: 12, color: theme.textSecondary },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: PALETTE.glassBorder, marginBottom: 16 },
  tab: { paddingVertical: 14, paddingHorizontal: 16, marginRight: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: PALETTE.gold },
  tabText: { fontSize: 15, color: theme.textMuted, fontWeight: '600' },
  tabTextActive: { color: PALETTE.gold },
  
  insightCardGradient: { padding: 24, borderRadius: 20, borderWidth: 1, borderColor: PALETTE.glassBorder, borderTopColor: PALETTE.glassHighlight, marginBottom: 16 },
  insightCardTitle: { fontSize: 18, color: PALETTE.textMain, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  insightCardText: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
  sectionHeader: { fontSize: 18, color: PALETTE.textMain, marginTop: 24, marginBottom: 16, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  
  reminderCard: { marginTop: 24, padding: 20, backgroundColor: 'rgba(232,214,174,0.08)', borderRadius: 16, borderLeftWidth: 3, borderLeftColor: PALETTE.gold },
  reminderText: { fontSize: 16, color: PALETTE.textMain, fontStyle: 'italic', lineHeight: 24, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }) },
  
  upsellGradient: { padding: 24, alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(232,214,174,0.18)', marginTop: 24 },
  upsellTitle: { fontSize: 16, fontWeight: '600', color: PALETTE.gold },
  upsellText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 20 },

  dynamicCard: { borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: PALETTE.glassBorder, borderTopColor: PALETTE.glassHighlight },
  dynamicLabel: { fontSize: 12, fontWeight: '700', color: PALETTE.gold, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  dynamicText: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.gold, marginTop: 8, marginRight: 12 },
  bulletText: { flex: 1, fontSize: 15, color: theme.textSecondary, lineHeight: 22 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(232, 214, 174, 0.1)', borderRadius: 16, padding: 20, marginBottom: 16 },
  tipText: { flex: 1, fontSize: 15, color: PALETTE.textMain, marginLeft: 16, lineHeight: 22 },

  previewSection: { marginTop: 6 },
  previewDivider: { height: 1, backgroundColor: 'rgba(232, 214, 174, 0.15)', marginVertical: 12 },
  previewAspectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  previewDot: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  previewPlanets: { flex: 1, fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
  previewCategory: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});
