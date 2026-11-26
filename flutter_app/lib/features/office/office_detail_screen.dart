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
import '../../widgets/glass_card.dart';
import '../../widgets/stamp_thumb.dart';
import 'contribute_sheet.dart';
import 'stamped_sheet.dart';
import 'visit_dialog.dart';

/// Port of src/components/office/OfficeDetail.tsx: the real app's docked
/// panel, not a plain AppBar+Scaffold page — name/meta/status header, then
/// the About/Notes/Public tab trio, then the pinned Stamp-it/Share + Plan +
/// Route action row. One deliberate gap: the web version's round "Stamps"
/// button links straight to /passport; this build has no cross-tab
/// navigation plumbed in from a pushed route, so it just closes back to
/// Explore instead — a later pass if a shared tab-index controller is
/// wanted.
class OfficeDetailScreen extends StatefulWidget {
  final OfficeWithStatus office;
  const OfficeDetailScreen({super.key, required this.office});

  @override
  State<OfficeDetailScreen> createState() => _OfficeDetailScreenState();
}

enum _DetailTab { about, notes, public }

class _OfficeDetailScreenState extends State<OfficeDetailScreen> {
  bool _checking = false;
  double? _lastCheckKm;
  bool _aboutExpanded = false;
  _DetailTab _tab = _DetailTab.about;
  late Future<List<PublicVisitNote>> _publicNotesFuture;

  OfficeWithStatus get office => widget.office;

