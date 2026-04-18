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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkiaGradient as LinearGradient } from '../../components/ui/SkiaGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/core';

import { type AppTheme } from '../../constants/theme';
import { SkiaDynamicCosmos } from '../../components/ui/SkiaDynamicCosmos';
import BirthDataModal from '../../components/BirthDataModal';
import { localDb } from '../../services/storage/localDb';
import { SavedChart, RelationshipChart, generateId } from '../../services/storage/models';
import { BirthData, NatalChart } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { AstrologySettingsService } from '../../services/astrology/astrologySettingsService';
import { SynastryEngine, SynastryReport, SynastryAspect } from '../../services/astrology/synastryEngine';
import { RelationshipInsightGenerator, RelationshipInsight } from '../../services/astrology/relationshipInsights';
import { PremiumRelationshipService, RelationshipComparison } from '../../services/premium/relationshipCharts';
import { exportChartToPdf } from '../../services/premium/pdfExport';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';
import NeedsComparison from '../../components/ui/NeedsComparison';
import AspectRow from '../../components/ui/AspectRow';
import { MetallicIcon } from '../../components/ui/MetallicIcon';
import { MetallicText } from '../../components/ui/MetallicText';
import NatalChartWheel from '../../components/ui/NatalChartWheel';
import { useSceneStore } from '../../store/sceneStore';
import { useResonanceStore } from '../../store/resonanceStore';
import { GoldSubtitle } from '../../components/ui/GoldSubtitle';
import { useAppTheme, useThemedStyles } from '../../context/ThemeContext';

