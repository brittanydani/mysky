import { cancelStreakAtRiskNotification, cancelReengagementNotification } from '../insightNotifications';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
const mockRemoveItem = jest.fn();
const mockCancelScheduled = jest.fn();
const mockSchedule = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
    removeItem: (...args: unknown[]) => mockRemoveItem(...args),
  },
}));

// Mock expo-notifications dynamic import
jest.mock('expo-notifications', () => ({
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancelScheduled(...args),
  scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
}));

jest.mock('../../storage/localDb', () => ({
  localDb: {
    getCheckIns: jest.fn().mockResolvedValue([]),
    getSleepEntries: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../utils/dateUtils', () => ({
  toLocalDateString: (d: Date) => d.toISOString().slice(0, 10),
}));

jest.mock('../../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe('cancelStreakAtRiskNotification', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cancels and removes the stored notification id when one exists', async () => {
    mockGetItem.mockResolvedValue('notif-id-123');
    mockCancelScheduled.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);

    await cancelStreakAtRiskNotification();

    expect(mockCancelScheduled).toHaveBeenCalledWith('notif-id-123');
    expect(mockRemoveItem).toHaveBeenCalledWith('@mysky:streak_at_risk_notif_id');
  });

  it('does nothing when no stored id exists', async () => {
    mockGetItem.mockResolvedValue(null);

    await cancelStreakAtRiskNotification();

    expect(mockCancelScheduled).not.toHaveBeenCalled();
    expect(mockRemoveItem).not.toHaveBeenCalled();
  });

  it('does not throw when AsyncStorage fails', async () => {
    mockGetItem.mockRejectedValue(new Error('Storage error'));

    await expect(cancelStreakAtRiskNotification()).resolves.toBeUndefined();
  });
});

describe('cancelReengagementNotification', () => {
  beforeEach(() => jest.clearAllMocks());

  it('cancels and removes the stored re-engagement notification', async () => {
    mockGetItem.mockResolvedValue('reengagement-id-456');
    mockCancelScheduled.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);

    await cancelReengagementNotification();

    expect(mockCancelScheduled).toHaveBeenCalledWith('reengagement-id-456');
    expect(mockRemoveItem).toHaveBeenCalledWith('@mysky:reengagement_notif_id');
  });

  it('does nothing when no stored id exists', async () => {
    mockGetItem.mockResolvedValue(null);

    await cancelReengagementNotification();

    expect(mockCancelScheduled).not.toHaveBeenCalled();
  });

  it('does not throw when AsyncStorage fails', async () => {
    mockGetItem.mockRejectedValue(new Error('Storage error'));

    await expect(cancelReengagementNotification()).resolves.toBeUndefined();
  });
});
