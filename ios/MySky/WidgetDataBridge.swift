import Foundation
import WidgetKit

// MARK: - React Native native module
// Exposed to JS via WidgetDataBridgeObjC.m using RCT_EXTERN_MODULE.
// Call NativeModules.WidgetDataBridge.updateWidgetData(data) from TypeScript
// to push new energy state into the shared App Group and reload widgets.

@objc(WidgetDataBridge)
final class WidgetDataBridge: NSObject {

    @objc
    func updateWidgetData(_ data: NSDictionary) {
        guard let defaults = UserDefaults(suiteName: "group.com.brittany.mysky") else { return }

        let keyMap: [String: String] = [
            "energyLevel": WidgetDataStore.keyEnergyLevel,
            "focusTitle":  WidgetDataStore.keyFocusTitle,
            "transit":     WidgetDataStore.keyTransit,
            "statusText":  WidgetDataStore.keyStatusText,
            "captionText": WidgetDataStore.keyCaptionText,
            "orbColorR":   WidgetDataStore.keyOrbR,
            "orbColorG":   WidgetDataStore.keyOrbG,
            "orbColorB":   WidgetDataStore.keyOrbB,
        ]

        for (jsKey, storeKey) in keyMap {
            if let value = data[jsKey] {
                defaults.set(value, forKey: storeKey)
            }
        }
        defaults.synchronize()

        WidgetCenter.shared.reloadAllTimelines()
    }

    /// Returns (and atomically clears) any check-ins queued by QuickCheckInIntent.
    /// Each record is `{ "timestamp": Double }`. The JS layer builds the full
    /// DailyCheckIn record using natal chart data and saves it via CheckInService.
    @objc
    func consumePendingCheckIns(_ callback: @escaping RCTResponseSenderBlock) {
        guard let defaults = UserDefaults(suiteName: "group.com.brittany.mysky") else {
            callback([[]])
            return
        }
        let pending = (defaults.array(forKey: WidgetDataStore.keyPendingCheckIns) as? [[String: Any]]) ?? []
        defaults.removeObject(forKey: WidgetDataStore.keyPendingCheckIns)
        defaults.synchronize()
        callback([pending])
    }

    @objc static func requiresMainQueueSetup() -> Bool { false }
}
