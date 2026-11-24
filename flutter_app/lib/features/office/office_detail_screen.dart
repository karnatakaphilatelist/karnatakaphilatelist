import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/date.dart';
import '../../core/geo.dart';
import '../../core/haptics.dart';
import '../../core/in_app_review.dart';
import '../../core/share.dart';
import '../../data/visits_repository.dart';
import '../../models/post_office.dart';
import '../../models/visit.dart';
import '../../theme/app_theme.dart';
import '../../widgets/postmark_specimen.dart';
import '../../widgets/stamp_thumb.dart';
import 'contribute_sheet.dart';
import 'stamped_sheet.dart';
import 'visit_dialog.dart';

/// Port of src/components/office/OfficeDetail.tsx, scoped to what this data
/// model actually backs. Ported in full: the stamp hero (StampThumb +
/// PostmarkSpecimen), the proximity check-in ("Check if you're here"),
/// sharing a stamped office, and the celebration sheet on a successful
/// stamp. Deliberately NOT ported: a tabbed About/Notes/Public layout —
/// there is no community-gallery query built yet to back a "Public" tab, so
/// inventing one here would just be an empty shell; the visit's own note and
/// photo (when present) are shown inline instead, which is the real content
/// a "Notes" tab would have held.
class OfficeDetailScreen extends StatefulWidget {
  final OfficeWithStatus office;
  const OfficeDetailScreen({super.key, required this.office});

  @override
  State<OfficeDetailScreen> createState() => _OfficeDetailScreenState();
}

class _OfficeDetailScreenState extends State<OfficeDetailScreen> {
  bool _checking = false;
  double? _lastCheckKm;

  OfficeWithStatus get office => widget.office;

  Future<void> _openDirections(BuildContext context) async {
    if (!office.hasCoordinates) return;
    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=${office.lat},${office.lng}',
    );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _checkIfHere() async {
    if (!office.hasCoordinates || _checking) return;
    setState(() => _checking = true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      final granted = permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse;
      if (!granted) {
        if (mounted) setState(() => _lastCheckKm = null);
        return;
      }
      final position = await Geolocator.getCurrentPosition();
      final km = distanceKm(
        Coordinates(lat: position.latitude, lng: position.longitude),
        Coordinates(lat: office.lat!, lng: office.lng!),
      );
      if (mounted) setState(() => _lastCheckKm = km);
    } catch (_) {
      if (mounted) setState(() => _lastCheckKm = null);
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  Future<void> _shareStamp() async {
    await shareText(
      text: "I've stamped ${office.name} post office on my Philatrail passport!",
    );
  }

  Future<void> _stampIt(VisitsController controller) async {
    final saved = await controller.markVisited(office.id);
    if (!saved || !mounted) return;
    hapticCollect();
    unawaited(maybeRequestReview(controller.visits.length));

    final officesController = officesControllerOf(context);
    final stateController = stateControllerOf(context);
    final stateOffices = stateController.officesFor(officesController.offices);
    final stateIds = stateOffices.map((o) => o.id).toSet();
    final collected = controller.visits.keys.where(stateIds.contains).length;
    final updated = OfficeWithStatus.from(office, status: OfficeStatus.visited, distanceKm: office.distanceKm);
    await showStampedSheet(context, office: updated, collected: collected, total: stateOffices.length);
  }

  @override
  Widget build(BuildContext context) {
    final controller = visitsControllerOf(context);
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final visit = controller.visits[office.id];
        final visited = visit != null;
        return Scaffold(
          appBar: AppBar(
            backgroundColor: AppColors.paper,
            foregroundColor: AppColors.ink,
            elevation: 0,
            actions: [
              if (visited)
                IconButton(
                  onPressed: _shareStamp,
                  icon: const Icon(Icons.ios_share),
                  tooltip: 'Share this stamp',
                ),
              IconButton(
                onPressed: () => showContributeSheet(context, office: office),
                icon: const Icon(Icons.flag_circle_outlined),
                tooltip: 'Contribute',
              ),
            ],
          ),
          backgroundColor: AppColors.paper,
          body: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
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
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    StampThumb(path: office.stampImagePath, natural: true),
                  ],
                ),
                const SizedBox(height: 16),
                if (office.aboutPlace != null && office.aboutPlace!.isNotEmpty)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: Text(office.aboutPlace!, style: const TextStyle(height: 1.5)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      PostmarkSpecimen(path: office.stampImagePath, visited: visited, name: office.name),
                    ],
                  ),
                _StatusBanner(status: office.status, visitedAt: visit?.visitedAt),
                if (_lastCheckKm != null) ...[
                  const SizedBox(height: 10),
                  _ProximityBanner(km: _lastCheckKm!),
                ],
                if (visit != null && (visit.note.isNotEmpty || visit.photoPath != null)) ...[
                  const SizedBox(height: 16),
                  _VisitNotesCard(visit: visit),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    if (office.hasCoordinates)
                      OutlinedButton.icon(
                        onPressed: () => _openDirections(context),
                        icon: const Icon(Icons.directions_outlined),
                        label: const Text('Directions'),
                      ),
                    if (!visited && office.hasCoordinates) ...[
                      const SizedBox(width: 10),
                      OutlinedButton.icon(
                        onPressed: _checking ? null : _checkIfHere,
                        icon: _checking
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.my_location),
                        label: const Text("Check if you're here"),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 52,
                        child: FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.postal,
                            shape: const StadiumBorder(),
                          ),
                          onPressed: visited
                              ? () => showVisitDialog(context, officeId: office.id, officeName: office.name)
                              : () => _stampIt(controller),
                          child: Text(visited ? 'Edit your visit' : 'Stamp this office'),
                        ),
                      ),
                    ),
                    if (!visited) ...[
                      const SizedBox(width: 12),
                      SizedBox(
                        width: 52,
                        height: 52,
                        child: IconButton.outlined(
                          isSelected: controller.plannedIds.contains(office.id),
                          onPressed: () {
                            hapticSelectionChanged();
                            controller.togglePlanned(office.id);
                          },
                          icon: const Icon(Icons.flag_outlined),
                          selectedIcon: const Icon(Icons.flag, color: AppColors.plannedInk),
                          tooltip: controller.plannedIds.contains(office.id)
                              ? 'Remove from planned'
                              : 'Plan a visit',
                        ),
                      ),
                    ],
                  ],
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

