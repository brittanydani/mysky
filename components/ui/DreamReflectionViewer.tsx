import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  DREAM_SYMBOLS, 
  extractSymbols, 
  pickVariant, 
  DreamArchetype 
} from '../../constants/dreamSymbols';

interface DreamReflectionViewerProps {
  dreamText: string;
  entryId: string;
}

const ARCHETYPE_COLORS: Record<DreamArchetype, [string, string]> = {
  Shadow: ['rgba(157, 118, 193, 0.4)', 'rgba(157, 118, 193, 0.05)'], // Amethyst
  Self: ['rgba(212, 175, 55, 0.4)', 'rgba(212, 175, 55, 0.05)'], // Champagne Gold
  Threshold: ['rgba(139, 196, 232, 0.4)', 'rgba(139, 196, 232, 0.05)'], // Silver-Blue
  Transformation: ['rgba(205, 127, 93, 0.4)', 'rgba(205, 127, 93, 0.05)'], // Copper
  Integration: ['rgba(64, 224, 208, 0.4)', 'rgba(64, 224, 208, 0.05)'], // Turquoise/Teal
  Anima: ['rgba(255, 105, 180, 0.4)', 'rgba(255, 105, 180, 0.05)'], // Rose/Pink
  Persona: ['rgba(15, 82, 186, 0.4)', 'rgba(15, 82, 186, 0.05)'], // Sapphire
};

export default function DreamReflectionViewer({ dreamText, entryId }: DreamReflectionViewerProps) {
  const reflections = useMemo(() => {
    const symbolKeys = extractSymbols(dreamText);
    return symbolKeys.map((key) => {
      const symbol = DREAM_SYMBOLS[key];
      const interpretation = pickVariant(symbol.interpretations, entryId);
      return {
        ...symbol,
        interpretation,
      };
    });
  }, [dreamText, entryId]);

  if (reflections.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Symbolic Reflections</Text>
      
      {reflections.map((reflection, index) => {
        const colors = ARCHETYPE_COLORS[reflection.archetype] || ARCHETYPE_COLORS.Self;

        return (
          <View key={`${reflection.label}-${index}`} style={styles.cardWrapper}>
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.glassCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.symbolLabel}>{reflection.label}</Text>
                  <Text style={styles.archetypeLabel}>{reflection.archetype}</Text>
                </View>
                
                <Text style={styles.themes}>
                  Themes: {reflection.themes.join(', ')}
                </Text>
                
                <Text style={styles.interpretation}>
                  {reflection.interpretation}
                </Text>
              </View>
            </LinearGradient>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    gap: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBorder: {
    padding: 1, // Creates the border effect
    borderRadius: 16,
  },
  glassCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.7)', // Dark glassmorphic base
    borderRadius: 15,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  symbolLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  archetypeLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  themes: {
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  interpretation: {
    fontSize: 15,
    lineHeight: 22,
    color: '#D0D0D0',
  },
});
