import 'dart:convert';
import 'dart:math' as math;

import 'package:shared_preferences/shared_preferences.dart';

import '../models/post_office.dart';

/// Port of src/lib/geofence.ts's pure logic (distance math + per-office
/// notify cooldown). The live web source confirms the radius below is 300m
/// — not a guess, read fresh from src/lib/geofence.ts this stage.
const int geofenceRadiusM = 300;

/// Minimum time between repeat notifications for the same office (24h, same
/// as the web app) so a person who walks past daily still gets re-alerted.
const Duration _cooldown = Duration(hours: 24);

const String _notifiedKey = 'pt_notified';

/// Haversine great-circle distance between two lat/lng points, in metres.
double distanceM(double lat1, double lng1, double lat2, double lng2) {
  const r = 6371000.0;
  double toRad(double d) => d * math.pi / 180;
  final dLat = toRad(lat2 - lat1);
  final dLng = toRad(lng2 - lng1);
  final a = math.pow(math.sin(dLat / 2), 2).toDouble() +
      math.cos(toRad(lat1)) * math.cos(toRad(lat2)) * math.pow(math.sin(dLng / 2), 2).toDouble();
  return 2 * r * math.asin(math.sqrt(a));
}

/// Tracks which offices were recently notified, so the background watcher
/// doesn't spam the same office repeatedly. Mirrors geofence.ts's
/// localStorage-backed loadNotified/saveNotified/markNotified via
/// SharedPreferences.
class GeofenceNotifyTracker {
  Future<Map<int, int>> _read() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_notifiedKey);
      if (raw == null) return {};
      final decoded = jsonDecode(raw) as Map<String, dynamic>;
      return decoded.map((k, v) => MapEntry(int.parse(k), v as int));
    } catch (_) {
      return {};
    }
  }

  Future<void> _write(Map<int, int> map) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_notifiedKey, jsonEncode(map.map((k, v) => MapEntry('$k', v))));
    } catch (_) {
      // Best-effort, matching the web app.
    }
  }

  /// Given the current position and the unvisited offices, returns the
  /// first office within [geofenceRadiusM] that hasn't been notified within
  /// the cooldown window — or null if none qualify.
  Future<PostOffice?> findNearbyOffice(
    double lat,
    double lng,
    List<PostOffice> offices,
    Set<int> visitedIds,
  ) async {
    final notified = await _read();
    final now = DateTime.now().millisecondsSinceEpoch;
    for (final office in offices) {
      if (visitedIds.contains(office.id)) continue;
      if (office.lat == null || office.lng == null) continue;
      final dist = distanceM(lat, lng, office.lat!, office.lng!);
      if (dist > geofenceRadiusM) continue;
      final lastNotified = notified[office.id] ?? 0;
      if (now - lastNotified < _cooldown.inMilliseconds) continue;
      return office;
    }
    return null;
  }

  Future<void> markNotified(int officeId) async {
    final map = await _read();
    map[officeId] = DateTime.now().millisecondsSinceEpoch;
    await _write(map);
  }
}
