import 'package:flutter/material.dart';

import '../../core/share.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_sheet.dart';

/// Port of src/components/passport/ShareProgressSheet.tsx — a preview of the
/// card being shared, so people see what they're sending before the native
/// share sheet opens.
Future<void> showShareProgressSheet(
  BuildContext context, {
  required int stamped,
  required int total,
  required String stateName,
  required void Function(ShareOutcome) onResult,
}) {
  return showAppSheet(
    context,
    title: 'Share your progress',
    builder: (sheetContext) => Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.postal,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              const Text(
                'MY POST OFFICE PASSPORT',
                style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600, letterSpacing: 1.2, fontSize: 12),
              ),
              const SizedBox(height: 8),
              Text(
                '$stamped',
                style: const TextStyle(color: Colors.white, fontSize: 56, fontWeight: FontWeight.w600, fontStyle: FontStyle.italic, height: 1),
              ),
              const SizedBox(height: 4),
              Text(
                'of $total stamped in $stateName',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.postal,
              shape: const StadiumBorder(),
              minimumSize: const Size.fromHeight(52),
            ),
            onPressed: () async {
              final result = await shareProgress(
                text: progressShareText(stamped, total, stateName),
                subject: 'Philatrail',
              );
              if (sheetContext.mounted) Navigator.of(sheetContext).pop();
              onResult(result);
            },
            child: const Text('Share'),
          ),
        ),
      ],
    ),
  );
}
