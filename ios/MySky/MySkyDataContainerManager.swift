// MySkyDataContainerManager.swift
// MySky — SwiftData ModelContainer singleton.
//
// Because MySky is a React Native / Expo application, there is no SwiftUI
// `@main App` struct to host `.modelContainer(container)`.  Instead, the
// container is managed as a singleton that is booted once from AppDelegate
// and is then available to any native Expo module or Swift helper.
//
// Usage from a native module:
//
//   guard #available(iOS 17.0, *) else { return }
//   let ctx = MySkyDataContainerManager.shared.context
//   let entry = DreamEntry(vividness: 4, dreamText: "Flew over mountains")
//   ctx.insert(entry)
//   try? ctx.save()
//
// Container configuration:
//   • Schema: DreamEntry, DailyCheckIn
//   • Storage: Local SQLite only (isStoredInMemoryOnly: false)
//   • iCloud sync: DISABLED — data never leaves the device.
//     This directly honours the "data sovereignty" promise on the
//     Calibration (Settings) screen.

import Foundation
import SwiftData

// MARK: - MySkyDataContainerManager

@available(iOS 17.0, *)
final class MySkyDataContainerManager {

    // MARK: - Singleton

    static let shared = MySkyDataContainerManager()

    // MARK: - Public Interface

    /// The live ModelContainer. Access `context` for all insert / fetch / delete.
    private(set) var container: ModelContainer

    /// Convenience accessor for the main-thread ModelContext.
    var context: ModelContext {
        container.mainContext
    }

    // MARK: - Init

    private init() {
        let schema = Schema([
            DreamEntry.self,
            DailyCheckIn.self,
        ])

        // `isStoredInMemoryOnly: false`   → persists to disk (default SQLite).
        // No CloudKit configuration       → data stays on device only.
        let config = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: false
        )

        do {
            container = try ModelContainer(for: schema, configurations: [config])
        } catch {
            // A fatalError here mirrors the pattern shown in Apple's SwiftData
            // documentation.  If the store is unreadable the app cannot honour
            // its privacy promises and must not continue.
            fatalError("MySky: Failed to initialise SwiftData container — \(error)")
        }
    }
}
