import 'package:flutter/services.dart';

/// Port of src/lib/haptics.ts. The web app wraps @capacitor/haptics; Flutter
/// already ships the same impact/selection vocabulary natively via
/// HapticFeedback (services.dart), so no extra plugin is needed here — a
/// substitution, not a gap (the `vibration` package in pubspec.yaml is
/// unused by this file; kept in case a custom buzz pattern is wanted later).
///
/// Only the three helpers actually called in the web app today are wired up
/// at their call sites (see explore_screen.dart's office selection and
/// office_detail_screen.dart's stamp/plan buttons): hapticSelect,
/// hapticCollect, hapticSelectionChanged. The rest are ported for parity
/// and are there to use as those flows grow (e.g. hapticError once a
/// dedicated failed-save surface exists).
Future<void> hapticTap() => HapticFeedback.lightImpact();

Future<void> hapticSelect() => HapticFeedback.mediumImpact();

/// "Stamp collected" celebration — heavy hit then a quick follow-up, same
/// shape as the web app's heavy-impact-then-success-notification pair
/// (Flutter has no separate "notification" haptic type, so a light impact
/// stands in for the success buzz).
Future<void> hapticCollect() async {
  await HapticFeedback.heavyImpact();
  await Future<void>.delayed(const Duration(milliseconds: 60));
  await HapticFeedback.lightImpact();
}

/// "Stamp removed" / "action undone" — softer double-tap.
Future<void> hapticRemove() async {
  await HapticFeedback.mediumImpact();
  await Future<void>.delayed(const Duration(milliseconds: 80));
  await HapticFeedback.lightImpact();
}

Future<void> hapticError() => HapticFeedback.heavyImpact();

Future<void> hapticSelectionChanged() => HapticFeedback.selectionClick();
