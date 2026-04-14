import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SkiaGradientText } from './SkiaGradientText';
import { CoreIdentitySummary } from '../../../services/astrology/natalSynthesis';

export const ChartStorySection = ({ coreIdentity }: { coreIdentity: CoreIdentitySummary | null }) => {
  if (!coreIdentity) return null;

  const { sunSign, risingSign, overviewParts, chartRuler } = coreIdentity;

  const renderParagraph = (text: string, index: number) => {
      if (index === 0) {
        const splitSun = text.split(`${sunSign} Sun`);
        const content = splitSun.length > 1 ? (
          <>
            {splitSun[0]}
            <Text style={styles.boldEmphasis}>{sunSign} Sun</Text>
            {splitSun[1]}
          </>
        ) : text;

        return (
          <Text key={`p-${index}`} style={styles.body}>
            {content}
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
    marginBottom: 48,
  },
  headerContainer: {
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    textAlign: 'center',
  },
  narrativeContainer: {
    gap: 24,
  },
  boldEmphasis: {
    fontWeight: '800',
    color: '#E8D6AE',
    textShadowColor: 'rgba(232, 214, 174, 0.22)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 28,
  },
});
