import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/format.dart';
import '../models/post_office.dart';

/// Port of src/lib/offices.ts, including its bundled-snapshot fallback: when
/// the database can't be reached (a paused free-tier project, no signal on
/// first launch), the copy shipped in assets/data/ is used instead of
/// failing, exactly as the web app does.
class OfficeRepository {
  final SupabaseClient? _client;
  const OfficeRepository(this._client);

  static const _baseColumns = 'id, name, pincode, district, lat, lng';
  static const _undefinedColumn = '42703'; // Postgres: column does not exist

  Future<List<PostOffice>> getPostOffices() async {
    List<Map<String, dynamic>> rows;
    try {
      rows = await _loadFromDatabase();
    } catch (error) {
      debugPrint('[offices] Database unavailable, showing the bundled list of post offices. $error');
      final raw = await rootBundle.loadString('assets/data/post-offices.snapshot.json');
      rows = List<Map<String, dynamic>>.from(jsonDecode(raw) as List);
    }
    final offices = rows.map(_toPostOffice).toList()
      ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    return offices;
  }

  /// Same columns/fallback sequence as loadFromDatabase() in offices.ts, so
  /// this keeps working against a database that hasn't had every migration.
  Future<List<Map<String, dynamic>>> _loadFromDatabase() async {
    final client = _client;
    if (client == null) throw StateError('No database client');
    const columnSets = [
      '$_baseColumns, state_code, stamp_image_path, about_place',
      '$_baseColumns, state_code, stamp_image_path',
      '$_baseColumns, stamp_image_path',
      _baseColumns,
    ];
    for (final columns in columnSets) {
      try {
        final result = await client.from('post_offices').select(columns).order('name').timeout(const Duration(seconds: 4));
        final rows = List<Map<String, dynamic>>.from(result as List);
        if (rows.isEmpty) throw StateError('Could not load post offices: the table returned no rows');
        return rows;
      } on PostgrestException catch (e) {
        if (e.code != _undefinedColumn) rethrow;
      }
    }
    throw StateError('Could not load post offices');
  }

  PostOffice _toPostOffice(Map<String, dynamic> row) {
    final district = row['district'] as String?;
    return PostOffice(
      id: row['id'] as int,
      name: formatPlaceName(row['name'] as String),
      pincode: row['pincode']?.toString() ?? '',
      district: (district == null || district.isEmpty) ? 'Unknown district' : formatPlaceName(district),
      state: (row['state_code'] as String?) ?? 'KA',
      lat: (row['lat'] as num?)?.toDouble(),
      lng: (row['lng'] as num?)?.toDouble(),
      stampImagePath: row['stamp_image_path'] as String?,
      aboutPlace: row['about_place'] as String?,
    );
  }
}