// ── Cinematic Palette ──


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
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
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
  const [chartViewMode, setChartViewMode] = useState<'mine' | 'synastry' | 'theirs'>('synastry');
  
  // Synastry preview for list cards
  const [synastryPreviews, setSynastryPreviews] = useState<Record<string, { aspects: SynastryAspect[]; connection: string }>>({});

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingRelationType, setAddingRelationType] = useState<RelationshipType>('partner');

  const setActiveScene = useSceneStore((s) => s.setActiveScene);
  const clearScene     = useSceneStore((s) => s.clearScene);
  const syncData       = useResonanceStore((s) => s.syncData);

  useFocusEffect(
    useCallback(() => {
      loadData().catch(() => {});
      setActiveScene('RESONANCE_HELIX');
      syncData().catch(() => {});
      return () => clearScene();
    }, [setActiveScene, syncData, clearScene])
  );

  const loadData = async () => {
    try {
      await localDb.initialize();
      
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const saved = charts[0];
        setSavedUserChart(saved);
        const astroSettings = await AstrologySettingsService.getSettings();
        
        const birthData: BirthData = {
          date: saved.birthDate,
          time: saved.birthTime,
          hasUnknownTime: saved.hasUnknownTime,
          place: saved.birthPlace,
          latitude: saved.latitude,
          longitude: saved.longitude,
          timezone: saved.timezone,
          houseSystem: astroSettings.houseSystem,
          zodiacSystem: astroSettings.zodiacSystem,
          orbPreset: astroSettings.orbPreset,
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
              houseSystem: astroSettings.houseSystem,
              zodiacSystem: astroSettings.zodiacSystem,
              orbPreset: astroSettings.orbPreset,
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
        'You want to understand them better',
        'That curiosity matters. Deeper Sky lets you explore unlimited relationship charts — partners, family, friends — so you can see the patterns that shape how you connect.',

        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Unlock Deeper Sky', onPress: () => router.push('/(tabs)/premium' as Href) },
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
      setRelationships(prev => [...prev, newRelationship]);
      setShowAddModal(false);

      if (userChart) {
        try {
          const saveAstroSettings = await AstrologySettingsService.getSettings();
          const otherChart = AstrologyCalculator.generateNatalChart({ ...birthData, houseSystem: saveAstroSettings.houseSystem, zodiacSystem: saveAstroSettings.zodiacSystem, orbPreset: saveAstroSettings.orbPreset });
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

    // Reset detail UI state before loading new relationship
    setActiveTab('overview');
    setChartViewMode('synastry');
    setSummaryPerson('them');
    setFilterMode({ person1: true, person2: true, cross: true });
    setComparison(null);
    
    try {
      Haptics.selectionAsync().catch(() => {});
    
      const astroSettings = await AstrologySettingsService.getSettings();
      const birthData: BirthData = {
        date: rel.birthDate, time: rel.birthTime, hasUnknownTime: rel.hasUnknownTime,
        place: rel.birthPlace, latitude: rel.latitude, longitude: rel.longitude, timezone: rel.timezone,
        houseSystem: astroSettings.houseSystem,
        zodiacSystem: astroSettings.zodiacSystem,
        orbPreset: astroSettings.orbPreset,
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
    setChartViewMode('synastry');
  };

  const handleExportPdf = useCallback(async () => {
    if (!isPremium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/(tabs)/premium' as Href);
      return;
    }
    if (!selectedChart || isExporting) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);

    try {
      await exportChartToPdf(selectedChart);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      logger.error('[Relationships] PDF export failed:', err);
      Alert.alert('Export failed', 'Something went wrong generating the PDF. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsExporting(false);
    }
  }, [isPremium, selectedChart, isExporting, router]);

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
        <SkiaDynamicCosmos />
        <ActivityIndicator size="large" color={theme.textGold} />
        <Text style={styles.loadingText}>Loading relationships...</Text>
      </View>
    );
  }

  if (!userChart) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="people-outline" size={56} color={theme.textMuted} style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>Create Your Profile First</Text>
        <Text style={styles.emptySubtitle}>Set up your birth data on the Home screen to explore relationship dynamics</Text>
      </View>
    );
  }

  // ── DETAIL VIEW ──
  if (viewMode === 'detail' && selectedRelationship && selectedChart && synastryReport) {
    const userName = userChart?.name || 'You';
    const summaryChart = chartViewMode === 'mine' ? userChart : chartViewMode === 'theirs' ? selectedChart : summaryPerson === 'you' ? userChart : selectedChart;

    return (
      <View style={styles.container}>
        <SkiaDynamicCosmos />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          
          <View style={styles.detailHeader}>
            <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="chevron-back-outline" size={24} color={theme.textPrimary} />
            </Pressable>
            <View style={styles.detailHeaderCenter}>
              <Text style={styles.detailTitle}>Relationship Chart</Text>
              <Text style={styles.detailSubtitle}>{userName} + {selectedRelationship.name}</Text>
            </View>
            <Pressable onPress={handleExportPdf} disabled={isExporting} style={styles.exportButton} accessibilityRole="button" accessibilityLabel="Export PDF">
              {isExporting
                ? <ActivityIndicator size="small" color={theme.textGold} />
                : <MetallicIcon name="share-outline" size={22} variant="gold" />}
            </Pressable>
            <Pressable onPress={handleDeleteRelationship} style={styles.deleteButton} accessibilityRole="button" accessibilityLabel="Delete relationship">
              <MetallicIcon name="trash-outline" size={22} color="#CD7F5D" />
            </Pressable>
          </View>

          <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScrollContent}>

            {/* Chart view mode toggle */}
            <View style={styles.chartViewToggle}>
              {([
                { key: 'mine' as const, label: userName },
                { key: 'synastry' as const, label: 'Synastry' },
                { key: 'theirs' as const, label: selectedRelationship.name },
              ]).map((seg, idx) => {
                const isActive = chartViewMode === seg.key;
                const isFirst = idx === 0;
                const isLast = idx === 2;
                return (
                  <Pressable
                    key={seg.key}
                    style={[
                      styles.chartViewSegment,
                      isFirst && styles.chartViewSegmentFirst,
                      isLast && styles.chartViewSegmentLast,
                      isActive && styles.chartViewSegmentActive,
                    ]}
                    onPress={() => { setChartViewMode(seg.key); Haptics.selectionAsync().catch(() => {}); }}
                  >
                    <Text style={[styles.chartViewSegmentText, isActive && styles.chartViewSegmentTextActive]} numberOfLines={1}>{seg.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Person selector — only shown in synastry mode */}
            {chartViewMode === 'synastry' && <View style={styles.personSelectorRow}>
              <Pressable
                style={[styles.personPill, summaryPerson === 'you' && { borderColor: `${theme.textGold}60`, backgroundColor: `${theme.textGold}15` }]}
                onPress={() => { setSummaryPerson('you'); Haptics.selectionAsync().catch(() => {}); }}
              >
                <Ionicons name="person-outline" size={13} color={summaryPerson === 'you' ? theme.textGold : theme.textMuted} />
                <Text style={[styles.personPillText, summaryPerson === 'you' && { color: theme.textGold }]}>{userName}</Text>
              </Pressable>

              <Pressable
                style={[styles.personPill, styles.personPillPartner, summaryPerson === 'them' && { borderColor: `${'#D4AF37'}60`, backgroundColor: `${'#D4AF37'}15` }]}
                onPress={() => { setSummaryPerson('them'); Haptics.selectionAsync().catch(() => {}); }}
              >
                {summaryPerson === 'them' ? <MetallicIcon name="layers-outline" size={13} color="#D4AF37" /> : <Ionicons name="layers-outline" size={13} color={theme.textMuted} />}
                {summaryPerson === 'them' ? <MetallicText style={styles.personPillText} color="#D4AF37">{selectedRelationship.name}</MetallicText> : <Text style={styles.personPillText}>{selectedRelationship.name}</Text>}
                <Text style={styles.personPillType}>{RELATIONSHIP_LABELS[selectedRelationship.relationship]}</Text>
              </Pressable>

              <Pressable style={styles.personPillAdd} onPress={() => { setAddingRelationType('partner'); setShowAddModal(true); Haptics.selectionAsync().catch(() => {}); }}>
                <Text style={styles.personPillAddText}>+ Add</Text>
              </Pressable>
            </View>}

            {/* Filter pills — only in synastry mode */}
            {chartViewMode === 'synastry' && <View style={styles.filterRow}>
              {([
                { key: 'person1' as const, label: 'Your planets', activeColor: theme.textGold },
                { key: 'person2' as const, label: `${selectedRelationship.name}'s`, activeColor: '#D4AF37' },
                { key: 'cross' as const, label: 'Cross-aspects', activeColor: '#E5E4E2' },
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
            </View>}

            {/* Chart wheel */}
            <View style={{ marginVertical: 12 }}>
              <NatalChartWheel
                chart={chartViewMode === 'theirs' ? selectedChart! : userChart!}
                overlayChart={chartViewMode === 'synastry' ? selectedChart : undefined}
                overlayName={chartViewMode === 'synastry' ? selectedRelationship?.name : undefined}
                filterMode={chartViewMode === 'synastry' ? filterMode : { person1: true, person2: false, cross: false }}
                showAspects={chartViewMode === 'synastry'}
              />
            </View>

            {/* Summary Bar */}
            {summaryChart && (
              <>
              <Text style={styles.summaryOwnerLabel}>
                {chartViewMode === 'mine' ? userName : chartViewMode === 'theirs' ? selectedRelationship.name : summaryPerson === 'you' ? userName : selectedRelationship.name}
              </Text>
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
              </>
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
                <LinearGradient colors={['rgba(122, 144, 168, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.insightCardGradient}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <MetallicIcon name="heart-outline" size={20} color="#7A90A8" />
                    <Text style={styles.insightCardTitle}>Your Connection</Text>
                  </View>
                  <Text style={styles.insightCardText}>{synastryReport.primaryConnection}</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(162, 194, 225, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.insightCardGradient}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <MetallicIcon name="trending-up-outline" size={20} color="#D4AF37" />
                    <Text style={styles.insightCardTitle}>Your Growth Edge</Text>
                  </View>
                  <Text style={styles.insightCardText}>{synastryReport.primaryChallenge}</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(232, 214, 174, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.insightCardGradient}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Ionicons name="pulse-outline" size={20} color={theme.textGold} />
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
                        <Ionicons name="sparkles-outline" size={18} color={theme.textGold} />
                        <Text style={styles.upsellTitle}>There's more between you</Text>
                      </View>
                      <Text style={styles.upsellText}>Communication styles, emotional needs comparison, and growth themes for this relationship — with Deeper Sky.</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                        <MetallicText style={{ fontSize: 14, fontWeight: '600' }} variant="gold">See the full picture</MetallicText>
                        <MetallicIcon name="arrow-forward-outline" size={16} variant="gold" />
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

                {!isPremium && synastryReport.aspects.length > 6 && (
                  <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                    <LinearGradient colors={['rgba(232, 214, 174, 0.15)', 'rgba(2,8,23,0.60)']} style={styles.upsellGradient}>
                      <Text style={styles.upsellTitle}>+{synastryReport.aspects.length - 6} hidden connections between you</Text>
                      <Text style={styles.upsellText}>The aspects you can't see yet often explain the tensions, attractions, and unspoken dynamics that shape this relationship most.</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
                        <MetallicText style={{ fontSize: 14, fontWeight: '600' }} variant="gold">Unlock all aspects</MetallicText>
                        <MetallicIcon name="arrow-forward-outline" size={16} variant="gold" />
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
                      <Ionicons name="bulb-outline" size={20} color={theme.textGold} />
                      <Text style={styles.tipText}>{comparison.communicationDynamics.tipForPerson1}</Text>
                    </View>
                  </>
                )}
              </Animated.View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ── LIST VIEW ──
  return (
    <View style={styles.container}>
      <SkiaDynamicCosmos />

      {/* Nebula depth — atmospheric glow orbs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.glowOrb, { top: -60, right: -60, backgroundColor: 'rgba(110, 140, 180, 0.12)' }]} />
        <View style={[styles.glowOrb, { bottom: 160, left: -120, backgroundColor: 'rgba(212, 175, 55, 0.06)' }]} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Relationships</Text>
          <GoldSubtitle style={styles.subtitle}>Understanding, not compatibility scores</GoldSubtitle>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                          <Ionicons name={RELATIONSHIP_ICONS[rel.relationship]} size={22} color={theme.textGold} />
                        </View>
                        <View style={styles.relationshipInfo}>
                          <Text style={styles.relationshipName}>{rel.name}</Text>
                          <Text style={styles.relationshipType}>{RELATIONSHIP_LABELS[rel.relationship]}</Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={20} color={theme.textMuted} />
                      </View>

                      {preview && preview.aspects.length > 0 && (
                        <View style={styles.previewSection}>
                          <View style={styles.previewDivider} />
                          {preview.aspects.map((aspect, i) => {
                            const catColors: Record<string, string> = { connection: '#7A90A8', chemistry: '#D4A3B3', growth: '#D4AF37', challenge: '#CD7F5D' };
                            const catColor = catColors[aspect.category] || theme.textMuted;
                            return (
                              <View key={i} style={styles.previewAspectRow}>
                                <View style={[styles.previewDot, { backgroundColor: catColor }]} />
                                <Text style={styles.previewPlanets} numberOfLines={1}>{aspect.person1Planet.planet.name} {aspect.aspectType.symbol} {aspect.person2Planet.planet.name}</Text>
                                <MetallicText style={styles.previewCategory} color={catColor}>{aspect.category}</MetallicText>
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
              {(['partner', 'ex', 'parent', 'child', 'friend', 'sibling', 'other'] as RelationshipType[]).map(type => (
                <Pressable key={type} style={styles.typeButton} onPress={() => handleAddRelationship(type)}>
                  <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={styles.typeIconContainer}>
                    <MetallicIcon name={RELATIONSHIP_ICONS[type]} size={24} color="#D4AF37" />
                  </LinearGradient>
                  <Text style={styles.typeLabel}>{RELATIONSHIP_LABELS[type]}</Text>
                </Pressable>
              ))}
            </View>

            {!isPremium && (
              <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                <View style={styles.limitIndicator}>
                  <Ionicons name="sparkles-outline" size={14} color={theme.textGold} />
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
                <MetallicIcon name="chatbubbles-outline" size={20} color="#D4AF37" />
                <View style={styles.discoverContent}>
                  <Text style={styles.discoverItemTitle}>Communication Styles</Text>
                  <Text style={styles.discoverItemText}>How you each process and express</Text>
                </View>
              </View>

              <View style={styles.discoverItem}>
                <MetallicIcon name="heart-outline" size={20} color="#D4A3B3" />
                <View style={styles.discoverContent}>
                  <Text style={styles.discoverItemTitle}>Emotional Needs</Text>
                  <Text style={styles.discoverItemText}>What makes each person feel safe</Text>
                </View>
              </View>

              <View style={styles.discoverItem}>
                <MetallicIcon name="git-merge-outline" size={20} color="#CD7F5D" />
                <View style={styles.discoverContent}>
                  <Text style={styles.discoverItemTitle}>Sources of Ease & Tension</Text>
                  <Text style={styles.discoverItemText}>Where you flow and where you grow</Text>
                </View>
              </View>

              <View style={styles.discoverItem}>
                <MetallicIcon name="refresh-outline" size={20} color="#7A90A8" />
                <View style={styles.discoverContent}>
                  <Text style={styles.discoverItemTitle}>Repair Strategies</Text>
                  <Text style={styles.discoverItemText}>How to reconnect after conflict</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
          <View style={{ height: 16 }} />
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 40 },
  safeArea: { flex: 1 },
  glowOrb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
  loadingText: { marginTop: 16, color: theme.textMuted, fontSize: 15,  },
  emptyTitle: { marginTop: 16, fontSize: 24, fontWeight: '700', color: theme.textPrimary },
  emptySubtitle: { marginTop: 12, fontSize: 15, color: theme.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 34, fontWeight: '800', color: theme.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 140 },
  
  listSectionTitle: { fontSize: 22, fontWeight: '700', color: theme.textPrimary, marginTop: 24, marginBottom: 6 },
  listSectionSubtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 20 },
  
  relationshipCardGradient: { padding: 28, borderRadius: 24, borderWidth: 1, borderColor: theme.cardBorder, borderTopColor: theme.cardHighlight, marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  relationshipIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  relationshipInfo: { flex: 1, marginLeft: 16 },
  relationshipName: { fontSize: 18, fontWeight: '700', color: theme.textPrimary, marginBottom: 2 },
  relationshipType: { fontSize: 13, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  typeButton: { width: '33.33%', padding: 6 },
  typeIconContainer: { borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder },
  typeLabel: { marginTop: 10, fontSize: 13, color: theme.textSecondary, textAlign: 'center', fontWeight: '500' },
  
  limitIndicator: { marginTop: 20, padding: 16, backgroundColor: 'transparent', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(232,214,174,0.18)' },
  limitText: { fontSize: 13, color: theme.textGold, textAlign: 'center', fontWeight: '600' },
  
  discoverSection: { padding: 24, borderRadius: 24, borderWidth: 1, borderColor: theme.cardBorder },
  discoverTitle: { fontSize: 20, fontWeight: '700', color: theme.textPrimary, marginBottom: 20 },
  discoverItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  discoverContent: { flex: 1, marginLeft: 16 },
  discoverItemTitle: { fontSize: 15, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
  discoverItemText: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },

  chartViewToggle: { flexDirection: 'row', borderRadius: 20, borderWidth: 1, borderColor: theme.cardBorder, overflow: 'hidden', marginBottom: 16 },
  chartViewSegment: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderRightWidth: 1, borderRightColor: theme.cardBorder },
  chartViewSegmentFirst: { borderRightWidth: 1, borderRightColor: theme.cardBorder },
  chartViewSegmentLast: { borderRightWidth: 0 },
  chartViewSegmentActive: { backgroundColor: `${theme.textGold}18` },
  chartViewSegmentText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
  chartViewSegmentTextActive: { color: theme.textGold },

  // Detail view styles
  detailHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.08)' },
  backButton: { padding: 8 },
  detailHeaderCenter: { flex: 1, alignItems: 'center' },
  detailTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  detailSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 4,  },
  exportButton: { padding: 8 },
  deleteButton: { padding: 8 },
  detailScroll: { flex: 1 },
  detailScrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 140 },

  personSelectorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  personPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: 'transparent' },
  personPillPartner: { flex: 1 },
  personPillActive: { borderColor: 'rgba(230, 213, 184, 0.4)', backgroundColor: 'rgba(230, 213, 184, 0.1)' },
  personPillText: { fontSize: 14, fontWeight: '600', color: theme.textMuted },
  personPillType: { fontSize: 11, color: theme.textMuted, marginLeft: 4 },
  personPillAdd: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(230, 213, 184, 0.34)', backgroundColor: 'rgba(230, 213, 184, 0.08)' },
  personPillAddText: { fontSize: 14, fontWeight: '600', color: theme.textGold },

  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 16 },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: 'transparent' },
  filterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  filterPillText: { fontSize: 12, color: theme.textMuted, fontWeight: '600' },

  summaryOwnerLabel: { fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginTop: 12, marginBottom: 6 },
  summaryBar: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 24, borderWidth: 1, borderColor: theme.cardBorder, paddingVertical: 20, paddingHorizontal: 12, marginBottom: 24 },
  summaryCol: { flex: 1, alignItems: 'center', gap: 4 },
  summarySep: { width: 1, height: 48, backgroundColor: 'transparent', alignSelf: 'center' },
  summaryIcon: { fontSize: 11, color: theme.textMuted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  summarySign: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
  summaryDetail: { fontSize: 12, color: theme.textSecondary, fontVariant: ['tabular-nums'] },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.cardBorder, marginBottom: 16 },
  tab: { paddingVertical: 14, paddingHorizontal: 16, marginRight: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.textGold },
  tabText: { fontSize: 15, color: theme.textMuted, fontWeight: '600' },
  tabTextActive: { color: theme.textGold },
  
  insightCardGradient: { padding: 24, borderRadius: 24, borderWidth: 1, borderColor: theme.cardBorder, borderTopColor: theme.cardHighlight, marginBottom: 16 },
  insightCardTitle: { fontSize: 18, fontWeight: '700', color: theme.textPrimary },
  insightCardText: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
  sectionHeader: { fontSize: 19, fontWeight: '700', color: theme.textPrimary, marginTop: 24, marginBottom: 16 },
  
  reminderCard: { marginTop: 24, padding: 24, backgroundColor: 'transparent', borderRadius: 24, borderLeftWidth: 3, borderLeftColor: theme.textGold },
  reminderText: { fontSize: 16, color: theme.textPrimary, lineHeight: 24 },
  
  upsellGradient: { padding: 24, alignItems: 'center', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(232,214,174,0.18)', marginTop: 24 },
  upsellTitle: { fontSize: 16, fontWeight: '600', color: theme.textGold },
  upsellText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 20 },

  dynamicCard: { borderRadius: 24, padding: 24, marginBottom: 12, borderWidth: 1, borderColor: theme.cardBorder, borderTopColor: theme.cardHighlight },
  dynamicLabel: { fontSize: 10, fontWeight: '800', color: theme.textGold, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 2 },
  dynamicText: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.textGold, marginTop: 8, marginRight: 12 },
  bulletText: { flex: 1, fontSize: 15, color: theme.textSecondary, lineHeight: 22 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.cardSurface, borderRadius: 28, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: theme.cardBorder, borderTopColor: theme.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.68)' },
  tipText: { flex: 1, fontSize: 15, color: theme.textPrimary, marginLeft: 16, lineHeight: 22 },

  previewSection: { marginTop: 6 },
  previewDivider: { height: 1, backgroundColor: 'transparent', marginVertical: 12 },
  previewAspectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  previewDot: { width: 6, height: 6, borderRadius: 3, marginRight: 10 },
  previewPlanets: { flex: 1, fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
  previewCategory: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});
