import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_shell.dart';
import '../../core/constants.dart';
import '../../core/date.dart';
import '../../core/states.dart';
import '../../data/auth_controller.dart';
import '../../data/learn_articles.dart';
import '../../data/state_controller.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/account_avatar.dart';
import '../../widgets/app_icons.dart';
import '../../widgets/app_sheet.dart';
import '../../widgets/dashed_border.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/postal_texture.dart';
import '../../widgets/postmark.dart';
import '../auth/sign_in_sheet.dart';
import '../explore/explore_screen.dart' show exploreOpenOffice, exploreOpenDistrict;
import '../learn/article_screen.dart';
import '../office/visit_dialog.dart';
import 'district_progress.dart';
import 'share_progress_sheet.dart';
import 'stamp_detail_sheet.dart';

enum _StampFilter { all, stamped, togo }

const _kicker = TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w700, letterSpacing: 12 * 0.18, color: AppColors.ink);
const _upNextCount = 3;

/// Port of src/components/passport/PassportView.tsx.
class PassportScreen extends StatefulWidget {
  const PassportScreen({super.key});

  @override
  State<PassportScreen> createState() => _PassportScreenState();
}

class _PassportScreenState extends State<PassportScreen> {
  bool _showAll = false;
  _StampFilter _stampFilter = _StampFilter.all;

  void _openOffice(int id) {
    exploreOpenOffice.value = id;
    goToTab(context, 0);
  }

  @override
  Widget build(BuildContext context) {
    final officesController = officesControllerOf(context);
    final stateController = stateControllerOf(context);
    final visitsController = visitsControllerOf(context);
    final auth = authControllerOf(context);

    return AnimatedBuilder(
      animation: Listenable.merge([officesController, stateController, visitsController, auth]),
      builder: (context, _) {
        if (officesController.loading || !visitsController.isReady) {
          return const Scaffold(
            backgroundColor: AppColors.paper,
            body: Center(child: Text('Loading your passport…', style: TextStyle(fontSize: 16, color: AppColors.muted))),
          );
        }
        final states = stateController.statesFor(officesController.offices);
        final stateCode = stateController.stateCodeFor(officesController.offices);
        final offices = stateController.officesFor(officesController.offices);
        final visits = visitsController.visits;
        final total = offices.length;
        final visited = offices.where((o) => visits.containsKey(o.id)).toList();
        final upNext = offices.where((o) => !visits.containsKey(o.id)).take(_upNextCount).toList();

        return Scaffold(
          backgroundColor: AppColors.paper,
          body: _showAll
              ? _buildShowAll(offices, visited, total, stateCode)
              : _buildMain(offices, visited, upNext, total, states, stateCode, stateController, auth),
        );
      },
    );
  }

