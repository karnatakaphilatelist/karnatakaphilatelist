import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_shell.dart' show goToTab;
import '../../core/counter_hours.dart';
import '../../core/date.dart';
import '../../core/geo.dart';
import '../../core/haptics.dart';
import '../../core/in_app_review.dart';
import '../../core/share.dart';
import '../../core/states.dart';
import '../../data/visits_remote_store.dart';
import '../../data/visits_repository.dart';
import '../../models/post_office.dart';
import '../../models/visit.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_icons.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/stamp_thumb.dart';
import 'contribute_sheet.dart';
import 'stamped_sheet.dart';
import 'visit_dialog.dart';

String _ordinal(int n) {
  final rest = n % 100;
  if (rest >= 11 && rest <= 13) return '${n}th';
  final i = n % 10;
  return '$n${i > 3 ? 'th' : const ['th', 'st', 'nd', 'rd'][i]}';
}

/// Headline size follows the name's length so long names wrap to two lines at most.
(double, double) _headline(String name) {
  if (name.length <= 10) return (48, 52);
  if (name.length <= 16) return (38, 42);
  return (30, 34);
}

enum _DetailTab { about, notes, public }

const _linkBlue = AppColors.pinBlue;

/// Port of src/components/office/OfficeDetail.tsx on phones: a `.kp-glass-panel`
/// docked at the bottom of Explore, over the map (the tab bar hides while it's
/// open), sized to its content up to 85% of the screen. It rises in (250ms
/// ease-out) and falls out (200ms ease-in) like the web's animate-rise/fall.
class OfficeDetailPanel extends StatefulWidget {
  final OfficeWithStatus office;
  final VoidCallback onClose;
  final Future<void> Function(int officeId) onMarkVisited;
  final VoidCallback? onCheckDistance;
  final int? collected;
  final int? total;
  final String? stateName;
  const OfficeDetailPanel({
    super.key,
    required this.office,
    required this.onClose,
    required this.onMarkVisited,
    this.onCheckDistance,
    this.collected,
    this.total,
    this.stateName,
  });

  @override
  State<OfficeDetailPanel> createState() => _OfficeDetailPanelState();
}

