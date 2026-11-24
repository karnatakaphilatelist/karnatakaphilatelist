import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../core/constants.dart';
import '../core/date.dart';
import '../models/visit.dart';

/// Port of src/lib/visits/guest-visits.ts + the localStorage read/write
/// helpers in src/lib/local-storage.ts (SharedPreferences is the Dart
/// equivalent of localStorage here).
const int maxNoteLength = 1000;

/// Turns whatever is stored on the device into clean guest visits.
///
/// SharedPreferences can hold anything written by an older app version, so
/// rows that cannot be trusted are dropped rather than allowed to crash the
/// app or be sent to the database. Guests cannot have photos, so photoPath
/// is always null — same rule as the web app, not weakened here.
List<Visit> parseGuestVisits(Object? raw) {
  if (raw is! List) return [];

  final byOffice = <int, Visit>{};
  for (final item in raw) {
    if (item is! Map) continue;
    final row = item;

    final officeIdRaw = row['officeId'];
    if (officeIdRaw is! int || officeIdRaw <= 0) continue;

    final visitedAtRaw = row['visitedAt'];
    final visitedAt = (visitedAtRaw is String && isoDatePattern.hasMatch(visitedAtRaw))
        ? visitedAtRaw
        : todayIso();

    final noteRaw = row['note'];
    final note = noteRaw is String
        ? (noteRaw.length > maxNoteLength ? noteRaw.substring(0, maxNoteLength) : noteRaw)
        : '';

    byOffice[officeIdRaw] = Visit(
      officeId: officeIdRaw,
      visitedAt: visitedAt,
      note: note,
      photoPath: null,
      isPublic: row['isPublic'] == true,
    );
  }
  return byOffice.values.toList();
}

/// Planned office ids stored on the device, ignoring anything that is not a
/// whole number.
List<int> parsePlannedIds(Object? raw) {
  if (raw is! List) return [];
  return raw.whereType<int>().toList();
}

/// Local persistence for guest visits/planned ids, mirroring readJson/
/// writeJson/removeKey in local-storage.ts. Failures are swallowed the same
/// way — a full or blocked store should never crash the app, only mean
/// progress doesn't persist.
class GuestStorage {
  Future<List<Visit>> readVisits() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(StorageKeys.guestVisits);
      if (raw == null) return [];
      return parseGuestVisits(jsonDecode(raw));
    } catch (_) {
      return [];
    }
  }

  Future<void> writeVisits(List<Visit> visits) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        StorageKeys.guestVisits,
        jsonEncode(visits.map((v) => v.toJson()).toList()),
      );
    } catch (_) {
      // Storage can be full or restricted; progress simply won't persist.
    }
  }

  Future<void> clearVisits() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(StorageKeys.guestVisits);
    } catch (_) {}
  }

  Future<Set<int>> readPlannedIds() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(StorageKeys.planned);
      if (raw == null) return {};
      return parsePlannedIds(jsonDecode(raw)).toSet();
    } catch (_) {
      return {};
    }
  }

  Future<void> writePlannedIds(Set<int> ids) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(StorageKeys.planned, jsonEncode(ids.toList()));
    } catch (_) {}
  }
}
