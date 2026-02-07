import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import BirthDataModal from '../../components/BirthDataModal';
import { localDb } from '../../services/storage/localDb';
import { SavedChart } from '../../services/storage/models';
import { BirthData, NatalChart } from '../../services/astrology/types';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { ChartDisplayManager } from '../../services/astrology/chartDisplayManager';
import { EmotionalOperatingSystemGenerator, EmotionalOperatingSystem } from '../../services/astrology/emotionalOperatingSystem';
import { getChironInsightFromChart, getChironPlacement, ChironInsight } from '../../services/journal/chiron';
import { getNodeInsight, getNodeAxis, NodeInsight } from '../../services/journal/nodes';
import { usePremium } from '../../context/PremiumContext';
import { logger } from '../../utils/logger';

type SectionType = 'emotional-language' | 'protection-style' | 'love-wound' | 'repair-style' | 'inner-child' | 'draining' | 'chosen';

export default function YouScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPremium } = usePremium();
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [savedChart, setSavedChart] = useState<SavedChart | null>(null);
  const [emotionalOS, setEmotionalOS] = useState<EmotionalOperatingSystem | null>(null);
  const [chironInsight, setChironInsight] = useState<ChironInsight | null>(null);
  const [nodeInsight, setNodeInsight] = useState<NodeInsight | null>(null);
  const [activeSection, setActiveSection] = useState<SectionType>('emotional-language');
  const [loading, setLoading] = useState(true);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const displayChart = userChart ? ChartDisplayManager.formatChartWithTimeWarnings(userChart) : null;

  const birthModalInitialData = useMemo(() => {
    if (!savedChart) return undefined;
    return {
      chartName: savedChart.name,
      date: savedChart.birthDate,
      time: savedChart.birthTime,
      hasUnknownTime: savedChart.hasUnknownTime,
      place: savedChart.birthPlace,
      latitude: savedChart.latitude,
      longitude: savedChart.longitude,
      timezone: savedChart.timezone,
      houseSystem: savedChart.houseSystem,
    };
  }, [savedChart]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        // Convert SavedChart to NatalChart format
        const savedChart = charts[0];
        setSavedChart(savedChart);
        const birthData = {
          date: savedChart.birthDate,
          time: savedChart.birthTime,
          hasUnknownTime: savedChart.hasUnknownTime,
          place: savedChart.birthPlace,
          latitude: savedChart.latitude,
          longitude: savedChart.longitude,
          houseSystem: savedChart.houseSystem,
          timezone: savedChart.timezone,
        };
        
        // Regenerate chart from saved birth data
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        chart.id = savedChart.id;
        chart.name = savedChart.name;
        chart.createdAt = savedChart.createdAt;
        chart.updatedAt = savedChart.updatedAt;
        
        setUserChart(chart);
        
        // Generate emotional operating system
        const os = EmotionalOperatingSystemGenerator.generateEmotionalOS(chart);
        setEmotionalOS(os);

        // Generate Chiron + Node awareness
        try {
          const ci = getChironInsightFromChart(chart);
          setChironInsight(ci);
          const ni = getNodeInsight(chart);
          setNodeInsight(ni);
        } catch {
          // Chiron/Node data not critical
        }
      }
    } catch (error) {
      logger.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBirthDataSave = async (birthData: BirthData, extra?: { chartName?: string }) => {
    if (!savedChart) return;
    try {
      const now = new Date().toISOString();
      const updatedChart: SavedChart = {
        ...savedChart,
        name: extra?.chartName ?? savedChart.name,
        birthDate: birthData.date,
        birthTime: birthData.time,
        hasUnknownTime: birthData.hasUnknownTime,
        birthPlace: birthData.place,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
        houseSystem: birthData.houseSystem,
        updatedAt: now,
        isDeleted: false,
      };

      await localDb.saveChart(updatedChart);
      setSavedChart(updatedChart);

      const updatedNatalChart = AstrologyCalculator.generateNatalChart(birthData);
      updatedNatalChart.id = updatedChart.id;
      updatedNatalChart.name = updatedChart.name;
      updatedNatalChart.createdAt = updatedChart.createdAt;
      updatedNatalChart.updatedAt = updatedChart.updatedAt;

      setUserChart(updatedNatalChart);
      const os = EmotionalOperatingSystemGenerator.generateEmotionalOS(updatedNatalChart);
      setEmotionalOS(os);

      try {
        setChironInsight(getChironInsightFromChart(updatedNatalChart));
        setNodeInsight(getNodeInsight(updatedNatalChart));
      } catch { /* non-critical */ }
      setShowBirthModal(false);
    } catch (error) {
      logger.error('Failed to update birth data:', error);
      Alert.alert('Update Failed', 'Unable to update birth data. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={40} />
        <Text style={styles.loadingText}>Understanding your emotional patterns...</Text>
      </View>
    );
  }

  if (!userChart || !emotionalOS) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={40} />
        <Text style={styles.loadingText}>Create your chart first to see your emotional operating system</Text>
        <Pressable
          style={styles.createChartButton}
          onPress={() => router.push('/' as Href)}
        >
          <Text style={styles.createChartText}>Go to Home</Text>
        </Pressable>
      </View>
    );
  }

  const sections = [
    {
      id: 'emotional-language' as SectionType,
      title: 'Your Emotional Language',
      subtitle: 'How your nervous system learned to feel safe',
      icon: 'heart' as const,
      color: 'rgba(224, 122, 122, 0.15)'
    },
    {
      id: 'protection-style' as SectionType,
      title: 'Your Protection Style',
      subtitle: 'How you defend when feeling vulnerable',
      icon: 'shield' as const,
      color: 'rgba(110, 191, 139, 0.15)'
    },
    {
      id: 'love-wound' as SectionType,
      title: 'Your Love Wound',
      subtitle: 'What you learned about love and how to heal',
      icon: 'heart-dislike' as const,
      color: 'rgba(201, 169, 98, 0.15)'
    },
    {
      id: 'repair-style' as SectionType,
      title: 'Your Repair Style',
      subtitle: 'How you reconnect after conflict',
      icon: 'construct' as const,
      color: 'rgba(147, 197, 253, 0.15)'
    },
    {
      id: 'inner-child' as SectionType,
      title: 'Your Inner Child Theme',
      subtitle: 'What your younger self needed most',
      icon: 'happy' as const,
      color: 'rgba(196, 181, 253, 0.15)'
    },
    {
      id: 'draining' as SectionType,
      title: 'What Drains You',
      subtitle: 'Situations that deplete your energy',
      icon: 'battery-dead' as const,
      color: 'rgba(248, 113, 113, 0.15)'
    },
    {
      id: 'chosen' as SectionType,
      title: 'What Makes You Feel Chosen',
      subtitle: 'How you know you\'re truly valued',
      icon: 'star' as const,
      color: 'rgba(251, 191, 36, 0.15)'
    }
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'emotional-language':
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.contentTitle}>This is how your nervous system learned to feel safe</Text>
            <Text style={styles.contentText}>{emotionalOS.emotionalLanguage.primaryMode}</Text>
            
            <Text style={styles.subTitle}>How you express emotions</Text>
            <Text style={styles.contentText}>{emotionalOS.emotionalLanguage.expression}</Text>
            
            <Text style={styles.subTitle}>What you need to feel emotionally safe</Text>
            <Text style={styles.contentText}>{emotionalOS.emotionalLanguage.needsToFeel}</Text>
            
            <Text style={styles.subTitle}>Signs you might be overwhelmed</Text>
            {emotionalOS.emotionalLanguage.overwhelmSigns.map((sign, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{sign}</Text>
              </View>
            ))}
          </View>
        );
        
      case 'protection-style':
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.contentTitle}>How you learned to protect yourself</Text>
            <Text style={styles.contentText}>{emotionalOS.protectionStyle.primaryDefense}</Text>
            
            <Text style={styles.subTitle}>What tends to trigger your defenses</Text>
            {emotionalOS.protectionStyle.triggers.map((trigger, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{trigger}</Text>
              </View>
            ))}
            
            <Text style={styles.subTitle}>What helps you feel safe to be vulnerable</Text>
            {emotionalOS.protectionStyle.safetyNeeds.map((need, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{need}</Text>
              </View>
            ))}
            
            <Text style={styles.subTitle}>How others can approach you gently</Text>
            <Text style={styles.contentText}>{emotionalOS.protectionStyle.gentleApproach}</Text>
          </View>
        );
        
      case 'love-wound':
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.contentTitle}>What you learned about love</Text>
            <Text style={styles.contentText}>{emotionalOS.loveWound.coreWound}</Text>
            
            <Text style={styles.subTitle}>How this shows up in relationships</Text>
            <Text style={styles.contentText}>{emotionalOS.loveWound.howItShows}</Text>
            
            <Text style={styles.subTitle}>Your path toward healing</Text>
            <Text style={styles.contentText}>{emotionalOS.loveWound.healingPath}</Text>
            
            <Text style={styles.subTitle}>Green flags for you in love</Text>
            {emotionalOS.loveWound.greenFlags.map((flag, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: theme.success }]} />
                <Text style={styles.listText}>{flag}</Text>
              </View>
            ))}
          </View>
        );
        
      case 'repair-style':
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.contentTitle}>How you handle conflict</Text>
            <Text style={styles.contentText}>{emotionalOS.repairStyle.conflictResponse}</Text>
            
            <Text style={styles.subTitle}>What you need after conflict</Text>
            {emotionalOS.repairStyle.repairNeeds.map((need, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{need}</Text>
              </View>
            ))}
            
            <Text style={styles.subTitle}>Your apology style</Text>
            <Text style={styles.contentText}>{emotionalOS.repairStyle.apologyStyle}</Text>
            
            <Text style={styles.subTitle}>How you reconnect</Text>
            <Text style={styles.contentText}>{emotionalOS.repairStyle.reconnectionPath}</Text>
          </View>
        );
        
      case 'inner-child':
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.contentTitle}>What your inner child needed most</Text>
            <Text style={styles.contentText}>{emotionalOS.innerChildTheme.coreNeed}</Text>
            
            <Text style={styles.subTitle}>How you naturally play and create</Text>
            <Text style={styles.contentText}>{emotionalOS.innerChildTheme.playStyle}</Text>
            
            <Text style={styles.subTitle}>How you seek comfort</Text>
            <Text style={styles.contentText}>{emotionalOS.innerChildTheme.comfortSeeking}</Text>
            
            <Text style={styles.subTitle}>How you like to be celebrated</Text>
            <Text style={styles.contentText}>{emotionalOS.innerChildTheme.celebrationStyle}</Text>
          </View>
        );
        
      case 'draining':
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.contentTitle}>Situations that drain your energy</Text>
            <Text style={styles.contentText}>Based on your chart, these situations may be particularly depleting for you:</Text>
            
            {emotionalOS.drainingSituations.map((situation, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: theme.error }]} />
                <Text style={styles.listText}>{situation}</Text>
              </View>
            ))}
            
            <Text style={styles.subTitle}>Protecting your energy</Text>
            <Text style={styles.contentText}>
              Recognizing these patterns can help you set boundaries and make choices that preserve your emotional energy. 
              It&apos;s not about avoiding all challenging situations, but about being intentional with your energy.
            </Text>
          </View>
        );
        
      case 'chosen':
        return (
          <View style={styles.sectionContent}>
            <Text style={styles.contentTitle}>How you know you&apos;re truly valued</Text>
            <Text style={styles.contentText}>These are the ways you feel most chosen and special:</Text>
            
            {emotionalOS.feelingChosenTriggers.map((trigger, index) => (
              <View key={index} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
                <Text style={styles.listText}>{trigger}</Text>
              </View>
            ))}
            
            <Text style={styles.subTitle}>Why this matters</Text>
            <Text style={styles.contentText}>
              Understanding how you feel chosen helps you communicate your needs and recognize when others are showing you love in your language. 
              It also helps you show others that you value them in ways that resonate.
            </Text>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StarField starCount={30} />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {displayChart?.warnings.length ? (
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={18} color={theme.warning} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Birth time unknown</Text>
              <Text style={styles.warningText}>{displayChart.warnings[0]}</Text>
            </View>
            <Pressable style={styles.warningAction} onPress={() => setShowBirthModal(true)}>
              <Text style={styles.warningActionText}>Update</Text>
              <Ionicons name="pencil" size={14} color={theme.primary} />
            </Pressable>
          </View>
        ) : null}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 0 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.header}
          >
            <Text style={styles.title}>Understanding Yourself</Text>
            <Text style={styles.subtitle}>
              Your emotional operating system
            </Text>

            {savedChart && (
              <Pressable style={styles.editBirthButton} onPress={() => setShowBirthModal(true)}>
                <Ionicons name="pencil" size={16} color={theme.primary} />
                <Text style={styles.editBirthText}>Edit birth details</Text>
              </Pressable>
            )}

            {/* View Natal Chart link */}
            <Pressable
              style={styles.viewChartLink}
              onPress={() => router.push('/(tabs)/chart' as Href)}
            >
              <Ionicons name="analytics-outline" size={18} color={theme.primary} />
              <Text style={styles.viewChartLinkText}>View Full Natal Chart</Text>
              <Ionicons name="arrow-forward" size={14} color={theme.primary} />
            </Pressable>
            
            {/* Poetic Introduction */}
            <Text style={styles.poeticIntro}>
              These patterns aren&apos;t flaws to fix — they&apos;re survival strategies 
              your nervous system created to keep you safe. Understanding them with 
              compassion is the beginning of healing.
            </Text>
          </Animated.View>

          {/* Section Navigation */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.sectionNav}
          >
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sectionNavContent}
            >
              {sections.map((section, index) => (
                <Pressable
                  key={section.id}
                  style={[
                    styles.sectionButton,
                    activeSection === section.id && styles.sectionButtonActive
                  ]}
                  onPress={() => setActiveSection(section.id)}
                >
                  <LinearGradient
                    colors={
                      activeSection === section.id 
                        ? ['rgba(201, 169, 98, 0.3)', 'rgba(201, 169, 98, 0.1)']
                        : ['rgba(30, 45, 71, 0.6)', 'rgba(26, 39, 64, 0.4)']
                    }
                    style={styles.sectionButtonGradient}
                  >
                    <Ionicons 
                      name={section.icon} 
                      size={20} 
                      color={activeSection === section.id ? theme.primary : theme.textSecondary} 
                    />
                    <Text style={[
                      styles.sectionButtonText,
                      activeSection === section.id && styles.sectionButtonTextActive
                    ]}>
                      {section.title}
                    </Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Active Section Content */}
          <Animated.View 
            entering={FadeInDown.delay(300).duration(600)}
            style={styles.contentContainer}
          >
            <LinearGradient
              colors={['rgba(30, 45, 71, 0.8)', 'rgba(26, 39, 64, 0.6)']}
              style={styles.contentCard}
            >
              {renderSectionContent()}
            </LinearGradient>
          </Animated.View>

          {/* Explanation */}
          <Animated.View 
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.explanationContainer}
          >
            <View style={styles.explanationHeader}>
              <Ionicons name="information-circle" size={20} color={theme.primary} />
              <Text style={styles.explanationTitle}>Why this matters</Text>
            </View>
            <Text style={styles.explanationText}>
              Your emotional operating system developed as an intelligent adaptation to your early experiences. 
              Understanding these patterns helps you make conscious choices about how you want to show up in relationships and life. 
              This isn&apos;t about changing who you are—it&apos;s about understanding yourself with compassion.
            </Text>
          </Animated.View>

          {/* ── Node Axis — Direction ── */}
          {nodeInsight && (
            <Animated.View
              entering={FadeInDown.delay(450).duration(600)}
              style={styles.awarenessCard}
            >
              <LinearGradient
                colors={['rgba(139, 196, 232, 0.12)', 'rgba(139, 196, 232, 0.04)']}
                style={styles.awarenessGradient}
              >
                <View style={styles.awarenessHeader}>
                  <Text style={styles.awarenessEmoji}>🧭</Text>
                  <Text style={styles.awarenessTitle}>Your Direction</Text>
                </View>

                {/* Free: one-line overview */}
                <Text style={styles.awarenessTheme}>{nodeInsight.fusionLine}</Text>

                {/* Free: brief awareness */}
                <View style={styles.nodeRow}>
                  <View style={styles.nodeSide}>
                    <Text style={styles.nodeLabel}>Comfort zone</Text>
                    <Text style={styles.nodeValue}>{nodeInsight.southNode.title}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={theme.textMuted} />
                  <View style={styles.nodeSide}>
                    <Text style={styles.nodeLabel}>Growth edge</Text>
                    <Text style={[styles.nodeValue, { color: theme.primary }]}>{nodeInsight.northNode.title}</Text>
                  </View>
                </View>

                {/* Premium: deeper descriptions + weekly reflection */}
                {isPremium && (
                  <>
                    <Text style={styles.awarenessDesc}>{nodeInsight.southNode.description}</Text>
                    <Text style={styles.awarenessDesc}>{nodeInsight.northNode.description}</Text>
                    <View style={styles.weeklyBox}>
                      <Ionicons name="calendar-outline" size={14} color={theme.primary} />
                      <Text style={styles.weeklyText}>{nodeInsight.weeklyReflection}</Text>
                    </View>
                  </>
                )}

                {!isPremium && (
                  <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                    <Text style={styles.deeperNudge}>
                      See how this evolves over time →
                    </Text>
                  </Pressable>
                )}
              </LinearGradient>
            </Animated.View>
          )}

          {/* ── Chiron — Sensitivity ── */}
          {chironInsight && (
            <Animated.View
              entering={FadeInDown.delay(500).duration(600)}
              style={styles.awarenessCard}
            >
              <LinearGradient
                colors={['rgba(196, 181, 253, 0.12)', 'rgba(196, 181, 253, 0.04)']}
                style={styles.awarenessGradient}
              >
                <View style={styles.awarenessHeader}>
                  <Text style={styles.awarenessEmoji}>🪐</Text>
                  <Text style={styles.awarenessTitle}>{chironInsight.title}</Text>
                </View>

                {/* Free: one-line theme */}
                <Text style={styles.awarenessTheme}>{chironInsight.theme}</Text>

                {/* Premium: full description + integration + body cue */}
                {isPremium && (
                  <>
                    <Text style={styles.awarenessDesc}>{chironInsight.description}</Text>
                    <View style={styles.integrationBox}>
                      <Text style={styles.integrationLabel}>Integration theme</Text>
                      <Text style={styles.integrationValue}>{chironInsight.integrationTheme}</Text>
                    </View>
                    <Text style={styles.bodyCue}>🫁 {chironInsight.bodyAwareness}</Text>
                  </>
                )}

                {!isPremium && (
                  <Pressable onPress={() => router.push('/(tabs)/premium' as Href)}>
                    <Text style={styles.deeperNudge}>
                      Go deeper with your sensitivity mapping →
                    </Text>
                  </Pressable>
                )}
              </LinearGradient>
            </Animated.View>
          )}

        </ScrollView>
      </SafeAreaView>

      <BirthDataModal
        visible={showBirthModal}
        onClose={() => setShowBirthModal(false)}
        onSave={handleBirthDataSave}
        initialData={birthModalInitialData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  createChartButton: {
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  createChartText: {
    color: theme.primary,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  poeticIntro: {
    fontSize: 15,
    color: theme.textSecondary,
    fontStyle: 'italic',
    lineHeight: 24,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  editBirthButton: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.4)',
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
  },
  editBirthText: {
    marginLeft: theme.spacing.xs,
    color: theme.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  warningAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
  },
  warningActionText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  sectionNav: {
    marginBottom: theme.spacing.xl,
  },
  sectionNavContent: {
    paddingHorizontal: theme.spacing.sm,
  },
  sectionButton: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  sectionButtonActive: {
    // Additional styling handled by gradient colors
  },
  sectionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minWidth: 120,
  },
  sectionButtonText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
    textAlign: 'center',
    flex: 1,
  },
  sectionButtonTextActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  contentContainer: {
    marginBottom: theme.spacing.xl,
  },
  contentCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  sectionContent: {
    // Content styling
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.md,
    lineHeight: 28,
  },
  contentText: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.textMuted,
    marginRight: theme.spacing.sm,
    marginTop: 8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(224, 176, 122, 0.4)',
    backgroundColor: 'rgba(224, 176, 122, 0.12)',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.warning,
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  listText: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  explanationContainer: {
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  explanationText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  viewChartLink: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.25)',
    gap: 8,
  },
  viewChartLinkText: {
    color: theme.primary,
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },

  // Node / Chiron awareness cards
  awarenessCard: {
    marginTop: theme.spacing.lg,
  },
  awarenessGradient: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  awarenessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  awarenessEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  awarenessTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  awarenessTheme: {
    fontSize: 15,
    color: theme.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  awarenessDesc: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: theme.borderRadius.lg,
  },
  nodeSide: {
    alignItems: 'center',
    flex: 1,
  },
  nodeLabel: {
    fontSize: 11,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  nodeValue: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '600',
  },
  weeklyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(201,169,98,0.08)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  weeklyText: {
    flex: 1,
    fontSize: 13,
    color: theme.primary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  integrationBox: {
    backgroundColor: 'rgba(196,181,253,0.08)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  integrationLabel: {
    fontSize: 11,
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  integrationValue: {
    fontSize: 14,
    color: theme.textPrimary,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  bodyCue: {
    fontSize: 13,
    color: theme.textMuted,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  deeperNudge: {
    fontSize: 13,
    color: theme.primary,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});