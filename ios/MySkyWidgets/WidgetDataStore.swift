import Foundation

// MARK: - Shared data model read by the widget and written by the main app

struct WidgetSnapshot {
    let energyLevel: Double  // 0.0–1.0
    let focusTitle: String   // dominant chakra, e.g. "Solar Plexus"
    let transit: String      // current transit, e.g. "Moon in Pisces"
    let statusText: String   // e.g. "Grounding Needed"
    let captionText: String  // quickMeaning sentence shown in the medium widget
    let orbColorR: Double
    let orbColorG: Double
    let orbColorB: Double
}

enum WidgetDataStore {
    static let appGroupSuite = "group.com.brittany.mysky"

    // UserDefaults keys (must match WidgetDataBridge.swift in the main target)
    static let keyEnergyLevel  = "widget_energy_level"
    static let keyFocusTitle   = "widget_focus_title"
    static let keyTransit      = "widget_transit"
    static let keyStatusText   = "widget_status_text"
    static let keyCaptionText  = "widget_caption_text"
    static let keyOrbR         = "widget_orb_r"
    static let keyOrbG         = "widget_orb_g"
    static let keyOrbB         = "widget_orb_b"

    // Pending check-ins queued by QuickCheckInIntent, consumed by the main app
    static let keyPendingCheckIns = "widget_pending_checkins"

    // Default values shown before the app has written any data
    private static let defaults = WidgetSnapshot(
        energyLevel: 0.65,
        focusTitle:  "Solar Plexus",
        transit:     "Moon in Pisces",
        statusText:  "Grounding Needed",
        captionText: "Tune inward. Your energy has a message for you today.",
        orbColorR:   0.85,
        orbColorG:   0.75,
        orbColorB:   0.55
    )

    static func load() -> WidgetSnapshot {
        guard let d = UserDefaults(suiteName: appGroupSuite) else { return defaults }
        return WidgetSnapshot(
            energyLevel: d.double(forKey: keyEnergyLevel).nonZero ?? defaults.energyLevel,
            focusTitle:  d.string(forKey: keyFocusTitle)           ?? defaults.focusTitle,
            transit:     d.string(forKey: keyTransit)              ?? defaults.transit,
            statusText:  d.string(forKey: keyStatusText)           ?? defaults.statusText,
            captionText: d.string(forKey: keyCaptionText)          ?? defaults.captionText,
            orbColorR:   d.double(forKey: keyOrbR).nonZero         ?? defaults.orbColorR,
            orbColorG:   d.double(forKey: keyOrbG).nonZero         ?? defaults.orbColorG,
            orbColorB:   d.double(forKey: keyOrbB).nonZero         ?? defaults.orbColorB
        )
    }

    static func save(_ dict: [String: Any]) {
        guard let d = UserDefaults(suiteName: appGroupSuite) else { return }
        dict.forEach { d.set($1, forKey: $0) }
        d.synchronize()
    }
}

private extension Double {
    // Returns nil when the key is absent (stored as 0.0 by default)
    var nonZero: Double? { self == 0 ? nil : self }
}
