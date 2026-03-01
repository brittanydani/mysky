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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/core';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
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
  
  // Synastry preview for list cards (top aspects per relationship)
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
      
      // Load user's primary chart
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
        
        // Load relationship charts
        const rels = await localDb.getRelationshipCharts(saved.id);
        setRelationships(rels);

        // Pre-compute synastry previews for list cards
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
            // Pick top 3 strongest aspects across all categories
            const topAspects = report.aspects
              .filter(a => a.strength === 'strong')
              .slice(0, 3);
            // If fewer than 3 strong, fill with moderate
            if (topAspects.length < 3) {
              const moderate = report.aspects
                .filter(a => a.strength === 'moderate' && !topAspects.includes(a))
                .slice(0, 3 - topAspects.length);
              topAspects.push(...moderate);
            }
            previews[rel.id] = {
              aspects: topAspects,
              connection: report.primaryConnection,
            };
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

      // Compute synastry preview for the new card
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

      // Automatically open the detail view
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
    
      // Generate chart for this relationship
      const birthData: BirthData = {
        date: rel.birthDate,
        time: rel.birthTime,
        hasUnknownTime: rel.hasUnknownTime,
        place: rel.birthPlace,
        latitude: rel.latitude,
        longitude: rel.longitude,
        timezone: rel.timezone,
      };
    
      const otherChart = AstrologyCalculator.generateNatalChart(birthData);
      otherChart.name = rel.name;
    
      // Calculate synastry
      const synastry = SynastryEngine.calculateSynastry(userChart, otherChart);
    
      // Generate relationship insight
      const insight = RelationshipInsightGenerator.generateRelationshipInsight(
        userChart,
        otherChart,
        rel.relationship === 'child' || rel.relationship === 'parent' ? 'parent-child' : 
          rel.relationship === 'partner' || rel.relationship === 'ex' ? 'romantic' : 'friendship',
        userChart.name || 'You',
        rel.name
      );

      // Set state only after all computations succeed
      setSelectedRelationship(rel);
      setSelectedChart(otherChart);
      setSynastryReport(synastry);
      setRelationshipInsight(insight);
      setViewMode('detail');
    
    // Generate premium comparison if applicable
    if (isPremium) {
      const comp = PremiumRelationshipService.generateComparison(
        userChart,
        otherChart,
        rel.relationship,
        isPremium,
        synastry
      );
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
              if (fromDetail) {
                handleBack();
              }
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
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteRelationship(rel, false),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StarField starCount={30} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading relationships...</Text>
      </View>
    );
  }

  // No user chart
  if (!userChart) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StarField starCount={30} />
        <Ionicons name="people" size={48} color={theme.textMuted} />
        <Text style={styles.emptyTitle}>Create Your Profile First</Text>
        <Text style={styles.emptySubtitle}>
          Set up your birth data on the Home screen to explore relationship dynamics
        </Text>
      </View>
    );
  }

  // Detail view
  if (viewMode === 'detail' && selectedRelationship && selectedChart && synastryReport) {
    return (
      <View style={styles.container}>
        <StarField starCount={30} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
            </Pressable>
            <View style={styles.detailHeaderCenter}>
              <Text style={styles.detailName}>{selectedRelationship.name}</Text>
              <Text style={styles.detailRelation}>
                {RELATIONSHIP_LABELS[selectedRelationship.relationship]}
              </Text>
            </View>
            <Pressable onPress={handleDeleteRelationship} style={styles.deleteButton} accessibilityRole="button" accessibilityLabel={`Delete ${selectedRelationship.name}`}>
              <Ionicons name="trash-outline" size={22} color={theme.error} />
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            {(['overview', 'aspects', 'dynamics'] as const).map(tab => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => {
                  setActiveTab(tab);
                  Haptics.selectionAsync().catch(() => {});
                }}
                accessibilityRole="tab"
                accessibilityLabel={tab.charAt(0).toUpperCase() + tab.slice(1)}
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
            {activeTab === 'overview' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                {/* Primary connection */}
                <View style={styles.insightCard}>
                  <LinearGradient
                    colors={['rgba(201, 169, 98, 0.15)', 'rgba(201, 169, 98, 0.05)']}
                    style={styles.insightCardGradient}
                  >
                    <Ionicons name="heart" size={24} color={theme.primary} />
                    <Text style={styles.insightCardTitle}>Your Connection</Text>
                    <Text style={styles.insightCardText}>{synastryReport.primaryConnection}</Text>
                  </LinearGradient>
                </View>

                {/* Growth edge */}
                <View style={styles.insightCard}>
                  <LinearGradient
                    colors={['rgba(147, 197, 253, 0.15)', 'rgba(147, 197, 253, 0.05)']}
                    style={styles.insightCardGradient}
                  >
                    <Ionicons name="trending-up" size={24} color="#93C5FD" />
                    <Text style={styles.insightCardTitle}>Your Growth Edge</Text>
                    <Text style={styles.insightCardText}>{synastryReport.primaryChallenge}</Text>
                  </LinearGradient>
                </View>

                {/* Overall dynamic */}
                <View style={styles.insightCard}>
                  <LinearGradient
                    colors={['rgba(110, 191, 139, 0.15)', 'rgba(110, 191, 139, 0.05)']}
                    style={styles.insightCardGradient}
                  >
                    <Ionicons name="pulse" size={24} color="#6EBF8B" />
                    <Text style={styles.insightCardTitle}>Overall Dynamic</Text>
                    <Text style={styles.insightCardText}>{synastryReport.overallDynamic}</Text>
                  </LinearGradient>
                </View>

                {/* Premium comparison content */}
                {isPremium && comparison && (
                  <>
                    <Text style={styles.sectionHeader}>What Each Person Needs</Text>
                    
                    <NeedsComparison
                      person1Name={userChart.name || 'You'}
                      person1Needs={comparison.person1Needs}
                      person2Name={selectedRelationship.name}
                      person2Needs={comparison.person2Needs}
                    />

                    {/* Reminder */}
                    <View style={styles.reminderCard}>
                      <Text style={styles.reminderText}>"{comparison.reminder}"</Text>
                    </View>
                  </>
                )}

                {/* Free user upsell */}
                {!isPremium && (
                  <Pressable
                    onPress={() => router.push('/(tabs)/premium' as Href)}
                    accessibilityRole="button"
                    accessibilityLabel="Unlock full relationship insights"
                  >
                    <View style={styles.upsellCard}>
                      <LinearGradient
                        colors={['rgba(201, 169, 98, 0.15)', 'rgba(201, 169, 98, 0.05)']}
                        style={[styles.upsellGradient, { borderWidth: 1, borderColor: 'rgba(201, 169, 98, 0.2)' }]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <Ionicons name="sparkles" size={18} color={theme.primary} />
                          <Text style={styles.upsellTitle}>There's more between you</Text>
                        </View>
                        <Text style={styles.upsellText}>
                          Communication styles, emotional needs comparison, and healing paths for this relationship — with Deeper Sky.
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>See the full picture</Text>
                          <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                        </View>
                      </LinearGradient>
                    </View>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {activeTab === 'aspects' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                {/* Key Aspects — unified list with colored category dots */}
                <Text style={styles.sectionHeader}>Key Aspects</Text>

                {/* Connection aspects */}
                {synastryReport.connectionAspects.slice(0, isPremium ? 10 : 2).map((aspect, i) => (
                  <AspectRow
                    key={`conn-${i}`}
                    description={`Your ${aspect.person1Planet.planet.name} ${aspect.aspectType.symbol} their ${aspect.person2Planet.planet.name}`}
                    title={aspect.title}
                    category={aspect.category}
                    strength={aspect.strength}
                    detail={aspect.description}
                  />
                ))}

                {/* Chemistry aspects */}
                {synastryReport.chemistryAspects.slice(0, isPremium ? 10 : 2).map((aspect, i) => (
                  <AspectRow
                    key={`chem-${i}`}
                    description={`Your ${aspect.person1Planet.planet.name} ${aspect.aspectType.symbol} their ${aspect.person2Planet.planet.name}`}
                    title={aspect.title}
                    category={aspect.category}
                    strength={aspect.strength}
                    detail={aspect.description}
                  />
                ))}

                {/* Growth / Challenge aspects */}
                {synastryReport.challengeAspects.slice(0, isPremium ? 10 : 2).map((aspect, i) => (
                  <AspectRow
                    key={`grow-${i}`}
                    description={`Your ${aspect.person1Planet.planet.name} ${aspect.aspectType.symbol} their ${aspect.person2Planet.planet.name}`}
                    title={aspect.title}
                    category={aspect.category}
                    strength={aspect.strength}
                    detail={aspect.description}
                  />
                ))}

                {!isPremium && synastryReport.aspects.length > 4 && (
                  <Pressable
                    onPress={() => router.push('/(tabs)/premium' as Href)}
                    accessibilityRole="button"
                    accessibilityLabel="Unlock all aspects"
                  >
                    <View style={styles.upsellCard}>
                      <LinearGradient
                        colors={['rgba(201, 169, 98, 0.15)', 'rgba(201, 169, 98, 0.05)']}
                        style={[styles.upsellGradient, { borderWidth: 1, borderColor: 'rgba(201, 169, 98, 0.2)' }]}
                      >
                        <Text style={styles.upsellTitle}>
                          +{synastryReport.aspects.length - 4} more planetary connections
                        </Text>
                        <Text style={styles.upsellText}>
                          Deeper aspects reveal hidden dynamics — the subtle threads that make this relationship unique.
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.primary }}>Unlock all aspects</Text>
                          <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                        </View>
                      </LinearGradient>
                    </View>
                  </Pressable>
                )}
              </Animated.View>
            )}

            {activeTab === 'dynamics' && relationshipInsight && (
              <Animated.View entering={FadeInDown.duration(400)}>
                {/* How you show love */}
                <View style={styles.dynamicCard}>
                  <Text style={styles.dynamicLabel}>How You Show Love</Text>
                  <Text style={styles.dynamicText}>{relationshipInsight.dynamics.howYouShowLove}</Text>
                </View>

                {/* How they feel safe */}
                <View style={styles.dynamicCard}>
                  <Text style={styles.dynamicLabel}>How {selectedRelationship.name} Feels Safe</Text>
                  <Text style={styles.dynamicText}>{relationshipInsight.dynamics.howTheyFeelSafe}</Text>
                </View>

                {/* Misreadings */}
                {relationshipInsight.dynamics.whereYouMisreadEachOther.length > 0 && (
                  <View style={styles.dynamicCard}>
                    <Text style={styles.dynamicLabel}>Where You Might Misread Each Other</Text>
                    {relationshipInsight.dynamics.whereYouMisreadEachOther.map((item, i) => (
                      <View key={i} style={styles.bulletItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Repair approach */}
                <View style={styles.dynamicCard}>
                  <Text style={styles.dynamicLabel}>How to Repair After Conflict</Text>
                  <Text style={styles.dynamicText}>{relationshipInsight.dynamics.howToRepairConflict}</Text>
                </View>

                {/* Emotional pacing */}
                <View style={styles.dynamicCard}>
                  <Text style={styles.dynamicLabel}>Emotional Pacing</Text>
                  <Text style={styles.dynamicText}>{relationshipInsight.dynamics.differentEmotionalPacing}</Text>
                </View>

                {/* Premium: Communication dynamics */}
                {isPremium && comparison && (
                  <>
                    <Text style={styles.sectionHeader}>Communication Styles</Text>
                    <View style={styles.dynamicCard}>
                      <Text style={styles.dynamicLabel}>Your Style</Text>
                      <Text style={styles.dynamicText}>{comparison.communicationDynamics.person1Style}</Text>
                      <Text style={[styles.dynamicLabel, { marginTop: 12 }]}>Their Style</Text>
                      <Text style={styles.dynamicText}>{comparison.communicationDynamics.person2Style}</Text>
                      <Text style={[styles.dynamicLabel, { marginTop: 12 }]}>The Dynamic</Text>
                      <Text style={styles.dynamicText}>{comparison.communicationDynamics.dynamicDescription}</Text>
                    </View>

                    <Text style={styles.sectionHeader}>Tips for Connection</Text>
                    <View style={styles.tipCard}>
                      <Ionicons name="bulb" size={20} color={theme.primary} />
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

  // List view
  return (
    <View style={styles.container}>
      <StarField starCount={30} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Relationships</Text>
          <Text style={styles.subtitle}>
            Understanding, not compatibility scores
          </Text>
        </Animated.View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Existing relationships */}
          {relationships.length > 0 && (
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <Text style={styles.listSectionTitle}>Your People</Text>
              {relationships.map((rel, index) => {
                const preview = synastryPreviews[rel.id];
                return (
                  <Pressable
                    key={rel.id}
                    style={styles.relationshipCard}
                    onPress={() => handleSelectRelationship(rel)}
                    onLongPress={() => handleLongPressRelationship(rel)}
                    accessibilityRole="button"
                    accessibilityLabel={`${rel.name}, ${RELATIONSHIP_LABELS[rel.relationship]}`}
                  >
                    <LinearGradient
                      colors={['rgba(201, 169, 98, 0.12)', 'rgba(201, 169, 98, 0.04)']}
                      style={styles.relationshipCardGradient}
                    >
                      {/* Header row */}
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.relationshipIcon}>
                          <Ionicons
                            name={RELATIONSHIP_ICONS[rel.relationship]}
                            size={24}
                            color={theme.primary}
                          />
                        </View>
                        <View style={styles.relationshipInfo}>
                          <Text style={styles.relationshipName}>{rel.name}</Text>
                          <Text style={styles.relationshipType}>
                            {RELATIONSHIP_LABELS[rel.relationship]}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                      </View>

                      {/* Key aspects preview */}
                      {preview && preview.aspects.length > 0 && (
                        <View style={styles.previewSection}>
                          <View style={styles.previewDivider} />
                          {preview.aspects.map((aspect, i) => {
                            const catColors: Record<string, string> = {
                              connection: '#6EBF8B',
                              chemistry: '#E07A98',
                              growth: '#8BC4E8',
                              challenge: '#E0B07A',
                            };
                            const catColor = catColors[aspect.category] || theme.textMuted;
                            return (
                              <View key={i} style={styles.previewAspectRow}>
                                <View style={[styles.previewDot, { backgroundColor: catColor }]} />
                                <Text style={styles.previewPlanets} numberOfLines={1}>
                                  {aspect.person1Planet.planet.name} {aspect.aspectType.symbol} {aspect.person2Planet.planet.name}
                                </Text>
                                <Text style={[styles.previewCategory, { color: catColor }]}>
                                  {aspect.category}
                                </Text>
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

          {/* Add new relationship */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.listSectionTitle}>
              {relationships.length > 0 ? 'Add Another' : 'Add a Relationship'}
            </Text>
            <Text style={styles.listSectionSubtitle}>
              Compare charts to understand your dynamics
            </Text>

            <View style={styles.typeGrid}>
              {(['partner', 'parent', 'child', 'friend', 'sibling', 'other'] as RelationshipType[]).map(type => (
                <Pressable
                  key={type}
                  style={styles.typeButton}
                  onPress={() => handleAddRelationship(type)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${RELATIONSHIP_LABELS[type]}`}
                >
                  <View style={styles.typeIconContainer}>
                    <Ionicons name={RELATIONSHIP_ICONS[type]} size={24} color={theme.primary} />
                  </View>
                  <Text style={styles.typeLabel}>{RELATIONSHIP_LABELS[type]}</Text>
                </Pressable>
              ))}
            </View>

            {/* Limit indicator for free users */}
            {!isPremium && (
              <Pressable
                onPress={() => router.push('/(tabs)/premium' as Href)}
                accessibilityRole="button"
                accessibilityLabel="Unlock unlimited relationship charts"
              >
                <View style={styles.limitIndicator}>
                  <Ionicons name="sparkles" size={12} color={theme.primary} />
                  <Text style={styles.limitText}>
                    {relationships.length === 0
                      ? 'Free includes 1 relationship chart · Deeper Sky unlocks unlimited'
                      : 'Deeper Sky unlocks unlimited charts — partner, parent, child, friend'}
                  </Text>
                </View>
              </Pressable>
            )}
          </Animated.View>

          {/* What you'll discover */}
          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.discoverSection}>
            <Text style={styles.discoverTitle}>What You'll Discover</Text>
            
            <View style={styles.discoverItem}>
              <Ionicons name="chatbubbles" size={20} color={theme.primary} />
              <View style={styles.discoverContent}>
                <Text style={styles.discoverItemTitle}>Communication Styles</Text>
                <Text style={styles.discoverItemText}>How you each process and express</Text>
              </View>
            </View>

            <View style={styles.discoverItem}>
              <Ionicons name="heart" size={20} color="#F87171" />
              <View style={styles.discoverContent}>
                <Text style={styles.discoverItemTitle}>Emotional Needs</Text>
                <Text style={styles.discoverItemText}>What makes each person feel safe</Text>
              </View>
            </View>

            <View style={styles.discoverItem}>
              <Ionicons name="git-merge" size={20} color="#93C5FD" />
              <View style={styles.discoverContent}>
                <Text style={styles.discoverItemTitle}>Sources of Ease & Tension</Text>
                <Text style={styles.discoverItemText}>Where you flow and where you grow</Text>
              </View>
            </View>

            <View style={styles.discoverItem}>
              <Ionicons name="refresh" size={20} color="#6EBF8B" />
              <View style={styles.discoverContent}>
                <Text style={styles.discoverItemTitle}>Repair Strategies</Text>
                <Text style={styles.discoverItemText}>How to reconnect after conflict</Text>
              </View>
            </View>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Add relationship modal */}
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
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  safeArea: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    color: theme.textMuted,
    fontSize: 14,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: 24,
    marginBottom: 8,
    fontFamily: 'serif',
  },
  listSectionSubtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 16,
  },
  relationshipCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  relationshipCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.2)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relationshipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  relationshipInfo: {
    flex: 1,
    marginLeft: 12,
  },
  relationshipName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  relationshipType: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  typeButton: {
    width: '33.33%',
    padding: 6,
  },
  typeIconContainer: {
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.15)',
  },
  typeLabel: {
    marginTop: 8,
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  limitIndicator: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(201, 169, 98, 0.08)',
    borderRadius: 12,
  },
  limitText: {
    fontSize: 13,
    color: theme.textMuted,
    textAlign: 'center',
  },
  discoverSection: {
    marginTop: 32,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  discoverTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 16,
    fontFamily: 'serif',
  },
  discoverItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  discoverContent: {
    flex: 1,
    marginLeft: 12,
  },
  discoverItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  discoverItemText: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },

  // Detail view styles
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    padding: 8,
  },
  detailHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  detailName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  detailRelation: {
    fontSize: 13,
    color: theme.textMuted,
  },
  deleteButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.primary,
  },
  detailScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  insightCard: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  insightCardGradient: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  insightCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'serif',
  },
  insightCardText: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: 28,
    marginBottom: 12,
    fontFamily: 'serif',
  },
  reminderCard: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(201, 169, 98, 0.08)',
    borderRadius: 16,
    borderLeftWidth: 3,
    borderLeftColor: theme.primary,
  },
  reminderText: {
    fontSize: 15,
    color: theme.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  upsellCard: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  upsellGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.2)',
  },
  upsellTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    marginTop: 8,
  },
  upsellText: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },

  // Dynamic card styles
  dynamicCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dynamicLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dynamicText: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
    marginTop: 6,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  // Synastry preview on list cards
  previewSection: {
    marginTop: 2,
  },
  previewDivider: {
    height: 1,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    marginVertical: 10,
  },
  previewAspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  previewPlanets: {
    flex: 1,
    fontSize: 12,
    color: theme.textSecondary,
  },
  previewCategory: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
