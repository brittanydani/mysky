import Foundation
import React
import WidgetKit

@objc(WidgetDataBridge)
class WidgetDataBridge: NSObject {

  private static let suiteName = "group.com.brittany.mysky"
  private static let dataKey = "widgetData"
  private static let pendingCheckInsKey = "pendingWidgetCheckIns"

  private var defaults: UserDefaults? {
    UserDefaults(suiteName: Self.suiteName)
  }

  @objc
  func updateWidgetData(_ data: NSDictionary) {
    guard let defaults = defaults else { return }
    defaults.set(data, forKey: Self.dataKey)
    defaults.synchronize()
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  @objc
  func consumePendingCheckIns(_ callback: @escaping RCTResponseSenderBlock) {
    guard let defaults = defaults else {
      callback([[]])
      return
    }
    let pending = defaults.array(forKey: Self.pendingCheckInsKey) as? [[String: Any]] ?? []
    defaults.removeObject(forKey: Self.pendingCheckInsKey)
    defaults.synchronize()
    callback([pending])
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
