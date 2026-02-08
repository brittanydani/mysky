// File: components/ui/NeedsComparison.tsx
// MySky — Side-by-side "What Each Person Needs" card for Relationships

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface NeedsComparisonProps {
  person1Name: string;
  person1Needs: string[];
  person2Name: string;
  person2Needs: string[];
}

export default function NeedsComparison({
  person1Name,
  person1Needs,
  person2Name,
  person2Needs,
}: NeedsComparisonProps) {
  return (
    <View style={styles.container}>
      <View style={styles.columns}>
        {/* Person 1 */}
        <LinearGradient
          colors={['rgba(201,169,98,0.1)', 'rgba(201,169,98,0.03)']}
          style={styles.column}
        >
          <View style={styles.nameRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={14} color={theme.primary} />
            </View>
            <Text style={styles.name} numberOfLines={1}>{person1Name}</Text>
          </View>
          <View style={styles.needsList}>
            {person1Needs.slice(0, 3).map((need, i) => (
              <View key={i} style={styles.needRow}>
                <View style={styles.needDot} />
                <Text style={styles.needText}>{need}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerIcon}>
            <Ionicons name="heart" size={12} color={theme.primary} />
          </View>
          <View style={styles.dividerLine} />
        </View>

        {/* Person 2 */}
        <LinearGradient
          colors={['rgba(139,196,232,0.1)', 'rgba(139,196,232,0.03)']}
          style={styles.column}
        >
          <View style={styles.nameRow}>
            <View style={[styles.avatar, { backgroundColor: 'rgba(139,196,232,0.2)' }]}>
              <Ionicons name="person" size={14} color="#8BC4E8" />
            </View>
            <Text style={[styles.name, { color: '#8BC4E8' }]} numberOfLines={1}>
              {person2Name}
            </Text>
          </View>
          <View style={styles.needsList}>
            {person2Needs.slice(0, 3).map((need, i) => (
              <View key={i} style={styles.needRow}>
                <View style={[styles.needDot, { backgroundColor: 'rgba(139,196,232,0.5)' }]} />
                <Text style={styles.needText}>{need}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  columns: {
    flexDirection: 'row',
    gap: 4,
  },
  column: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(201,169,98,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
    flex: 1,
  },
  needsList: {
    gap: 8,
  },
  needRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  needDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(201,169,98,0.5)',
    marginTop: 5,
    flexShrink: 0,
  },
  needText: {
    fontSize: 12.5,
    color: theme.textSecondary,
    lineHeight: 17,
    flex: 1,
  },
  dividerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    paddingVertical: 12,
  },
  dividerLine: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(201,169,98,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
});
