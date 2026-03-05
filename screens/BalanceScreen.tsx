// File: screens/BalanceScreen.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStabilityEngine } from '../hooks/useStabilityEngine';

import { UnifiedAura } from '../components/reflect/UnifiedAura';
import { TriadGlow } from '../components/ui/TriadGlow';
import { StabilitySparkline } from '../components/ui/StabilitySparkline';
import { ParentalResilienceTrigger } from '../components/ui/ParentalResilienceTrigger';

export const BalanceScreen = () => {
  const currentWindow = 'Gold'; // Derived from your CircadianDial logic
  const { syncUpdate } = useStabilityEngine(currentWindow);
  const [lastDelta, setLastDelta] = useState(0);

  const handleSync = async (metrics: any) => {
    const result = await syncUpdate(metrics);
    setLastDelta(result.delta);
    
    // Trigger the Success Fusion animation or a haptic pulse
    console.log(`Sync Complete: ${result.context} shift of ${result.delta}`);
  };

  return (
    <View style={styles.container}>
      {/* 80% Somatic / 20% Blueprint split in the UI */}
      <UnifiedAura pulseRate={lastDelta > 0 ? lastDelta : 10} /> 
      
      <TriadGlow onSync={handleSync} />
      
      <StabilitySparkline delta={lastDelta || 25} />
      
      <ParentalResilienceTrigger />
      
      <View style={styles.footer}>
        <Text style={styles.contextLabel}>
          CURRENT CONTEXT: {currentWindow === 'Gold' ? 'DEVELOPMENT' : 'PARENTING'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 20,
  },
  contextLabel: {
    color: '#fff',
  }
});