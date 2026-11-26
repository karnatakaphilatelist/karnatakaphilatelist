import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/date.dart';
import '../../core/geo.dart';
import '../../core/haptics.dart';
import '../../core/in_app_review.dart';
import '../../core/share.dart';
import '../../data/visits_remote_store.dart';
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
/// sharing a stamped office, the celebration sheet on a successful stamp,
/// and — now that the web app has a real query to back it — a "Public
/// notes" section reusing fetchPublicVisitsForOffice, shown inline below
/// the person's own notes rather than as a separate tab.
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
                _PublicNotesSection(
                  officeId: office.id,
                  hasVisited: visited,
                  onWriteNote: () => showVisitDialog(context, officeId: office.id, officeName: office.name),
                ),
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

/// Public notes left on this office by any collector — Google-Maps-review
/// style, ported from OfficeDetail.tsx's "Public" tab. Includes its own
/// "Write a public note" entry point (reusing the existing visit dialog,
/// which already has the public/private picker) rather than relying on
/// someone finding it inside their own private notes.
class _PublicNotesSection extends StatefulWidget {
  final int officeId;
  final bool hasVisited;
  final VoidCallback onWriteNote;
  const _PublicNotesSection({
    required this.officeId,
    required this.hasVisited,
    required this.onWriteNote,
  });

  @override
  State<_PublicNotesSection> createState() => _PublicNotesSectionState();
}

class _PublicNotesSectionState extends State<_PublicNotesSection> {
  late Future<List<PublicVisitNote>> _future;

  @override
  void initState() {
    super.initState();
    _future = VisitsRemoteStore(Supabase.instance.client).fetchPublicVisitsForOffice(widget.officeId);
  }

  @override
  void didUpdateWidget(covariant _PublicNotesSection oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.officeId != widget.officeId) {
      _future = VisitsRemoteStore(Supabase.instance.client).fetchPublicVisitsForOffice(widget.officeId);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Public notes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        FutureBuilder<List<PublicVisitNote>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
              );
            }
            final notes = snapshot.data ?? const [];
            if (notes.isEmpty) {
              return const Text(
                'Tips and photos other collectors choose to share publicly will show up here.',
                style: TextStyle(color: AppColors.muted, fontSize: 13),
              );
            }
            return Column(
              children: [for (final n in notes) _PublicNoteRow(note: n)],
            );
          },
        ),
        const SizedBox(height: 10),
        if (widget.hasVisited)
          OutlinedButton.icon(
            onPressed: widget.onWriteNote,
            icon: const Icon(Icons.public, size: 18),
            label: const Text('Write a public note'),
          )
        else
          const Text(
            'Stamp your passport here to write a public note.',
            style: TextStyle(color: AppColors.muted, fontSize: 13),
          ),
      ],
    );
  }
}

class _PublicNoteRow extends StatelessWidget {
  final PublicVisitNote note;
  const _PublicNoteRow({required this.note});

  @override
  Widget build(BuildContext context) {
    final name = (note.authorName?.trim().isNotEmpty ?? false) ? note.authorName!.trim() : 'A collector';
    final initial = name.substring(0, 1).toUpperCase();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          note.authorAvatarUrl != null
              ? CircleAvatar(radius: 18, backgroundImage: NetworkImage(note.authorAvatarUrl!))
              : CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.postalSoft,
                  child: Text(initial, style: const TextStyle(color: AppColors.postal, fontWeight: FontWeight.bold)),
                ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(formatVisitDate(note.visitedAt), style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 3),
                Text(note.note, style: const TextStyle(height: 1.35)),
                if (note.photoPath != null) ...[
                  const SizedBox(height: 8),
                  _PublicNotePhoto(path: note.photoPath!),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Resolves a public note's photo to a short-lived signed URL, same bucket
/// and TTL as usePhotoUrl.ts on the web side.
class _PublicNotePhoto extends StatelessWidget {
  final String path;
  const _PublicNotePhoto({required this.path});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String>(
      future: Supabase.instance.client.storage
          .from(VisitsRemoteStore.photoBucket)
          .createSignedUrl(path, 60 * 60),
      builder: (context, snapshot) {
        final url = snapshot.data;
        if (url == null) return const SizedBox.shrink();
        return ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: Image.network(url, height: 120, width: double.infinity, fit: BoxFit.cover),
        );
      },
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
