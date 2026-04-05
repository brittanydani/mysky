/**
 * Auth Workflow — integration tests
 *
 * Tests the full auth lifecycle: session restoration with retries,
 * sign-in/sign-out flows, RevenueCat sync, store clearing, and
 * demo seed triggering.
 */

const mockGetSession = jest.fn();
const mockRefreshSession = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockStartAutoRefresh = jest.fn();
const mockStopAutoRefresh = jest.fn();
const mockAppStateAddEventListener = jest.fn();

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      refreshSession: () => mockRefreshSession(),
      signOut: () => mockSignOut(),
      onAuthStateChange: (cb: Function) => mockOnAuthStateChange(cb),
      startAutoRefresh: (...args: unknown[]) => mockStartAutoRefresh(...args),
      stopAutoRefresh: (...args: unknown[]) => mockStopAutoRefresh(...args),
    },
  },
}));

const mockRevenueCatLogIn = jest.fn();
const mockRevenueCatLogOut = jest.fn();

jest.mock('../../services/premium/revenuecat', () => ({
  revenueCatService: {
    logIn: (...args: unknown[]) => Promise.resolve(mockRevenueCatLogIn(...args)),
    logOut: () => Promise.resolve(mockRevenueCatLogOut()),
  },
}));

const mockSeedIfNeeded = jest.fn().mockResolvedValue(undefined);

jest.mock('../../services/storage/demoSeedService', () => ({
  DemoSeedService: {
    seedIfNeeded: (...args: unknown[]) => mockSeedIfNeeded(...args),
  },
}));

const mockClearSyncQueue = jest.fn().mockResolvedValue(undefined);

