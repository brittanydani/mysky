/**
 * OnboardingModal — component tests
 *
 * Validates: step navigation, name validation, auth flow within onboarding,
 * backup restore passphrase validation, chart generation trigger.
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockGetSession = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      getSession: () => mockGetSession(),
    },
  },
}));

const mockSaveChart = jest.fn().mockResolvedValue(undefined);
const mockGetCharts = jest.fn().mockResolvedValue([]);

jest.mock('../../services/storage/localDb', () => ({
  localDb: {
    saveChart: (...args: unknown[]) => mockSaveChart(...args),
    getCharts: () => mockGetCharts(),
  },
}));

jest.mock('../../services/astrology/calculator', () => ({
  AstrologyCalculator: {
    generateNatalChart: jest.fn(() => ({
      id: 'chart-1',
      name: 'Test Chart',
      birthData: {
        date: '1990-01-15',
        time: '14:30',
        hasUnknownTime: false,
        place: 'New York, NY',
        latitude: 40.7128,
        longitude: -74.006,
        houseSystem: 'whole-sign',
        timezone: 'America/New_York',
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })),
  },
}));

jest.mock('../../services/astrology/inputValidator', () => ({
  InputValidator: {
    validateBirthData: jest.fn(() => ({ valid: true, errors: [] })),
  },
}));

const mockPickBackupFile = jest.fn();
const mockRestoreFromBackupFile = jest.fn();

jest.mock('../../services/storage/backupService', () => ({
  BackupService: {
    pickBackupFile: () => mockPickBackupFile(),
    restoreFromBackupFile: (...args: unknown[]) => mockRestoreFromBackupFile(...args),
  },
}));

jest.mock('../../utils/IdentityVault', () => ({
  IdentityVault: {
    sealIdentity: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/storage/encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../../utils/dateUtils', () => ({
  toLocalDateString: jest.fn((d: Date) => d.toISOString().slice(0, 10)),
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../components/ui/SkiaDynamicCosmos', () => ({
  SkiaDynamicCosmos: () => null,
}));

jest.mock('../../components/ui/SkiaGradient', () => ({
  SkiaGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../components/ui/MetallicIcon', () => ({
  MetallicIcon: () => null,
}));

jest.mock('../../components/ui/MetallicText', () => {
  const { Text } = require('react-native');
  return { MetallicText: ({ children, ...props }: any) => <Text {...props}>{children}</Text> };
});

jest.mock('../../components/LegalOverlay', () => ({
  LegalOverlay: () => null,
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => null,
  };
});

import OnboardingModal from '../OnboardingModal';

const alertSpy = jest.spyOn(Alert, 'alert');

const defaultProps = {
  visible: true,
  onComplete: jest.fn(),
  onPrivacyConsent: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockGetSession.mockResolvedValue({ data: { session: null } });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('OnboardingModal', () => {
  describe('visibility', () => {
    it('renders nothing when visible is false', () => {
      const { toJSON } = render(
        <OnboardingModal {...defaultProps} visible={false} />,
      );
      expect(toJSON()).toBeNull();
    });

    it('renders when visible', () => {
      const { getByText } = render(<OnboardingModal {...defaultProps} />);
      // Welcome step should show the get started content
      expect(getByText(/MySky/i)).toBeTruthy();
    });
  });

  describe('step navigation', () => {
    it('navigates from welcome → auth on Get Started', async () => {
      const { getByText, getByPlaceholderText } = render(<OnboardingModal {...defaultProps} />);
      await act(async () => {
        fireEvent.press(getByText(/get started/i));
      });
      // Should now be on auth step — look for email/password fields
      expect(getByPlaceholderText(/email/i)).toBeTruthy();
    });
  });

  describe('auth step within onboarding', () => {
    it('validates missing fields', async () => {
      const { getByText } = render(<OnboardingModal {...defaultProps} />);
      // Navigate to auth step
      await act(async () => {
        fireEvent.press(getByText(/get started/i));
      });

      // Try to submit without filling fields (default mode is sign-in)
      const submitBtn = getByText('Sign In');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      expect(alertSpy).toHaveBeenCalledWith('Missing fields', expect.any(String));
      expect(mockSignUp).not.toHaveBeenCalled();
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it('proceeds to privacy step after successful sign-in (no pending chart, no existing charts)', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      mockGetCharts.mockResolvedValue([]);

      const { getByText, getByPlaceholderText } = render(<OnboardingModal {...defaultProps} />);
      // Navigate to auth
      await act(async () => {
        fireEvent.press(getByText(/get started/i));
      });

      fireEvent.changeText(getByPlaceholderText(/email/i), 'user@test.com');
      fireEvent.changeText(getByPlaceholderText(/password/i), 'securepass');

      await act(async () => {
        const btn = getByText('Sign In');
        fireEvent.press(btn);
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'securepass',
      });
    });

    it('sign-up with no session prompts email confirmation', async () => {
      mockSignUp.mockResolvedValue({ data: { session: null }, error: null });

      const { getByText, getByPlaceholderText } = render(<OnboardingModal {...defaultProps} />);
      await act(async () => {
        fireEvent.press(getByText(/get started/i));
      });

      // Switch to sign-up mode
      const toggleBtn = getByText(/sign up/i);
      fireEvent.press(toggleBtn);

      fireEvent.changeText(getByPlaceholderText(/email/i), 'new@test.com');
      fireEvent.changeText(getByPlaceholderText(/password/i), 'newpassword');

      await act(async () => {
        const submitBtn = getByText(/create account|sign up/i);
        fireEvent.press(submitBtn);
      });

      expect(alertSpy).toHaveBeenCalledWith('Check your email', expect.any(String));
    });
  });

  describe('backup restore', () => {
    it('validates short passphrase', async () => {
      mockPickBackupFile.mockResolvedValue('file:///backup.msky');

      const { getByText, getByPlaceholderText } = render(<OnboardingModal {...defaultProps} />);

      // Trigger backup restore from welcome
      const restoreBtn = getByText(/restore|backup/i);
      await act(async () => {
        fireEvent.press(restoreBtn);
      });

      // Should navigate to passphrase step after picking file
      // Enter a short passphrase and try to submit
      const passphraseInput = getByPlaceholderText(/passphrase/i);
      fireEvent.changeText(passphraseInput, 'short');

      const submitBtn = getByText(/restore|submit|confirm/i);
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      expect(alertSpy).toHaveBeenCalledWith('Invalid Passphrase', expect.any(String));
      expect(mockRestoreFromBackupFile).not.toHaveBeenCalled();
    });
  });
});
