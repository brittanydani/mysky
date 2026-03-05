import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export interface KeywordData {
  word: string;
  count: number;
  correlation: number; // e.g., 0.0 to 1.0 (higher means stronger correlation with stability)
}

interface KeywordCloudProps {
  data: KeywordData[];
}

export function KeywordCloud({ data }: KeywordCloudProps) {
  const { colors } = useTheme();

  // Sort by correlation to highlight the most stable words
  const sortedData = [...data].sort((a, b) => b.correlation - a.correlation);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Success Patterns</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Words associated with your highest stability days
      </Text>
      
      <View style={styles.cloudContainer}>
        {sortedData.map((item, index) => {
          // Calculate font size based on count and correlation
          const fontSize = Math.max(14, Math.min(32, 12 + item.count * 2));
          // Higher correlation gets a more prominent color/weight
          const opacity = 0.5 + (item.correlation * 0.5);
          const fontWeight = item.correlation > 0.7 ? 'bold' : 'normal';

          return (
            <View key={index} style={styles.wordWrapper}>
              <Text 
                style={[
                  styles.word, 
                  { 
                    fontSize, 
                    fontWeight,
                    opacity,
                    color: item.correlation > 0.8 ? '#4ade80' : colors.text, // Highlight highly correlated words in green (or theme success color)
                  }
                ]}
              >
                {item.word}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  cloudContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  wordWrapper: {
    padding: 4,
  },
  word: {
    textAlign: 'center',
  },
});
