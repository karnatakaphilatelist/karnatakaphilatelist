//
//  PhilatrailWidget.swift
//  Philatrail — Home screen widget showing stamp collection progress.
//
//  Requires iOS 16+ for SwiftUI's `.containerBackground` modifier.
//  Falls back gracefully on iOS 15 (systemSmall only, no container background).
//
//  Data sharing: the main app writes to App Group "group.app.vinvi.philatrail"
//  via PhilatrailSharedStore. The widget reads from the same group.
//

import WidgetKit
import SwiftUI

// MARK: - Shared data model

struct PassportProgress: Codable {
    var stampsKA: Int       // Karnataka stamps collected
    var stampsKATotal: Int  // Karnataka total (100)
    var stampsTN: Int       // Tamil Nadu stamps collected
    var stampsTNTotal: Int  // Tamil Nadu total (58)
    var lastUpdated: Date

    static let empty = PassportProgress(
        stampsKA: 0, stampsKATotal: 100,
        stampsTN: 0, stampsTNTotal: 58,
        lastUpdated: .distantPast
    )
}

// MARK: - App Group key

private let appGroupID = "group.app.vinvi.philatrail"
private let progressKey = "passport_progress"

func readProgress() -> PassportProgress {
    guard
        let defaults = UserDefaults(suiteName: appGroupID),
        let data = defaults.data(forKey: progressKey),
        let progress = try? JSONDecoder().decode(PassportProgress.self, from: data)
    else { return .empty }
    return progress
}

// MARK: - Timeline provider

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> ProgressEntry {
        ProgressEntry(date: Date(), progress: .empty)
    }

    func getSnapshot(in context: Context, completion: @escaping (ProgressEntry) -> Void) {
        completion(ProgressEntry(date: Date(), progress: readProgress()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ProgressEntry>) -> Void) {
        let progress = readProgress()
        let entry = ProgressEntry(date: Date(), progress: progress)
        // Refresh every hour (the widget reloads when the app writes new data via
        // WidgetCenter.shared.reloadAllTimelines(), so hourly is just a safety net).
        let refresh = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }
}

struct ProgressEntry: TimelineEntry {
    let date: Date
    let progress: PassportProgress
}

// MARK: - Widget view

struct PhilatrailWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var totalStamps: Int { entry.progress.stampsKA + entry.progress.stampsTN }
    var grandTotal: Int { entry.progress.stampsKATotal + entry.progress.stampsTNTotal }
    var percent: Double {
        grandTotal > 0 ? Double(totalStamps) / Double(grandTotal) : 0
    }

    var body: some View {
        if #available(iOS 17, *) {
            content
                .containerBackground(.fill.tertiary, for: .widget)
        } else {
            content
                .padding()
                .background(Color(red: 0.98, green: 0.95, blue: 0.89)) // --color-paper
        }
    }

    var content: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Header
            HStack(spacing: 4) {
                // Small stamp icon — the ✉ emoji works across all iOS versions
                Text("✉️")
                    .font(.system(size: 14))
                Text("PHILATRAIL")
                    .font(.system(size: 10, weight: .heavy, design: .default))
                    .tracking(1.5)
                    .foregroundColor(Color(red: 0.81, green: 0.09, blue: 0.19)) // postal red
            }

            Spacer(minLength: 0)

            // Big stamp count
            Text("\(totalStamps)")
                .font(.system(size: 42, weight: .bold, design: .rounded))
                .foregroundColor(Color(red: 0.09, green: 0.13, blue: 0.31)) // --color-ink

            Text("of \(grandTotal) stamps")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(Color(red: 0.37, green: 0.39, blue: 0.51)) // --color-muted

            Spacer(minLength: 0)

            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3)
                        .fill(Color(red: 0.9, green: 0.86, blue: 0.76).opacity(0.6))
                        .frame(height: 6)
                    RoundedRectangle(cornerRadius: 3)
                        .fill(
                            percent == 1
                            ? Color(red: 0.09, green: 0.47, blue: 0.30)   // visited green
                            : Color(red: 0.81, green: 0.09, blue: 0.19)   // postal red
                        )
                        .frame(width: geo.size.width * percent, height: 6)
                        .animation(.easeOut(duration: 0.4), value: percent)
                }
            }
            .frame(height: 6)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

// MARK: - Widget configuration

@main
struct PhilatrailWidget: Widget {
    let kind: String = "PhilatrailWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PhilatrailWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Passport Progress")
        .description("See how many post offices you've stamped.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
