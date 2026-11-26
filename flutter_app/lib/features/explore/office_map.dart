import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as ll;

import '../../core/cluster.dart';
import '../../core/map_tiles.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import 'pin_icons.dart';

/// Port of src/components/map/OfficeMap.tsx. Where the web version leans on
/// Leaflet's imperative API (map.flyTo, map.fitBounds) inside effects,
/// flutter_map exposes the same moves through MapController — the sequencing
/// (fit-all on load, fly-to on selection, fly-to on location) is kept
/// identical, just expressed with a controller instead of refs + effects.
class OfficeMap extends StatefulWidget {
  final List<OfficeWithStatus> offices;
  final int? selectedId;
  final Coordinates? userLocation;
  final ValueChanged<int> onSelect;

  const OfficeMap({
    super.key,
    required this.offices,
    required this.selectedId,
    required this.userLocation,
    required this.onSelect,
  });

  @override
  State<OfficeMap> createState() => _OfficeMapState();
}

class _OfficeMapState extends State<OfficeMap> {
  final _mapController = MapController();
  double _zoom = 5;
  bool _hasFitted = false;

  // Karnataka-ish starting view, matching MAP_START_CENTER/MAP_START_ZOOM.
  static const _startCenter = ll.LatLng(22.5, 79);
  static const _startZoom = 5.0;
  static const _focusZoom = 12.0;
  static const _nearMeZoom = 11.0;

  List<OfficeWithStatus> get _located => widget.offices.where((o) => o.hasCoordinates).toList();

  @override
  void didUpdateWidget(OfficeMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    final shownChanged = !_sameIds(oldWidget.offices, widget.offices);
    if (shownChanged) _fitToOffices();
    if (oldWidget.selectedId != widget.selectedId) _flyToSelected();
    if (oldWidget.userLocation != widget.userLocation && widget.userLocation != null) {
      _mapController.move(
        ll.LatLng(widget.userLocation!.lat, widget.userLocation!.lng),
        _nearMeZoom,
      );
    }
  }

  bool _sameIds(List<OfficeWithStatus> a, List<OfficeWithStatus> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i].id != b[i].id) return false;
    }
    return true;
  }

  void _fitToOffices() {
    final points = _located.map((o) => ll.LatLng(o.lat!, o.lng!)).toList();
    if (points.isEmpty) return;
    final first = !_hasFitted;
    _hasFitted = true;
    if (first && widget.selectedId != null) return; // yields to the link-selected office
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (points.length > 1) {
        final bounds = LatLngBounds.fromPoints(points);
        // Leave room for the search bar above and the list sheet below.
        final fitted = CameraFit.bounds(
          bounds: bounds,
          padding: const EdgeInsets.fromLTRB(40, 130, 40, 160),
        ).fit(_mapController.camera);
        // Leaflet's zoomSnap={0.25}: fitBounds rounds the zoom *down* to the
        // nearest quarter level, so the web shows a touch more area than an
        // exact fit — match it, or the pins cluster differently.
        final snapped = (fitted.zoom * 4).floorToDouble() / 4;
        _mapController.move(fitted.center, snapped);
      } else {
        _mapController.move(points.first, _focusZoom);
      }
    });
  }

  void _flyToSelected() {
    if (widget.selectedId == null) return;
    OfficeWithStatus? office;
    for (final o in widget.offices) {
      if (o.id == widget.selectedId) {
        office = o;
        break;
      }
    }
    if (office != null && office.hasCoordinates) {
      final targetZoom = _zoom > _focusZoom ? _zoom : _focusZoom;
      _mapController.move(ll.LatLng(office.lat!, office.lng!), targetZoom);
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fitToOffices());
  }

  @override
  Widget build(BuildContext context) {
    final tiles = getTileConfig();
    final located = _located;
    final byId = {for (final o in located) o.id: o};
    final clusters = clusterPoints(
      located.map((o) => ClusterInput(id: o.id, lat: o.lat!, lng: o.lng!)).toList(),
      _zoom,
      cellPx: 64, // OfficeMarkers passes 64, not clusterPoints' default 52
      keepSingle: widget.selectedId == null ? {} : {widget.selectedId!},
    );

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        backgroundColor: AppColors.sand,
        // Leaflet never rotates; pinch, pan and double-tap zoom only.
        interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
        initialCenter: _startCenter,
        initialZoom: _startZoom,
        onMapEvent: (event) {
          // Re-cluster at Leaflet's `zoomend`: when a gesture finishes, and
          // after every programmatic move (the initial fit, fly-to-office,
          // fly-to-location) — those never emit a MoveEnd, so without this
          // the pins kept clustering at the starting zoom of 5.
          final settled = event is MapEventMoveEnd ||
              event is MapEventFlingAnimationEnd ||
              event is MapEventDoubleTapZoomEnd ||
              event is MapEventScrollWheelZoom ||
              event.source == MapEventSource.mapController ||
              event.source == MapEventSource.fitCamera;
          if (settled) {
            final newZoom = event.camera.zoom;
            if (newZoom != _zoom) setState(() => _zoom = newZoom);
          }
        },
      ),
      children: [
        TileLayer(
          urlTemplate: tiles.urlTemplate,
          userAgentPackageName: 'app.vinvi.philatrail',
          maxZoom: tiles.maxZoom,
          tileProvider: NetworkTileProvider(headers: tileHeaders),
        ),
        MarkerLayer(
          markers: [
            for (final cluster in clusters)
              if (cluster.ids.length > 1)
                Marker(
                  key: ValueKey('c${cluster.key}-${cluster.ids.length}'),
                  point: ll.LatLng(cluster.lat, cluster.lng),
                  width: clusterSize(cluster.ids.length),
                  height: clusterSize(cluster.ids.length),
                  child: GestureDetector(
                    onTap: () {
                      final bounds = LatLngBounds.fromPoints([
                        for (final id in cluster.ids)
                          if (byId[id] != null) ll.LatLng(byId[id]!.lat!, byId[id]!.lng!),
                      ]);
                      _mapController.fitCamera(CameraFit.bounds(
                        bounds: bounds,
                        padding: const EdgeInsets.all(70),
                        maxZoom: 14,
                      ));
                    },
                    child: ClusterBubble(
                      count: cluster.ids.length,
                      progress: clusterProgress(
                        cluster.ids.where((id) => byId[id]?.status == OfficeStatus.visited).length,
                        cluster.ids.length,
                      ),
                    ),
                  ),
                )
              else if (byId[cluster.ids.first] != null)
                Marker(
                  key: ValueKey(cluster.ids.first),
                  point: ll.LatLng(cluster.lat, cluster.lng),
                  width: 30,
                  height: 30,
                  child: GestureDetector(
                    onTap: () => widget.onSelect(cluster.ids.first),
                    child: OfficePin(
                      status: byId[cluster.ids.first]!.status,
                      selected: cluster.ids.first == widget.selectedId,
                    ),
                  ),
                ),
            if (widget.userLocation != null)
              Marker(
                point: ll.LatLng(widget.userLocation!.lat, widget.userLocation!.lng),
                width: 20,
                height: 20,
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF1B73B3),
                    border: Border.all(color: Colors.white, width: 3),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }
}
