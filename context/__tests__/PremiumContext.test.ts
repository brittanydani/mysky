const mockNotificationAsync = jest.fn().mockResolvedValue(undefined);
const mockEncryptedGetItem = jest.fn();
const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockLogIn = jest.fn().mockResolvedValue(undefined);
const mockGetCustomerInfo = jest.fn();
const mockGetOfferings = jest.fn();
const mockIsPremium = jest.fn();

let mockAuthState: {
  session: { user: { id: string; email: string } } | null;
  loading: boolean;
} = {
  session: { user: { id: 'user-1', email: 'user@example.com' } },
  loading: false,
};

type MockAuthState = {
  session: { user: { id: string; email: string } } | null;
  loading: boolean;
};

jest.mock('expo-haptics', () => ({
  notificationAsync: (...args: unknown[]) => mockNotificationAsync(...args),
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('../../services/storage/encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    getItem: (...args: unknown[]) => mockEncryptedGetItem(...args),
  },
}));

jest.mock('../../services/premium/revenuecat', () => ({
  revenueCatService: {
    initialize: () => mockInitialize(),
    logIn: (...args: unknown[]) => mockLogIn(...args),
    getCustomerInfo: () => mockGetCustomerInfo(),
    getOfferings: () => mockGetOfferings(),
    isPremium: (...args: unknown[]) => mockIsPremium(...args),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
  },
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PremiumProvider, usePremium } from '../../context/PremiumContext';

function PremiumConsumer() {
  const { isPremium, isReady } = usePremium();
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Text, { testID: 'premium' }, String(isPremium)),
    React.createElement(Text, { testID: 'ready' }, String(isReady)),
  );
}

describe('PremiumContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      session: { user: { id: 'user-1', email: 'user@example.com' } },
      loading: false,
    } as MockAuthState;
    mockEncryptedGetItem.mockResolvedValue(null);
    mockGetCustomerInfo.mockResolvedValue({ entitlements: { active: {} } });
    mockGetOfferings.mockResolvedValue(null);
    mockIsPremium.mockReturnValue(false);
  });

  it('resets premium state when the user signs out', async () => {
    mockGetCustomerInfo.mockResolvedValue({ entitlements: { active: { premium: { isActive: true } } } });
    mockIsPremium.mockReturnValue(true);

    const view = render(
      React.createElement(PremiumProvider, null, React.createElement(PremiumConsumer)),
    );

    await waitFor(() => {
      expect(view.getByTestId('premium').children[0]).toBe('true');
      expect(view.getByTestId('ready').children[0]).toBe('true');
    });

    mockAuthState = {
      session: null,
      loading: false,
    } as MockAuthState;

    view.rerender(
      React.createElement(PremiumProvider, null, React.createElement(PremiumConsumer)),
    );

    await waitFor(() => {
      expect(view.getByTestId('premium').children[0]).toBe('false');
      expect(view.getByTestId('ready').children[0]).toBe('true');
    });
  });

  it('does not apply demo premium override to non-reviewer accounts', async () => {
    mockEncryptedGetItem.mockResolvedValue('true');

    const view = render(
      React.createElement(PremiumProvider, null, React.createElement(PremiumConsumer)),
    );

    await waitFor(() => {
      expect(view.getByTestId('ready').children[0]).toBe('true');
    });

    expect(mockLogIn).toHaveBeenCalledWith('user-1');
    expect(view.getByTestId('premium').children[0]).toBe('false');
  });

  it('does not apply a reviewer-only premium override when debug premium is disabled', async () => {
    mockAuthState = {
      session: { user: { id: 'reviewer-1', email: 'brittanyapps@outlook.com' } },
      loading: false,
    } as MockAuthState;
    mockEncryptedGetItem.mockResolvedValue('true');

    const view = render(
      React.createElement(PremiumProvider, null, React.createElement(PremiumConsumer)),
    );

    await waitFor(() => {
      expect(view.getByTestId('ready').children[0]).toBe('true');
      expect(view.getByTestId('premium').children[0]).toBe('false');
    });
  });
});