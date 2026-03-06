/**
 * PremiumModal
 * * The cinematic wrapper for the "Deeper Sky" premium experience.
 * Features an integrated StarField background to ensure the transition 
 * from the app into the premium flow feels like an orbital ascent.
 */

import React from 'react';
import { Modal, View, StyleSheet, Platform } from 'react-native';
import PremiumScreen from './PremiumScreen';
import { SkiaDynamicCosmos } from './ui/SkiaDynamicCosmos';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PremiumModal({ visible, onClose }: PremiumModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      // pageSheet on iOS gives that nice "layered" depth look
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      statusBarTranslucent={Platform.OS === 'android'}
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.container}>
        {/* StarField is placed here to provide a consistent backdrop 
          while PremiumScreen content scrolls on top of it.
        */}
        <SkiaDynamicCosmos />
        
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
