/**
 * AuthRequiredModal — component tests
 *
 * Validates: validation, auth flows, mode toggling, error handling.
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockRequestPasswordRecoveryCode = jest.fn();
const mockCompletePasswordRecovery = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
    },
  },
}));

jest.mock('../../services/auth/passwordRecovery', () => ({
  requestPasswordRecoveryCode: (...args: unknown[]) => mockRequestPasswordRecoveryCode(...args),
  completePasswordRecovery: (...args: unknown[]) => mockCompletePasswordRecovery(...args),
}));

// Theme uses no native modules, no mock needed

jest.mock('../../components/ui/SkiaDynamicCosmos', () => ({
  SkiaDynamicCosmos: () => null,
}));

jest.mock('../../components/ui/SkiaGradient', () => ({
  SkiaGradient: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import AuthRequiredModal from '../AuthRequiredModal';

// Spy on Alert.alert
const alertSpy = jest.spyOn(Alert, 'alert');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthRequiredModal', () => {
  it('renders nothing when visible is false', () => {
    const { queryByLabelText } = render(<AuthRequiredModal visible={false} />);
    expect(queryByLabelText('Email address')).toBeNull();
  });

  it('renders form when visible', () => {
    const { getByLabelText } = render(<AuthRequiredModal visible />);
    expect(getByLabelText('Email address')).toBeTruthy();
    expect(getByLabelText('Password')).toBeTruthy();
    expect(getByLabelText('Show password')).toBeTruthy();
  });

  it('toggles password visibility', () => {
    const { getByLabelText } = render(<AuthRequiredModal visible />);

    expect(getByLabelText('Password').props.secureTextEntry).toBe(true);

    fireEvent.press(getByLabelText('Show password'));

    expect(getByLabelText('Hide password')).toBeTruthy();
    expect(getByLabelText('Password').props.secureTextEntry).toBe(false);
  });

  it('defaults to sign-up mode', () => {
    const { getByLabelText } = render(<AuthRequiredModal visible />);
    expect(getByLabelText('Create Account')).toBeTruthy();
  });

  it('toggles between sign-in and sign-up', () => {
    const { getByLabelText } = render(<AuthRequiredModal visible />);
    // Initially sign-up
    expect(getByLabelText('Create Account')).toBeTruthy();

    // Toggle to sign-in
    fireEvent.press(getByLabelText('Already have an account? Sign In'));
    expect(getByLabelText('Sign In')).toBeTruthy();

    // Toggle back
    fireEvent.press(getByLabelText("Don't have an account? Sign Up"));
    expect(getByLabelText('Create Account')).toBeTruthy();
  });

  // ── Validation ──

  it('alerts on empty fields', async () => {
    const { getByLabelText } = render(<AuthRequiredModal visible />);
    await act(async () => {
      fireEvent.press(getByLabelText('Create Account'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Missing fields', expect.any(String));
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('alerts on invalid email', async () => {
    const { getByLabelText } = render(<AuthRequiredModal visible />);
    fireEvent.changeText(getByLabelText('Email address'), 'bademail');
    fireEvent.changeText(getByLabelText('Password'), 'password123');
    await act(async () => {
      fireEvent.press(getByLabelText('Create Account'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Invalid email', expect.any(String));
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('alerts on short password', async () => {
    const { getByLabelText } = render(<AuthRequiredModal visible />);
    fireEvent.changeText(getByLabelText('Email address'), 'test@test.com');
    fireEvent.changeText(getByLabelText('Password'), '12345');
    await act(async () => {
      fireEvent.press(getByLabelText('Create Account'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Password too short', expect.any(String));
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  // ── Sign-up flow ──

  it('calls signUp with trimmed email and password', async () => {
    mockSignUp.mockResolvedValue({ data: { session: { user: {} } }, error: null });

    const { getByLabelText } = render(<AuthRequiredModal visible />);
    fireEvent.changeText(getByLabelText('Email address'), '  user@test.com  ');
    fireEvent.changeText(getByLabelText('Password'), 'securepassword');
    await act(async () => {
      fireEvent.press(getByLabelText('Create Account'));
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'securepassword',
    });
  });

  it('prompts email confirmation when session is null after sign-up', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null });

    const { getByLabelText } = render(<AuthRequiredModal visible />);
    fireEvent.changeText(getByLabelText('Email address'), 'user@test.com');
    fireEvent.changeText(getByLabelText('Password'), 'securepassword');
    await act(async () => {
      fireEvent.press(getByLabelText('Create Account'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Check your email', expect.any(String));
    // Mode should switch to sign-in
    expect(getByLabelText('Sign In')).toBeTruthy();
  });

  it('shows generic error on sign-up failure', async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: new Error('Signup failed') });

    const { getByLabelText } = render(<AuthRequiredModal visible />);
    fireEvent.changeText(getByLabelText('Email address'), 'user@test.com');
    fireEvent.changeText(getByLabelText('Password'), 'securepassword');
    await act(async () => {
      fireEvent.press(getByLabelText('Create Account'));
    });

    expect(alertSpy).toHaveBeenCalledWith('Error', 'Signup failed');
  });

  // ── Sign-in flow ──

  it('calls signInWithPassword on sign-in mode', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    const { getByLabelText } = render(<AuthRequiredModal visible />);
    // Switch to sign-in
    fireEvent.press(getByLabelText('Already have an account? Sign In'));
    fireEvent.changeText(getByLabelText('Email address'), 'user@test.com');
    fireEvent.changeText(getByLabelText('Password'), 'securepassword');
    await act(async () => {
      fireEvent.press(getByLabelText('Sign In'));
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'securepassword',
    });
  });

  it('shows generic sign-in error to prevent email enumeration', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: new Error('Invalid login credentials') });

    const { getByLabelText } = render(<AuthRequiredModal visible />);
    fireEvent.press(getByLabelText('Already have an account? Sign In'));
    fireEvent.changeText(getByLabelText('Email address'), 'user@test.com');
    fireEvent.changeText(getByLabelText('Password'), 'wrongpassword');
    await act(async () => {
      fireEvent.press(getByLabelText('Sign In'));
    });

    // Should NOT leak the actual error message
    expect(alertSpy).toHaveBeenCalledWith(
      'Error',
      'Sign-in failed. Please check your email and password.',
    );
  });

  it('requests a recovery code from sign-in mode', async () => {
    mockRequestPasswordRecoveryCode.mockResolvedValue(undefined);

    const { getByLabelText, getByText } = render(<AuthRequiredModal visible />);
    fireEvent.press(getByLabelText('Already have an account? Sign In'));

    await act(async () => {
      fireEvent.press(getByLabelText('Forgot password'));
    });

    fireEvent.changeText(getByLabelText('Recovery email address'), 'user@test.com');

    await act(async () => {
      fireEvent.press(getByLabelText('Email Me a Code'));
    });

    expect(getByText('Reset your password')).toBeTruthy();
    expect(mockRequestPasswordRecoveryCode).toHaveBeenCalledWith('user@test.com');
    expect(alertSpy).toHaveBeenCalledWith(
      'Check your email',
      'If an account exists for this email, we sent a 6-digit recovery code.',
    );
  });

  it('completes password recovery and signs the user in', async () => {
    mockRequestPasswordRecoveryCode.mockResolvedValue(undefined);
    mockCompletePasswordRecovery.mockResolvedValue(undefined);
    mockSignInWithPassword.mockResolvedValue({ error: null });

    const { getByLabelText } = render(<AuthRequiredModal visible />);
    fireEvent.press(getByLabelText('Already have an account? Sign In'));

    await act(async () => {
      fireEvent.press(getByLabelText('Forgot password'));
    });

    fireEvent.changeText(getByLabelText('Recovery email address'), 'user@test.com');

    await act(async () => {
      fireEvent.press(getByLabelText('Email Me a Code'));
    });

    fireEvent.changeText(getByLabelText('Recovery code'), '123456');
    fireEvent.changeText(getByLabelText('New password'), 'securepassword');
    fireEvent.changeText(getByLabelText('Confirm new password'), 'securepassword');

    await act(async () => {
      fireEvent.press(getByLabelText('Reset Password'));
    });

    expect(mockCompletePasswordRecovery).toHaveBeenCalledWith({
      email: 'user@test.com',
      code: '123456',
      newPassword: 'securepassword',
    });
    expect(mockSignInWithPassword).toHaveBeenLastCalledWith({
      email: 'user@test.com',
      password: 'securepassword',
    });
  });
});
