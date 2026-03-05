import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Slider from '@react-native-community/slider';

export const SomaticHeatMap = () => {
  const [day, setDay] = useState(15);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Somatic Heat-Map Time-Lapse</Text>
      <View style={styles.bodyContainer}>
        <View style={styles.bodyHead} />
        <View style={styles.bodyTorso}>
          {day < 10 && <View style={[styles.tensionSpot, { top: 20, left: 20, backgroundColor: 'red' }]} />}
          {day >= 10 && day < 20 && <View style={[styles.tensionSpot, { top: 60, left: 40, backgroundColor: 'orange' }]} />}
          {day >= 20 && <View style={[styles.tensionSpot, { bottom: 20, right: 30, backgroundColor: 'yellow' }]} />}
        </View>
      </View>
      <Text style={styles.dayLabel}>Day {Math.floor(day)} / 30</Text>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={1}
        maximumValue={30}
        value={day}
        onValueChange={setDay}
        minimumTrackTintColor="#1E90FF"
        maximumTrackTintColor="#555"
        thumbTintColor="#FFD700"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: { padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, marginVertical: 10 },
  title: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 20 },
  bodyContainer: { height: 200, alignItems: 'center', justifyContent: 'center' },
  bodyHead: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', marginBottom: 5 },
  bodyTorso: { width: 100, height: 120, backgroundColor: '#333', borderRadius: 20, position: 'relative' },
  tensionSpot: { width: 30, height: 30, borderRadius: 15, position: 'absolute', opacity: 0.8 },
  dayLabel: { color: '#AAA', textAlign: 'center', marginTop: 10 }
});
