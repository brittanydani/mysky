import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PremiumProvider } from '../context/PremiumContext';
import { useEffect, useState } from 'react';
import { MigrationService } from '../services/storage/migrationService';
import { PrivacyComplianceManager } from '../services/privacy/privacyComplianceManager';
import { AstrologySettingsService } from '../services/astrology/astrologySettingsService';
import PrivacyConsentModal from '../components/PrivacyConsentModal';
import { logger } from '../utils/logger';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [needsPrivacyConsent, setNeedsPrivacyConsent] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);

  useEffect(() => {
    // Initialize database and check privacy consent on app start
    const initializeApp = async () => {
      try {
        // Check if user has given privacy consent (including expiry/policy version)
        const privacyManager = new PrivacyComplianceManager();
        const consentStatus = await privacyManager.requestConsent();
        setNeedsPrivacyConsent(consentStatus.required);
        
        // If user has consent, perform migration if needed
        if (!consentStatus.required) {
          await MigrationService.performMigrationIfNeeded();
          // Pre-load astrology settings cache so calculator uses correct orbs/house system
          await AstrologySettingsService.getSettings();
        }
        
        setDbReady(true);
      } catch (error) {
        logger.error('Failed to initialize app:', error);
        setDbReady(true); // Continue anyway
      } finally {
        setCheckingConsent(false);
      }
    };

    initializeApp();
  }, []);

  const handlePrivacyConsent = async (granted: boolean) => {
    try {
      if (granted) {
        const privacyManager = new PrivacyComplianceManager();
        await privacyManager.recordConsent({
          granted: true,
          policyVersion: await privacyManager.getPolicyVersion(),
          timestamp: new Date().toISOString(),
          method: 'explicit',
          lawfulBasis: 'consent',
          purpose: 'astrology_personalization',
        });
        
        // After consent is given, perform migration if needed
        await MigrationService.performMigrationIfNeeded();
        
        setNeedsPrivacyConsent(false);
      } else {
        const privacyManager = new PrivacyComplianceManager();
        await privacyManager.withdrawConsent();
        // User declined - you might want to show a message or exit
        // For now, we'll just keep showing the consent modal
        logger.info('User declined privacy consent');
      }
    } catch (error) {
      logger.error('Privacy consent handling failed:', error);
      // Don't leave user stuck — allow them through if consent was granted
      if (granted) {
        setNeedsPrivacyConsent(false);
      }
    }
  };

  // Show loading screen while initializing
  if (checkingConsent || !dbReady) {
    return null; // Or a loading screen component
  }

  return (
    <PremiumProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#0D1421' },
                animation: 'fade',
              }}
            />
            
            {/* Privacy Consent Modal - shown before user can use the app */}
            <PrivacyConsentModal
              visible={needsPrivacyConsent}
              onConsent={handlePrivacyConsent}
              contactEmail="brittanyapps@outlook.com"
            />
          </SafeAreaProvider>
        </GestureHandlerRootView>
    </PremiumProvider>
  );
}