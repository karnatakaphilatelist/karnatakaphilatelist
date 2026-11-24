import 'dart:io';

import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import '../../widgets/app_sheet.dart';

enum LocationSheetMode { prime, denied }

/// Port of src/components/explore/LocationSheet.tsx: plain-words sheets
/// around the location permission, so the OS prompt is never a surprise.
Future<void> showLocationSheet(
  BuildContext context, {
  required LocationSheetMode mode,
  required VoidCallback? onContinue,
}) {
  return showAppSheet<void>(
    context,
    title: mode == LocationSheetMode.denied ? 'Location is off' : 'Find post offices near you',
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
                  decoration: BoxDecoration(color: AppColors.sand, shape: BoxShape.circle),
                  child: const Icon(Icons.my_location, size: 22),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'We use your location only to sort post offices by distance and to show how far you are from one. It is not stored or shared.',
                    style: TextStyle(color: AppColors.muted, height: 1.4),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppColors.postal, minimumSize: const Size.fromHeight(52), shape: const StadiumBorder()),
              onPressed: () {
                Navigator.of(sheetContext).pop();
                onContinue?.call();
              },
              child: const Text('Continue'),
            ),
            const SizedBox(height: 6),
            TextButton(
              onPressed: () => Navigator.of(sheetContext).pop(),
              child: const Text('Not now', style: TextStyle(color: AppColors.ink, fontWeight: FontWeight.w600)),
            ),
          ],
        ),
      LocationSheetMode.denied => Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.warnSoft, borderRadius: BorderRadius.circular(16)),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.error_outline, color: AppColors.warn, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '${Platform.isIOS || Platform.isAndroid ? "To see what is near you, open your phone's Settings, choose this app, then turn Location on." : "To see what is near you, allow location for this app."} '
                      'You can still browse and search every post office.',
                      style: const TextStyle(color: AppColors.warn, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppColors.ink, minimumSize: const Size.fromHeight(52), shape: const StadiumBorder()),
              onPressed: () => Navigator.of(sheetContext).pop(),
              child: const Text('OK'),
            ),
          ],
        ),
    },
  );
}
