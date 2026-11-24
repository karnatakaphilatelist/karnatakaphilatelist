import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/date.dart';
import '../models/visit.dart';
import 'guest_visits.dart';
import 'visits_remote_store.dart';

/// Fields a user can change after marking an office as visited. Mirrors
/// VisitDetails in VisitsProvider.tsx.
class VisitDetailsInput {
  final String note;
  final bool isPublic;
  /// A newly chosen (already-compressed) photo to upload — signed-in users only.
  final Uint8List? newPhoto;
  final bool removePhoto;
  const VisitDetailsInput({
    required this.note,
    required this.isPublic,
    this.newPhoto,
    this.removePhoto = false,
  });
}

/// Identifies the guest. Can never equal a user id, which is always a UUID
/// — same invariant the web app relies on.
const String guestOwner = 'guest';

/// Port of VisitsProvider.tsx as a ChangeNotifier. Read the project's
/// "Guest → Cloud Sync & Merge Specification" before changing ANY of the
/// sequencing or concurrency-strategy logic below — replicate it exactly,
/// don't "clean it up" into one unified strategy; the three different
/// patterns (optimistic markVisited/removeVisit vs. pessimistic
/// saveDetails) are deliberate, not an oversight in the original.
class VisitsController extends ChangeNotifier {
  final VisitsRemoteStore _remote;
  final GuestStorage _guestStorage;
  final SupabaseClient _client;

  VisitsController(SupabaseClient client)
      : _client = client,
        _remote = VisitsRemoteStore(client),
        _guestStorage = GuestStorage() {
    _loadPlanned();
    _identityKey = _currentIdentityKey();
    _load();
    _authSub = client.auth.onAuthStateChange.listen((_) {
      final next = _currentIdentityKey();
      if (next != _identityKey) {
        _identityKey = next;
        _load();
      }
    });
  }

  StreamSubscription<AuthState>? _authSub;

  Map<int, Visit> _visits = {};
  Set<int> _plannedIds = {};
  String? _ownerKey; // whose data _visits currently holds
  late String _identityKey; // whose data it SHOULD hold
  int _loadGeneration = 0; // race guard: a stale in-flight load must never win
  String? _lastError;

  /// Current user's visits keyed by post office id. Empty until [isReady].
  Map<int, Visit> get visits => isReady ? _visits : const {};
  Set<int> get plannedIds => _plannedIds;

  /// False until the visits for the person currently using the app (the
  /// signed-in user, or the guest) have been loaded. Goes back to false on
  /// sign-in/out, so one person's stamps are never shown as another's.
  bool get isReady => _ownerKey == _identityKey;

  /// Set after an action fails; read it once and it's yours (no built-in
  /// toast queue here — the UI layer decides how to show it, e.g. a
  /// SnackBar, then should treat it as consumed).
  String? get lastError => _lastError;
  void clearError() {
    _lastError = null;
  }

  String? get _userId => _client.auth.currentUser?.id;
  String _currentIdentityKey() => _userId ?? guestOwner;

  Future<void> _loadPlanned() async {
    _plannedIds = await _guestStorage.readPlannedIds();
    notifyListeners();
  }

  bool _isLoadedForCurrentPerson() {
    if (_ownerKey == _identityKey) return true;
    _lastError = 'Your passport is still loading. Try again in a moment.';
    notifyListeners();
    return false;
  }

  /// Load visits for the current user, or for the guest when signed out.
  /// Guest visits are merged into the account the first time someone signs
  /// in. Exact sequencing from the spec: guest read → merge-if-signed-in →
  /// always-fetch-fresh-server-list → commit.
  Future<void> _load() async {
    final generation = ++_loadGeneration;
    final userId = _userId;
    final identityKey = _identityKey;

    final guestVisits = await _guestStorage.readVisits();
    var loaded = guestVisits;
    Object? mergeError;
    Object? loadError;

    if (userId != null) {
      if (guestVisits.isNotEmpty) {
        try {
          await _remote.mergeGuestVisits(userId, guestVisits);
          await _guestStorage.clearVisits();
        } catch (e) {
          // Keep the stamps on this device so the next sign-in can try
          // again, and still show the account's own passport below.
          mergeError = e;
        }
      }
      try {
        loaded = await _remote.fetchVisits(userId);
      } catch (e) {
        loaded = [];
        loadError = e;
      }
    }

    // A stale in-flight load (e.g. the user signed out mid-fetch) must
    // never overwrite state after the identity changed — generation
    // counter is this port's equivalent of the web app's `cancelled` flag.
    if (generation != _loadGeneration) return;

    _visits = {for (final v in loaded) v.officeId: v};
    _ownerKey = identityKey;

    if (loadError != null) {
      _lastError = 'Could not load your passport. ${loadError.toString()}';
    } else if (mergeError != null) {
      _lastError = 'Could not move your guest stamps to your account. ${mergeError.toString()}';
    }
    notifyListeners();
  }

