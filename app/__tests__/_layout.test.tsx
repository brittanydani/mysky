import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import RootLayout from '../_layout';

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    lazy: jest.fn(() => () => null),
  };
});

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockHideSplash = jest.fn().mockResolvedValue(undefined);
const mockUpdateSettings = jest.fn();
const mockGetCharts = jest.fn();
const mockClearAccountScopedData = jest.fn().mockResolvedValue(undefined);
const mockEncryptedRemoveItem = jest.fn().mockResolvedValue(undefined);
const mockAsyncRemoveItem = jest.fn().mockResolvedValue(undefined);
const mockDestroyIdentity = jest.fn().mockResolvedValue(undefined);
const mockFlushQueue = jest.fn().mockResolvedValue(undefined);
const mockPullFromSupabase = jest.fn().mockResolvedValue(undefined);
const mockSyncBirthProfileFromLocal = jest.fn().mockResolvedValue(undefined);

let mockCurrentAuth = {
  session: { user: { id: 'user-a' } },
  loading: false,
};

let mockCurrentSettings = {
  id: 'default',
  cloudSyncEnabled: false,
  lastSyncAt: '2026-04-01T00:00:00.000Z',
  lastBackupAt: undefined,
  userId: 'user-a',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
};

jest.mock('expo-router', () => {
  const ReactActual = jest.requireActual('react') as typeof import('react');
  const Stack = ({ children }: { children?: React.ReactNode }) => ReactActual.createElement(ReactActual.Fragment, null, children);
  function MockStackScreen() {
    return null;
  }
  Stack.Screen = MockStackScreen;
  return {
    useRouter: () => ({
      push: mockRouterPush,
      replace: mockRouterReplace,
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
    }),
    Stack,
  };
});

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: () => mockHideSplash(),
}));

jest.mock('expo-standard-web-crypto', () => ({
  polyfillWebCrypto: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('true'),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockCurrentAuth,
}));

jest.mock('../../context/PremiumContext', () => ({
  PremiumProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../context/StarNotificationContext', () => ({
  StarNotificationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../../services/storage/migrationService', () => ({
  MigrationService: {
    performMigrationIfNeeded: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/privacy/privacyComplianceManager', () => ({
  PrivacyComplianceManager: jest.fn().mockImplementation(() => ({
    requestConsent: jest.fn().mockResolvedValue({ required: false, policyVersion: '1.0' }),
    recordConsent: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../services/astrology/astrologySettingsService', () => ({
  AstrologySettingsService: {
    getSettings: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../utils/haptics', () => ({
  initHapticPreference: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/storage/localDb', () => ({
  localDb: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getSettings: jest.fn(async () => mockCurrentSettings),
    updateSettings: jest.fn(async (settings) => {
      mockCurrentSettings = { ...mockCurrentSettings, ...settings };
      mockUpdateSettings(settings);
    }),
    clearAccountScopedData: () => mockClearAccountScopedData(),
    getCharts: jest.fn(async () => mockGetCharts()),
    saveChart: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/storage/encryptedAsyncStorage', () => ({
  EncryptedAsyncStorage: {
    removeItem: (...args: unknown[]) => mockEncryptedRemoveItem(...args),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    removeItem: (...args: unknown[]) => mockAsyncRemoveItem(...args),
  },
  removeItem: (...args: unknown[]) => mockAsyncRemoveItem(...args),
}));

jest.mock('../../services/storage/userDataKeys', () => ({
  ENCRYPTED_ASYNC_USER_DATA_KEYS: ['@mysky:core_values', '@mysky:daily_reflections'],
  PLAIN_ASYNC_USER_DATA_KEYS: ['mysky_custom_journal_tags', 'msky_user_name'],
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: mockCurrentAuth.session } })),
    },
  },
}));

jest.mock('../../utils/IdentityVault', () => ({
  IdentityVault: {
    openVault: jest.fn().mockResolvedValue(null),
    destroyIdentity: () => mockDestroyIdentity(),
  },
}));

jest.mock('../../hooks/usePendingWidgetCheckIns', () => ({
  usePendingWidgetCheckIns: jest.fn(),
}));

jest.mock('../../store/useSubscriptionStore', () => ({
  useSubscriptionStore: {
    getState: () => ({
      initialize: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

jest.mock('../../services/storage/syncService', () => ({
  __esModule: true,
  flushQueue: () => mockFlushQueue(),
  pullFromSupabase: () => mockPullFromSupabase(),
  syncBirthProfileFromLocal: () => mockSyncBirthProfileFromLocal(),
}));

jest.mock('../../utils/sentry', () => ({
  initSentry: jest.fn(),
}));

jest.mock('../../components/OnboardingModal', () => () => null);
jest.mock('../../components/PrivacyConsentModal', () => () => null);
jest.mock('../../components/AuthRequiredModal', () => () => null);
jest.mock('../../components/ui/CosmicBackground', () => () => null);

describe('RootLayout account isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentAuth = {
      session: { user: { id: 'user-a' } },
      loading: false,
    };
    mockCurrentSettings = {
      id: 'default',
      cloudSyncEnabled: false,
      lastSyncAt: '2026-04-01T00:00:00.000Z',
      lastBackupAt: undefined,
      userId: 'user-a',
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    };
    mockGetCharts.mockResolvedValue([]);
  });

  it('clears account-scoped local data when the signed-in user does not match stored local ownership', async () => {
    mockCurrentAuth = {
      session: { user: { id: 'user-b' } },
      loading: false,
    };
    mockCurrentSettings = {
      userId: 'user-a',
      id: 'default',
      cloudSyncEnabled: false,
      lastSyncAt: '2026-04-01T00:00:00.000Z',
      lastBackupAt: undefined,
      createdAt: '2026-04-01T00:00:00.000Z',
      updatedAt: '2026-04-01T00:00:00.000Z',
    };

    render(<RootLayout />);

    await waitFor(() => {
      expect(mockClearAccountScopedData).toHaveBeenCalled();
    });

    expect(mockEncryptedRemoveItem).toHaveBeenCalled();
    expect(mockAsyncRemoveItem).toHaveBeenCalled();
    expect(mockDestroyIdentity).toHaveBeenCalled();
    expect(mockUpdateSettings).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-b' }));
  });
});