  @override
  void initState() {
    super.initState();
    _publicNotesFuture = VisitsRemoteStore(Supabase.instance.client).fetchPublicVisitsForOffice(office.id);
  }

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
        final isPlanned = controller.plannedIds.contains(office.id);
        return Scaffold(
          backgroundColor: AppColors.paper,
          body: SafeArea(
            child: Column(
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 10, bottom: 2),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.lineStrong,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Flexible(
                                    child: Text(
                                      office.name,
                                      style: const TextStyle(
                                        fontFamily: AppFonts.display,
                                        fontWeight: FontWeight.w500,
                                        fontSize: 28,
                                        height: 1.1,
                                      ),
                                    ),
                                  ),
                                  if (visited) ...[
                                    const SizedBox(width: 6),
                                    const Padding(
                                      padding: EdgeInsets.only(top: 4),
                                      child: Icon(Icons.verified, color: AppColors.visited, size: 22),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: () => Navigator.of(context).maybePop(),
                              icon: const Icon(Icons.close, size: 16),
                              tooltip: 'Close post office details',
                              style: IconButton.styleFrom(
                                backgroundColor: AppColors.card,
                                foregroundColor: AppColors.ink,
                                shape: const CircleBorder(),
                                minimumSize: const Size(32, 32),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                office.district,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: AppColors.muted, fontSize: 14),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Container(width: 1, height: 14, color: AppColors.lineStrong),
                            const SizedBox(width: 10),
                            Text(
                              office.pincode.isEmpty ? 'No pincode' : office.pincode,
                              style: const TextStyle(fontFamily: AppFonts.mono, color: AppColors.muted, fontSize: 13),
                            ),
                            if (office.distanceKm != null) ...[
                              const SizedBox(width: 10),
                              Container(width: 1, height: 14, color: AppColors.lineStrong),
                              const SizedBox(width: 10),
                              Text(
                                formatDistance(office.distanceKm!),
                                style: const TextStyle(
                                  fontFamily: AppFonts.mono,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _StatusPill(status: office.status, stampedOn: visit != null ? formatVisitDate(visit.visitedAt) : null),
                                  const SizedBox(height: 8),
                                  if (visited)
                                    const Text(
                                      'Stamped in your passport.',
                                      style: TextStyle(fontSize: 13),
                                    )
                                  else
                                    _ProximityButton(
                                      km: _lastCheckKm ?? office.distanceKm,
                                      checking: _checking,
                                      onCheckDistance: office.hasCoordinates ? _checkIfHere : null,
                                    ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            StampThumb(path: office.stampImagePath, natural: true),
                          ],
                        ),
                        if (!visited) _ProximityWarning(km: _lastCheckKm ?? office.distanceKm),
                        const SizedBox(height: 14),
                        _DetailTabBar(
                          active: _tab,
                          hasNote: (visit?.note.isNotEmpty ?? false),
                          onChanged: (t) => setState(() => _tab = t),
                        ),
                        const SizedBox(height: 14),
                        switch (_tab) {
                          _DetailTab.about => _AboutTab(
                              office: office,
                              expanded: _aboutExpanded,
                              onExpand: () => setState(() => _aboutExpanded = true),
                            ),
                          _DetailTab.notes => _NotesTab(
                              visit: visit,
                              onEdit: () => showVisitDialog(context, officeId: office.id, officeName: office.name),
                            ),
                          _DetailTab.public => _PublicTab(
                              future: _publicNotesFuture,
                              visited: visited,
                              onWriteNote: () => showVisitDialog(context, officeId: office.id, officeName: office.name),
                            ),
                        },
                        if (controller.lastError != null) ...[
                          const SizedBox(height: 12),
                          Text(controller.lastError!, style: const TextStyle(color: AppColors.postalDark, fontSize: 13)),
                        ],
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
                  child: Column(
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _GradientActionButton(
                              label: visited ? 'Share stamp' : 'Stamp it',
                              icon: visited ? Icons.ios_share : Icons.check,
                              onTap: visited ? _shareStamp : () => _stampIt(controller),
                            ),
                          ),
                          const SizedBox(width: 12),
                          if (visited)
                            _RoundAction(
                              icon: Icons.menu_book_outlined,
                              label: 'Stamps',
                              onTap: () => Navigator.of(context).maybePop(),
                            )
                          else
                            _RoundAction(
                              icon: isPlanned ? Icons.flag : Icons.flag_outlined,
                              label: isPlanned ? 'Planned' : 'Plan',
                              iconColor: AppColors.focus,
                              selected: isPlanned,
                              onTap: () {
                                hapticSelectionChanged();
                                controller.togglePlanned(office.id);
                              },
                            ),
                          if (office.hasCoordinates) ...[
                            const SizedBox(width: 12),
                            _RoundAction(
                              icon: Icons.navigation_outlined,
                              label: 'Route',
                              onTap: () => _openDirections(context),
                            ),
                          ],
                        ],
                      ),
                      TextButton.icon(
                        onPressed: () => showContributeSheet(context, office: office),
                        icon: const Icon(Icons.error_outline, size: 14, color: AppColors.muted),
                        label: const Text(
                          'Something wrong? Help improve this',
                          style: TextStyle(color: AppColors.muted, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Small spelled-out-status pill — port of StatusBadge.tsx. Status is never
/// conveyed by color alone.
class _StatusPill extends StatelessWidget {
  final OfficeStatus status;
  final String? stampedOn;
  const _StatusPill({required this.status, required this.stampedOn});

  @override
  Widget build(BuildContext context) {
    final (bg, fg, label) = switch (status) {
      OfficeStatus.visited => (AppColors.visited.withValues(alpha: 0.12), AppColors.visitedInk, 'STAMPED'),
      OfficeStatus.planned => (AppColors.focus.withValues(alpha: 0.1), AppColors.focus, 'PLANNED'),
      OfficeStatus.unvisited => (AppColors.warn.withValues(alpha: 0.12), AppColors.warn, 'NOT YET STAMPED'),
    };
    final suffix = status == OfficeStatus.visited && stampedOn != null ? ' $stampedOn' : '';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          status == OfficeStatus.visited
              ? Icon(Icons.check, size: 13, color: fg)
              : Container(width: 6, height: 6, decoration: BoxDecoration(color: fg, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(
            '$label$suffix',
            style: TextStyle(color: fg, fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1.2),
          ),
        ],
      ),
    );
  }
}

/// The "Check if you're here" control — port of ProximityButton in
/// OfficeDetail.tsx: "here" shows a confirmation line, unknown shows the
/// glass check-in button, away shows nothing (the warning banner below
/// carries that case instead).
class _ProximityButton extends StatelessWidget {
  final double? km;
  final bool checking;
  final VoidCallback? onCheckDistance;
  const _ProximityButton({required this.km, required this.checking, required this.onCheckDistance});

  @override
  Widget build(BuildContext context) {
    final state = proximity(km);
    if (state == Proximity.here && km != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.check, size: 15, color: AppColors.visitedInk),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              "You're here · ${formatShortDistance(km!)} away",
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: AppColors.visitedInk, fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
        ],
      );
    }
    if (onCheckDistance == null) return const SizedBox.shrink();
    return Material(
      type: MaterialType.transparency,
      child: InkWell(
        onTap: checking ? null : onCheckDistance,
        customBorder: const StadiumBorder(),
        child: GlassCard(
          borderRadius: BorderRadius.circular(999),
          padding: const EdgeInsets.fromLTRB(10, 9, 16, 9),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              checking
                  ? const SizedBox(width: 15, height: 15, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.my_location, size: 15, color: AppColors.postal),
              const SizedBox(width: 8),
              const Text("Check if you're here", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Shown below the status row only when far away and unvisited — port of
/// ProximityWarning.
class _ProximityWarning extends StatelessWidget {
  final double? km;
  const _ProximityWarning({required this.km});

  @override
  Widget build(BuildContext context) {
    if (proximity(km) != Proximity.away || km == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(top: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.warnSoft, borderRadius: BorderRadius.circular(16)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline, size: 16, color: AppColors.warn),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: const TextStyle(color: AppColors.warn, fontSize: 13, height: 1.3),
                children: [
                  TextSpan(text: "You're ${formatDistance(km!)} away. ", style: const TextStyle(fontWeight: FontWeight.bold)),
                  const TextSpan(text: 'Stamps are meant to be collected in person. You can still log a past visit.'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// About · Notes · Public — port of the tab bar in OfficeDetail.tsx.
class _DetailTabBar extends StatelessWidget {
  final _DetailTab active;
  final bool hasNote;
  final ValueChanged<_DetailTab> onChanged;
  const _DetailTabBar({required this.active, required this.hasNote, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    Widget tab(_DetailTab value, String label, {bool badge = false}) {
      final isActive = active == value;
      return Expanded(
        child: InkWell(
          onTap: () => onChanged(value),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(color: isActive ? AppColors.ink : Colors.transparent, width: 2.5),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                    color: isActive ? AppColors.ink : AppColors.muted,
                  ),
                ),
                if (badge) ...[
                  const SizedBox(width: 4),
                  Container(
                    width: 16,
                    height: 16,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: AppColors.ink.withValues(alpha: 0.1), shape: BoxShape.circle),
                    child: const Text('1', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0x0F16204F))),
      ),
      child: Row(
        children: [
          tab(_DetailTab.about, 'About'),
          tab(_DetailTab.notes, 'Notes', badge: hasNote),
          tab(_DetailTab.public, 'Public'),
        ],
      ),
    );
  }
}

/// Centered icon + title + description for every empty tab state.
class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  const _EmptyState({required this.icon, required this.title, required this.description});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: AppColors.ink.withValues(alpha: 0.04), shape: BoxShape.circle),
            child: Icon(icon, size: 26, color: AppColors.muted),
          ),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 4),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 260),
            child: Text(
              description,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.muted, fontSize: 13, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }
}

class _AboutTab extends StatelessWidget {
  final OfficeWithStatus office;
  final bool expanded;
  final VoidCallback onExpand;
  const _AboutTab({required this.office, required this.expanded, required this.onExpand});

  @override
  Widget build(BuildContext context) {
    if (office.district.isEmpty) return const SizedBox.shrink();
    final text = (office.aboutPlace != null && office.aboutPlace!.isNotEmpty)
        ? office.aboutPlace!
        : 'A philatelic post office in ${office.district} district. Visit to collect its unique postmark cancellation stamp in your passport.';
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.ink.withValues(alpha: 0.025), borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(width: 3, height: 12, color: AppColors.postal, margin: const EdgeInsets.only(right: 6)),
              const Text(
                'ABOUT THIS PLACE',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.4, color: AppColors.muted),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            text,
            maxLines: expanded ? null : 3,
            overflow: expanded ? TextOverflow.visible : TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 14, height: 1.5),
          ),
          if (!expanded) ...[
            const SizedBox(height: 4),
            GestureDetector(
              onTap: onExpand,
              child: const Text('Read more', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF2F4AA8))),
            ),
          ],
        ],
      ),
    );
  }
}

class _NotesTab extends StatelessWidget {
  final Visit? visit;
  final VoidCallback onEdit;
  const _NotesTab({required this.visit, required this.onEdit});

  @override
  Widget build(BuildContext context) {
    final v = visit;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (v == null)
          const _EmptyState(
            icon: Icons.sticky_note_2_outlined,
            title: 'No notes yet',
            description: 'Visit this office and stamp your passport to start adding notes and photos.',
          )
        else if (v.note.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.ink.withValues(alpha: 0.02),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.ink.withValues(alpha: 0.06)),
            ),
            child: Text(v.note, style: const TextStyle(fontSize: 14, height: 1.5)),
          )
        else
          const _EmptyState(
            icon: Icons.sticky_note_2_outlined,
            title: 'No notes yet',
            description: 'Add a note or photo from your visit — only you can see it unless you make it public.',
          ),
        if (v != null) ...[
          const SizedBox(height: 8),
          GestureDetector(
            onTap: onEdit,
            child: Text(
              (v.note.isNotEmpty || v.photoPath != null) ? 'Edit note & photo' : 'Add a note',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF2F4AA8)),
            ),
          ),
        ],
      ],
    );
  }
}

