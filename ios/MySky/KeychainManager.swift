//
//  KeychainManager.swift
//  MySky
//
//  Securely generates, stores, and retrieves the app's AES-256 encryption key
//  using the iOS hardware Keychain. The key is created once and persists across
//  app launches. Access is restricted to when the device is unlocked.
//

import Foundation
import Security
import CryptoKit

// MARK: - Premium Keychain Manager

final class KeychainManager {
    static let shared = KeychainManager()
    private let keyIdentifier = "com.myskyapp.encryption.aesKey"

    private init() {}

    /// Retrieves the existing key or generates and stores a new one if it doesn't exist.
    func fetchOrGenerateKey() -> SymmetricKey {
        if let existingKey = retrieveKey() {
            return existingKey
        } else {
            let newKey = SymmetricKey(size: .bits256)
            storeKey(newKey)
            return newKey
        }
    }

    // MARK: - Private Keychain Operations

    private func storeKey(_ key: SymmetricKey) {
        // Convert SymmetricKey to raw Data without an intermediate array copy
        let keyData = key.withUnsafeBytes { Data($0) }

        // Minimal lookup query — only class + account — so delete succeeds
        // even if the item was previously stored with a different accessibility setting.
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: keyIdentifier
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: keyIdentifier,
            kSecValueData as String: keyData,
            // Only accessible while the device is unlocked; never migrates to another device
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let status = SecItemAdd(addQuery as CFDictionary, nil)
        guard status == errSecSuccess else {
            assertionFailure("[KeychainManager] Failed to store encryption key — status \(status). Data will be inaccessible after restart.")
            return
        }
    }

    private func retrieveKey() -> SymmetricKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: keyIdentifier,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)

        if status == errSecSuccess, let keyData = dataTypeRef as? Data {
            return SymmetricKey(data: keyData)
        }
        return nil
    }
}
