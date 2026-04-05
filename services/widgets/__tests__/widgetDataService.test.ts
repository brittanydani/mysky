// widgetDataService wraps NativeModules.WidgetDataBridge. In the node test
// environment there is no native module, so we verify the platform-gated
// no-op contract and the callback-based API directly.

const mockUpdateWidgetData = jest.fn();
const mockConsumePendingCheckIns = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  NativeModules: {
    WidgetDataBridge: {
      updateWidgetData: mockUpdateWidgetData,
      consumePendingCheckIns: mockConsumePendingCheckIns,
    },
  },
}));

import { updateWidgetData, consumePendingCheckIns, WidgetData } from '../widgetDataService';

const sampleData: WidgetData = {
  energyLevel: 0.75,
  focusTitle: 'Solar Plexus',
  transit: 'Moon in Pisces',
  statusText: 'Grounding Needed',
  captionText: 'Root yourself before expanding.',
  orbColorR: 0.9,
  orbColorG: 0.7,
  orbColorB: 0.3,
};

describe('widgetDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateWidgetData()', () => {
    it('calls WidgetDataBridge.updateWidgetData with the provided data on iOS', () => {
      updateWidgetData(sampleData);
      expect(mockUpdateWidgetData).toHaveBeenCalledTimes(1);
      expect(mockUpdateWidgetData).toHaveBeenCalledWith(sampleData);
    });

    it('is a no-op when not running on iOS', () => {
      const RN = require('react-native');
      RN.Platform.OS = 'web';
      updateWidgetData(sampleData);
      expect(mockUpdateWidgetData).not.toHaveBeenCalled();
      RN.Platform.OS = 'ios';
    });
  });

  describe('consumePendingCheckIns()', () => {
    it('invokes the native bridge and forwards records to the callback on iOS', () => {
      const pendingRecords = [{ timestamp: 1711800000 }, { timestamp: 1711803600 }];
      mockConsumePendingCheckIns.mockImplementation((cb: (r: typeof pendingRecords) => void) =>
        cb(pendingRecords),
      );

      const callback = jest.fn();
      consumePendingCheckIns(callback);

      expect(mockConsumePendingCheckIns).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(pendingRecords);
    });

    it('calls callback with empty array when bridge returns null/undefined', () => {
      mockConsumePendingCheckIns.mockImplementation((cb: (r: null) => void) => cb(null));
      const callback = jest.fn();
      consumePendingCheckIns(callback);
      expect(callback).toHaveBeenCalledWith([]);
    });

    it('calls callback with empty array when not running on iOS', () => {
      const RN = require('react-native');
      RN.Platform.OS = 'web';

      const callback = jest.fn();
      consumePendingCheckIns(callback);

      expect(mockConsumePendingCheckIns).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith([]);

      RN.Platform.OS = 'ios';
    });

    it('calls callback with empty array when WidgetDataBridge is absent', () => {
      const RN = require('react-native');
      const original = RN.NativeModules.WidgetDataBridge;
      RN.NativeModules.WidgetDataBridge = undefined;

      const callback = jest.fn();
      consumePendingCheckIns(callback);
      expect(callback).toHaveBeenCalledWith([]);

      RN.NativeModules.WidgetDataBridge = original;
    });
  });
});