  void _commit(Map<int, Visit> next) {
    _visits = next;
    if (_userId == null) {
      // Fire-and-forget, matching the web app's writeJson (not awaited by callers).
      unawaited(_guestStorage.writeVisits(next.values.toList()));
    }
    notifyListeners();
  }

  Map<int, Visit> _withoutOffice(Map<int, Visit> visits, int officeId) {
    final next = Map<int, Visit>.from(visits)..remove(officeId);
    return next;
  }

  /// Optimistic: commits locally first, persists remotely after. Guests
  /// never make a remote call at all — purely local, always "succeeds."
  Future<bool> markVisited(int officeId) async {
    if (!_isLoadedForCurrentPerson()) return false;
    final previous = _visits;
    // Already stamped: never replace the existing note and photo with a blank visit.
    if (previous.containsKey(officeId)) return true;

    final visit = Visit(
      officeId: officeId,
      visitedAt: todayIso(),
      note: '',
      photoPath: null,
      isPublic: false,
    );
    _commit({...previous, officeId: visit});

    final userId = _userId;
    if (userId == null) return true;
    try {
      await _remote.insertVisitIfMissing(userId, visit);
      return true;
    } catch (e) {
      _commit(_withoutOffice(_visits, officeId));
      _lastError = 'Could not save your visit. ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  /// Pessimistic: uploads any new photo and updates the remote row first;
  /// local state only updates after the server confirms. On any failure an
  /// uploaded photo is discarded so nothing orphaned is left behind.
  Future<bool> saveDetails(int officeId, VisitDetailsInput details) async {
    if (!_isLoadedForCurrentPerson()) return false;
    final current = _visits[officeId];
    if (current == null) return false;

    String? uploadedPath;
    Future<void> discardUpload() async {
      final path = uploadedPath;
      if (path != null) {
        try {
          await _remote.removeStampPhoto(path);
        } catch (_) {}
      }
    }

    final userId = _userId;
    try {
      var photoPath = details.removePhoto ? null : current.photoPath;
      if (userId != null && details.newPhoto != null) {
        uploadedPath = await _remote.uploadStampPhoto(userId, officeId, details.newPhoto!);
        photoPath = uploadedPath;
      }

      final updated = current.copyWith(
        note: details.note.trim(),
        photoPath: photoPath,
        isPublic: details.isPublic,
      );
      if (userId != null) {
        await _remote.updateVisitDetails(userId, updated);
      }

      // The visit was removed while this was saving: do not bring it back.
      if (!_visits.containsKey(officeId)) {
        await discardUpload();
        return false;
      }
      _commit({..._visits, officeId: updated});

      // Clean up the replaced photo only after the new state is safely saved.
      if (userId != null && current.photoPath != null && current.photoPath != photoPath) {
        try {
          await _remote.removeStampPhoto(current.photoPath!);
        } catch (_) {}
      }
      return true;
    } catch (e) {
      await discardUpload();
      _lastError = 'Could not save your changes. ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  /// Optimistic: removes from local state immediately, deletes remotely
  /// after; restores the visit locally and reports the error on failure.
  Future<bool> removeVisit(int officeId) async {
    if (!_isLoadedForCurrentPerson()) return false;
    final existing = _visits[officeId];
    if (existing == null) return true;

    _commit(_withoutOffice(_visits, officeId));
    final userId = _userId;
    if (userId == null) return true;
    try {
      await _remote.deleteVisit(userId, officeId);
      if (existing.photoPath != null) {
        try {
          await _remote.removeStampPhoto(existing.photoPath!);
        } catch (_) {}
      }
      return true;
    } catch (e) {
      _commit({..._visits, officeId: existing});
      _lastError = 'Could not remove your visit. ${e.toString()}';
      notifyListeners();
      return false;
    }
  }

  /// Planned offices are a personal to-do list kept on this device only —
  /// never sent to Supabase, never merged, untouched by sign-in/out. Don't
  /// add server sync for this; there isn't any on the web side either.
  void togglePlanned(int officeId) {
    final next = Set<int>.from(_plannedIds);
    if (!next.remove(officeId)) next.add(officeId);
    _plannedIds = next;
    unawaited(_guestStorage.writePlannedIds(next));
    notifyListeners();
  }

  @override
  void dispose() {
    _authSub?.cancel();
    super.dispose();
  }
}
