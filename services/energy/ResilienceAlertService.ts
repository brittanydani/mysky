/**
 * ResilienceAlertService
 * Monitors the generated Stability Delta and triggers a local push notification
 * recommending a Somatic Reset if the user drifts too far from their baseline.
 */

import * as Notifications from 'expo-notifications';
import { calculateStabilityDelta, TriadMetrics } from '../../logic/StabilityEngine';
import { getContextualWeight } from '../../utils/ContextMapper';

// If the Delta drops below this threshold, it signifies high variance/friction.
const RESILIENCE_PULL_THRESHOLD = 0.0;

export const checkAndTriggerResilienceAlert = async (
  metrics: TriadMetrics,
  activeWindow: 'Gold' | 'Silver' | 'Indigo',
  puck: { x: number, y: number }
) => {
  const delta = calculateStabilityDelta(metrics, activeWindow);
  const context = getContextualWeight(puck, activeWindow);
  
  // If delta is negative, the user is drifting away from their ideal baseline
  if (delta < RESILIENCE_PULL_THRESHOLD) {
    
    // Trigger an immediate local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Grounding Needed 🌙",
        body: `Your ${context} focus is showing high friction. Tap here for a quick 60-second Skia breath reset.`,
        data: { 
          // Deep link routing data to open the breathing exercise directly
          route: '/(tabs)/energy', 
          action: 'somatic_reset',
          delta
        },
      },
      // null trigger means send immediately
      trigger: null, 
    });
    
    return { triggered: true, delta, context };
  }
  
  return { triggered: false, delta, context };
};

/**
 * Call this early in the app lifecycle (e.g., in _layout.tsx) 
 * to ensure we have permission to send local alerts.
 */
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};
