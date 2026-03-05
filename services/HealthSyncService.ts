import HealthKit from 'react-native-health';

/**
 * HealthSyncService
 * Writes Somatic Gate sessions to Apple Health.
 * High-end integration for Apple-tier wellness tracking.
 */
export const saveMindfulSession = (startTime: Date, endTime: Date) => {
  const options = {
    startDate: startTime.toISOString(),
    endDate: endTime.toISOString(),
  };

  HealthKit.saveMindfulSession(options, (err, res) => {
    if (err) {
      console.error("HealthKit Write Error:", err);
      return;
    }
    // Success: The user just earned Apple Health credit for their regulation.
    console.log("Somatic Session Synchronized to Apple Health");
  });
};