class _OfficeDetailPanelState extends State<OfficeDetailPanel> with SingleTickerProviderStateMixin {
  bool _aboutExpanded = false;
  _DetailTab _tab = _DetailTab.about;
  late Future<List<PublicVisitNote>> _publicNotes;
  late final AnimationController _anim = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 250),
    reverseDuration: const Duration(milliseconds: 200),
  )..forward();
  bool _closing = false;

  OfficeWithStatus get office => widget.office;

  @override
  void initState() {
    super.initState();
    _publicNotes = VisitsRemoteStore(Supabase.instance.client).fetchPublicVisitsForOffice(office.id);
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  Future<void> _close() async {
    if (_closing) return;
    _closing = true;
    await _anim.reverse();
    widget.onClose();
  }

  Future<void> _share() async {
    final where = widget.stateName != null ? ' in ${widget.stateName}' : '';
    final result = await shareText(
      text: 'I just stamped ${office.name}$where on Philatrail. https://philatrail.com',
      subject: 'Philatrail',
    );
    if (result == ShareOutcome.failed && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not share. Please try again.')));
    }
  }

  void _editVisit() => showVisitDialog(context, officeId: office.id, officeName: office.name);

  Future<void> _openDirections() async {
    if (!office.hasCoordinates) return;
    await launchUrl(
      Uri.parse('https://www.google.com/maps/dir/?api=1&destination=${office.lat},${office.lng}'),
      mode: LaunchMode.externalApplication,
    );
  }

  @override
  Widget build(BuildContext context) {
    final controller = visitsControllerOf(context);
    final maxHeight = MediaQuery.of(context).size.height * 0.85;
    final curve = CurvedAnimation(parent: _anim, curve: Curves.easeOut, reverseCurve: Curves.easeIn);
    return AnimatedBuilder(
      animation: Listenable.merge([controller, curve]),
      builder: (context, _) {
        final visit = controller.visits[office.id];
        final isPlanned = office.status == OfficeStatus.planned;
        return Opacity(
          opacity: curve.value,
          child: Transform.translate(
            offset: Offset(0, 24 * (1 - curve.value)),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxHeight: maxHeight),
              child: GlassCard(
                kind: GlassKind.panel,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      margin: const EdgeInsets.only(top: 12),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(color: AppColors.handle, borderRadius: BorderRadius.circular(999)),
                    ),
                    Flexible(
                      child: SingleChildScrollView(
                        padding: EdgeInsets.fromLTRB(16, 12, 16, 24 + MediaQuery.of(context).padding.bottom),
                        child: _content(visit),
                      ),
                    ),
                    _actions(controller, visit != null, isPlanned),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _content(Visit? visit) {
    final (fontSize, lineHeight) = _headline(office.name);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Name row + verified badge + close ──
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Transform.translate(
                        offset: const Offset(-2, 0),
                        child: Text(
                          office.name.toUpperCase(),
                          style: TextStyle(
                            fontSize: fontSize,
                            height: lineHeight / fontSize,
                            fontWeight: FontWeight.w500,
                            letterSpacing: fontSize * 0.01,
                            color: AppColors.ink,
                          ),
                        ),
                      ),
                    ),
                    if (visit != null) ...[
                      const SizedBox(width: 8),
                      const Padding(padding: EdgeInsets.only(top: 10), child: _VerifiedBadge()),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Semantics(
                button: true,
                label: 'Close post office details',
                excludeSemantics: true,
                child: GestureDetector(
                  onTap: _close,
                  child: const GlassCard(
                    borderRadius: BorderRadius.all(Radius.circular(999)),
                    child: SizedBox(
                      width: 32,
                      height: 32,
                      child: Center(child: AppIconView(AppIcon.close, size: 11, color: AppColors.ink, strokeWidth: 2.8)),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        // ── Meta: district | pincode | distance ──
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Row(
            children: [
              Flexible(
                child: Text(office.district,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
              ),
              const SizedBox(width: 12),
              Container(width: 1, height: 14, color: AppColors.goldRule),
              const SizedBox(width: 12),
              Text(
                office.pincode.isEmpty ? 'No pincode' : office.pincode,
                style: const TextStyle(fontFamily: AppFonts.mono, fontSize: 14, height: 20 / 14, letterSpacing: 14 * 0.08, color: AppColors.muted),
              ),
              if (office.distanceKm != null) ...[
                const SizedBox(width: 12),
                Container(width: 1, height: 14, color: AppColors.goldRule),
                const SizedBox(width: 12),
                Text(
                  formatDistance(office.distanceKm!).toUpperCase(),
                  style: const TextStyle(fontFamily: AppFonts.mono, fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.muted),
                ),
              ],
            ],
          ),
        ),
        const _CounterHoursLine(),
        // ── Status row: badge + proximity/progress | PPC image ──
        Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(minWidth: 150),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      StatusBadge(status: office.status, stampedOn: visit != null ? formatVisitDate(visit.visitedAt) : null),
                      const SizedBox(height: 8),
                      if (visit != null)
                        _stampedLine()
                      else
                        _ProximityButton(km: office.distanceKm, onCheckDistance: widget.onCheckDistance),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Transform.translate(
                offset: const Offset(0, -4),
                child: StampThumb(path: office.stampImagePath, natural: true, hero: true),
              ),
            ],
          ),
        ),
        if (visit == null) _ProximityWarning(km: office.distanceKm),
        // ── Tab bar: About · Notes · Public ──
        Padding(
          padding: const EdgeInsets.only(top: 14),
          child: _TabBar(
            active: _tab,
            noteBadge: visit != null && visit.note.isNotEmpty,
            onChanged: (t) => setState(() => _tab = t),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 14),
          child: switch (_tab) {
            _DetailTab.about => _about(),
            _DetailTab.notes => _notes(visit),
            _DetailTab.public => _public(visit != null),
          },
        ),
      ],
    );
  }

  Widget _stampedLine() {
    final c = widget.collected;
    final t = widget.total;
    const base = TextStyle(fontSize: 12, height: 16 / 12, color: AppColors.ink);
    if (c == null || t == null || c == 0 || t == 0) return const Text('Stamped in your passport.', style: base);
    final where = widget.stateName != null ? ' in ${widget.stateName}' : '';
    final left = t - c < 0 ? 0 : t - c;
    return Text.rich(
      TextSpan(style: base, children: [
        const TextSpan(text: 'Your '),
        TextSpan(text: _ordinal(c), style: const TextStyle(fontWeight: FontWeight.w600)),
        TextSpan(text: ' stamp$where. $left to go.'),
      ]),
    );
  }

  Widget _about() {
    if (office.district.isEmpty) return const SizedBox.shrink();
    final text = (office.aboutPlace?.isNotEmpty ?? false)
        ? office.aboutPlace!
        : 'A philatelic post office in ${office.district} district, Karnataka. Visit to collect its unique postmark cancellation stamp in your passport.';
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.ink.withValues(alpha: 0.025), borderRadius: BorderRadius.circular(12)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SectionLabel('About this place'),
          const SizedBox(height: 8),
          Text(
            text,
            maxLines: _aboutExpanded ? null : 3,
            overflow: _aboutExpanded ? null : TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 14, height: 21 / 14, color: AppColors.ink),
          ),
          if (!_aboutExpanded)
            GestureDetector(
              onTap: () => setState(() => _aboutExpanded = true),
              child: const Padding(
                padding: EdgeInsets.only(top: 4),
                child: Text('Read more', style: TextStyle(fontSize: 13, height: 1.5, fontWeight: FontWeight.w600, color: _linkBlue)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _notes(Visit? visit) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (visit == null)
          const _EmptyState(
            icon: AppIcon.note,
            title: 'No notes yet',
            description: 'Visit this office and stamp your passport to start adding notes and photos.',
          )
        else if (visit.note.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.ink.withValues(alpha: 0.02),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.ink.withValues(alpha: 0.06)),
            ),
            child: Text(visit.note, style: const TextStyle(fontSize: 14, height: 21 / 14, color: AppColors.ink)),
          )
        else
          const _EmptyState(
            icon: AppIcon.note,
            title: 'No notes yet',
            description: 'Add a note or photo from your visit — only you can see it unless you make it public.',
          ),
        if (visit != null)
          GestureDetector(
            onTap: _editVisit,
            child: Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                (visit.note.isNotEmpty || visit.photoPath != null) ? 'Edit note & photo' : 'Add a note',
                style: const TextStyle(fontSize: 13, height: 1.5, fontWeight: FontWeight.w600, color: _linkBlue),
              ),
            ),
          ),
      ],
    );
  }

  Widget _public(bool visited) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FutureBuilder<List<PublicVisitNote>>(
          future: _publicNotes,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Text('Loading public notes…', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
              );
            }
            final notes = snapshot.data ?? const <PublicVisitNote>[];
            if (notes.isEmpty) {
              return const _EmptyState(
                icon: AppIcon.globe,
                title: 'No public notes yet',
                description: 'Tips and photos other collectors choose to share publicly will show up here.',
              );
            }
            return Column(children: [
              for (var i = 0; i < notes.length; i++) _PublicNoteRow(note: notes[i], last: i == notes.length - 1),
            ]);
          },
        ),
        if (visited)
          GestureDetector(
            onTap: _editVisit,
            child: Container(
              margin: const EdgeInsets.only(top: 12),
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppColors.ink.withValues(alpha: 0.1), width: 1.5),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AppIconView(AppIcon.globe, size: 16, color: AppColors.postal),
                  SizedBox(width: 6),
                  Text('Write a public note', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.postal)),
                ],
              ),
            ),
          )
        else
          const Padding(
            padding: EdgeInsets.only(top: 12),
            child: Text('Stamp your passport here to write a public note.',
                textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: AppColors.muted)),
          ),
      ],
    );
  }

  Widget _actions(VisitsController controller, bool visited, bool isPlanned) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: visited
                    ? RedCtaButton(label: 'Share stamp', icon: AppIcon.share, onTap: _share, iconGap: 10)
                    : RedCtaButton(label: 'Stamp it', icon: AppIcon.check, onTap: () => widget.onMarkVisited(office.id)),
              ),
              const SizedBox(width: 12),
              if (visited)
                _RoundAction(icon: AppIcon.note, label: 'Stamps', onTap: () => goToTab(context, 1))
              else
                _RoundAction(
                  icon: AppIcon.flag,
                  iconColor: _linkBlue,
                  label: isPlanned ? 'Planned' : 'Plan',
                  ring: isPlanned,
                  onTap: () {
                    hapticSelectionChanged();
                    controller.togglePlanned(office.id);
                  },
                ),
              if (office.hasCoordinates) ...[
                const SizedBox(width: 12),
                _RoundAction(icon: AppIcon.navigation, label: 'Route', onTap: _openDirections),
              ],
            ],
          ),
          GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => showContributeSheet(context, office: office),
            child: const Padding(
              padding: EdgeInsets.only(top: 8),
              child: SizedBox(
                width: double.infinity,
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AppIconView(AppIcon.alert, size: 14, color: AppColors.muted),
                      SizedBox(width: 6),
                      Text('Something wrong? Help improve this', style: TextStyle(fontSize: 13, height: 1.5, color: AppColors.muted)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Port of StatusBadge.tsx — status always spelled out, never colour alone.
class StatusBadge extends StatelessWidget {
  final OfficeStatus status;
  final String? stampedOn;
  const StatusBadge({super.key, required this.status, this.stampedOn});

  @override
  Widget build(BuildContext context) {
    final (bg, fg, label) = switch (status) {
      OfficeStatus.unvisited => (AppColors.unstampedGold.withValues(alpha: 0.12), AppColors.unstampedGold, 'NOT YET STAMPED'),
      OfficeStatus.planned => (AppColors.pinBlue.withValues(alpha: 0.1), AppColors.pinBlue, 'PLANNED'),
      OfficeStatus.visited => (AppColors.stampGreen.withValues(alpha: 0.12), AppColors.visitedInk, 'STAMPED'),
    };
    final suffix = status == OfficeStatus.visited && stampedOn != null ? ' ${stampedOn!.toUpperCase()}' : '';
    return Container(
      constraints: const BoxConstraints(minHeight: 24),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (status == OfficeStatus.visited)
            AppIconView(AppIcon.check, size: 14, color: fg, strokeWidth: 3.2)
          else
            Container(width: 6, height: 6, decoration: BoxDecoration(color: fg, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text('$label$suffix',
              style: TextStyle(fontSize: 11, height: 14 / 11, fontWeight: FontWeight.w700, letterSpacing: 11 * 0.14, color: fg)),
        ],
      ),
    );
  }
}

/// A section label with the small postal-red accent bar.
class SectionLabel extends StatelessWidget {
  final String text;
  const SectionLabel(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 3, height: 12, decoration: BoxDecoration(color: AppColors.postal, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 6),
        Text(text.toUpperCase(),
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 11 * 0.14, color: AppColors.muted)),
      ],
    );
  }
}

