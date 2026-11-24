import 'package:flutter/material.dart';

import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_sheet.dart';
import '../../widgets/stamp_thumb.dart';
import 'visit_dialog.dart';

/// Port of src/components/office/StampedSheet.tsx: the reward moment right
/// after "Stamp it". Left out deliberately: the web version's ripple/press
/// CSS keyframe animation on the stamp icon — a later motion pass, not
/// forgotten; the content and actions are otherwise a full port.
Future<void> showStampedSheet(
  BuildContext context, {
  required OfficeWithStatus office,
  required int collected,
  required int total,
}) {
  return showAppSheet<void>(
    context,
    title: 'Stamped!',
    builder: (sheetContext) => Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            Container(
              width: 128,
              height: 128,
              decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.visited, width: 2)),
            ),
            StampThumb(path: office.stampImagePath, size: 96),
            const Positioned(
              bottom: 0,
              right: 0,
              child: CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.visited,
                child: Icon(Icons.check, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(
          office.name,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w500, letterSpacing: 0.3),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(color: AppColors.visited.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(999)),
          child: const Text('STAMPED',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: AppColors.visitedInk)),
        ),
        const SizedBox(height: 6),
        Text('$collected of $total in your passport', style: const TextStyle(color: AppColors.muted)),
        const SizedBox(height: 20),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: AppColors.ink, minimumSize: const Size.fromHeight(56), shape: const StadiumBorder()),
          onPressed: () {
            Navigator.of(sheetContext).pop();
            showVisitDialog(context, officeId: office.id, officeName: office.name);
          },
          child: const Text('Add note and photo'),
        ),
        const SizedBox(height: 4),
        TextButton(
          onPressed: () => Navigator.of(sheetContext).pop(),
          child: const Text('Done', style: TextStyle(color: AppColors.ink, fontWeight: FontWeight.w600)),
        ),
      ],
    ),
  );
}
