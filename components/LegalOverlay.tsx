// File: components/LegalOverlay.tsx
// Thin wrapper that renders legal screen content as an absoluteFill overlay
// inside the OnboardingModal (which is a native Modal outside the router tree).

import React from 'react';
import { StyleSheet, View } from 'react-native';
import FAQScreen from '../app/faq';
import PrivacyPolicyScreen from '../app/privacy';
import TermsOfServiceScreen from '../app/terms';

interface Props {
  screen: 'terms' | 'privacy' | 'faq';
  onClose: () => void;
}

export function LegalOverlay({ screen, onClose }: Props) {
  return (
    <View style={StyleSheet.absoluteFill}>
      {screen === 'terms' && <TermsOfServiceScreen onBack={onClose} />}
      {screen === 'privacy' && <PrivacyPolicyScreen onBack={onClose} />}
      {screen === 'faq' && <FAQScreen onBack={onClose} />}
    </View>
  );
}
