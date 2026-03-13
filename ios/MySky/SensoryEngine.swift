//
//  SensoryEngine.swift
//  MySky
//
//  Centralized manager for all haptic and tactile feedback. Replaces ad-hoc
//  generator calls scattered across views with a single, expressive API so
//  every touch feels intentional and consistent throughout the app.
//

import UIKit
import SwiftUI

// MARK: - App Sensory Engine

final class SensoryEngine {
    static let shared = SensoryEngine()

    private init() {}

    /// Used for changing tabs, selecting time of day, or toggling switches.
    func triggerSelection() {
        let generator = UISelectionFeedbackGenerator()
        generator.prepare()
        generator.selectionChanged()
    }

    /// Used for standard buttons and list interactions.
    func triggerTap(weight: UIImpactFeedbackGenerator.FeedbackStyle = .light) {
        let generator = UIImpactFeedbackGenerator(style: weight)
        generator.prepare()
        generator.impactOccurred()
    }

    /// Used specifically for the "Hold to Seal" interactions to give a heavy, physical feel.
    func triggerSeal() {
        let generator = UIImpactFeedbackGenerator(style: .rigid)
        generator.prepare()
        generator.impactOccurred(intensity: 1.0)
    }

    /// Used after a successful save or sync to confirm the action completed.
    func triggerSuccess() {
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(.success)
    }

    /// Used if a save fails or a network request drops.
    func triggerError() {
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(.error)
    }
}

// MARK: - SwiftUI Extension for Easy Access

extension View {
    func sensoryTap() {
        SensoryEngine.shared.triggerTap()
    }
}
