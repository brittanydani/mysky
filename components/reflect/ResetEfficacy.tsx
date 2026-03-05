import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EFFICACY_DATA = [
  { ratio: '4:8', gain: '+15%', color: '#4CAF50', label: 'Deep Calm' },
  { ratio: '4:4:4:4', gain: '+8%', color: '#2196F3', label: 'Box Breathing' },
  { ratio: '5:5', gain: '+5%', color: '#9C27B0', label: 'Coherent' },
  { ratio: '6:2', gain: '-2%', color: '#F44336', label: 'Energizing' },
];

export const ResetEfficacy = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Reset Efficacy</Text>
      <Text style={styles.subtitle}>Stability Gain by Breathing Ratio</Text>
      
      <View style={styles.chartContainer}>
        {EFFICACY_DATA.map((item, index) => {
          const isPositive = item.gain.startsWith('+');
          const height = Math.abs(parseInt(item.gain, 10)) * 5; // scaled for UI
          
          return (
            <View key={index} style={styles.barColumn}>
              <View style={styles.barStack}>
                {isPositive ? (
                  <View style={[styles.bar, { height, backgroundColor: item.color }]} />
                ) : (
                  <View style={[styles.barBelow, { height, backgroundColor: item.color }]} />
                )}
              </View>
              <Text style={styles.ratioLabel}>{item.ratio}</Text>
              <Text style={[styles.gainLabel, { color: isPositive ? '#4CAF50' : '#F44336' }]}>
                {item.gain}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, marginVertical: 10 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#AAA', fontSize: 14, marginBottom: 20 },
  chartContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'flex-end',
    height: 150,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)'
  },
  barColumn: { alignItems: 'center', width: 60 },
  barStack: { height: 100, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
  bar: { width: 30, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  barBelow: { width: 30, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, marginTop: 'auto' },
  ratioLabel: { color: '#FFF', fontSize: 12, marginTop: 10, fontWeight: 'bold' },
  gainLabel: { fontSize: 12, marginTop: 4 }
});
