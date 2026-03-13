// SecurityEngine.swift
// MySky — Production AES-256-GCM encryption backed by KeychainManager.
//
// Architecture:
//   • KeychainManager provides the 256-bit SymmetricKey (generated once,
//     stored in the iOS Keychain with kSecAttrAccessibleWhenUnlockedThisDeviceOnly).
//   • SecurityEngine wraps AES.GCM operations from Apple's CryptoKit so all
//     SwiftData model fields encrypt/decrypt through a single call site.
//
// Storage format:
//   AES.GCM.SealedBox.combined  →  12-byte nonce + ciphertext + 16-byte auth tag
//   The GCM tag detects any tampering before decryption is attempted.
//
// Usage from SwiftData @Transient computed properties:
//   get { SecurityEngine.shared.decrypt(encryptedField) }
//   set { encryptedField = SecurityEngine.shared.encrypt(newValue) }

import Foundation
import CryptoKit

// MARK: - SecurityEngine

final class SecurityEngine {

    static let shared = SecurityEngine()

    /// Key resolved from KeychainManager on first use — hardware-backed,
    /// device-bound, never in iCloud backups.
    private lazy var symmetricKey: SymmetricKey = {
        KeychainManager.shared.fetchOrGenerateKey()
    }()

    private init() {}

    // MARK: - Encrypt

    /// Encrypts `text` with AES-256-GCM.
    /// Returns the combined sealed box (nonce + ciphertext + tag) as raw Data,
    /// or nil if the string cannot be UTF-8 encoded.
    func encrypt(_ text: String) -> Data? {
        guard let plaintext = text.data(using: .utf8) else { return nil }
        do {
            let sealed = try AES.GCM.seal(plaintext, using: symmetricKey)
            return sealed.combined   // nonce ++ ciphertext ++ tag
        } catch {
            return nil
        }
    }

    // MARK: - Decrypt

    /// Decrypts a combined AES-GCM sealed box.
    /// - Returns `""` for nil input (field was never written).
    /// - Returns a sentinel string if decryption fails (key mismatch or data tampered).
    ///   The sentinel mirrors the JS layer's `DECRYPTION_FAILED_PLACEHOLDER` so both
    ///   layers surface the same error text to the UI.
    func decrypt(_ combinedData: Data?) -> String {
        guard let combinedData else { return "" }
        do {
            let sealed    = try AES.GCM.SealedBox(combined: combinedData)
            let decrypted = try AES.GCM.open(sealed, using: symmetricKey)
            return String(data: decrypted, encoding: .utf8) ?? ""
        } catch {
            return "[Unable to access encrypted data on this device]"
        }
    }
}