/// Instagram-style green starburst, only for visited offices.
class _VerifiedBadge extends StatelessWidget {
  const _VerifiedBadge();

  static const _svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">'
      '<path d="M12 1l2.09 3.07L17.5 3l.41 3.5L21.4 8l-1.6 3.12L21.4 14.2l-3.5 1.52L17.5 19.2l-3.41-1.07L12 21.2l-2.09-3.07L6.5 19.2l-.41-3.48L2.6 14.2l1.6-3.08L2.6 8l3.49-1.5L6.5 3l3.41 1.07L12 1z" fill="#14653f"/>'
      '<path d="M8.5 12.5l2 2 5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  @override
  Widget build(BuildContext context) =>
      Semantics(label: 'Stamped — verified', child: SvgPicture.string(_svg, width: 24, height: 24));
}

class _TabBar extends StatelessWidget {
  final _DetailTab active;
  final bool noteBadge;
  final ValueChanged<_DetailTab> onChanged;
  const _TabBar({required this.active, required this.noteBadge, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    Widget tab(_DetailTab value, String label, {bool badge = false}) {
      final on = active == value;
      return Expanded(
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => onChanged(value),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 10, bottom: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(label,
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.5,
                          fontWeight: on ? FontWeight.w700 : FontWeight.w600,
                          color: on ? AppColors.ink : AppColors.muted,
                        )),
                    if (badge) ...[
                      const SizedBox(width: 4),
                      Container(
                        height: 18,
                        constraints: const BoxConstraints(minWidth: 18),
                        padding: const EdgeInsets.symmetric(horizontal: 5),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(color: AppColors.ink.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(999)),
                        child: const Text('1', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.ink)),
                      ),
                    ],
                  ],
                ),
              ),
              if (on)
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: -1,
                  child: Container(height: 2.5, decoration: BoxDecoration(color: AppColors.ink, borderRadius: BorderRadius.circular(2))),
                ),
            ],
          ),
        ),
      );
    }

    return DecoratedBox(
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.ink.withValues(alpha: 0.06)))),
      child: Row(children: [
        tab(_DetailTab.about, 'About'),
        tab(_DetailTab.notes, 'Notes', badge: noteBadge),
        tab(_DetailTab.public, 'Public'),
      ]),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final AppIcon icon;
  final String title;
  final String description;
  const _EmptyState({required this.icon, required this.title, required this.description});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: AppColors.ink.withValues(alpha: 0.04), shape: BoxShape.circle),
            child: AppIconView(icon, size: 28, color: AppColors.muted, strokeWidth: 1.5),
          ),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.ink)),
          const SizedBox(height: 4),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 260),
            child: Text(description,
                textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, height: 18 / 13, color: AppColors.muted)),
          ),
        ],
      ),
    );
  }
}

