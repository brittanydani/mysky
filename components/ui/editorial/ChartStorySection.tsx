import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SkiaGradientText } from './SkiaGradientText';
import { Spacing } from './theme';
import { CoreIdentitySummary } from '../../../services/astrology/natalSynthesis';

export const ChartStorySection = ({ coreIdentity }: { coreIdentity: CoreIdentitySummary | null }) => {
  if (!coreIdentity) return null;

  const { sunSign, risingSign, overviewParts, chartRuler, chartRulerSign } = coreIdentity;

  const renderParagraph = (text: string, index: number) => {
    // 1. Drop Cap for the first letter of the very first paragraph
    if (index === 0) {
      const firstLetter = text.charAt(0);
      const rest = text.slice(1);
      
      // Simple boldness injection for the Sun Sign
      const splitSun = rest.split(`${sunSign} Sun`);
      const restContent = splitSun.length > 1 ? (
        <>
          {splitSun[0]}
          <Text style={styles.boldEmphasis}>{sunSign} Sun</Text>
          {splitSun[1]}
        </>
      ) : rest;
      
      return (
        <Text key={`p-${index}`} style={styles.body}>
          <Text style={styles.dropCap}>{firstLetter}</Text>{restContent}
        </Text>
      );
    }
    
    // Bold Rising Sign mention
    if (risingSign && text.includes(`${risingSign} Rising`)) {
      const splitRising = text.split(`${risingSign} Rising`);
      return (
        <Text key={`p-${index}`} style={styles.body}>
           {splitRising[0]}
           <Text style={styles.boldEmphasis}>{risingSign} Rising</Text>
           {splitRising[1]}
        </Text>
      );
    }

    // Bold Chart Ruler mentions
    if (chartRuler && text.includes(chartRuler)) {
      const splitRuler = text.split(chartRuler);
      return (
         <Text key={`p-${index}`} style={styles.body}>
           {splitRuler[0]}
           <Text style={styles.boldEmphasis}>{chartRuler}</Text>
           {splitRuler[1]}
         </Text>
      );
    }
    
    return (
      <Text key={`p-${index}`} style={styles.body}>
        {text}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {/* Editorial Header */}
      <View style={styles.headerContainer}>
        <SkiaGradientText text="The Blueprint" variant="hero" />
        <Text style={styles.subtitle}>
          SUN IN {sunSign.toUpperCase()}{risingSign ? ` • RISING IN ${risingSign.toUpperCase()}` : ''}
        </Text>
      </View>

      {/* Magazine-Style Narrative */}
      <View style={styles.narrativeContainer}>
        {overviewParts.map((para, i) => renderParagraph(para, i))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    marginBottom: 32,
  },
  headerContainer: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
  },
  narrativeContainer: {
    gap: 20,
  },
  dropCap: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  boldEmphasis: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});
