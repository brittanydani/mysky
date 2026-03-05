import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export const InternalAtmosphere = ({ onClearPressure }: { onClearPressure: () => void }) => {
  const [activeDomain, setActiveDomain] = useState('Peak Cognition');

  return (
    <View style={styles.container}>
      {/* Circadian Window Dial */}
      <View style={styles.dial}>
        <Text style={styles.dialText}>Active Domain: {activeDomain}</Text>
      </View>

      {/* Somatic Silhouette */}
      <View style={styles.silhouette}>
        <Text style={styles.silhouetteTitle}>Interactive Body Map</Text>
        <View style={styles.heatMapNode} />
      </View>

      {/* Domain Pressure Cards */}
      <View style={styles.cards}>
        <Text style={styles.card}>Focus Pressure</Text>
        <Text style={styles.card}>Connection Pressure</Text>
        <Text style={styles.card}>Movement Pressure</Text>
      </View>

      {/* "Clear Pressure" Gate */}
      <Pressable style={styles.clearGate} onPress={onClearPressure}>
        <Text style={styles.clearText}>Clear Pressure</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  dial: { alignItems: 'center', marginBottom: 20 },
  dialText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  silhouette: { height: 200, backgroundColor: '#222', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  silhouetteTitle: { color: 'gray' },
  heatMapNode: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,100,100,0.5)', position: 'absolute' },
  cards: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  card: { color: 'white', backgroundColor: '#333', padding: 10, borderRadius: 5, flex: 1, marginHorizontal: 5, textAlign: 'center', fontSize: 12 },
  clearGate: { backgroundColor: '#4a90e2', padding: 15, borderRadius: 10, alignItems: 'center' },
  clearText: { color: 'white', fontWeight: 'bold' }
});