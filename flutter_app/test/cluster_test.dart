import 'package:flutter_test/flutter_test.dart';
import 'package:philatrail/core/cluster.dart';

void main() {
  const bengaluru = ClusterInput(id: 1, lat: 12.97, lng: 77.59);
  const mysuru = ClusterInput(id: 2, lat: 12.30, lng: 76.64);
  // Two offices at one coordinate — the shape that makes CameraFit hand the
  // map an infinite zoom.
  const sameSpotA = ClusterInput(id: 3, lat: 12.97, lng: 77.59);

  test('merges nearby points and keeps distant ones apart', () {
    final clusters = clusterPoints([bengaluru, sameSpotA, mysuru], 6);
    expect(clusters.length, 2);
    final merged = clusters.firstWhere((c) => c.ids.length > 1);
    expect(merged.ids, [1, 3]);
    expect(merged.key, 1, reason: 'stable key is the lowest member id');
  });

  test('every pin stands alone at or above clusterMaxZoom', () {
    final clusters = clusterPoints([bengaluru, sameSpotA], clusterMaxZoom);
    expect(clusters.length, 2);
  });

  test('keepSingle is never merged', () {
    final clusters = clusterPoints([bengaluru, sameSpotA], 6, keepSingle: {3});
    expect(clusters.length, 2);
  });

  // Dart's .floor() throws UnsupportedError on a non-finite double, which
  // crashed the whole Explore map ("Unsupported operation: Infinity or NaN
  // toInt") whenever a degenerate fit produced one of these zooms.
  for (final zoom in [double.infinity, double.negativeInfinity, double.nan]) {
    test('survives a $zoom zoom instead of throwing', () {
      expect(() => clusterPoints([bengaluru, mysuru], zoom), returnsNormally);
      expect(clusterPoints([bengaluru, mysuru], zoom), isNotEmpty);
    });
  }
}
