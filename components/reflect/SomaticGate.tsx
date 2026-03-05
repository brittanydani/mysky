import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LissajousPortal } from './LissajousPortal';

export const SomaticGate = () => {
  const [breaths, setBreaths] = useState(0);
  const [isRegulated, setIsRegulated] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');

  // Simulating Success Fusion / Breathing detection
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isRegulated && breaths < 10) {
      interval = setInterval(() => {
        setBreaths((prev) => {
          if (prev >= 9) {
            setIsRegulated(true);
            return 10;
          }
          return prev + 1;
        });
      }, 2000); // simulate 1 breath every 2 seconds for this demo
    }
    return () => clearInterval(interval);
  }, [isRegulated, breaths]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SOMATIC GATE</Text>

      {!isRegulated ? (
        <Animated.View exiting={FadeOut} style={styles.portalContainer}>
          <LissajousPortal />
          <Text style={styles.instruction}>Breathe to Dissolve Tension</Text>
          <Text style={styles.counter}>{breaths} / 10</Text>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn} style={styles.journalContainer}>
          <Text style={styles.successText}>SYSTEM REGULATED.</Text>
          <TextInput
            style={styles.input}
            placeholder="High-end text reflection..."
            placeholderTextColor="#8A8A8E"
            multiline
            value={journalEntry}
            onChangeText={setJournalEntry}
          />
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>SAVE REFLECTION</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    color: '#8A8A8E',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 4,
    position: 'absolute',
    top: 60,
  },
  portalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    color: '#FFF',
    fontSize: 18,
    marginTop: 40,
    fontWeight: '300',
  },
  counter: {
    color: '#34C759',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
    letterSpacing: 2,
  },
  journalContainer: {
    width: '100%',
    alignItems: 'center',
  },
  successText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 150,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#34C759',
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  }
});
