import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SkiaGradient as LinearGradient } from '../components/ui/SkiaGradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export default function CosmicContext() {
  const router = useRouter();

  const activeTransits = [
    { id: 1, planet: 'Sun', symbol: '☉', sign: 'Pisces', signSymbol: '♓︎', status: 'Direct', impact: 'Heightened intuition and emotional permeability.' },
    { id: 2, planet: 'Moon', symbol: '☽', sign: 'Scorpio', signSymbol: '♏︎', status: 'Direct', impact: 'Deep emotional processing. Secrets may surface.' },
    { id: 3, planet: 'Mercury', symbol: '☿', sign: 'Aries', signSymbol: '♈︎', status: 'Retrograde', impact: 'Communication feels rushed and prone to friction.', isRx: true },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(110, 140, 180, 0.15)', 'transparent']} style={styles.ambientTop} />

      <View style={styles.header}>
        <Pressable onPress={() => { Haptics.selectionAsync(); router.back(); }} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Cosmic Context</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.moonCard}>
          <Text style={styles.sectionLabel}>CURRENT LUNATION</Text>
          <View style={styles.moonGraphicContainer}>
            <View style={styles.moonGlow} />
            <View style={styles.moonCore}>
              <View style={styles.moonShadow} />
            </View>
          </View>
          <Text style={styles.moonTitle}>Waning Crescent in Scorpio</Text>
          <Text style={styles.moonDesc}>A time for release, energetic clearing, and deep internal auditing before the New Moon.</Text>
        </View>

        <View style={styles.affirmationCard}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.premiumHeaderRow}>
            <Text style={styles.affirmationLabel}>DAILY ALIGNMENT</Text>
            <Text style={styles.premiumIcon}>✦</Text>
          </View>
          <Text style={styles.affirmationText}>
            "I allow what is heavy to drop away. I do not need to carry the emotional weight of others today."
          </Text>
        </View>

        <View style={styles.transitsSection}>
          <Text style={styles.sectionLabel}>ACTIVE TRANSITS</Text>
          <View style={styles.transitsContainer}>
            {activeTransits.map((transit, index) => (
              <View key={transit.id}>
                <View style={styles.transitRow}>
                  <View style={styles.planetIconBox}>
                    <Text style={styles.planetSymbol}>{transit.symbol}</Text>
                  </View>
                  <View style={styles.transitDetails}>
                    <View style={styles.transitHeaderRow}>
                      <Text style={styles.transitTitle}>{transit.planet} in {transit.sign}</Text>
                      {transit.isRx && <Text style={styles.rxBadge}>Rx</Text>}
                    </View>
                    <Text style={styles.transitImpact}>{transit.impact}</Text>
                  </View>
                </View>
                {index < activeTransits.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050507' },
  ambientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backArrow: { color: '#FFF', fontSize: 36, fontWeight: '300', lineHeight: 40 },
  headerTitle: { fontSize: 16, color: '#FFF', fontFamily: 'Georgia', letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
  sectionLabel: { fontSize: 11, fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginBottom: 16 },

  moonCard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 32, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 24 },
  moonGraphicContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  moonGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(110, 140, 180, 0.2)' },
  moonCore: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', overflow: 'hidden' },
  moonShadow: { position: 'absolute', right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: '#050507', opacity: 0.9 },
  moonTitle: { fontSize: 20, color: '#FFF', fontFamily: 'Georgia', marginBottom: 8 },
  moonDesc: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20 },

  affirmationCard: { padding: 24, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(217, 191, 140, 0.2)', marginBottom: 32 },
  premiumHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  affirmationLabel: { fontSize: 11, fontWeight: 'bold', color: '#D9BF8C', letterSpacing: 1.5 },
  premiumIcon: { color: '#D9BF8C', fontSize: 14 },
  affirmationText: { fontSize: 18, color: '#FFF', fontFamily: 'Georgia', fontStyle: 'italic', lineHeight: 28 },

  transitsSection: { marginBottom: 24 },
  transitsContainer: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  transitRow: { flexDirection: 'row', alignItems: 'flex-start' },
  planetIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(110, 140, 180, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  planetSymbol: { fontSize: 20, color: '#6E8CB4' },
  transitDetails: { flex: 1 },
  transitHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  transitTitle: { fontSize: 16, color: '#FFF', fontWeight: '600', marginRight: 8 },
  rxBadge: { backgroundColor: 'rgba(217, 140, 140, 0.2)', color: '#D98C8C', fontSize: 9, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  transitImpact: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 20 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 20, marginLeft: 56 },
});
