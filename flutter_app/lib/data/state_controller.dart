import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/constants.dart';
import '../core/states.dart';
import '../models/post_office.dart';

/// Port of StateProvider.tsx + useStateOffices. Only owns the persisted
/// choice (SharedPreferences, same key/shape as the web app's `kp:state:v1`)
/// — the office list itself lives in OfficesController and is passed in
/// here rather than cached, so there's no risk of this controller acting on
/// a stale copy of the office list.
class StateController extends ChangeNotifier {
  String? _stored;

  StateController() {
    _load();
  }

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _stored = prefs.getString(StorageKeys.state);
      notifyListeners();
    } catch (_) {
      // No stored choice yet — resolveState() falls back to Karnataka.
    }
  }

  List<StateOption> statesFor(List<PostOffice> allOffices) =>
      liveStates(allOffices.map((o) => o.state));

  String stateCodeFor(List<PostOffice> allOffices) =>
      resolveState(_stored, statesFor(allOffices));

  List<PostOffice> officesFor(List<PostOffice> allOffices) {
    final code = stateCodeFor(allOffices);
    return allOffices.where((o) => o.state == code).toList();
  }

  void choose(String code) {
    _stored = code;
    notifyListeners();
    unawaited(_persist(code));
  }

  Future<void> _persist(String code) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(StorageKeys.state, code);
    } catch (_) {
      // Best-effort, matching the web app's writeJson.
    }
  }
}
