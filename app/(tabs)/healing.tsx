import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { theme } from '../../constants/theme';
import StarField from '../../components/ui/StarField';
import InsightCard from '../../components/ui/InsightCard';
import ShadowQuoteCard from '../../components/ui/ShadowQuoteCard';
import { healingInsights } from '../../services/mockData';
import { ShadowQuoteEngine, ShadowQuote } from '../../services/astrology/shadowQuotes';
import { AstrologyCalculator } from '../../services/astrology/calculator';
import { localDb } from '../../services/storage/localDb';
import { logger } from '../../utils/logger';

export default function HealingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [healingQuote, setHealingQuote] = useState<ShadowQuote | null>(null);

  useEffect(() => {
    loadHealingQuote();
  }, []);

  const loadHealingQuote = async () => {
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
          houseSystem: savedChart.houseSystem,
        };
        const chart = AstrologyCalculator.generateNatalChart(birthData);
        const result = await ShadowQuoteEngine.getDailyShadowQuote(chart);
        // Prefer protective/release tones on the healing screen
        if (result.quote.tone === 'protective' || result.quote.tone === 'release') {
          setHealingQuote(result.quote);
        } else if (result.closeQuote) {
          // closeQuote is always release tone — perfect for healing
          setHealingQuote(result.closeQuote);
        }
      }
    } catch (e) {
      logger.error('[Healing] Failed to load shadow quote:', e);
    }
  };

  const handleInsightPress = (insight: typeof healingInsights[0]) => {
    if (insight.isLocked) {
      router.push('/(tabs)/premium' as Href);
    }
  };

  return (
    <View style={styles.container}>
      <StarField starCount={25} />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
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
            <Text style={styles.title}>Healing Insights</Text>
          </Animated.View>

          {/* Shadow quote — soft Chiron/release truth */}
          {healingQuote && (
            <Animated.View entering={FadeInDown.delay(150).duration(800)} style={styles.shadowSection}>
              <ShadowQuoteCard
                quote={healingQuote}
                variant="footer"
                animationDelay={0}
              />
            </Animated.View>
          )}

          {/* Inner Child Needs - Featured */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <InsightCard
              title={healingInsights[0].title}
              content={healingInsights[0].content}
              icon="heart"
              variant="featured"
              onPress={() => handleInsightPress(healingInsights[0])}
            />
          </Animated.View>

          {/* Current Growth Theme */}
          <Animated.View 
            entering={FadeInDown.delay(300).duration(600)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Current Growth Theme</Text>
            
            {healingInsights.slice(1).map((insight) => (
              <InsightCard
                key={insight.id}
                title={insight.title}
                content={insight.content}
                icon={
                  insight.id === '2' ? 'shield' :
                  insight.id === '3' ? 'link' : 'moon'
                }
                locked={insight.isLocked}
                onPress={() => handleInsightPress(insight)}
              />
            ))}
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
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.textPrimary,
    fontFamily: 'serif',
    letterSpacing: 0.5,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  shadowSection: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
});
