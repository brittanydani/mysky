import React, { useState, useEffect, useCallback } from 'react';
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

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import BirthDataModal from '../../components/BirthDataModal';
import { localDb } from '../../services/storage/localDb';
import { SavedChart, RelationshipChart } from '../../services/storage/models';
import { BirthData, NatalChart } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { SynastryEngine, SynastryReport, SynastryAspect } from '../../services/astrology/synastryEngine';
import { RelationshipInsightGenerator, RelationshipInsight } from '../../services/astrology/relationshipInsights';
import { PremiumRelationshipService, RelationshipComparison } from '../../services/premium/relationshipCharts';
import { usePremium } from '../../context/PremiumContext';
import { generateId } from '../../services/storage/models';
import { logger } from '../../utils/logger';

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
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingRelationType, setAddingRelationType] = useState<RelationshipType>('partner');

  useEffect(() => {
    loadData();
  }, []);

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
    Haptics.selectionAsync();
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
      
      // Automatically open the detail view
      handleSelectRelationship(newRelationship);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      logger.error('Failed to save relationship:', error);
      Alert.alert('Error', 'Failed to save relationship. Please try again.');
    }
  };

  const handleSelectRelationship = async (rel: RelationshipChart) => {
    if (!userChart) return;
    
    setSelectedRelationship(rel);
    setViewMode('detail');
    Haptics.selectionAsync();
    
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
    setSelectedChart(otherChart);
    
    // Calculate synastry
    const synastry = SynastryEngine.calculateSynastry(userChart, otherChart);
    setSynastryReport(synastry);
    
    // Generate relationship insight
    const insight = RelationshipInsightGenerator.generateRelationshipInsight(
      userChart,
      otherChart,
      rel.relationship === 'child' || rel.relationship === 'parent' ? 'parent-child' : 
        rel.relationship === 'partner' || rel.relationship === 'ex' ? 'romantic' : 'friendship',
      userChart.name || 'You',
      rel.name
    );
    setRelationshipInsight(insight);
    
    // Generate premium comparison if applicable
    if (isPremium) {
      const comp = PremiumRelationshipService.generateComparison(
        userChart,
        otherChart,
        rel.relationship,
        isPremium
      );
      setComparison(comp);
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
    
    Alert.alert(
      'Remove Relationship',
      `Remove ${selectedRelationship.name} from your relationships? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await localDb.deleteRelationshipChart(selectedRelationship.id);
              setRelationships(prev => prev.filter(r => r.id !== selectedRelationship.id));
              handleBack();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              logger.error('Failed to delete relationship:', error);
            }
          },
        },
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
        <Text style={styles.emptyTitle}>Create Your Chart First</Text>
        <Text style={styles.emptySubtitle}>
          Set up your birth chart on the Home screen to explore relationship dynamics
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
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
            </Pressable>
            <View style={styles.detailHeaderCenter}>
              <Text style={styles.detailName}>{selectedRelationship.name}</Text>
              <Text style={styles.detailRelation}>
                {RELATIONSHIP_LABELS[selectedRelationship.relationship]}
              </Text>
            </View>
            <Pressable onPress={handleDeleteRelationship} style={styles.deleteButton}>
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
                  Haptics.selectionAsync();
                }}
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
                    
                    <View style={styles.needsRow}>
                      <View style={styles.needsColumn}>
                        <Text style={styles.needsName}>{userChart.name || 'You'}</Text>
                        {comparison.person1Needs.slice(0, 3).map((need, i) => (
                          <View key={i} style={styles.needItem}>
                            <Ionicons name="checkmark" size={14} color={theme.primary} />
                            <Text style={styles.needText}>{need}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.needsDivider} />
                      <View style={styles.needsColumn}>
                        <Text style={styles.needsName}>{selectedRelationship.name}</Text>
                        {comparison.person2Needs.slice(0, 3).map((need, i) => (
                          <View key={i} style={styles.needItem}>
                            <Ionicons name="checkmark" size={14} color={theme.primary} />
                            <Text style={styles.needText}>{need}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Reminder */}
                    <View style={styles.reminderCard}>
                      <Text style={styles.reminderText}>"{comparison.reminder}"</Text>
                    </View>
                  </>
                )}

                {/* Free user upsell */}
                {!isPremium && (
                  <View style={styles.upsellCard}>
                    <LinearGradient
                      colors={['rgba(201, 169, 98, 0.2)', 'rgba(201, 169, 98, 0.1)']}
                      style={styles.upsellGradient}
                    >
                      <Ionicons name="sparkles" size={24} color={theme.primary} />
                      <Text style={styles.upsellTitle}>See the full picture</Text>
                      <Text style={styles.upsellText}>
                        Communication dynamics, emotional needs, and healing paths — available with Deeper Sky.
                      </Text>
                    </LinearGradient>
                  </View>
                )}
              </Animated.View>
            )}

            {activeTab === 'aspects' && (
              <Animated.View entering={FadeInDown.duration(400)}>
                {/* Connection aspects */}
                {synastryReport.connectionAspects.length > 0 && (
                  <>
                    <Text style={styles.sectionHeader}>
                      <Ionicons name="heart" size={16} color={theme.primary} /> Connection Points
                    </Text>
                    {synastryReport.connectionAspects.slice(0, isPremium ? 10 : 2).map((aspect, i) => (
                      <AspectCard key={i} aspect={aspect} />
                    ))}
                  </>
                )}

                {/* Chemistry aspects */}
                {synastryReport.chemistryAspects.length > 0 && (
                  <>
                    <Text style={styles.sectionHeader}>
                      <Ionicons name="flame" size={16} color="#F87171" /> Chemistry
                    </Text>
                    {synastryReport.chemistryAspects.slice(0, isPremium ? 10 : 2).map((aspect, i) => (
                      <AspectCard key={i} aspect={aspect} />
                    ))}
                  </>
                )}

                {/* Challenge aspects */}
                {synastryReport.challengeAspects.length > 0 && (
                  <>
                    <Text style={styles.sectionHeader}>
                      <Ionicons name="trending-up" size={16} color="#93C5FD" /> Growth Areas
                    </Text>
                    {synastryReport.challengeAspects.slice(0, isPremium ? 10 : 2).map((aspect, i) => (
                      <AspectCard key={i} aspect={aspect} />
                    ))}
                  </>
                )}

                {!isPremium && synastryReport.aspects.length > 4 && (
                  <View style={styles.upsellCard}>
                    <LinearGradient
                      colors={['rgba(201, 169, 98, 0.2)', 'rgba(201, 169, 98, 0.1)']}
                      style={styles.upsellGradient}
                    >
                      <Text style={styles.upsellTitle}>
                        +{synastryReport.aspects.length - 4} more aspects
                      </Text>
                      <Text style={styles.upsellText}>
                        All planetary connections are available with Deeper Sky.
                      </Text>
                    </LinearGradient>
                  </View>
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
              {relationships.map((rel, index) => (
                <Pressable
                  key={rel.id}
                  style={styles.relationshipCard}
                  onPress={() => handleSelectRelationship(rel)}
                >
                  <LinearGradient
                    colors={['rgba(201, 169, 98, 0.12)', 'rgba(201, 169, 98, 0.04)']}
                    style={styles.relationshipCardGradient}
                  >
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
                  </LinearGradient>
                </Pressable>
              ))}
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
              <View style={styles.limitIndicator}>
                <Text style={styles.limitText}>
                  {relationships.length === 0
                    ? 'Free accounts include 1 relationship chart'
                    : 'Deeper Sky includes unlimited relationship charts'}
                </Text>
              </View>
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

// Aspect card component
function AspectCard({ aspect }: { aspect: SynastryAspect }) {
  return (
    <View style={styles.aspectCard}>
      <View style={styles.aspectHeader}>
        <View style={styles.aspectPlanets}>
          <Text style={styles.aspectPlanetText}>
            {aspect.person1Planet.planet.name} {aspect.aspectType.symbol} {aspect.person2Planet.planet.name}
          </Text>
          <View style={[
            styles.aspectStrength,
            aspect.strength === 'strong' && styles.aspectStrengthStrong,
            aspect.strength === 'moderate' && styles.aspectStrengthModerate,
          ]}>
            <Text style={styles.aspectStrengthText}>{aspect.strength}</Text>
          </View>
        </View>
        <Text style={styles.aspectTitle}>{aspect.title}</Text>
      </View>
      <Text style={styles.aspectDescription}>{aspect.description}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.2)',
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
  needsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  needsColumn: {
    flex: 1,
  },
  needsDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  needsName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 12,
  },
  needItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  needText: {
    fontSize: 13,
    color: theme.textSecondary,
    marginLeft: 8,
    flex: 1,
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

  // Aspect card styles
  aspectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  aspectHeader: {
    marginBottom: 8,
  },
  aspectPlanets: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aspectPlanetText: {
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: 'monospace',
  },
  aspectStrength: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  aspectStrengthStrong: {
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
  },
  aspectStrengthModerate: {
    backgroundColor: 'rgba(147, 197, 253, 0.2)',
  },
  aspectStrengthText: {
    fontSize: 11,
    color: theme.textMuted,
    textTransform: 'uppercase',
  },
  aspectTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
    marginTop: 4,
  },
  aspectDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
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
});
