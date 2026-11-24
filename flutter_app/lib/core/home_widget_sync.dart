import 'package:flutter/foundation.dart';
import 'package:home_widget/home_widget.dart';

/// Pushes passport-progress numbers to the Android home-screen widget
/// (android/app/src/main/kotlin/app/vinvi/philatrail/PhilatrailWidgetProvider.kt +
/// res/layout/philatrail_widget.xml). Mirrors the content of the existing
/// iOS widget (ios/PhilatrailWidget/PhilatrailWidget.swift) — "N of M
/// stamps" plus a progress bar — but computes the total across however many
/// states are actually live from the real office list, rather than
/// hardcoding KA=100/TN=58 the way the iOS widget currently does (worth
/// bringing the iOS widget in line with this later, not done here since that
/// needs Xcode/macOS to build and verify, neither available in this
/// environment).
///
/// Android-only for now: an iOS Flutter widget extension needs its own
/// Xcode target wired up the same way ios/PhilatrailWidget/ already is,
/// which can't be built or verified without a Mac — deliberately left to a
/// later pass rather than shipped unverified. HomeWidget's calls no-op
/// harmlessly on iOS when no such extension exists, so this is safe to call
/// unconditionally.
const String _androidWidgetProviderName = 'PhilatrailWidgetProvider';

int? _lastCollected;
int? _lastTotal;

/// Call whenever the office list or the visited set changes. Cheap and
/// idempotent — skips the platform-channel round trip when nothing actually
/// changed, and never throws (a widget that was never added to the home
/// screen, or a platform with no widget support, both fail silently here
/// rather than interrupting the app).
Future<void> updateHomeWidgetProgress({required int collected, required int total}) async {
  if (collected == _lastCollected && total == _lastTotal) return;
  _lastCollected = collected;
  _lastTotal = total;
  try {
    await HomeWidget.saveWidgetData<int>('collected', collected);
    await HomeWidget.saveWidgetData<int>('total', total);
    await HomeWidget.updateWidget(androidName: _androidWidgetProviderName);
  } catch (e) {
    // Best-effort — see doc comment above.
    debugPrint('updateHomeWidgetProgress failed: $e');
  }
}
