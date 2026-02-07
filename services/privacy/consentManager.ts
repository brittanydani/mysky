import { secureStorage } from '../storage/secureStorage';
import { generateId } from '../storage/models';
import { ConsentPreferences, ConsentRecord, ConsentStatus } from './types';

export class ConsentManager {
  private static CONSENT_MAX_AGE_DAYS = 365;

  async checkConsentStatus(): Promise<ConsentStatus> {
    const policyVersion = (await secureStorage.getPrivacyPolicyVersion()) ?? '1.0';
    const consentRecord = await secureStorage.getConsentRecord();
    const timestamp = consentRecord?.timestamp;
    let expired = false;
    let expiresAt: string | undefined;

    if (timestamp) {
      const maxAgeMs = ConsentManager.CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      const expiryTime = new Date(timestamp).getTime() + maxAgeMs;
      expiresAt = new Date(expiryTime).toISOString();
      expired = Date.now() > expiryTime;
    }

    return {
      granted: !expired && (consentRecord?.granted ?? false),
      policyVersion: consentRecord?.version ?? policyVersion,
      timestamp,
      expired,
      expiresAt,
      method: 'explicit',
      lawfulBasis: 'consent',
      purpose: 'astrology_personalization',
    };
  }

  async updateConsentPreferences(preferences: ConsentPreferences): Promise<ConsentRecord> {
    await secureStorage.setPrivacyPolicyVersion(preferences.policyVersion);
    await secureStorage.setPrivacyConsent(preferences.granted, preferences.policyVersion, preferences.reason);

    return {
      id: generateId(),
      granted: preferences.granted,
      policyVersion: preferences.policyVersion,
      timestamp: new Date().toISOString(),
      method: preferences.method,
      lawfulBasis: preferences.lawfulBasis,
      purpose: preferences.purpose,
    };
  }

  async getConsentHistory(): Promise<ConsentRecord[]> {
    const history = await secureStorage.getConsentHistory();
    return history.map((entry: any) => ({
      id: entry.id,
      granted: entry.granted,
      policyVersion: entry.policyVersion,
      timestamp: entry.timestamp,
      method: 'explicit',
      lawfulBasis: 'consent',
      purpose: 'astrology_personalization',
    }));
  }
}
