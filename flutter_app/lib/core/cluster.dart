import 'dart:math';

/// Exact port of src/lib/cluster.ts. A simple grid-based cluster so results
/// are stable while panning — don't swap in a different clustering
/// algorithm (e.g. a plugin's) without re-checking it matches this behavior,
/// since the web app's zoom-dependent merge/split feel is tuned to this one.
class ClusterInput {
  final int id;
  final double lat;
  final double lng;
  const ClusterInput({required this.id, required this.lat, required this.lng});
}

class Cluster {
  /// Stable key: the lowest member id.
  final int key;
  final double lat;
  final double lng;
  final List<int> ids;
  const Cluster({
    required this.key,
    required this.lat,
    required this.lng,
    required this.ids,
  });
}

/// Zoom level from which every pin is shown on its own.
const double clusterMaxZoom = 12;

/// Web Mercator position in pixels at a zoom level (256px tiles).
({double x, double y}) _project(double lat, double lng, double zoom) {
  final scale = 256 * pow(2, zoom);
  final clampedLat = max(-85.0511, min(85.0511, lat));
  final sinLat = sin(clampedLat * pi / 180);
  return (
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - log((1 + sinLat) / (1 - sinLat)) / (4 * pi)) * scale,
  );
}

/// Groups points that would sit within [cellPx] screen pixels of each other
/// at this zoom. Points listed in [keepSingle] (for example the selected
/// office) are never merged.
List<Cluster> clusterPoints(
  List<ClusterInput> points,
  double rawZoom, {
  double cellPx = 52,
  Set<int> keepSingle = const {},
}) {
  // JS's `Math.floor(Infinity)` is Infinity, but Dart's `.floor()` throws
  // "Unsupported operation: Infinity or NaN toInt", so a non-finite zoom the
  // web app would merely render oddly takes the whole map down here. Treat
  // NaN as the starting zoom and clamp everything else into the tile range.
  final zoom = rawZoom.isNaN ? 5.0 : rawZoom.clamp(0.0, 22.0);
  if (zoom >= clusterMaxZoom) {
    return points
        .map((p) => Cluster(key: p.id, lat: p.lat, lng: p.lng, ids: [p.id]))
        .toList();
  }
  final cells = <String, List<ClusterInput>>{};
  final result = <Cluster>[];
  for (final point in points) {
    if (keepSingle.contains(point.id)) {
      result.add(Cluster(key: point.id, lat: point.lat, lng: point.lng, ids: [point.id]));
      continue;
    }
    final projected = _project(point.lat, point.lng, zoom);
    final cell = '${(projected.x / cellPx).floor()}:${(projected.y / cellPx).floor()}';
    (cells[cell] ??= []).add(point);
  }
  for (final bucket in cells.values) {
    final lat = bucket.map((p) => p.lat).reduce((a, b) => a + b) / bucket.length;
    final lng = bucket.map((p) => p.lng).reduce((a, b) => a + b) / bucket.length;
    final ids = bucket.map((p) => p.id).toList()..sort();
    result.add(Cluster(key: ids.first, lat: lat, lng: lng, ids: ids));
  }
  return result;
}