/// Feedback for the "Check if you're here" button — port of the proximity
/// message in OfficeDetail.tsx, driven by core/geo.dart's [proximity].
class _ProximityBanner extends StatelessWidget {
  final double km;
  const _ProximityBanner({required this.km});

  @override
  Widget build(BuildContext context) {
    final here = proximity(km) == Proximity.here;
    final color = here ? AppColors.visited : AppColors.warn;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(here ? Icons.check_circle_outline : Icons.error_outline, size: 18, color: color),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              here ? "You're here!" : "You're ${formatShortDistance(km)} away",
              style: TextStyle(color: color, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

/// Read-only summary of the signed-in user's own visit note/photo — the
/// real content a "Notes" tab would show, without inventing a public-gallery
/// tab this build has no data to back (see the class doc comment above).
class _VisitNotesCard extends StatelessWidget {
  final Visit visit;
  const _VisitNotesCard({required this.visit});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('Your notes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              const Spacer(),
              Icon(visit.isPublic ? Icons.public : Icons.lock_outline, size: 16, color: AppColors.muted),
              const SizedBox(width: 4),
              Text(visit.isPublic ? 'Public' : 'Private', style: const TextStyle(color: AppColors.muted, fontSize: 12)),
            ],
          ),
          if (visit.note.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(visit.note, style: const TextStyle(height: 1.4)),
          ],
          if (visit.photoPath != null) ...[
            const SizedBox(height: 10),
            // The photo lives in the private stamp-photos bucket (unlike the
            // office's own public stampImagePath), so rendering it needs a
            // signed URL rather than StampThumb's public-URL helper — a
            // later pass; a plain indicator is the honest minimum for now.
            const Row(
              children: [
                Icon(Icons.camera_alt_outlined, size: 16, color: AppColors.muted),
                SizedBox(width: 6),
                Text('Photo attached', style: TextStyle(color: AppColors.muted, fontSize: 13)),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
