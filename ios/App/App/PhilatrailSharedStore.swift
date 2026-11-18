//
//  PhilatrailSharedStore.swift
//  Philatrail
//
//  Writes passport progress to App Group shared UserDefaults so the
//  home-screen widget can display current stamp counts without network access.
//
//  Called from AppDelegate via a Capacitor plugin bridge (see PhilatrailPlugin.swift).
//

import Foundation
import WidgetKit

// MARK: - Data model (must match PhilatrailWidget.swift)

struct PassportProgressData: Codable {
    var stampsKA: Int
    var stampsKATotal: Int
    var stampsTN: Int
    var stampsTNTotal: Int
    var lastUpdated: Date
}

// MARK: - Shared store

enum PhilatrailSharedStore {
    static let appGroupID = "group.app.vinvi.philatrail"
    static let progressKey = "passport_progress"

    /// Writes updated stamp counts and reloads all widget timelines.
    static func updateProgress(
        stampsKA: Int, stampsKATotal: Int,
        stampsTN: Int, stampsTNTotal: Int
    ) {
        guard let defaults = UserDefaults(suiteName: appGroupID) else { return }
        let data = PassportProgressData(
            stampsKA: stampsKA, stampsKATotal: stampsKATotal,
            stampsTN: stampsTN, stampsTNTotal: stampsTNTotal,
            lastUpdated: Date()
        )
        guard let encoded = try? JSONEncoder().encode(data) else { return }
        defaults.set(encoded, forKey: progressKey)
        // Tell WidgetKit to refresh immediately.
        WidgetCenter.shared.reloadAllTimelines()
    }
}
