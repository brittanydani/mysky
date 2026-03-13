import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ExtractedSymbol } from '../../services/premium/dreamSymbolParser';
import { theme } from '../../constants/theme';

interface Props {
  symbols?: ExtractedSymbol[];
}

export function DreamSymbolChips({ symbols }: Props) {
  if (!symbols || symbols.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Identified Symbols</Text>
      <View style={styles.chipRow}>
        {symbols.map((sym, i) => (
          <View key={i} style={styles.chip}>
            <Text style={styles.chipCategory}>
              {sym.category.replace(/_/g, ' ').toUpperCase()}
            </Text>
            <Text style={styles.chipWord}>{sym.word}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8B2C1',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipCategory: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    marginBottom: 2,
  },
  chipWord: {
    fontSize: 13,
    color: theme.textPrimary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
