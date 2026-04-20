import {
  setHapticsEnabled,
  initHapticPreference,
  selection,
  impact,
  notification,
  selectionAsync,
} from '../haptics';

const mockSelectionAsync = jest.fn().mockResolvedValue(undefined);
const mockImpactAsync = jest.fn().mockResolvedValue(undefined);
const mockNotificationAsync = jest.fn().mockResolvedValue(undefined);
const mockGetItem = jest.fn();

jest.mock('expo-haptics', () => ({
  selectionAsync: () => mockSelectionAsync(),
  impactAsync: (...args: unknown[]) => mockImpactAsync(...args),
  notificationAsync: (...args: unknown[]) => mockNotificationAsync(...args),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: (...args: unknown[]) => mockGetItem(...args) },
}));

describe('setHapticsEnabled / selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHapticsEnabled(true); // reset to default
  });

  it('calls selectionAsync when haptics are enabled', () => {
    selection();
    expect(mockSelectionAsync).toHaveBeenCalledTimes(1);
  });

  it('does not call selectionAsync when haptics are disabled', () => {
    setHapticsEnabled(false);
    selection();
    expect(mockSelectionAsync).not.toHaveBeenCalled();
  });
});

describe('impact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHapticsEnabled(true);
  });

  it('calls impactAsync when haptics are enabled', () => {
    impact();
    expect(mockImpactAsync).toHaveBeenCalledTimes(1);
  });

  it('does not call impactAsync when haptics are disabled', () => {
    setHapticsEnabled(false);
    impact();
    expect(mockImpactAsync).not.toHaveBeenCalled();
  });
});

describe('notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHapticsEnabled(true);
  });

  it('calls notificationAsync when haptics are enabled', () => {
    notification();
    expect(mockNotificationAsync).toHaveBeenCalledTimes(1);
  });

  it('does not call notificationAsync when haptics are disabled', () => {
    setHapticsEnabled(false);
    notification();
    expect(mockNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('selectionAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHapticsEnabled(true);
  });

  it('resolves without calling haptics when disabled', async () => {
    setHapticsEnabled(false);
    await expect(selectionAsync()).resolves.toBeUndefined();
    expect(mockSelectionAsync).not.toHaveBeenCalled();
  });

  it('calls selectionAsync when enabled', async () => {
    await selectionAsync();
    expect(mockSelectionAsync).toHaveBeenCalledTimes(1);
  });
});

describe('initHapticPreference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setHapticsEnabled(true);
  });

  it('disables haptics when stored preference is "0"', async () => {
    mockGetItem.mockResolvedValue('0');
    await initHapticPreference();
    // After loading pref "0", haptics should be disabled
    selection();
    expect(mockSelectionAsync).not.toHaveBeenCalled();
  });

  it('enables haptics when stored preference is "1"', async () => {
    setHapticsEnabled(false); // start disabled
    mockGetItem.mockResolvedValue('1');
    await initHapticPreference();
    selection();
    expect(mockSelectionAsync).toHaveBeenCalledTimes(1);
  });

  it('keeps default (enabled) when no preference stored', async () => {
    mockGetItem.mockResolvedValue(null);
    await initHapticPreference();
    selection();
    expect(mockSelectionAsync).toHaveBeenCalledTimes(1);
  });
});
