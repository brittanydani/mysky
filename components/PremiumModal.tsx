/**
 * PremiumModal
 * * The cinematic wrapper for the "Deeper Sky" premium experience.
 * Features an integrated StarField background to ensure the transition 
 * from the app into the premium flow feels like an orbital ascent.
 */

import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import PremiumScreen from './PremiumScreen';
import { useAppTheme } from '../context/ThemeContext';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PremiumModal({ visible, onClose }: PremiumModalProps) {
  const theme = useAppTheme();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
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
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
