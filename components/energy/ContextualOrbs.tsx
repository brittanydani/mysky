/**
 * ContextualOrbs.tsx
 * Horizontal scroll of the last few check-in deltas in the Archive or Balance Screen.
 */

import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type OrbData = {
  id: string;
  context: string;
  delta: number;
  time: string;
};

// Colors associated with each context window
const CONTEXT_COLORS: Record<string, [string, string]> = {
  Development: ['#D4AF37', 'rgba(212, 175, 55, 0.2)'], // Gold
  Parenting: ['#50C878', 'rgba(80, 200, 120, 0.2)'],   // Emerald
  Recovery: ['#4B0082', 'rgba(75, 0, 130, 0.2)'],      // Indigo
  Social: ['#C0C0C0', 'rgba(192, 192, 192, 0.2)'],     // Silver
};

export const ContextualOrbs = ({ orbs }: { orbs: OrbData[] }) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {orbs.map((orb) => {
        const [solid, translucent] = CONTEXT_COLORS[orb.context] || CONTEXT_COLORS['Recovery'];
        const isPositive = orb.delta >= 0;

        return (
          <View key={orb.id} style={styles.orbItem}>
            <LinearGradient
              colors={[translucent, 'transparent']}
              style={styles.orbContainer}
            >
              <View style={[styles.orbCore, { backgroundColor: isPositive ? solid : '#CD7F5D' }]} />
            </LinearGradient>
            <Text style={styles.contextText}>{orb.context}</Text>
            <Text style={[styles.deltaText, { color: isPositive ? '#D4AF37' : '#CD7F5D' }]}>
              {isPositive ? '+' : ''}{orb.delta}
            </Text>
            <Text style={styles.timeText}>{orb.time}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 120,
    marginTop: 20,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  orbItem: {
    alignItems: 'center',
    width: 80,
  },
  orbContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  orbCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  contextText: {
    color: '#E0E0E0',
    fontSize: 10,
    fontFamily: 'SpaceMono-Regular', // Placeholder matching typography
    marginTop: 8,
    textTransform: 'uppercase',
  },
  deltaText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  timeText: {
    color: '#888888',
    fontSize: 9,
    marginTop: 2,
  },
});
