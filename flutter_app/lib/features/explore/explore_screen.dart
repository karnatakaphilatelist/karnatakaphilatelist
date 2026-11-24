import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/haptics.dart';
import '../../core/office_status.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../office/office_detail_screen.dart';
import '../office/visit_dialog.dart';
import 'filter_chips.dart';
import 'office_list.dart';
import 'office_map.dart';

/// Port of src/components/explore/ExploreView.tsx, scoped to this stage's
/// plan: map + filter + list + "locate me" + selection, now state-filtered
/// (via the shared StateController — see offices_controller.dart/
/// state_controller.dart) and visit-aware (via VisitsController, wired in
/// Stage 2). Deliberately NOT yet ported from the web version (tracked for
/// a later pass, not forgotten): the search box, draggable sheet snap
/// points (this uses a fixed DraggableScrollableSheet instead), the
/// location-priming sheet, and nearby-notification tap handling (added
/// alongside the background watcher itself).
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

  _ExploreScreenState() : _filter = null;

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
      // (denied/primed messaging) is still to be ported alongside the
      // background geolocation watcher.
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
        final allOffices = withStatus(
          stateOffices,
          visitsController.visits,
          visitsController.plannedIds,
          _userLocation,
        );
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