class _PublicTab extends StatelessWidget {
  final Future<List<PublicVisitNote>> future;
  final bool visited;
  final VoidCallback onWriteNote;
  const _PublicTab({required this.future, required this.visited, required this.onWriteNote});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FutureBuilder<List<PublicVisitNote>>(
          future: future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(
                  child: Text('Loading public notes…', style: TextStyle(color: AppColors.muted, fontSize: 13)),
                ),
              );
            }
            final notes = snapshot.data ?? const [];
            if (notes.isEmpty) {
              return const _EmptyState(
                icon: Icons.public_outlined,
                title: 'No public notes yet',
                description: 'Tips and photos other collectors choose to share publicly will show up here.',
              );
            }
            return Column(children: [for (final n in notes) _PublicNoteRow(note: n)]);
          },
        ),
        const SizedBox(height: 10),
        if (visited)
          Material(
            type: MaterialType.transparency,
            child: InkWell(
              onTap: onWriteNote,
              customBorder: const StadiumBorder(),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: AppColors.ink.withValues(alpha: 0.1), width: 1.5),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.public, size: 16, color: AppColors.postal),
                    SizedBox(width: 6),
                    Text('Write a public note', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.postal)),
                  ],
                ),
              ),
            ),
          )
        else
          const Padding(
            padding: EdgeInsets.only(top: 2),
            child: Text(
              'Stamp your passport here to write a public note.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.muted, fontSize: 13),
            ),
          ),
      ],
    );
  }
}

