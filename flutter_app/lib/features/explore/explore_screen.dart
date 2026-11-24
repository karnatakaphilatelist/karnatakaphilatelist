import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/office_status.dart';
import '../../data/office_repository.dart';
import '../../models/post_office.dart';
import '../../models/visit.dart';
import '../../theme/app_theme.dart';
import 'filter_chips.dart';
import 'office_list.dart';
import 'office_map.dart';

/// Port of src/components/explore/ExploreView.tsx, scoped to this stage's
/// plan: map + filter + list + "locate me" + selection. Deliberately NOT yet
/// ported from the web version (tracked for a later pass, not forgotten):
/// the search box, multi-state switcher, draggable sheet snap points (this
/// uses a fixed DraggableScrollableSheet instead), location-priming sheet,
/// haptics/widget-update side effects, and nearby-notification wiring —
/// those belong with Stage 2/3 (visits, geofencing) since they're driven by
/// data this screen doesn't have yet (no VisitsProvider equivalent until
/// visits_repository.dart exists).
class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  late final OfficeRepository _repository;
  List<PostOffice> _offices = [];
  bool _loading = true;
  Object? _error;

  StatusFilterValue _filter;
  int? _selectedId;
  Coordinates? _userLocation;
  bool _locating = false;

  _ExploreScreenState() : _filter = null;

  @override
  void initState() {
    super.initState();
    _repository = OfficeRepository(Supabase.instance.client);
    _load();
  }

  Future<void> _load() async {
    try {
      final offices = await _repository.getPostOffices();
      if (!mounted) return;
      setState(() {
        _offices = offices;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  Future<void> _locate() async {
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
      if (!granted) return;
      final position = await Geolocator.getCurrentPosition();
      if (!mounted) return;
      setState(() {
        _userLocation = Coordinates(lat: position.latitude, lng: position.longitude);
      });
    } catch (_) {
      // Deliberately quiet for this stage — the web app's LocationSheet
      // (denied/primed messaging) is still to be ported alongside geofencing
      // in Stage 3.
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_error != null) {
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
                  onPressed: () {
                    setState(() {
                      _loading = true;
                      _error = null;
                    });
                    _load();
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    // No VisitsProvider equivalent yet (Stage 2) — every office shows as
    // unvisited/unplanned for now. withStatus()/getOfficeStatus() are
    // already wired so Stage 2 only has to supply real visits/plannedIds.
    final allOffices = withStatus(_offices, const <int, Visit>{}, const <int>{}, _userLocation);
    final visibleOffices = _filter == null
        ? allOffices
        : allOffices.where((o) => o.status == _filter).toList();
    final listOffices = _userLocation != null ? sortByDistance(visibleOffices) : visibleOffices;

    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: OfficeMap(
              offices: visibleOffices,
              selectedId: _selectedId,
              userLocation: _userLocation,
              onSelect: (id) => setState(() => _selectedId = id),
            ),
          ),
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 16,
            right: 16,
            child: StatusFilterChips(
              value: _filter,
              onChanged: (v) => setState(() => _filter = v),
            ),
          ),
          Positioned(
            right: 16,
            bottom: MediaQuery.of(context).size.height * 0.42 + 16,
            child: FloatingActionButton(
              heroTag: 'locate',
              backgroundColor: AppColors.card,
              foregroundColor: AppColors.ink,
              onPressed: _locate,
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
                              onSelect: (id) => setState(() => _selectedId = id),
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
  }
}
