/**
 * PremiumModal
 * * The cinematic wrapper for the "Deeper Sky" premium experience.
 * Features an integrated StarField background to ensure the transition 
 * from the app into the premium flow feels like an orbital ascent.
 */

import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import PremiumScreen from './PremiumScreen';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PremiumModal({ visible, onClose }: PremiumModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <PremiumScreen onClose={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Using the obsidian base color for the modal background
    backgroundColor: '#020817',
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