jest.mock('../../services/storage/localDb', () => ({
  __esModule: true,
  localDb: {
    clearSyncQueue: () => mockClearSyncQueue(),
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Medium: 'medium' },
  NotificationFeedbackType: { Error: 'error' },
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockClearCache = jest.fn();
const mockClearScene = jest.fn();
const mockResetStatus = jest.fn();

jest.mock('../../store/dreamMapStore', () => ({
  useDreamMapStore: { getState: () => ({ clearCache: mockClearCache }) },
}));
jest.mock('../../store/resonanceStore', () => ({
  useResonanceStore: { getState: () => ({ clearCache: mockClearCache }) },
}));
jest.mock('../../store/sceneStore', () => ({
  useSceneStore: { getState: () => ({ clearScene: mockClearScene }) },
}));
jest.mock('../../store/circadianStore', () => ({
  useCircadianStore: { getState: () => ({ clearCache: mockClearCache }) },
}));
jest.mock('../../store/correlationStore', () => ({
  useCorrelationStore: { getState: () => ({ clearCache: mockClearCache }) },
}));
jest.mock('../../store/checkInStore', () => ({
  useCheckInStore: { getState: () => ({ resetStatus: mockResetStatus }) },
}));

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { AppState, Text } from 'react-native';
import { AuthProvider, useAuth } from '../../context/AuthContext';

function AuthConsumer() {
  const { session, loading, signOut, user } = useAuth();
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Text, { testID: 'loading' }, String(loading)),
    React.createElement(Text, { testID: 'session' }, session ? 'active' : 'none'),
    React.createElement(Text, { testID: 'user-id' }, user?.id ?? 'no-user'),
    React.createElement(Text, { testID: 'signout', onPress: signOut }, 'Sign Out'),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  mockAppStateAddEventListener.mockReturnValue({ remove: jest.fn() });
  mockRefreshSession.mockResolvedValue({ data: { session: null }, error: null });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((...args: unknown[]) =>
    mockAppStateAddEventListener(...args)
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Auth Workflow', () => {
  describe('session restoration', () => {
    it('restores an existing session on mount', async () => {
      const mockSession = { user: { id: 'user-123', email: 'test@test.com' } };
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, React.createElement(AuthConsumer)),
      );

      await waitFor(() => {
        expect(getByTestId('loading').children[0]).toBe('false');
      });

      expect(getByTestId('session').children[0]).toBe('active');
      expect(getByTestId('user-id').children[0]).toBe('user-123');
      expect(mockRevenueCatLogIn).toHaveBeenCalledWith('user-123');
    });

    it('retries session restoration on transient failure', async () => {
      mockGetSession
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ data: { session: null }, error: null });

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, React.createElement(AuthConsumer)),
      );

      await waitFor(() => {
        expect(getByTestId('loading').children[0]).toBe('false');
      }, { timeout: 5000 });

      expect(mockGetSession).toHaveBeenCalledTimes(2);
      expect(getByTestId('session').children[0]).toBe('none');
    });

    it('sets loading false after max retries exhausted', async () => {
      mockGetSession.mockRejectedValue(new Error('Persistent failure'));

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, React.createElement(AuthConsumer)),
      );

      await waitFor(() => {
        expect(getByTestId('loading').children[0]).toBe('false');
      }, { timeout: 15000 });

      expect(getByTestId('session').children[0]).toBe('none');
    });
  });

  describe('auth state change listener', () => {
    it('registers onAuthStateChange on mount', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      render(React.createElement(AuthProvider, null, React.createElement(AuthConsumer)));

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
      });
    });

    it('triggers RevenueCat logIn on SIGNED_IN event', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      let authCallback: Function = () => {};
      mockOnAuthStateChange.mockImplementation((cb: Function) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      render(React.createElement(AuthProvider, null, React.createElement(AuthConsumer)));

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });

      act(() => {
        authCallback('SIGNED_IN', { user: { id: 'new-user', email: 'demo@test.com' } });
      });

      expect(mockRevenueCatLogIn).toHaveBeenCalledWith('new-user');
      expect(mockSeedIfNeeded).toHaveBeenCalledWith('demo@test.com');
    });

    it('triggers RevenueCat logOut on SIGNED_OUT event', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });

      let authCallback: Function = () => {};
      mockOnAuthStateChange.mockImplementation((cb: Function) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      });

      render(React.createElement(AuthProvider, null, React.createElement(AuthConsumer)));

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });

      act(() => {
        authCallback('SIGNED_OUT', null);
      });

      expect(mockRevenueCatLogOut).toHaveBeenCalled();
    });

    it('rehydrates and refreshes the session when the app becomes active', async () => {
      const activeSession = {
        user: { id: 'user-123', email: 'test@test.com' },
        access_token: 'stale-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000),
      };
      const refreshedSession = {
        ...activeSession,
        access_token: 'fresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      mockGetSession
        .mockResolvedValueOnce({ data: { session: null }, error: null })
        .mockResolvedValueOnce({ data: { session: activeSession }, error: null });
      mockRefreshSession.mockResolvedValue({ data: { session: refreshedSession }, error: null });

      let appStateHandler: ((status: string) => void) | undefined;
      mockAppStateAddEventListener.mockImplementation((_event: string, handler: (status: string) => void) => {
        appStateHandler = handler;
        return { remove: jest.fn() };
      });

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, React.createElement(AuthConsumer)),
      );

      await waitFor(() => {
        expect(getByTestId('loading').children[0]).toBe('false');
      });

      await act(async () => {
        appStateHandler?.('active');
      });

      await waitFor(() => {
        expect(getByTestId('session').children[0]).toBe('active');
        expect(getByTestId('user-id').children[0]).toBe('user-123');
      });

      expect(mockStartAutoRefresh).toHaveBeenCalled();
      expect(mockRefreshSession).toHaveBeenCalled();
      expect(mockSeedIfNeeded).toHaveBeenCalledWith('test@test.com');
    });
  });

  describe('signOut', () => {
    it('clears session, sync queue, and all Zustand stores', async () => {
      const mockSession = { user: { id: 'user-123' } };
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      mockSignOut.mockResolvedValue({ error: null });

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, React.createElement(AuthConsumer)),
      );

      await waitFor(() => {
        expect(getByTestId('session').children[0]).toBe('active');
      });

      await act(async () => {
        await getByTestId('signout').props.onPress();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockClearSyncQueue).toHaveBeenCalled();
      expect(mockClearCache).toHaveBeenCalled();
      expect(mockClearScene).toHaveBeenCalled();
      expect(mockResetStatus).toHaveBeenCalled();
    });

    it('handles signOut failure gracefully', async () => {
      const mockSession = { user: { id: 'user-123' } };
      mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      mockSignOut.mockResolvedValue({ error: new Error('Sign out failed') });

      const { getByTestId } = render(
        React.createElement(AuthProvider, null, React.createElement(AuthConsumer)),
      );

      await waitFor(() => {
        expect(getByTestId('session').children[0]).toBe('active');
      });

      await act(async () => {
        await getByTestId('signout').props.onPress();
      });

      const { logger } = require('../../utils/logger');
      expect(logger.error).toHaveBeenCalledWith(
        '[AuthContext] Sign-out failed:',
        expect.any(Error),
      );
    });
  });
});