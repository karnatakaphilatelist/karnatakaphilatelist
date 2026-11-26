import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../app_shell.dart';
import '../../core/constants.dart';
import '../../core/haptics.dart';
import '../../core/in_app_review.dart';
import '../../core/office_status.dart';
import '../../core/states.dart';
import '../../data/auth_controller.dart';
import '../../data/nearby_notifications.dart';
import '../../data/state_controller.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/account_avatar.dart' show firstName;
import '../../widgets/app_icons.dart';
import '../../widgets/glass_card.dart';
import '../auth/sign_in_sheet.dart';
import '../office/office_detail_screen.dart';
import '../office/stamped_sheet.dart';
import '../office/visit_dialog.dart';
import 'filter_chips.dart';
import 'location_sheet.dart';
import 'office_list.dart';
import 'office_map.dart';

/// Ask Explore to open one office (the web's `/explore?office=<id>` link, used
/// by the Passport). Explore switches to that office's state and selects it.
final ValueNotifier<int?> exploreOpenOffice = ValueNotifier<int?>(null);

/// Ask Explore to search one district with the list open (`/explore?district=`).
final ValueNotifier<String?> exploreOpenDistrict = ValueNotifier<String?>(null);

const double _peek = 108; // 6.75rem
const double _topGap = 120; // calc(100% - 7.5rem)