  Widget _buildMain(
    List<PostOffice> offices,
    List<PostOffice> visited,
    List<PostOffice> upNext,
    int total,
    List<StateOption> states,
    String stateCode,
    StateController stateController,
    AuthController auth,
  ) {
    final visits = visitsControllerOf(context).visits;
    final toGo = total - visited.length;
    final fraction = total > 0 ? (visited.length / total).clamp(visited.isNotEmpty ? 0.04 : 0.0, 1.0) : 0.0;
    final safeTop = MediaQuery.of(context).padding.top;

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        // ── Red header ──
        PostalTexture(
          borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
          child: Padding(
            padding: EdgeInsets.fromLTRB(16, safeTop + 24, 16, 24),
            child: DefaultTextStyle.merge(
              style: const TextStyle(color: Colors.white),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(
                    height: 40,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('PHILATRAIL',
                            style: TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w800, letterSpacing: 12 * 0.22, color: Colors.white)),
                        AccountAvatarButton(onWhite: true),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Opacity(
                        opacity: 0.85,
                        child: Text('MY PASSPORT', style: _kicker.copyWith(color: Colors.white)),
                      ),
                      const SizedBox(width: 14),
                      Container(width: 1, height: 16, color: AppColors.goldOnRed),
                      const SizedBox(width: 14),
                      GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () => showShareProgressSheet(
                          context,
                          stamped: visited.length,
                          total: total,
                          stateName: stateName(stateCode),
                          onResult: (_) {},
                        ),
                        // `-my-2.5 py-2.5`: a taller touch target that takes no layout space.
                        child: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Text('SHARE PROGRESS', style: _kicker.copyWith(color: Colors.white)),
                            const Positioned(left: 0, right: 0, top: -10, bottom: -10, child: SizedBox()),
                          ],
                        ),
                      ),
                    ],
                  ),
                  _HeaderStateSwitcher(states: states, stateCode: stateCode, choose: stateController.choose),
                  const SizedBox(height: 12),
                  Text.rich(
                    TextSpan(children: [
                      TextSpan(
                        text: '${visited.length} OF $total ',
                        style: const TextStyle(
                            fontSize: 20, height: 24 / 20, fontWeight: FontWeight.w700, fontStyle: FontStyle.italic, letterSpacing: 20 * 0.08),
                      ),
                      const WidgetSpan(child: SizedBox(width: 4)),
                      const TextSpan(
                        text: 'STAMPED',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, fontStyle: FontStyle.italic, letterSpacing: 12 * 0.1),
                      ),
                    ]),
                    style: const TextStyle(color: AppColors.goldOnRed),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    height: 4,
                    alignment: Alignment.centerLeft,
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.25), borderRadius: BorderRadius.circular(999)),
                    child: LayoutBuilder(
                      builder: (context, c) => Container(
                        width: (c.maxWidth * fraction).clamp(8, c.maxWidth),
                        decoration: BoxDecoration(color: AppColors.goldOnRed, borderRadius: BorderRadius.circular(999)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Opacity(
                    opacity: 0.85,
                    child: Text('$toGo TO GO',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 11, height: 16 / 11, fontWeight: FontWeight.w600, letterSpacing: 11 * 0.22, color: Colors.white)),
                  ),
                ],
              ),
            ),
          ),
        ),
        // ── Body ──
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 32, 16, 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (auth.user == null && !auth.isLoading)
                Padding(
                  padding: const EdgeInsets.only(bottom: 32),
                  child: GlassCard(
                    borderRadius: const BorderRadius.all(Radius.circular(16)),
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        const Expanded(
                          child: Text(
                            "You're browsing as a guest. Sign in to keep your passport on every device.",
                            style: TextStyle(fontSize: 14, height: 18 / 14, color: AppColors.muted),
                          ),
                        ),
                        const SizedBox(width: 12),
                        _Pill(label: 'Sign in', onTap: () => showSignInSheet(context, reason: SignInReason.manual)),
                      ],
                    ),
                  ),
                ),
              if (upNext.isNotEmpty) ...[
                const Text('UP NEXT', style: _kicker),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final office in upNext)
                      GestureDetector(
                        onTap: () => _openOffice(office.id),
                        child: GlassCard(
                          borderRadius: const BorderRadius.all(Radius.circular(999)),
                          child: SizedBox(
                            height: 40,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                              child: Center(
                                widthFactor: 1,
                                child: Text(office.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 40),
              ],
              Row(
                children: [
                  const Expanded(child: Text('YOUR STAMPS', style: _kicker)),
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => setState(() => _showAll = true),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Text('SEE ALL',
                          style: TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w600, letterSpacing: 12 * 0.14, color: AppColors.muted)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              if (visited.isEmpty)
                GlassCard(
                  borderRadius: const BorderRadius.all(Radius.circular(16)),
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      const Text('No stamps yet. Find a post office and tap Stamp it.',
                          textAlign: TextAlign.center, style: TextStyle(fontSize: 16, height: 1.5, color: AppColors.muted)),
                      const SizedBox(height: 14),
                      GestureDetector(
                        onTap: () => goToTab(context, 0),
                        child: Container(
                          constraints: const BoxConstraints(minHeight: 48),
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          decoration: BoxDecoration(color: AppColors.postal, borderRadius: BorderRadius.circular(999)),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Open the map', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: () {
                          final article = articles.firstWhere((a) => a.slug == 'get-the-booklet');
                          Navigator.of(context).push(MaterialPageRoute(builder: (_) => ArticleScreen(article: article)));
                        },
                        child: Container(
                          constraints: const BoxConstraints(minHeight: 48),
                          alignment: Alignment.center,
                          child: const Text(
                            'No booklet yet? See where to get it',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.ink,
                              decoration: TextDecoration.underline,
                              decorationColor: AppColors.ink,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else
                GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: EdgeInsets.zero,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: 0.72,
                  children: [
                    for (final office in visited.take(6))
                      GestureDetector(
                        onTap: () => showStampDetailSheet(context, office: _withStatus(office)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            AspectRatio(
                              aspectRatio: 1,
                              child: GlassCard(
                                borderRadius: const BorderRadius.all(Radius.circular(16)),
                                child: Stack(
                                  children: [
                                    Positioned.fill(
                                      child: Padding(
                                        padding: const EdgeInsets.all(8),
                                        child: LayoutBuilder(
                                          builder: (context, c) => Postmark(
                                            name: office.name,
                                            date: formatVisitDate(visits[office.id]!.visitedAt),
                                            pincode: office.pincode,
                                            stateCode: office.state,
                                            size: c.maxWidth,
                                          ),
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 8,
                                      top: 8,
                                      child: Container(
                                        width: 24,
                                        height: 24,
                                        alignment: Alignment.center,
                                        decoration: const BoxDecoration(color: AppColors.stampGreen, shape: BoxShape.circle),
                                        child: const AppIconView(AppIcon.check, size: 14, color: Colors.white, strokeWidth: 3.4),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(office.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
                          ],
                        ),
                      ),
                  ],
                ),
              const SizedBox(height: 40),
              const Text('BY DISTRICT', style: _kicker),
              const SizedBox(height: 16),
              GlassCard(
                borderRadius: const BorderRadius.all(Radius.circular(18)),
                padding: const EdgeInsets.all(16),
                child: DistrictProgress(
                  offices: offices,
                  visits: visits,
                  onDistrict: (district) {
                    exploreOpenDistrict.value = district;
                    goToTab(context, 0);
                  },
                ),
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _FooterLink('Privacy', 'https://philatrail.com/privacy'),
                  const SizedBox(width: 20),
                  _FooterLink('Terms', 'https://philatrail.com/terms'),
                ],
              ),
              const SizedBox(height: 12),
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 448),
                  child: const Text(disclaimer, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, height: 20 / 12, color: AppColors.muted)),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  OfficeWithStatus _withStatus(PostOffice office) => OfficeWithStatus.from(office, status: OfficeStatus.visited, distanceKm: null);

  Widget _buildShowAll(List<PostOffice> offices, List<PostOffice> visited, int total, String stateCode) {
    final visits = visitsControllerOf(context).visits;
    final toGo = total - visited.length;
    final notVisited = offices.where((o) => !visits.containsKey(o.id)).toList();
    final shown = switch (_stampFilter) {
      _StampFilter.stamped => visited,
      _StampFilter.togo => notVisited,
      _StampFilter.all => [...visited, ...notVisited],
    };
    return ListView(
      padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 24, 16, 40),
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: Semantics(
            button: true,
            label: 'Back to passport',
            excludeSemantics: true,
            child: GestureDetector(
              onTap: () => setState(() => _showAll = false),
              child: const GlassCard(
                borderRadius: BorderRadius.all(Radius.circular(999)),
                child: SizedBox(width: 44, height: 44, child: Center(child: _BackChevron())),
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Text(stateName(stateCode).toUpperCase(), style: _kicker),
            const SizedBox(width: 12),
            Container(width: 1, height: 14, color: AppColors.goldRule),
            const SizedBox(width: 12),
            Text('${visited.length} OF $total', style: _kicker.copyWith(color: AppColors.muted)),
          ],
        ),
        const SizedBox(height: 12),
        Transform.translate(
          offset: const Offset(-2, 0),
          child: const Text('YOUR STAMPS',
              style: TextStyle(fontSize: 48, height: 52 / 48, fontWeight: FontWeight.w500, letterSpacing: 0.48, color: AppColors.ink)),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            for (final (value, label) in [
              (_StampFilter.all, 'All $total'),
              (_StampFilter.stamped, 'Stamped ${visited.length}'),
              (_StampFilter.togo, 'To go $toGo'),
            ]) ...[
              _FilterPill(label: label, active: _stampFilter == value, onTap: () => setState(() => _stampFilter = value)),
              const SizedBox(width: 8),
            ],
          ],
        ),
        const SizedBox(height: 24),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.zero,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.8,
          children: [
            for (final office in shown)
              visits[office.id] != null
                  ? GestureDetector(
                      onTap: () => showStampDetailSheet(context, office: _withStatus(office)),
                      child: GlassCard(
                        borderRadius: const BorderRadius.all(Radius.circular(16)),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Center(
                              child: Postmark(
                                name: office.name,
                                date: formatVisitDate(visits[office.id]!.visitedAt),
                                pincode: office.pincode,
                                stateCode: office.state,
                                size: 104,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(office.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.ink)),
                            Text(formatVisitDate(visits[office.id]!.visitedAt),
                                style: const TextStyle(fontFamily: AppFonts.mono, fontSize: 13, color: AppColors.muted)),
                          ],
                        ),
                      ),
                    )
                  : GestureDetector(
                      onTap: () => _openOffice(office.id),
                      child: DashedBorder(
                        color: AppColors.unstampedGold.withValues(alpha: 0.3),
                        radius: 16,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            DashedBorder(
                              color: AppColors.unstampedGold.withValues(alpha: 0.3),
                              radius: 44,
                              child: const SizedBox(width: 88, height: 88),
                            ),
                            const SizedBox(height: 12),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: Text(office.name,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.muted)),
                            ),
                          ],
                        ),
                      ),
                    ),
          ],
        ),
      ],
    );
  }
}

class _BackChevron extends StatelessWidget {
  const _BackChevron();
  @override
  Widget build(BuildContext context) => Transform.rotate(angle: 3.141592653589793, child: const _Chevron());
}

class _Chevron extends StatelessWidget {
  const _Chevron();
  @override
  Widget build(BuildContext context) => const AppIconView(AppIcon.chevronRight, size: 20, color: AppColors.ink, strokeWidth: 2.4);
}

class _Pill extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _Pill({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(color: AppColors.postal, borderRadius: BorderRadius.circular(999)),
        child: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _FilterPill({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final text = Text(label, style: TextStyle(fontSize: 15, fontWeight: active ? FontWeight.w700 : FontWeight.w600, color: AppColors.ink));
    const radius = BorderRadius.all(Radius.circular(999));
    return GestureDetector(
      onTap: onTap,
      child: active
          ? Container(
              height: 40,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.chipActive,
                borderRadius: radius,
                boxShadow: [cssShadow(0, 2, 8, 0, Colors.black.withValues(alpha: 0.12))],
              ),
              foregroundDecoration: BoxDecoration(borderRadius: radius, border: Border.all(color: AppColors.ink, width: 1.5)),
              child: text,
            )
          : GlassCard(
              borderRadius: radius,
              child: Container(height: 40, padding: const EdgeInsets.symmetric(horizontal: 16), alignment: Alignment.center, child: text),
            ),
    );
  }
}

class _FooterLink extends StatelessWidget {
  final String label;
  final String url;
  const _FooterLink(this.label, this.url);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        alignment: Alignment.center,
        child: Text(label,
            style: const TextStyle(
                fontSize: 14, color: AppColors.muted, decoration: TextDecoration.underline, decorationColor: AppColors.muted)),
      ),
    );
  }
}

/// Port of passport/StateSwitcher.tsx: the big uppercase state name with a
/// round translucent chevron, tap for the state sheet, swipe sideways to step
/// between states.
class _HeaderStateSwitcher extends StatefulWidget {
  final List<StateOption> states;
  final String stateCode;
  final ValueChanged<String> choose;
  const _HeaderStateSwitcher({required this.states, required this.stateCode, required this.choose});

  @override
  State<_HeaderStateSwitcher> createState() => _HeaderStateSwitcherState();
}

class _HeaderStateSwitcherState extends State<_HeaderStateSwitcher> {
  Offset? _start;

  void _step(int direction) {
    final states = widget.states;
    final index = states.indexWhere((s) => s.code == widget.stateCode);
    if (index == -1 || states.length < 2) return;
    widget.choose(states[(index + direction + states.length) % states.length].code);
  }

  void _openSheet() {
    showAppSheet<void>(
      context,
      title: 'Choose a state',
      builder: (sheetContext) => Column(
        children: [
          for (final s in widget.states) ...[
            GestureDetector(
              onTap: () {
                widget.choose(s.code);
                Navigator.of(sheetContext).pop();
              },
              child: Container(
                constraints: const BoxConstraints(minHeight: 56),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: s.code == widget.stateCode ? AppColors.postal.withValues(alpha: 0.1) : null,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: s.code == widget.stateCode ? AppColors.postal : AppColors.line),
                ),
                child: Row(
                  children: [
                    Text(s.name, style: const TextStyle(fontFamily: AppFonts.display, fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.ink)),
                    const SizedBox(width: 8),
                    Text('${s.count} OFFICES',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 1.2, color: AppColors.muted)),
                    const Spacer(),
                    if (s.code == widget.stateCode) const AppIconView(AppIcon.check, size: 20, color: AppColors.postal),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final current = widget.states.where((s) => s.code == widget.stateCode).firstOrNull;
    final width = MediaQuery.of(context).size.width;
    final fontSize = (width * 0.1).clamp(30.0, 48.0);
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Listener(
        onPointerDown: (e) => _start = e.position,
        onPointerUp: (e) {
          final origin = _start;
          _start = null;
          if (origin == null) return;
          final dx = e.position.dx - origin.dx;
          final dy = (e.position.dy - origin.dy).abs();
          if (dx.abs() < 56 || dy > dx.abs() * 0.6) return;
          _step(dx < 0 ? 1 : -1);
        },
        child: SizedBox(
          height: 56,
          child: Stack(
            alignment: Alignment.centerLeft,
            children: [
              Positioned.fill(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: _openSheet,
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Transform.translate(
                      offset: const Offset(-2, 0),
                      child: Padding(
                        padding: const EdgeInsets.only(right: 44),
                        child: Text(
                          (current?.name ?? stateName(widget.stateCode)).toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: fontSize, height: 1.5, fontWeight: FontWeight.w500, letterSpacing: fontSize * 0.01, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                right: 0,
                child: IgnorePointer(
                  child: Container(
                    width: 36,
                    height: 36,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), shape: BoxShape.circle),
                    foregroundDecoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border(top: BorderSide(color: Color(0x66FFFFFF), width: 1)),
                    ),
                    child: const ChevronDown20(size: 16, color: AppColors.goldOnRed, strokeWidth: 2.8),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
