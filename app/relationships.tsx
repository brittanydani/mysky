import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../constants/theme';
import StarField from '../components/ui/StarField';
import { localDb } from '../services/storage/localDb';
import { NatalChart } from '../services/astrology/types';
import { AstrologyCalculator } from '../services/astrology/calculator';
import { RelationshipGuidanceGenerator, HumanRelationshipGuidance } from '../services/astrology/relationshipGuidance';
import { logger } from '../utils/logger';

export default function RelationshipsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [userChart, setUserChart] = useState<NatalChart | null>(null);
  const [guidance, setGuidance] = useState<HumanRelationshipGuidance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const charts = await localDb.getCharts();
      if (charts.length > 0) {
        const savedChart = charts[0];
        const birthData = {
          date: savedChart.birthDate,
          time: savedChart.birthTime,
          hasUnknownTime: savedChart.hasUnknownTime,
          place: savedChart.birthPlace,
          latitude: savedChart.latitude,
          longitude: savedChart.longitude,
          houseSystem: savedChart.houseSystem
        };
        
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        chart.id = savedChart.id;
        chart.name = savedChart.name;
        
        setUserChart(chart);
        setGuidance(RelationshipGuidanceGenerator.generateGuidance(chart));
      }
    } catch (error) {
      logger.error('Failed to load relationship data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={40} />
        <Text style={styles.loadingText}>Exploring your heart...</Text>
      </View>
    );
  }

  if (!userChart || !guidance) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StarField starCount={40} />
        <Text style={styles.emptyTitle}>Discover how you love</Text>
        <Text style={styles.loadingText}>Create your chart to understand your unique relationship patterns</Text>
        <Pressable
          style={styles.createChartButton}
          onPress={() => router.push('/' as Href)}
        >
          <Text style={styles.createChartText}>Get Started</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StarField starCount={30} />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Love & Connection</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Poetic Intro */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.intro}
          >
            <Text style={styles.introText}>
              This isn&apos;t about finding your "perfect match." It&apos;s about understanding yourself 
              in relationship — how you love, what you need, and where you&apos;re still learning.
            </Text>
          </Animated.View>

          {/* How You Love */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <LinearGradient
              colors={['rgba(224, 122, 152, 0.12)', 'rgba(224, 122, 152, 0.04)']}
              style={styles.insightCard}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="heart" size={18} color="#E07A98" />
                <Text style={[styles.cardLabel, { color: '#E07A98' }]}>HOW YOU LOVE</Text>
              </View>
              <Text style={styles.cardTitle}>{guidance.howYouLove.title}</Text>
              <Text style={styles.cardContent}>{guidance.howYouLove.message}</Text>
              <View style={styles.affirmationBox}>
                <Text style={styles.affirmation}>"{guidance.howYouLove.affirmation}"</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* What You Need */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <LinearGradient
              colors={['rgba(139, 196, 232, 0.12)', 'rgba(139, 196, 232, 0.04)']}
              style={styles.insightCard}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="water" size={18} color="#8BC4E8" />
                <Text style={[styles.cardLabel, { color: '#8BC4E8' }]}>WHAT YOU NEED</Text>
              </View>
              <Text style={styles.cardTitle}>{guidance.whatYouNeed.title}</Text>
              <Text style={styles.cardContent}>{guidance.whatYouNeed.message}</Text>
              <View style={styles.affirmationBox}>
                <Text style={styles.affirmation}>"{guidance.whatYouNeed.affirmation}"</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* How You Grow */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <LinearGradient
              colors={['rgba(110, 191, 139, 0.12)', 'rgba(110, 191, 139, 0.04)']}
              style={styles.insightCard}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="leaf" size={18} color="#6EBF8B" />
                <Text style={[styles.cardLabel, { color: '#6EBF8B' }]}>YOUR GROWTH EDGE</Text>
              </View>
              <Text style={styles.cardTitle}>{guidance.howYouGrow.title}</Text>
              <Text style={styles.cardContent}>{guidance.howYouGrow.message}</Text>
              <View style={styles.affirmationBox}>
                <Text style={styles.affirmation}>"{guidance.howYouGrow.affirmation}"</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Blind Spots */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <LinearGradient
              colors={['rgba(201, 169, 98, 0.12)', 'rgba(201, 169, 98, 0.04)']}
              style={styles.insightCard}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="eye-off-outline" size={18} color={theme.primary} />
                <Text style={[styles.cardLabel, { color: theme.primary }]}>GENTLE BLIND SPOT</Text>
              </View>
              <Text style={styles.cardTitle}>{guidance.blindSpots.title}</Text>
              <Text style={styles.cardContent}>{guidance.blindSpots.message}</Text>
              <View style={styles.affirmationBox}>
                <Text style={styles.affirmation}>"{guidance.blindSpots.affirmation}"</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Gentle Reminder */}
          <Animated.View 
            entering={FadeInDown.delay(600).duration(600)}
            style={styles.reminderSection}
          >
            <LinearGradient
              colors={['rgba(201, 169, 98, 0.15)', 'rgba(201, 169, 98, 0.05)']}
              style={styles.reminderCard}
            >
              <Text style={styles.reminderText}>"{guidance.gentleReminder}"</Text>
            </LinearGradient>
          </Animated.View>

          {/* Reflection Prompt */}
          <Animated.View 
            entering={FadeInDown.delay(700).duration(600)}
            style={styles.promptSection}
          >
            <Text style={styles.promptLabel}>Today&apos;s reflection</Text>
            <Text style={styles.promptText}>{guidance.partnerReflectionPrompt}</Text>
            
            <Pressable
              style={styles.journalButton}
              onPress={() => router.push('/(tabs)/journal' as Href)}
            >
              <LinearGradient
                colors={['rgba(201, 169, 98, 0.2)', 'rgba(201, 169, 98, 0.1)']}
                style={styles.journalGradient}
              >
                <Ionicons name="create-outline" size={18} color={theme.primary} />
                <Text style={styles.journalButtonText}>Reflect in Journal</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: theme.spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  createChartButton: {
    backgroundColor: 'rgba(201, 169, 98, 0.2)',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.3)',
  },
  createChartText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  intro: {
    marginBottom: theme.spacing.xl,
  },
  introText: {
    fontSize: 16,
    color: theme.textSecondary,
    lineHeight: 26,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  insightCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginLeft: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textPrimary,
    fontFamily: 'serif',
    marginBottom: theme.spacing.md,
  },
  cardContent: {
    fontSize: 15,
    color: theme.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  affirmationBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: theme.spacing.md,
  },
  affirmation: {
    fontSize: 14,
    color: theme.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  reminderSection: {
    marginBottom: theme.spacing.lg,
  },
  reminderCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 98, 0.2)',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: 17,
    color: theme.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: 'serif',
  },
  promptSection: {
    backgroundColor: 'rgba(30, 45, 71, 0.5)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: theme.spacing.lg,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
  },
  promptText: {
    fontSize: 18,
    color: theme.textPrimary,
    fontStyle: 'italic',
    lineHeight: 28,
    fontFamily: 'serif',
    marginBottom: theme.spacing.lg,
  },
  journalButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  journalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  journalButtonText: {
    fontSize: 15,
    color: theme.primary,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});
