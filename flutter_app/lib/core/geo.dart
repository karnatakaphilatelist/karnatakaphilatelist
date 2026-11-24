import 'dart:math';

import '../models/post_office.dart';

/// Great-circle distance helpers. Exact port of src/lib/geo.ts — keep the
/// constants and formulas identical, this is what distance sorting and
/// "how close to count as here" depend on.
const double earthRadiusKm = 6371;

double _toRadians(double degrees) => degrees * pi / 180;

/// Great-circle distance between two points, in kilometres.
double distanceKm(Coordinates a, Coordinates b) {
  final dLat = _toRadians(b.lat - a.lat);
  final dLng = _toRadians(b.lng - a.lng);
  final h = pow(sin(dLat / 2), 2) +
      cos(_toRadians(a.lat)) * cos(_toRadians(b.lat)) * pow(sin(dLng / 2), 2);
  return 2 * earthRadiusKm * asin(sqrt(h));
}

String formatDistance(double km) {
  return km < 10 ? '${km.toStringAsFixed(1)} km' : '${km.round()} km';
}

/// How close (km) someone has to be for the app to say they are at the post
/// office. Matches AT_OFFICE_KM in src/lib/geo.ts.
const double atOfficeKm = 0.15;

/// Short distance for status messages: metres under a kilometre, kilometres
/// above.
String formatShortDistance(double km) {
  if (km < 1) {
    final metres = (km * 1000 / 10).round() * 10;
    return '${max(10, metres)} m';
  }
  return formatDistance(km);
}

enum Proximity { unknown, here, away }

/// Whether a measured distance counts as being at the post office. `null`
/// means no location yet.
Proximity proximity(double? km) {
  if (km == null) return Proximity.unknown;
  return km <= atOfficeKm ? Proximity.here : Proximity.away;
}
