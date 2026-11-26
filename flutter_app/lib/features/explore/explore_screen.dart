import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants.dart';
import '../../core/haptics.dart';
import '../../core/office_status.dart';
import '../../core/states.dart';
import '../../data/nearby_notifications.dart';
import '../../data/state_controller.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/account_avatar.dart';
import '../office/office_detail_screen.dart';
import '../office/visit_dialog.dart';
import 'filter_chips.dart';
import 'location_sheet.dart';
import 'office_list.dart';
import 'office_map.dart';

/// Port of src/components/explore/ExploreView.tsx, scoped to this stage's
/// plan: map + search + filter + list + "locate me" (now with the
/// location-priming/denied sheets) + selection, state-filtered (via the
/// shared StateController — see offices_controller.dart/state_controller.dart),
/// visit-aware (via VisitsController, wired in Stage 2), and geofence-aware
/// (NearbyNotificationService). Deliberately NOT yet ported from the web
/// version: the draggable sheet's 3-way snap points (this uses a fixed
/// DraggableScrollableSheet instead) — a later pass if wanted.
class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

// Phone list sheet snap points — mirrors ExploreView.tsx's snap stops (peek /
// half / nearly full), collapsed to the two that matter for the header's
// "Show list" / "Show map" toggle.
const double _sheetPeek = 0.14;
const double _sheetOpenSize = 0.55;
const double _sheetMax = 0.9;

class _ExploreScreenState extends State<ExploreScreen> {
  StatusFilterValue _filter;
  int? _selectedId;
  Coordinates? _userLocation;
  bool _locating = false;
  String? _watchedSignature;
  String _query = '';
  final _searchController = TextEditingController();
  final _sheetController = DraggableScrollableController();
  bool _sheetOpen = false;

  _ExploreScreenState() : _filter = null;

  @override
  void initState() {
    super.initState();
    // Mirrors ExploreView.tsx's mount-time effect: start the watcher once;
    // a tap on its notification just highlights the office, same as the web
    // app (it doesn't jump straight into the detail screen).
    NearbyNotificationService.init(onOfficeTap: (id) {
      if (mounted) setState(() => _selectedId = id);
    });
    _sheetController.addListener(_onSheetSizeChanged);
  }

  void _onSheetSizeChanged() {
    final open = _sheetController.size > (_sheetPeek + 0.05);
    if (open != _sheetOpen) setState(() => _sheetOpen = open);
  }

