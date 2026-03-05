import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

export const StabilityRecurrences = () => {
  // Mock data representing a 30-day stability trend
  const data = [50, 60, 45, 70, 80, 55, 65, 90, 85, 40, 30, 60, 75, 80];
  
  const SVG_WIDTH = width - 80;
  const SVG_HEIGHT = 100;
  
  const generatePath = () => {
    if (data.length === 0) return '';
    const stepX = SVG_WIDTH / (data.length - 1);
    const maxY = Math.max(...data);
    const minY = Math.min(...data);
    const scaleY = SVG_HEIGHT / (maxY - minY);

    return data.reduce((path, val, idx) => {
      const x = idx * stepX;
      const y = SVG_HEIGHT - (val - minY) * scaleY; // Invert Y
      return path + (idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    }, '');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Stability Recurrences</Text>
      <Text style={styles.subtitle}>Last 30 Days Trend</Text>
      
      <View style={styles.chartContainer}>
        <Svg width={SVG_WIDTH} height={SVG_HEIGHT} style={styles.svg}>
          <Defs>
            <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#4CAF50" stopOpacity="0.5" />
              <Stop offset="1" stopColor="#F44336" stopOpacity="0.5" />
            </LinearGradient>
          </Defs>
          <Path
            d={generatePath()}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <View style={styles.labels}>
          <Text style={styles.axisLabel}>Surges</Text>
          <Text style={styles.axisLabel}>Dips</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, marginVertical: 10 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#AAA', fontSize: 14, marginBottom: 15 },
  chartContainer: { 
    height: 120, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  svg: { flex: 1 },
  labels: { 
    justifyContent: 'space-between',
    paddingLeft: 10,
    height: 100
  },
  axisLabel: { color: '#888', fontSize: 10 }
});