/// "Check if you're here": a confirmation line when at the office, the glass
/// pill when the distance is unknown, nothing when far (the warning covers it).
class _ProximityButton extends StatelessWidget {
  final double? km;
  final VoidCallback? onCheckDistance;
  const _ProximityButton({required this.km, required this.onCheckDistance});

  @override
  Widget build(BuildContext context) {
    final state = proximity(km);
    if (state == Proximity.here && km != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const AppIconView(AppIcon.check, size: 16, color: AppColors.visitedInk, strokeWidth: 3),
          const SizedBox(width: 8),
          Flexible(
            child: Text("You're here · ${formatShortDistance(km!)} away",
                style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.visitedInk)),
          ),
        ],
      );
    }
    if (state == Proximity.away || onCheckDistance == null) return const SizedBox.shrink();
    return GestureDetector(
      onTap: onCheckDistance,
      child: GlassCard(
        borderRadius: const BorderRadius.all(Radius.circular(999)),
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          padding: const EdgeInsets.fromLTRB(10, 10, 16, 10),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppIconView(AppIcon.target, size: 16, color: AppColors.postal),
              SizedBox(width: 8),
              Flexible(
                child: Text("Check if you're here",
                    style: TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProximityWarning extends StatelessWidget {
  final double? km;
  const _ProximityWarning({required this.km});

  @override
  Widget build(BuildContext context) {
    if (proximity(km) != Proximity.away || km == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.warnSoft, borderRadius: BorderRadius.circular(16)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(padding: EdgeInsets.only(top: 2), child: AppIconView(AppIcon.alert, size: 16, color: AppColors.warn)),
          const SizedBox(width: 8),
          Expanded(
            child: Text.rich(
              TextSpan(
                style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.warn),
                children: [
                  TextSpan(text: "You're ${formatDistance(km!)} away.", style: const TextStyle(fontWeight: FontWeight.w700)),
                  const TextSpan(text: ' Stamps are meant to be collected in person. You can still log a past visit.'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PublicNoteRow extends StatelessWidget {
  final PublicVisitNote note;
  final bool last;
  const _PublicNoteRow({required this.note, required this.last});

  @override
  Widget build(BuildContext context) {
    final name = (note.authorName?.trim().isNotEmpty ?? false) ? note.authorName!.trim() : 'A collector';
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        border: last ? null : Border(bottom: BorderSide(color: AppColors.ink.withValues(alpha: 0.06))),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            clipBehavior: Clip.antiAlias,
            alignment: Alignment.center,
            decoration: const BoxDecoration(color: AppColors.postalSoft, shape: BoxShape.circle),
            child: note.authorAvatarUrl != null
                ? Image.network(note.authorAvatarUrl!, width: 36, height: 36, fit: BoxFit.cover)
                : Text(name.substring(0, 1).toUpperCase(),
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.postal)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Flexible(
                      child: Text(name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.ink)),
                    ),
                    const SizedBox(width: 8),
                    Text(formatVisitDate(note.visitedAt), style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(note.note, style: const TextStyle(fontSize: 14, height: 21 / 14, color: AppColors.ink)),
                if (note.photoPath != null)
                  FutureBuilder<String>(
                    future: Supabase.instance.client.storage.from(VisitsRemoteStore.photoBucket).createSignedUrl(note.photoPath!, 3600),
                    builder: (context, snapshot) => snapshot.data == null
                        ? const SizedBox.shrink()
                        : Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(snapshot.data!, height: 128, width: double.infinity, fit: BoxFit.cover),
                            ),
                          ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// The red gradient pill CTA used across the app ("Stamp it", "Next",
/// "Sign in", "Continue with email"): 56px, #e0334a → postal, white 16px bold
/// uppercase with 0.14em tracking, a white inset top highlight and a red glow.
class RedCtaButton extends StatelessWidget {
  final String label;
  final AppIcon? icon;
  final VoidCallback? onTap;
  final double iconGap;
  final double letterSpacingEm;
  final bool uppercase;
  const RedCtaButton({
    super.key,
    required this.label,
    this.icon,
    this.onTap,
    this.iconGap = 8,
    this.letterSpacingEm = 0.14,
    this.uppercase = true,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [AppColors.postalTop, AppColors.postal],
            ),
            boxShadow: [cssShadow(0, 8, 18, -8, AppColors.postal.withValues(alpha: 0.7))],
          ),
          foregroundDecoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            border: const Border(top: BorderSide(color: Color(0x59FFFFFF), width: 1.5)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                AppIconView(icon!, size: 20, color: Colors.white, strokeWidth: 2.8),
                SizedBox(width: iconGap),
              ],
              Text(
                uppercase ? label.toUpperCase() : label,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 16 * letterSpacingEm,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A 56px round glass button with an 11px uppercase label under it.
class _RoundAction extends StatelessWidget {
  final AppIcon icon;
  final String label;
  final VoidCallback onTap;
  final Color iconColor;
  final bool ring;
  const _RoundAction({required this.icon, required this.label, required this.onTap, this.iconColor = AppColors.ink, this.ring = false});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 56,
      child: Column(
        children: [
          Semantics(
            button: true,
            label: label,
            excludeSemantics: true,
            child: GestureDetector(
              onTap: onTap,
              child: Container(
                decoration: ring
                    ? BoxDecoration(shape: BoxShape.circle, boxShadow: [const BoxShadow(color: AppColors.pinBlue, spreadRadius: 2)])
                    : null,
                child: GlassCard(
                  borderRadius: const BorderRadius.all(Radius.circular(999)),
                  child: SizedBox(width: 56, height: 56, child: Center(child: AppIconView(icon, size: 22, color: iconColor))),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(label.toUpperCase(),
              style: const TextStyle(fontSize: 11, height: 12 / 11, fontWeight: FontWeight.w600, letterSpacing: 11 * 0.1, color: AppColors.muted)),
        ],
      ),
    );
  }
}

/// Opens one office's detail outside Explore (kept for any route that still
/// pushes it): the same docked panel, over a sand backdrop like the map's.
class OfficeDetailScreen extends StatelessWidget {
  final OfficeWithStatus office;
  const OfficeDetailScreen({super.key, required this.office});

  @override
  Widget build(BuildContext context) {
    final controller = visitsControllerOf(context);
    final officesController = officesControllerOf(context);
    return Scaffold(
      backgroundColor: AppColors.sand,
      body: AnimatedBuilder(
        animation: controller,
        builder: (context, _) {
          final stateOffices = officesController.offices.where((o) => o.state == office.state).toList();
          final collected = stateOffices.where((o) => controller.visits.containsKey(o.id)).length;
          final live = OfficeWithStatus.from(
            office,
            status: controller.visits.containsKey(office.id)
                ? OfficeStatus.visited
                : (controller.plannedIds.contains(office.id) ? OfficeStatus.planned : OfficeStatus.unvisited),
            distanceKm: office.distanceKm,
          );
          return Align(
            alignment: Alignment.bottomCenter,
            child: OfficeDetailPanel(
              office: live,
              onClose: () => Navigator.of(context).maybePop(),
              collected: collected,
              total: stateOffices.length,
              stateName: stateName(office.state),
              onMarkVisited: (id) async {
                final saved = await controller.markVisited(id);
                if (!saved || !context.mounted) return;
                hapticCollect();
                unawaited(maybeRequestReview(controller.visits.length));
                await showStampedSheet(
                  context,
                  office: OfficeWithStatus.from(office, status: OfficeStatus.visited, distanceKm: office.distanceKm),
                  collected: collected + 1,
                  total: stateOffices.length,
                );
              },
            ),
          );
        },
      ),
    );
  }
}


/// Whether the counter is probably open now (typical hours, see
/// core/counter_hours.dart). Refreshes each minute.
class _CounterHoursLine extends StatefulWidget {
  const _CounterHoursLine();

  @override
  State<_CounterHoursLine> createState() => _CounterHoursLineState();
}

class _CounterHoursLineState extends State<_CounterHoursLine> {
  late CounterStatus _status = counterStatus(DateTime.now());
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(minutes: 1), (_) {
      if (mounted) setState(() => _status = counterStatus(DateTime.now()));
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = switch (_status.state) {
      CounterState.open => AppColors.stampGreen,
      CounterState.closed => AppColors.muted,
      _ => AppColors.warn,
    };
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 7),
            child: Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_status.label, style: const TextStyle(fontSize: 13, height: 20 / 13, color: AppColors.muted)),
                Text('Typical hours; check locally before a long trip.',
                    style: TextStyle(fontSize: 12, height: 16 / 12, color: AppColors.muted.withValues(alpha: 0.8))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
