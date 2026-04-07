/**
 * OnboardingModal — component tests
 *
 * Validates: auth-first onboarding flow,
 * backup restore passphrase validation, chart generation trigger.
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSignUpAndEnsureSession = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockRequestPasswordRecoveryCode = jest.fn();
const mockCompletePasswordRecovery = jest.fn();

const mockSaveChart = jest.fn().mockResolvedValue(undefined);
const mockGetCharts = jest.fn().mockResolvedValue([]);

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
  },
}));

jest.mock('../../services/auth/signUpSession', () => ({
  signUpAndEnsureSession: (...args: unknown[]) => mockSignUpAndEnsureSession(...args),
}));

jest.mock('../../services/auth/passwordRecovery', () => ({
  requestPasswordRecoveryCode: (...args: unknown[]) => mockRequestPasswordRecoveryCode(...args),
  completePasswordRecovery: (...args: unknown[]) => mockCompletePasswordRecovery(...args),
}));

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
  const mockReactNative = jest.requireActual('react-native');
  return {
    MetallicText: ({ children, ...props }: any) => <mockReactNative.Text {...props}>{children}</mockReactNative.Text>,
  };
});

jest.mock('../../components/LegalOverlay', () => ({
  LegalOverlay: () => null,
}));

jest.mock('@react-native-community/datetimepicker', () => {
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
      expect(getByText(/Welcome back/i)).toBeTruthy();
    });
  });

  describe('auth-first flow', () => {
    it('signs in existing users and exits onboarding immediately', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      const onSignInComplete = jest.fn();

      const { getByLabelText, getByText } = render(
        <OnboardingModal {...defaultProps} onSignInComplete={onSignInComplete} />,
      );

      fireEvent.changeText(getByLabelText('Email address'), 'user@test.com');
      fireEvent.changeText(getByLabelText('Password'), 'securepass');

      await act(async () => {
        fireEvent.press(getByText('Sign In'));
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'securepass',
      });
      expect(onSignInComplete).toHaveBeenCalledTimes(1);
    });

    it('sends sign-up users into privacy consent before profile creation', async () => {
      mockSignUpAndEnsureSession.mockResolvedValue({
        session: { access_token: 'token' },
        user: { id: 'user-1' },
        requiresEmailConfirmation: false,
      });

      const { getByLabelText, getByText } = render(<OnboardingModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByText("Don't have an account? Sign Up"));
      });

      fireEvent.changeText(getByLabelText('Email address'), 'new@test.com');
      fireEvent.changeText(getByLabelText('Password'), 'newpassword');

      await act(async () => {
        fireEvent.press(getByText('Create Account'));
      });

      expect(mockSignUpAndEnsureSession).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'newpassword',
      });
      expect(getByText(/your privacy matters/i)).toBeTruthy();
    });

    it('completes sign-up onboarding through legal and birth details', async () => {
      mockSignUpAndEnsureSession.mockResolvedValue({
        session: { access_token: 'token' },
        user: { id: 'user-1' },
        requiresEmailConfirmation: false,
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ([{
          place_id: '123',
          display_name: 'New York, New York, United States',
          lat: '40.7128',
          lon: '-74.0060',
        }]),
      }) as unknown as typeof fetch;

      const onComplete = jest.fn();
      const { getByText, getByPlaceholderText, findByText, queryByPlaceholderText } = render(
        <OnboardingModal {...defaultProps} onComplete={onComplete} />,
      );

      await act(async () => {
        fireEvent.press(getByText("Don't have an account? Sign Up"));
      });

      fireEvent.changeText(getByPlaceholderText(/email/i), 'new@test.com');
      fireEvent.changeText(getByPlaceholderText(/password/i), 'newpassword');

      await act(async () => {
        fireEvent.press(getByText('Create Account'));
      });

      await act(async () => {
        fireEvent.press(getByText(/i accept & continue/i));
      });

      fireEvent.changeText(getByPlaceholderText(/your name/i), 'Sky User');
      await act(async () => {
        fireEvent.press(getByText('Continue'));
      });

      await act(async () => {
        fireEvent.press(getByText('Continue'));
      });

      await act(async () => {
        fireEvent.press(getByText('Continue'));
      });

      fireEvent.changeText(getByPlaceholderText(/search city/i), 'New York');
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await act(async () => {
        fireEvent.press(await findByText(/new york, new york/i));
      });

      await act(async () => {
        fireEvent.press(getByText(/create profile/i));
      });

      await act(async () => {
        jest.advanceTimersByTime(4000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(queryByPlaceholderText(/email/i)).toBeNull();
    });

    it('supports password recovery from the auth-first screen', async () => {
      mockRequestPasswordRecoveryCode.mockResolvedValue(undefined);

      const { getByLabelText, getByText } = render(<OnboardingModal {...defaultProps} />);

      await act(async () => {
        fireEvent.press(getByLabelText('Forgot password'));
      });

      fireEvent.changeText(getByLabelText('Recovery email address'), 'user@test.com');

      await act(async () => {
        fireEvent.press(getByText('Email Me a Code'));
      });

      expect(mockRequestPasswordRecoveryCode).toHaveBeenCalledWith('user@test.com');
    });
  });

  describe('backup restore', () => {
    it('validates short passphrase', async () => {
      mockPickBackupFile.mockResolvedValue('file:///backup.msky');

      const { getByText, getByPlaceholderText } = render(<OnboardingModal {...defaultProps} />);

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
