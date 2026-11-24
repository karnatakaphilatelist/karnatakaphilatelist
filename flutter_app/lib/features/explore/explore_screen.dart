import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants.dart';
import '../../core/haptics.dart';
import '../../core/office_status.dart';
import '../../data/nearby_notifications.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
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

class _ExploreScreenState extends State<ExploreScreen> {
  StatusFilterValue _filter;
  int? _selectedId;
  Coordinates? _userLocation;
  bool _locating = false;
  String? _watchedSignature;
  String _query = '';
  final _searchController = TextEditingController();

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
  }

  @override
  void dispose() {
    NearbyNotificationService.stop();
    _searchController.dispose();
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

        final stateOffices = stateController.officesFor(officesController.offices);
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
                    Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 10, offset: Offset(0, 2))],
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (v) => setState(() => _query = v),
                        decoration: InputDecoration(
                          hintText: 'Search name, district or pincode',
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
                          contentPadding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    StatusFilterChips(
                      value: _filter,
                      onChanged: (v) => setState(() => _filter = v),
                    ),
                  ],
                ),
              ),
              Positioned(
                right: 16,
                bottom: MediaQuery.of(context).size.height * 0.42 + 16,
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
              ),
              DraggableScrollableSheet(
                initialChildSize: 0.4,
                minChildSize: 0.12,
                maxChildSize: 0.9,
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
                          margin: const EdgeInsets.symmetric(vertical: 10),
                          width: 36,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppColors.line,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        Expanded(
                          child: CustomScrollView(
                            controller: scrollController,
                            slivers: [
                              SliverToBoxAdapter(
                                child: OfficeListView(
                                  offices: listOffices,
                                  selectedId: _selectedId,
                                  onSelect: (id) => _openDetail(
                                    listOffices.firstWhere((o) => o.id == id),
                                  ),
                                ),
                              ),
                            ],
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