/// One public note: Google-review style — avatar, name, date, text, optional
/// photo. Port of PublicNoteRow in OfficeDetail.tsx.
class _PublicNoteRow extends StatelessWidget {
  final PublicVisitNote note;
  const _PublicNoteRow({required this.note});

  @override
  Widget build(BuildContext context) {
    final name = (note.authorName?.trim().isNotEmpty ?? false) ? note.authorName!.trim() : 'A collector';
    final initial = name.substring(0, 1).toUpperCase();
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0x0F16204F))),
      ),
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
          const SizedBox(width: 12),
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
                const SizedBox(height: 4),
                Text(note.note, style: const TextStyle(fontSize: 14, height: 1.4)),
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
      future: Supabase.instance.client.storage.from(VisitsRemoteStore.photoBucket).createSignedUrl(path, 60 * 60),
      builder: (context, snapshot) {
        final url = snapshot.data;
        if (url == null) return const SizedBox.shrink();
        return ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.network(url, height: 128, width: double.infinity, fit: BoxFit.cover),
        );
      },
    );
  }
}

/// The main "Stamp it"/"Share stamp" pill — port of its gradient-red CTA.
class _GradientActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;
  const _GradientActionButton({required this.label, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const StadiumBorder(),
        child: Ink(
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFE0334A), AppColors.postal],
            ),
            boxShadow: [
              BoxShadow(color: AppColors.postal.withValues(alpha: 0.35), blurRadius: 18, offset: const Offset(0, 8)),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 20, color: Colors.white),
              const SizedBox(width: 10),
              Text(
                label.toUpperCase(),
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 1.2),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A small round glass button with a label underneath — port of the
/// Plan/Stamps/Route round actions beside the main CTA.
class _RoundAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool selected;
  final Color? iconColor;
  const _RoundAction({required this.icon, required this.label, required this.onTap, this.selected = false, this.iconColor});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Material(
          type: MaterialType.transparency,
          child: InkWell(
            onTap: onTap,
            customBorder: const CircleBorder(),
            child: Container(
              decoration: selected
                  ? BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.focus, width: 2))
                  : null,
              child: GlassCard(
                borderRadius: BorderRadius.circular(999),
                padding: const EdgeInsets.all(14),
                child: Icon(icon, size: 22, color: iconColor ?? AppColors.ink),
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label.toUpperCase(),
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.0, color: AppColors.muted),
        ),
      ],
    );
  }
}
