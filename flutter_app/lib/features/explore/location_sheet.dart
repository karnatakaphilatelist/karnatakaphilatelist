import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../widgets/app_icons.dart';
import '../../widgets/app_sheet.dart';

/// [noFix]: permission is granted but the phone returned no position (indoors,
/// no signal, an emulator with no point set) — saying "Location is off" there
/// sent people to settings that were already right.
enum LocationSheetMode { prime, denied, noFix }

/// Port of src/components/explore/LocationSheet.tsx: plain-words sheets around
/// the location permission, so the system prompt is never a surprise.
Future<void> showLocationSheet(
  BuildContext context, {
  required LocationSheetMode mode,
  required VoidCallback? onContinue,
}) {
  return showAppSheet<void>(
    context,
    title: switch (mode) {
      LocationSheetMode.denied => 'Location is off',
      LocationSheetMode.noFix => "Can't find you yet",
      LocationSheetMode.prime => 'Find post offices near you',
    },
    builder: (sheetContext) => switch (mode) {
      LocationSheetMode.prime => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(color: AppColors.sand, shape: BoxShape.circle),
                  child: const AppIconView(AppIcon.target, size: 24, color: AppColors.ink),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'We use your location to sort post offices by distance and to show how far you are from one. '
                    'If you allow notifications, Philatrail also keeps checking in the background and alerts you when you are near a post office you have not stamped yet, with a notification showing while it does. '
                    'Your location stays on your phone: it is not stored or shared.',
                    style: TextStyle(fontSize: 16, height: 24 / 16, color: AppColors.muted),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            _SheetButton(
              label: 'Continue',
              color: AppColors.postal,
              minHeight: 52,
              onTap: () {
                Navigator.of(sheetContext).pop();
                onContinue?.call();
              },
            ),
            const SizedBox(height: 8),
            _SheetButton(label: 'Not now', minHeight: 48, onTap: () => Navigator.of(sheetContext).pop()),
          ],
        ),
      LocationSheetMode.denied || LocationSheetMode.noFix => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.warnSoft, borderRadius: BorderRadius.circular(16)),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(padding: EdgeInsets.only(top: 2), child: AppIconView(AppIcon.alert, size: 20, color: AppColors.warn)),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      mode == LocationSheetMode.noFix
                          ? "Your phone couldn't get a position just now. Try again in a moment, or step outside or "
                              'near a window. You can still browse and search every post office.'
                          : "To see what is near you, open your phone's Settings, choose this app, then turn Location on. "
                              'You can still browse and search every post office.',
                      style: TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.warn),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            _SheetButton(label: 'OK', color: AppColors.ink, minHeight: 52, onTap: () => Navigator.of(sheetContext).pop()),
          ],
        ),
    },
  );
}

/// A full-width pill button: filled (white bold text) when [color] is set,
/// otherwise a plain ink semibold text button.
class _SheetButton extends StatelessWidget {
  final String label;
  final Color? color;
  final double minHeight;
  final VoidCallback onTap;
  const _SheetButton({required this.label, this.color, required this.minHeight, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: BoxConstraints(minHeight: minHeight),
        alignment: Alignment.center,
        decoration: color == null ? null : BoxDecoration(color: color, borderRadius: BorderRadius.circular(999)),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 16,
            fontWeight: color == null ? FontWeight.w600 : FontWeight.w700,
            color: color == null ? AppColors.ink : Colors.white,
          ),
        ),
      ),
    );
  }
}
