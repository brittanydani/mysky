import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Interactive Intent (iOS 17+)
// Logs a silent baseline check-in directly from the Home Screen button —
// no app launch required.

struct QuickCheckInIntent: AppIntent {
    static var title: LocalizedStringResource = "Quick Check-In"
    static var description = IntentDescription("Logs a baseline energy state in MySky.")

    func perform() async throws -> some IntentResult {
        guard let d = UserDefaults(suiteName: WidgetDataStore.appGroupSuite) else { return .result() }
        // Append a pending check-in record. The main app reads and flushes
        // this queue the next time it comes to the foreground.
        var queue = (d.array(forKey: WidgetDataStore.keyPendingCheckIns) as? [[String: Any]]) ?? []
        queue.append(["timestamp": Date().timeIntervalSince1970])
        d.set(queue, forKey: WidgetDataStore.keyPendingCheckIns)
        d.synchronize()
        return .result()
    }
}

// MARK: - Timeline Entry

struct DailyEnergyEntry: TimelineEntry {
    let date: Date
    let energyLevel: Double
    let focusTitle: String
    let transit: String
    let statusText: String
    let captionText: String
    let orbColor: Color
}

private extension DailyEnergyEntry {
    static var placeholder: DailyEnergyEntry {
        DailyEnergyEntry(
            date:        Date(),
            energyLevel: 0.65,
            focusTitle:  "Solar Plexus",
            transit:     "Moon in Pisces",
            statusText:  "Grounding Needed",
            captionText: "Tune inward. Your energy has a message for you today.",
            orbColor:    Color(red: 0.85, green: 0.75, blue: 0.55)
        )
    }

    static func fromStore() -> DailyEnergyEntry {
        let s = WidgetDataStore.load()
        return DailyEnergyEntry(
            date:        Date(),
            energyLevel: s.energyLevel,
            focusTitle:  s.focusTitle,
            transit:     s.transit,
            statusText:  s.statusText,
            captionText: s.captionText,
            orbColor:    Color(red: s.orbColorR, green: s.orbColorG, blue: s.orbColorB)
        )
    }
}

// MARK: - Provider

struct EnergyWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> DailyEnergyEntry { .placeholder }

    func getSnapshot(in context: Context, completion: @escaping (DailyEnergyEntry) -> Void) {
        completion(context.isPreview ? .placeholder : .fromStore())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyEnergyEntry>) -> Void) {
        let entry   = DailyEnergyEntry.fromStore()
        let refresh = Calendar.current.date(byAdding: .hour, value: 1, to: entry.date)!
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }
}

// MARK: - Entry View

struct MySkyWidgetEntryView: View {
    var entry: DailyEnergyEntry
    @Environment(\.widgetFamily) var family

    private let bgDark = Color(red: 0.04, green: 0.04, blue: 0.06)

    var body: some View {
        ZStack {
            bgDark

            // Ambient glow positioned per widget size
            Circle()
                .fill(entry.orbColor.opacity(0.15))
                .blur(radius: 40)
                .frame(width: 150, height: 150)
                .offset(
                    x: family == .systemMedium ? 100 : 0,
                    y: family == .systemMedium ?   0 : -50
                )

            switch family {
            case .systemSmall:          smallLayout
            case .systemMedium:         mediumLayout
            case .accessoryCircular:    lockCircularLayout
            case .accessoryRectangular: lockRectLayout
            default:                    smallLayout
            }
        }
    }

    // MARK: Small – "Cosmic Pulse"

    private var smallLayout: some View {
        VStack(alignment: .leading, spacing: 12) {
            WidgetEtherealOrb(color: entry.orbColor, size: 44)
            Spacer()
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.transit.uppercased())
                    .font(.system(size: 9, weight: .bold, design: .rounded))
                    .tracking(1)
                    .foregroundColor(entry.orbColor)
                Text(entry.focusTitle)
                    .font(.system(size: 16, weight: .semibold, design: .serif))
                    .foregroundColor(.white)
                Text(entry.statusText)
                    .font(.system(size: 11, weight: .regular, design: .rounded))
                    .foregroundColor(.white.opacity(0.6))
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    // MARK: Medium – "Daily Context" (interactive)

    private var mediumLayout: some View {
        HStack(spacing: 20) {
            // Left: orb + transit label
            VStack(alignment: .leading, spacing: 12) {
                WidgetEtherealOrb(color: entry.orbColor, size: 56)
                VStack(alignment: .leading, spacing: 2) {
                    Text(entry.transit.uppercased())
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .tracking(1)
                        .foregroundColor(entry.orbColor)
                    Text(entry.focusTitle)
                        .font(.system(size: 18, weight: .semibold, design: .serif))
                        .foregroundColor(.white)
                }
            }

            Spacer()

            // Right: context caption + interactive button
            VStack(alignment: .leading, spacing: 12) {
                Text(entry.captionText)
                    .font(.system(size: 13, weight: .regular, design: .serif))
                    .italic()
                    .lineSpacing(2)
                    .foregroundColor(.white.opacity(0.8))
                    .lineLimit(4)

                Spacer()

                Button(intent: QuickCheckInIntent()) {
                    HStack(spacing: 4) {
                        Image(systemName: "plus.circle.fill")
                        Text("Log Energy")
                    }
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundColor(bgDark)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(entry.orbColor)
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(20)
    }

    // MARK: Lock Screen – Circular (energy ring)

    private var lockCircularLayout: some View {
        ZStack {
            AccessoryWidgetBackground()
            Circle()
                .stroke(Color.white.opacity(0.3), lineWidth: 3)
            Circle()
                .trim(from: 0, to: entry.energyLevel)
                .stroke(Color.white, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Image(systemName: "sparkles")
                .font(.system(size: 16))
        }
    }

    // MARK: Lock Screen – Rectangular

    private var lockRectLayout: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: "sparkles")
                Text(entry.transit.uppercased())
                    .font(.system(size: 10, weight: .bold, design: .rounded))
            }
            Text(entry.focusTitle)
                .font(.system(size: 14, weight: .semibold, design: .serif))
            Text(entry.statusText)
                .font(.system(size: 12, weight: .regular, design: .rounded))
                .opacity(0.8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Orb Component (widget-optimised, no animations)

struct WidgetEtherealOrb: View {
    let color: Color
    let size: CGFloat

    var body: some View {
        ZStack {
            Circle()
                .fill(color.opacity(0.2))
                .blur(radius: size * 0.15)
                .frame(width: size, height: size)
            Circle()
                .fill(
                    RadialGradient(
                        gradient: Gradient(colors: [color.opacity(0.9), color.opacity(0.1)]),
                        center: .center,
                        startRadius: 2,
                        endRadius: size * 0.4
                    )
                )
                .frame(width: size * 0.75, height: size * 0.75)
            Circle()
                .fill(Color.white.opacity(0.8))
                .frame(width: size * 0.1, height: size * 0.1)
                .blur(radius: 1)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Widget Configuration

struct EnergyWidget: Widget {
    let kind = "EnergyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: EnergyWidgetProvider()) { entry in
            MySkyWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    Color(red: 0.04, green: 0.04, blue: 0.06)
                }
        }
        .configurationDisplayName("Daily Energy")
        .description("Your cosmic blueprint and daily focus, always on your Home Screen.")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .accessoryCircular,
            .accessoryRectangular,
        ])
    }
}

// MARK: - Widget Bundle

@main
struct MySkyWidgets: WidgetBundle {
    var body: some Widget {
        EnergyWidget()
    }
}