  void _toggleSheet() {
    hapticSelect();
    _sheetController.animateTo(
      _sheetOpen ? _sheetPeek : _sheetOpenSize,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    NearbyNotificationService.stop();
    _searchController.dispose();
    _sheetController.removeListener(_onSheetSizeChanged);
    _sheetController.dispose();
    super.dispose();
  }

  /// Keeps the background watcher's office list in sync, same reasoning as
  /// ExploreView.tsx's setWatchedOffices effect — called from build() since
  /// that's where the current state-filtered office list and visited set
  /// are computed, but only actually sent when something changed.
  void _syncWatchedOffices(List<PostOffice> stateOffices, Set<int> visitedIds) {
    final signature = '${stateOffices.length}:${(visitedIds.toList()..sort()).join(",")}';
    if (signature == _watchedSignature) return;
    _watchedSignature = signature;
    Future.microtask(() => NearbyNotificationService.setWatchedOffices(stateOffices, visitedIds));
  }

  /// List rows carry a chevron (see office_list.dart) — tapping one opens the
  /// full detail/stamping screen, not just a map highlight. Tapping a map pin
  /// (OfficeMap's onSelect) only selects/centers, matching the web app's
  /// lighter-weight map-tap behavior; opening OfficeDetail from the map is a
  /// later pass if wanted.
  void _openDetail(OfficeWithStatus office) {
    hapticSelect();
    setState(() => _selectedId = office.id);
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => OfficeDetailScreen(office: office)),
    );
  }

  /// Port of handleFindNearMe(): explain why we ask, once per device,
  /// before the system prompt ever shows.
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

  /// Port of StateSwitcher.tsx's picker sheet — the state list itself (not
  /// just the current one) is the part Explore was missing entirely.
  Future<void> _pickState(
    BuildContext context,
    StateController stateController,
    List<StateOption> states,
    String currentCode,
  ) async {
    final chosen = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppColors.paper,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.symmetric(vertical: 8),
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, 4),
              child: Text(
                'SWITCH STATE',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.6, color: AppColors.muted),
              ),
            ),
            for (final s in states)
              ListTile(
                title: Text(
                  s.name,
                  style: TextStyle(
                    fontFamily: AppFonts.display,
                    fontWeight: FontWeight.w500,
                    fontSize: 18,
                    color: s.code == currentCode ? AppColors.postal : AppColors.ink,
                  ),
                ),
                trailing: Text('${s.count}', style: const TextStyle(color: AppColors.muted, fontFamily: AppFonts.mono)),
                onTap: () => Navigator.of(sheetContext).pop(s.code),
              ),
          ],
        ),
      ),
    );
    if (chosen != null && chosen != currentCode) {
      hapticSelect();
      stateController.choose(chosen);
    }
  }

  Future<void> _requestLocation() async {
    if (_locating) return;
    setState(() => _locating = true);
    try {
      final permission = await Geolocator.checkPermission();
      var granted = permission == LocationPermission.always ||
          permission == LocationPermission.whileInUse;
      if (!granted) {
        final requested = await Geolocator.requestPermission();
        granted = requested == LocationPermission.always ||
            requested == LocationPermission.whileInUse;
      }
      if (!granted) {
        if (mounted) await showLocationSheet(context, mode: LocationSheetMode.denied, onContinue: null);
        return;
      }
      final position = await Geolocator.getCurrentPosition();
      if (!mounted) return;
      setState(() {
        _userLocation = Coordinates(lat: position.latitude, lng: position.longitude);
      });
    } catch (_) {
      if (mounted) await showLocationSheet(context, mode: LocationSheetMode.denied, onContinue: null);
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final officesController = officesControllerOf(context);
    final stateController = stateControllerOf(context);
    final visitsController = visitsControllerOf(context);

    return AnimatedBuilder(
      animation: Listenable.merge([officesController, stateController, visitsController]),
      builder: (context, _) {
        if (officesController.loading) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        if (officesController.error != null) {
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.wifi_off, color: AppColors.muted, size: 32),
                    const SizedBox(height: 12),
                    const Text('Could not load post offices. Check your connection and try again.'),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: officesController.reload,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        final states = stateController.statesFor(officesController.offices);
        final stateCode = stateController.stateCodeFor(officesController.offices);
        final stateOffices = stateController.officesFor(officesController.offices);
        final stampedInState = stateOffices.where((o) => visitsController.visits.containsKey(o.id)).length;
        _syncWatchedOffices(stateOffices, visitsController.visits.keys.toSet());
        final allOffices = withStatus(
          stateOffices,
          visitsController.visits,
          visitsController.plannedIds,
          _userLocation,
        );
        final needle = _query.trim().toLowerCase();
        final visibleOffices = allOffices.where((o) {
          if (_filter != null && o.status != _filter) return false;
          if (needle.isEmpty) return true;
          return o.name.toLowerCase().contains(needle) ||
              o.district.toLowerCase().contains(needle) ||
              o.pincode.contains(needle);
        }).toList();
        final listOffices = _userLocation != null ? sortByDistance(visibleOffices) : visibleOffices;

        return Scaffold(
          body: Stack(
            children: [
              Positioned.fill(
                child: OfficeMap(
                  offices: visibleOffices,
                  selectedId: _selectedId,
                  userLocation: _userLocation,
                  onSelect: (id) {
                    hapticSelect();
                    setState(() => _selectedId = id);
                  },
                ),
              ),
              Positioned(
                top: MediaQuery.of(context).padding.top + 12,
                left: 16,
                right: 16,
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 56,
                            decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: BorderRadius.circular(28),
                              boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 10, offset: Offset(0, 2))],
                            ),
                            child: TextField(
                              controller: _searchController,
                              onChanged: (v) => setState(() => _query = v),
                              decoration: InputDecoration(
                                hintText: 'Search post offices',
                                prefixIcon: const Icon(Icons.search, color: AppColors.muted, size: 20),
                                suffixIcon: _query.isEmpty
                                    ? null
                                    : IconButton(
                                        icon: const Icon(Icons.close, size: 18),
                                        onPressed: () {
                                          _searchController.clear();
                                          setState(() => _query = '');
                                        },
                                      ),
                                border: InputBorder.none,
                                contentPadding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        const AccountAvatarButton(size: 56),
                      ],
                    ),
                    const SizedBox(height: 10),
                    StatusFilterChips(
                      value: _filter,
                      onChanged: (v) => setState(() => _filter = v),
                    ),
                  ],
                ),
              ),
              // Tracks the sheet's live size (not just the peek/open snap points, which
              // only update once dragging settles) so the locate button always floats
              // just above the sheet's current top edge, dragged or animated.
              AnimatedBuilder(
                animation: _sheetController,
                builder: (context, _) {
                  final sheetSize = _sheetController.isAttached ? _sheetController.size : _sheetPeek;
                  return Positioned(
                    right: 16,
                    bottom: MediaQuery.of(context).size.height * sheetSize + 16,
                    child: FloatingActionButton(
                      heroTag: 'locate',
                      backgroundColor: AppColors.card,
                      foregroundColor: AppColors.ink,
                      onPressed: _findNearMe,
                      child: _locating
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.my_location),
                    ),
                  );
                },
              ),
              DraggableScrollableSheet(
                controller: _sheetController,
                initialChildSize: _sheetPeek,
                minChildSize: _sheetPeek,
                maxChildSize: _sheetMax,
                builder: (context, scrollController) {
                  return Container(
                    decoration: const BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                      boxShadow: [
                        BoxShadow(color: Color(0x1A000000), blurRadius: 12, offset: Offset(0, -2)),
                      ],
                    ),
                    child: Column(
                      children: [
                        Container(
                          margin: const EdgeInsets.only(top: 10, bottom: 4),
                          width: 36,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppColors.line,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        // Port of ExploreView.tsx's phone panel header (direction D): peek
                        // shows state + progress + "Show list"; open shows the list heading
                        // + "Show map". This is the state switcher's only home on phones now
                        // — the floating card that used to sit above the search bar is gone.
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                          child: Row(
                            children: [
                              Expanded(
                                child: _sheetOpen
                                    ? Text(
                                        _userLocation != null ? 'Nearby' : 'Post offices',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                          letterSpacing: 1.6,
                                          color: AppColors.ink,
                                        ),
                                      )
                                    : InkWell(
                                        onTap: states.length > 1
                                            ? () => _pickState(context, stateController, states, stateCode)
                                            : null,
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Text(
                                                  stateName(stateCode),
                                                  style: const TextStyle(
                                                    fontFamily: AppFonts.display,
                                                    fontWeight: FontWeight.w500,
                                                    fontSize: 20,
                                                  ),
                                                ),
                                                if (states.length > 1) ...[
                                                  const SizedBox(width: 4),
                                                  const Icon(Icons.expand_more, size: 18, color: AppColors.ink),
                                                ],
                                              ],
                                            ),
                                            const SizedBox(height: 4),
                                            Row(
                                              children: [
                                                ClipRRect(
                                                  borderRadius: BorderRadius.circular(999),
                                                  child: SizedBox(
                                                    width: 96,
                                                    child: LinearProgressIndicator(
                                                      value: stateOffices.isEmpty ? 0 : stampedInState / stateOffices.length,
                                                      minHeight: 6,
                                                      backgroundColor: AppColors.line,
                                                      color: AppColors.visited,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  '$stampedInState of ${stateOffices.length} stamped',
                                                  style: const TextStyle(fontFamily: AppFonts.mono, color: AppColors.muted, fontSize: 13),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                              ),
                              TextButton.icon(
                                onPressed: _toggleSheet,
                                style: TextButton.styleFrom(
                                  backgroundColor: AppColors.lineStrong.withValues(alpha: 0.35),
                                  foregroundColor: AppColors.ink,
                                  shape: const StadiumBorder(),
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  minimumSize: const Size(0, 40),
                                ),
                                icon: Icon(_sheetOpen ? Icons.map_outlined : Icons.list, size: 16),
                                label: Text(
                                  _sheetOpen ? 'Show map' : 'Show list',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: OfficeListView(
                            controller: scrollController,
                            offices: listOffices,
                            selectedId: _selectedId,
                            onSelect: (id) => _openDetail(
                              listOffices.firstWhere((o) => o.id == id),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
