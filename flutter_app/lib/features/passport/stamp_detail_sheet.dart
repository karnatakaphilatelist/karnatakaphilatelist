import 'package:flutter/material.dart';

import '../../app_shell.dart';
import '../../core/date.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_sheet.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/postmark.dart';
import '../explore/explore_screen.dart' show exploreOpenOffice;
import '../office/visit_dialog.dart';

/// Port of src/components/passport/StampDetailSheet.tsx — one stamp, large,
/// with when it was collected, its note, and edit / view-on-map / remove.
Future<void> showStampDetailSheet(BuildContext context, {required OfficeWithStatus office}) {
  final controller = visitsControllerOf(context);
  final visit = controller.visits[office.id];
  if (visit == null) return Future.value();

  return showAppSheet(
    context,
    title: office.name,
    builder: (sheetContext) => Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Postmark(name: office.name, date: formatVisitDate(visit.visitedAt), pincode: office.pincode, stateCode: office.state, size: 160),
        const SizedBox(height: 16),
        Text('${office.district} district · ${office.pincode}',
            textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, height: 1.5, fontWeight: FontWeight.w600, color: AppColors.ink)),
        const SizedBox(height: 4),
        Text('Collected ${formatVisitDate(visit.visitedAt)}',
            textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
        if (visit.note.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(visit.note, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.ink)),
          ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  showVisitDialog(context, officeId: office.id, officeName: office.name);
                },
                child: Container(
                  constraints: const BoxConstraints(minHeight: 48),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    gradient: const LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [AppColors.postalTop, AppColors.postal],
                    ),
                  ),
                  child: Text(
                    (visit.note.isNotEmpty || visit.photoPath != null) ? 'EDIT NOTE' : 'ADD NOTE',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 1.4, color: Colors.white),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: GestureDetector(
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  exploreOpenOffice.value = office.id;
                  goToTab(context, 0);
                },
                child: const GlassCard(
                  borderRadius: BorderRadius.all(Radius.circular(999)),
                  child: SizedBox(
                    height: 48,
                    child: Center(
                      child: Text('View on map', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () {
            controller.removeVisit(office.id);
            Navigator.of(sheetContext).pop();
          },
          child: Container(
            constraints: const BoxConstraints(minHeight: 44),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            alignment: Alignment.center,
            child: const Text('Remove visit', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.postalDark)),
          ),
        ),
      ],
    ),
  );
}
