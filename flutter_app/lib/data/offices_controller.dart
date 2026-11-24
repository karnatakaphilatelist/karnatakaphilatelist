import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/post_office.dart';
import 'office_repository.dart';

/// Fetches the full (India-wide) office list once at app start and shares it
/// between ExploreScreen and PassportScreen, so both filter the same data
/// through the same StateController rather than each fetching (and
/// potentially diverging) their own copy.
class OfficesController extends ChangeNotifier {
  final OfficeRepository _repository;
  List<PostOffice> offices = [];
  bool loading = true;
  Object? error;

  OfficesController(SupabaseClient client) : _repository = OfficeRepository(client) {
    reload();
  }

  Future<void> reload() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      offices = await _repository.getPostOffices();
      loading = false;
    } catch (e) {
      error = e;
      loading = false;
    }
    notifyListeners();
  }
}
