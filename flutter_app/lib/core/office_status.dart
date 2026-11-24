import '../models/post_office.dart';
import '../models/visit.dart';
import 'geo.dart';

/// Exact port of src/lib/office-status.ts.
const Map<OfficeStatus, String> statusLabel = {
  OfficeStatus.unvisited: 'Not visited',
  OfficeStatus.planned: 'Planned',
  OfficeStatus.visited: 'Visited',
};

OfficeStatus getOfficeStatus(
  int officeId,
  Map<int, Visit> visits,
  Set<int> plannedIds,
) {
  if (visits.containsKey(officeId)) return OfficeStatus.visited;
  return plannedIds.contains(officeId) ? OfficeStatus.planned : OfficeStatus.unvisited;
}

/// Attaches the user's status and distance to each office.
List<OfficeWithStatus> withStatus(
  List<PostOffice> offices,
  Map<int, Visit> visits,
  Set<int> plannedIds,
  Coordinates? userLocation,
) {
  return offices.map((office) {
    final status = getOfficeStatus(office.id, visits, plannedIds);
    double? km;
    if (userLocation != null && office.hasCoordinates) {
      km = distanceKm(userLocation, Coordinates(lat: office.lat!, lng: office.lng!));
    }
    return OfficeWithStatus.from(office, status: status, distanceKm: km);
  }).toList();
}

/// Nearest first; offices without coordinates go last.
List<OfficeWithStatus> sortByDistance(List<OfficeWithStatus> offices) {
  final sorted = [...offices];
  sorted.sort((a, b) =>
      (a.distanceKm ?? double.infinity).compareTo(b.distanceKm ?? double.infinity));
  return sorted;
}