/// Port of src/components/explore/ExploreView.tsx (phone layout).
class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  StatusFilterValue _filter;
  int? _selectedId;
  Coordinates? _userLocation;
  bool _locating = false;
  String? _watchedSignature;
  String _query = '';
  final _searchController = TextEditingController();

  // The list sheet: 0 = peek, 1 = half, 2 = nearly full (ExploreView's `snap`).
  int _snap = 0;
  double? _dragHeight;
  _Drag? _drag;
  bool _sheetVisible = false; // the sheet waits for the map, then fades in

  _ExploreScreenState() : _filter = null;

  bool get _sheetOpen => _snap > 0;

  @override
  void initState() {
    super.initState();
    NearbyNotificationService.init(onOfficeTap: (id) {
      if (mounted) setState(() => _selectedId = id);
    });
    exploreReset.addListener(_reset);
    exploreOpenOffice.addListener(_openLinkedOffice);
    exploreOpenDistrict.addListener(_openLinkedDistrict);
    Timer(const Duration(milliseconds: 1000), () {
      if (mounted) setState(() => _sheetVisible = true);
    });
  }

  @override
  void dispose() {
    NearbyNotificationService.stop();
    exploreReset.removeListener(_reset);
    exploreOpenOffice.removeListener(_openLinkedOffice);
    exploreOpenDistrict.removeListener(_openLinkedDistrict);
    _searchController.dispose();
    super.dispose();
  }

  void _reset() {
    setState(() {
      _query = '';
      _searchController.clear();
      _filter = null;
      _selectedId = null;
      _snap = 0;
    });
  }

  void _openLinkedOffice() {
    final id = exploreOpenOffice.value;
    if (id == null) return;
    exploreOpenOffice.value = null;
    final offices = officesControllerOf(context).offices;
    final linked = offices.where((o) => o.id == id).firstOrNull;
    if (linked == null) return;
    stateControllerOf(context).choose(linked.state);
    setState(() => _selectedId = linked.id);
  }

  void _openLinkedDistrict() {
    final district = exploreOpenDistrict.value;
    if (district == null) return;
    exploreOpenDistrict.value = null;
    setState(() {
      _query = district;
      _searchController.text = district;
      _snap = 1;
    });
  }

  void _setSheetOpen(bool open) => setState(() => _snap = open ? 1 : 0);

  void _syncWatchedOffices(List<PostOffice> stateOffices, Set<int> visitedIds) {
    final signature = '${stateOffices.length}:${(visitedIds.toList()..sort()).join(",")}';
    if (signature == _watchedSignature) return;
    _watchedSignature = signature;
    Future.microtask(() => NearbyNotificationService.setWatchedOffices(stateOffices, visitedIds));
  }

  void _selectOffice(int id) {
    hapticSelect();
    setState(() => _selectedId = id);
  }

  Future<void> _markVisited(int officeId, int collectedBefore, int total) async {
    final visits = visitsControllerOf(context);
    final saved = await visits.markVisited(officeId);
    if (!saved || !mounted) return;
    hapticCollect();
    unawaited(maybeRequestReview(visits.visits.length));
    final office = officesControllerOf(context).offices.firstWhere((o) => o.id == officeId);
    await showStampedSheet(
      context,
      office: OfficeWithStatus.from(office, status: OfficeStatus.visited, distanceKm: null),
      collected: collectedBefore + 1,
      total: total,
    );
  }

  /// Explain first, once, so the system prompt is never a surprise.
  Future<void> _findNearMe() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    if (prefs.getBool(StorageKeys.locationPrimed) ?? false) {
      await _requestLocation();
      return;
    }
    await showLocationSheet(
      context,
      mode: LocationSheetMode.prime,
      onContinue: () async {
        await prefs.setBool(StorageKeys.locationPrimed, true);
        await _requestLocation();
      },
    );
  }

  Future<void> _requestLocation() async {
    if (_locating) return;
    setState(() => _locating = true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
      final granted = permission == LocationPermission.always || permission == LocationPermission.whileInUse;
      if (!granted) {
        if (mounted) await showLocationSheet(context, mode: LocationSheetMode.denied, onContinue: null);
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 10)),
      );
      if (!mounted) return;
      setState(() => _userLocation = Coordinates(lat: position.latitude, lng: position.longitude));
    } catch (_) {
      if (mounted) await showLocationSheet(context, mode: LocationSheetMode.denied, onContinue: null);
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  /// The state switcher's choice list — the web uses a native `<select>`,
  /// which Android shows as a plain single-choice dialog.
  Future<void> _pickState(StateController stateController, List<StateOption> states, String current) async {
    final chosen = await showDialog<String>(
      context: context,
      builder: (dialogContext) => SimpleDialog(
        backgroundColor: AppColors.warmWhite,
        surfaceTintColor: Colors.transparent,
        children: [
          for (final s in states)
            RadioListTile<String>(
              value: s.code,
              groupValue: current,
              activeColor: AppColors.postal,
              title: Text(s.name, style: const TextStyle(fontSize: 16, color: AppColors.ink)),
              onChanged: (v) => Navigator.of(dialogContext).pop(v),
            ),
        ],
      ),
    );
    if (chosen != null && chosen != current) {
      hapticSelect();
      stateController.choose(chosen);
    }
  }

  // ── Sheet drag: same rules as ExploreView's dragProps/finishDrag ──
  void _dragStart(DragStartDetails d, double sheetHeight) {
    _drag = _Drag(d.globalPosition.dy, sheetHeight);
  }

  void _dragUpdate(DragUpdateDetails d, double parent) {
    final drag = _drag;
    if (drag == null) return;
    final dy = drag.y - d.globalPosition.dy;
    if (!drag.moved && dy.abs() < 8) return;
    drag.moved = true;
    drag.lastY = d.globalPosition.dy;
    final maxH = (parent - _topGap).clamp(_peek, double.infinity);
    setState(() => _dragHeight = (drag.h + dy).clamp(_peek, maxH));
  }

  void _dragEnd(double parent) {
    final drag = _drag;
    _drag = null;
    if (drag == null || !drag.moved) return;
    final stops = [_peek, parent * 0.5, (parent - _topGap).clamp(_peek, double.infinity)];
    // A flick counts: lean the landing spot the way the finger was heading.
    final flick = (drag.y - drag.lastY) * 1.5;
    final target = (drag.h + flick).clamp(_peek, stops[2]);
    var nearest = 0;
    for (var i = 1; i < stops.length; i++) {
      if ((stops[i] - target).abs() < (stops[nearest] - target).abs()) nearest = i;
    }
    setState(() {
      _snap = nearest;
      _dragHeight = null;
    });
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
        if (officesController.loading) {
          return const Scaffold(backgroundColor: AppColors.sand, body: Center(child: CircularProgressIndicator(color: AppColors.postal)));
        }
        if (officesController.error != null) {
          return Scaffold(
            backgroundColor: AppColors.paper,
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Could not load post offices. Check your connection and try again.',
                        textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: AppColors.muted)),
                    const SizedBox(height: 16),
                    RedCtaButton(label: 'Retry', onTap: officesController.reload),
                  ],
                ),
              ),
            ),
          );
        }

        final states = stateController.statesFor(officesController.offices);
        final stateCode = stateController.stateCodeFor(officesController.offices);
        final stateOffices = stateController.officesFor(officesController.offices);
        final visits = visitsController.visits;
        final stampedCount = stateOffices.where((o) => visits.containsKey(o.id)).length;
        _syncWatchedOffices(stateOffices, visits.keys.toSet());
        final allOffices = withStatus(stateOffices, visits, visitsController.plannedIds, _userLocation);
        final needle = _query.trim().toLowerCase();
        final matches = allOffices.where((o) {
          if (_filter != null && o.status != _filter) return false;
          if (needle.isEmpty) return true;
          return o.name.toLowerCase().contains(needle) || o.district.toLowerCase().contains(needle) || o.pincode.contains(needle);
        }).toList();
        final visibleOffices = _userLocation != null ? sortByDistance(matches) : matches;

        // The detail card follows the filter and search: it closes by itself
        // when the selected office drops out of the visible list.
        final selected = visibleOffices.where((o) => o.id == _selectedId).firstOrNull;
        if (_selectedId != null && selected == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) setState(() => _selectedId = null);
          });
        }
        if (detailSheetOpen.value != (selected != null)) {
          WidgetsBinding.instance.addPostFrameCallback((_) => detailSheetOpen.value = selected != null);
        }

        final safeTop = MediaQuery.of(context).padding.top;
        return Scaffold(
          backgroundColor: AppColors.sand,
          resizeToAvoidBottomInset: false,
          body: LayoutBuilder(builder: (context, constraints) {
            final parent = constraints.maxHeight;
            final sheetHeight = _dragHeight ??
                (_snap == 0 ? _peek : _snap == 1 ? parent * 0.5 : (parent - _topGap).clamp(_peek, double.infinity));
            return Stack(
              children: [
                Positioned.fill(
                  child: OfficeMap(
                    offices: visibleOffices,
                    selectedId: _selectedId,
                    userLocation: _userLocation,
                    onSelect: _selectOffice,
                  ),
                ),
                // Map credit: quiet glass pill, bottom-left, above the peeking sheet.
                Positioned(
                  left: 0,
                  bottom: _peek,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5),
                    decoration: const BoxDecoration(
                      color: Color(0xB3FFFAF0),
                      borderRadius: BorderRadius.only(topRight: Radius.circular(8)),
                    ),
                    child: const Text('© MapTiler © OpenStreetMap',
                        style: TextStyle(fontSize: 10, height: 1.4, color: AppColors.muted)),
                  ),
                ),
                if (!_sheetOpen)
                  Positioned(
                    top: safeTop + 24,
                    left: 0,
                    right: 0,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: ExploreSearchBar(controller: _searchController, onChanged: (v) => setState(() => _query = v)),
                        ),
                        const SizedBox(height: 12 - chipRowPadTop),
                        StatusFilterChips(value: _filter, onChanged: (v) => setState(() => _filter = v)),
                      ],
                    ),
                  ),
                if (selected == null && !_sheetOpen && _dragHeight == null)
                  Positioned(
                    right: 16,
                    bottom: sheetHeight + 16,
                    child: Semantics(
                      button: true,
                      label: 'Show post offices near me',
                      excludeSemantics: true,
                      child: GestureDetector(
                        onTap: _locating ? null : _findNearMe,
                        child: Opacity(
                          opacity: _locating ? 0.6 : 1,
                          child: const GlassCard(
                            borderRadius: BorderRadius.all(Radius.circular(999)),
                            child: SizedBox(
                              width: 52,
                              height: 52,
                              child: Center(child: AppIconView(AppIcon.locate, size: 24, color: AppColors.postal)),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                if (selected == null)
                  AnimatedPositioned(
                    duration: _dragHeight == null ? const Duration(milliseconds: 300) : Duration.zero,
                    curve: Curves.easeOut,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: sheetHeight,
                    child: AnimatedOpacity(
                      opacity: _sheetVisible ? 1 : 0,
                      duration: const Duration(milliseconds: 300),
                      child: IgnorePointer(
                        ignoring: !_sheetVisible,
                        child: _sheet(
                          parent: parent,
                          sheetHeight: sheetHeight,
                          states: states,
                          stateCode: stateCode,
                          stateController: stateController,
                          stampedCount: stampedCount,
                          total: stateOffices.length,
                          visibleOffices: visibleOffices,
                          signedIn: auth.user != null,
                          greetingName: auth.user == null ? null : firstName(auth.user!),
                        ),
                      ),
                    ),
                  ),
                if (selected != null)
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: OfficeDetailPanel(
                      key: ValueKey(selected.id),
                      office: selected,
                      onClose: () => setState(() => _selectedId = null),
                      onCheckDistance: _findNearMe,
                      collected: allOffices.where((o) => o.status == OfficeStatus.visited).length,
                      total: allOffices.length,
                      stateName: stateName(stateCode),
                      onMarkVisited: (id) => _markVisited(
                        id,
                        allOffices.where((o) => o.status == OfficeStatus.visited).length,
                        allOffices.length,
                      ),
                    ),
                  ),
              ],
            );
          }),
        );
      },
    );
  }

  Widget _sheet({
    required double parent,
    required double sheetHeight,
    required List<StateOption> states,
    required String stateCode,
    required StateController stateController,
    required int stampedCount,
    required int total,
    required List<OfficeWithStatus> visibleOffices,
    required bool signedIn,
    required String? greetingName,
  }) {
    final header = GestureDetector(
      behavior: HitTestBehavior.translucent,
      onVerticalDragStart: (d) => _dragStart(d, sheetHeight),
      onVerticalDragUpdate: (d) => _dragUpdate(d, parent),
      onVerticalDragEnd: (_) => _dragEnd(parent),
      onVerticalDragCancel: () => _dragEnd(parent),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Grab bar: tap to toggle.
          Semantics(
            button: true,
            label: _sheetOpen ? 'Collapse the list' : 'Expand the list',
            excludeSemantics: true,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => _setSheetOpen(!_sheetOpen),
              child: SizedBox(
                height: 28,
                child: Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: AppColors.handle, borderRadius: BorderRadius.circular(999)),
                  ),
                ),
              ),
            ),
          ),
          if (_sheetOpen)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: ExploreSearchBar(controller: _searchController, onChanged: (v) => setState(() => _query = v)),
            ),
          if (_sheetOpen)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: _ProgressStrip(
                signedIn: signedIn,
                firstName: greetingName,
                stamped: stampedCount,
                total: total,
                stateCode: stateCode,
                onFindNext: () => setState(() => _filter = OfficeStatus.unvisited),
                onSignIn: () => showSignInSheet(context, reason: SignInReason.manual),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: _sheetOpen
                      ? _listHeading(visibleOffices.length, total)
                      : _peekSummary(states, stateCode, stateController, stampedCount, total),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: () => _setSheetOpen(!_sheetOpen),
                  child: Container(
                    height: 44,
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    decoration: BoxDecoration(
                      color: AppColors.warmBrown.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_sheetOpen ? 'Show map' : 'Show list',
                            style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
                        const SizedBox(width: 6),
                        ChevronDown20(size: 14, color: AppColors.ink, strokeWidth: 2.6, up: !_sheetOpen),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (_sheetOpen)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: StatusFilterChips(value: _filter, onChanged: (v) => setState(() => _filter = v)),
            ),
        ],
      ),
    );

    return GlassCard(
      kind: GlassKind.panel,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        child: OverflowBox(
          alignment: Alignment.topCenter,
          maxHeight: double.infinity,
          child: SizedBox(
            height: sheetHeight < 300 ? 300 : sheetHeight,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                header,
                Expanded(
                  child: OfficeListView(
                    offices: visibleOffices,
                    selectedId: _selectedId,
                    onSelect: _selectOffice,
                    physics: _sheetOpen ? const ClampingScrollPhysics() : const NeverScrollableScrollPhysics(),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _listHeading(int shown, int total) {
    const style = TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w700, letterSpacing: 12 * 0.18, color: AppColors.ink);
    return Row(
      children: [
        Text(_userLocation != null ? 'NEARBY' : 'POST OFFICES', style: style),
        if (shown != total) ...[
          const SizedBox(width: 12),
          Container(width: 1, height: 14, color: AppColors.goldRule),
          const SizedBox(width: 12),
          Text('$shown SHOWN', style: style.copyWith(color: AppColors.muted)),
        ],
      ],
    );
  }

  Widget _peekSummary(List<StateOption> states, String stateCode, StateController stateController, int stamped, int total) {
    final fraction = total == 0 ? 0.0 : (stamped / total).clamp(stamped > 0 ? 0.04 : 0.0, 1.0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // StateSwitcher `title`: bold state name + chevron over an invisible select.
        Semantics(
          button: true,
          label: 'State',
          value: stateName(stateCode),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => _pickState(stateController, states, stateCode),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 44),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    states.where((s) => s.code == stateCode).firstOrNull?.name ?? stateName(stateCode),
                    style: const TextStyle(fontSize: 20, height: 24 / 20, fontWeight: FontWeight.w700, letterSpacing: -0.5, color: AppColors.ink),
                  ),
                  const SizedBox(width: 6),
                  const ChevronDown20(size: 16, color: AppColors.ink),
                ],
              ),
            ),
          ),
        ),
        Row(
          children: [
            Container(
              width: 96,
              height: 6,
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(color: AppColors.warmBrown.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
              alignment: Alignment.centerLeft,
              child: FractionallySizedBox(widthFactor: fraction, heightFactor: 1, child: Container(color: AppColors.stampGreen)),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Text.rich(
                TextSpan(
                  style: const TextStyle(fontFamily: AppFonts.mono, fontSize: 13, height: 1.5, color: AppColors.muted),
                  children: [
                    TextSpan(text: '$stamped', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.stampGreen)),
                    TextSpan(text: ' of $total stamped'),
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

class _Drag {
  final double y;
  final double h;
  double lastY;
  bool moved = false;
  _Drag(this.y, this.h) : lastY = y;
}

/// Port of ProgressStrip.tsx — shown above the list when it's open: signed-in
/// progress + "Find next", or a guest's "sign in so you don't lose them".
class _ProgressStrip extends StatelessWidget {
  final bool signedIn;
  final String? firstName;
  final int stamped;
  final int total;
  final String stateCode;
  final VoidCallback onFindNext;
  final VoidCallback onSignIn;
  const _ProgressStrip({
    required this.signedIn,
    required this.firstName,
    required this.stamped,
    required this.total,
    required this.stateCode,
    required this.onFindNext,
    required this.onSignIn,
  });

  @override
  Widget build(BuildContext context) {
    if (!signedIn) {
      if (stamped == 0) return const SizedBox.shrink();
      return Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppColors.plannedSoft, borderRadius: BorderRadius.circular(16)),
        child: Row(
          children: [
            Expanded(
              child: Text(
                'You have stamped $stamped as a guest. Sign in so you do not lose ${stamped == 1 ? 'it' : 'them'}.',
                style: const TextStyle(fontSize: 14, height: 18 / 14, color: AppColors.plannedInk),
              ),
            ),
            const SizedBox(width: 12),
            _SmallPill(label: 'Sign in', color: AppColors.ink, onTap: onSignIn),
          ],
        ),
      );
    }
    final greeting = greetingWord(stateCode);
    final percent = total > 0 ? (stamped / total * 100).round() : 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(firstName != null ? '$greeting, $firstName' : greeting,
                        style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
                    Text.rich(TextSpan(
                      style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted),
                      children: [
                        TextSpan(
                            text: '$stamped',
                            style: const TextStyle(fontFamily: AppFonts.display, fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.ink)),
                        TextSpan(text: ' of $total stamped'),
                      ],
                    )),
                  ],
                ),
              ),
              if (stamped < total) _SmallPill(label: 'Find next', color: AppColors.postal, onTap: onFindNext),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            height: 8,
            clipBehavior: Clip.antiAlias,
            alignment: Alignment.centerLeft,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
            child: FractionallySizedBox(
              widthFactor: percent / 100,
              heightFactor: 1,
              child: Container(decoration: BoxDecoration(color: AppColors.visited, borderRadius: BorderRadius.circular(999))),
            ),
          ),
        ],
      ),
    );
  }
}

class _SmallPill extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _SmallPill({required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(999)),
        child: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
      ),
    );
  }
}
