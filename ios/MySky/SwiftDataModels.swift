// SwiftDataModels.swift
// MySky — SwiftData model definitions for encrypted-at-rest persistence.
//
// Requires iOS 17.0+  (SwiftData framework minimum).
//
// Security model:
//   • Sensitive string fields are stored in the database only as raw AES-256-GCM
//     ciphertext (Data).  The database file contains no readable text.
//   • UI code reads and writes plain-text via @Transient computed properties.
//   • SecurityEngine handles all encrypt/decrypt calls, pulling the key from
//     the hardware Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly).
//
// Example UI usage:
//
//   @Environment(\.modelContext) private var context
//
//   func sealDreamEntry() {
//       let entry = DreamEntry(vividness: 4, dreamText: userTypedText)
//       context.insert(entry)
//       // SwiftData autosaves on the next run-loop tick.
//   }

import Foundation
import SwiftData

// MARK: - Dream Journal Entry

/// Persisted record for a single dream journal entry.
/// `dreamText` is encrypted before writing to the SQLite backing store.
@Model
final class DreamEntry {

    @Attribute(.unique) var id: UUID
    var date: Date

    // Subjective quality metrics (1–5 scale)
    var vividness:  Int
    var lucidity:   Int
    var control:    Int

    var themes:      [String]
    var isRecurring: Bool

    // 🔒 Raw encrypted bytes stored in the database.
    //    The column name is intentionally generic to avoid leaking field purpose.
    private var encryptedDreamText: Data?

    // 🔓 Plain-text accessor for UI and business logic.
    //    @Transient marks this property as excluded from the SwiftData schema.
    @Transient var dreamText: String {
        get { SecurityEngine.shared.decrypt(encryptedDreamText) }
        set { encryptedDreamText = SecurityEngine.shared.encrypt(newValue) }
    }

    init(
        date:        Date     = Date(),
        vividness:   Int      = 3,
        lucidity:    Int      = 2,
        control:     Int      = 3,
        themes:      [String] = [],
        isRecurring: Bool     = false,
        dreamText:   String   = ""
    ) {
        self.id          = UUID()
        self.date        = date
        self.vividness   = vividness
        self.lucidity    = lucidity
        self.control     = control
        self.themes      = themes
        self.isRecurring = isRecurring
        // Encrypt immediately on creation — the DB never sees plaintext.
        self.encryptedDreamText = SecurityEngine.shared.encrypt(dreamText)
    }
}

// MARK: - Daily Check-In

/// Persisted record for a single emotional check-in.
/// Free-text `notes` are encrypted before writing to the SQLite backing store.
@Model
final class DailyCheckIn {

    @Attribute(.unique) var id: UUID
    var timestamp: Date
    var timeOfDay: String       // "Morning" | "Afternoon" | "Evening" | "Night"

    // Numeric scores stored as-is; these are less sensitive than free text.
    var moodScore:   Double
    var energyScore: Double
    var stressScore: Double

    var tags: [String]

    // 🔒 Encrypted notes blob
    private var encryptedNotes: Data?

    // 🔓 Plain-text accessor for UI
    @Transient var notes: String {
        get { SecurityEngine.shared.decrypt(encryptedNotes) }
        set { encryptedNotes = SecurityEngine.shared.encrypt(newValue) }
    }

    init(
        timestamp:   Date     = Date(),
        timeOfDay:   String   = "Morning",
        moodScore:   Double,
        energyScore: Double,
        stressScore: Double,
        tags:        [String] = [],
        notes:       String   = ""
    ) {
        self.id          = UUID()
        self.timestamp   = timestamp
        self.timeOfDay   = timeOfDay
        self.moodScore   = moodScore
        self.energyScore = energyScore
        self.stressScore = stressScore
        self.tags        = tags
        self.encryptedNotes = SecurityEngine.shared.encrypt(notes)
    }
}
