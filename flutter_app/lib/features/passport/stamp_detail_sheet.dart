import 'package:flutter/material.dart';

import '../../core/date.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_sheet.dart';
import '../../widgets/postmark.dart';
import '../office/office_detail_screen.dart';
import '../office/visit_dialog.dart';

/// Port of src/components/passport/StampDetailSheet.tsx — one collected
/// stamp, large, with its date, note and remove/edit actions.
Future<void> showStampDetailSheet(
  BuildContext context, {
  required OfficeWithStatus office,
}) {
  final controller = visitsControllerOf(context);
  final visit = controller.visits[office.id];
  if (visit == null) return Future.value();

  return showAppSheet(
    context,
    title: office.name,
    builder: (sheetContext) => Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Postmark(
          name: office.name,
          date: formatVisitDate(visit.visitedAt),
          pincode: office.pincode,
          stateCode: office.state,
          size: 160,
        ),
        const SizedBox(height: 16),
        Text(
          '${office.district} district · ${office.pincode}',
          style: const TextStyle(fontWeight: FontWeight.w600),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 4),
        Text(
          'Collected ${formatVisitDate(visit.visitedAt)}',
          style: const TextStyle(color: AppColors.muted, fontSize: 13),
          textAlign: TextAlign.center,
        ),
        if (visit.note.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(visit.note, textAlign: TextAlign.center),
        ],
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.postal,
                  shape: const StadiumBorder(),
                  minimumSize: const Size.fromHeight(48),
                ),
                onPressed: () {
                  Navigator.of(sheetContext).pop();
                  showVisitDialog(context, officeId: office.id, officeName: office.name);
                },
                child: Text(visit.note.isNotEmpty || visit.photoPath != null ? 'Edit note' : 'Add note'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  shape: const StadiumBorder(),
                  minimumSize: const Size.fromHeight(48),
                ),
                onPressed: () {
                  Navigator.of(sheetContext).pop();
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => OfficeDetailScreen(office: office)),
                  );
                },
                child: const Text('View on map'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        TextButton(
          onPressed: () {
            controller.removeVisit(office.id);
            Navigator.of(sheetContext).pop();
          },
          child: const Text('Remove visit', style: TextStyle(color: AppColors.postalDark, fontSize: 13)),
        ),
      ],
    ),
  );
}
