import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/date.dart';
import '../../core/geo.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import 'visit_dialog.dart';

/// Scoped first pass of src/components/office/OfficeDetail.tsx (566 lines —
/// deliberately NOT ported in full here to keep this stage reviewable; the
/// postmark/stamp-image rendering (Postmark.tsx, PostmarkSpecimen.tsx,
/// StampThumb.tsx) and the public-gallery/share pieces are a follow-up pass,
/// not forgotten). Covers: office info, status, stamp action, directions,
/// opening the visit dialog once stamped.
class OfficeDetailScreen extends StatelessWidget {
  final OfficeWithStatus office;
  const OfficeDetailScreen({super.key, required this.office});

  Future<void> _openDirections(BuildContext context) async {
    if (!office.hasCoordinates) return;
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=${office.lat},${office.lng}',
    );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final controller = visitsControllerOf(context);
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final visit = controller.visits[office.id];
        return Scaffold(
          appBar: AppBar(
            backgroundColor: AppColors.paper,
            foregroundColor: AppColors.ink,
            elevation: 0,
          ),
          backgroundColor: AppColors.paper,
          body: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(office.name, style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Text(office.district, style: const TextStyle(color: AppColors.muted)),
                    if (office.pincode.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      Container(width: 1, height: 14, color: AppColors.lineStrong),
                      const SizedBox(width: 8),
                      Text(
                        office.pincode,
                        style: const TextStyle(fontFamily: AppFonts.mono, color: AppColors.muted),
                      ),
                    ],
                  ],
                ),
                if (office.distanceKm != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    '${formatDistance(office.distanceKm!)} away',
                    style: const TextStyle(fontFamily: AppFonts.mono, fontSize: 13),
                  ),
                ],
                const SizedBox(height: 16),
                if (office.aboutPlace != null && office.aboutPlace!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(office.aboutPlace!, style: const TextStyle(height: 1.5)),
                  ),
                _StatusBanner(status: office.status, visitedAt: visit?.visitedAt),
                const SizedBox(height: 16),
                if (office.hasCoordinates)
                  OutlinedButton.icon(
                    onPressed: () => _openDirections(context),
                    icon: const Icon(Icons.directions_outlined),
                    label: const Text('Directions'),
                  ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.postal,
                      shape: const StadiumBorder(),
                    ),
                    onPressed: visit != null
                        ? () => showVisitDialog(context, officeId: office.id, officeName: office.name)
                        : () => controller.markVisited(office.id),
                    child: Text(visit != null ? 'Edit your visit' : 'Stamp this office'),
                  ),
                ),
                if (controller.lastError != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    controller.lastError!,
                    style: const TextStyle(color: AppColors.postalDark, fontSize: 13),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StatusBanner extends StatelessWidget {
  final OfficeStatus status;
  final String? visitedAt;
  const _StatusBanner({required this.status, required this.visitedAt});

  @override
  Widget build(BuildContext context) {
    final (color, icon, label) = switch (status) {
      OfficeStatus.visited => (
          AppColors.visited,
          Icons.check_circle,
          visitedAt != null ? 'Stamped on ${formatVisitDate(visitedAt!)}' : 'Stamped',
        ),
      OfficeStatus.planned => (AppColors.plannedInk, Icons.flag, 'Planned'),
      OfficeStatus.unvisited => (AppColors.muted, Icons.mail_outline, 'Not visited yet'),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
