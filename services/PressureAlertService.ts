// File: services/PressureAlertService.ts
/**
 * Monitors real-time pressure deltas.
 * Triggers a push notification if environmental load exceeds personal resilience.
 */

import * as Notifications from 'expo-notifications';

export const checkPressureThresholds = (currentPressures: any, stabilityIndex: number) => {
  const THRESHOLD = 0.85;

  Object.keys(currentPressures).forEach((domain) => {
    const data = currentPressures[domain];
    
    // Logic: If stability is already low, lower the notification threshold
    const dynamicThreshold = stabilityIndex < 50 ? THRESHOLD - 0.1 : THRESHOLD;

    if (data.pressure > dynamicThreshold) {
      sendHighEndAlert(domain, data.status);
    }
  });
};

const sendHighEndAlert = async (domain: string, status: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Atmospheric Shift: ${domain}`,
      body: `${status}. Take a 60-second somatic pause.`,
      data: { type: 'PARENTAL_RESET' },
    },
    trigger: null, // Immediate
  });
};
