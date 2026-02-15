import React from 'react';
import { Modal, View, StyleSheet, Platform } from 'react-native';
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
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.container}>
        <PremiumScreen onClose={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
