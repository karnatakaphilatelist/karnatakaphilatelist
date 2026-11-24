import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/post_office.dart';

/// Port of src/lib/offices.ts, minus the bundled-snapshot fallback (that
/// snapshot is a build-time JSON file baked into the Next.js app; porting it
/// here means vendoring a copy into flutter_app/assets/ — deliberately
/// deferred until there's a real asset pipeline, so the "database
/// unreachable" case currently surfaces as a thrown error/empty state
/// instead of silently falling back. Track this gap before shipping.
class OfficeRepository {
  final SupabaseClient _client;
  const OfficeRepository(this._client);

  static const _baseColumns = 'id, name, pincode, district, lat, lng';
  static const _undefinedColumn = '42703'; // Postgres: column does not exist

  /// The master list of passport post offices, same columns/fallback
  /// sequence as loadFromDatabase() in offices.ts (so this keeps working
  /// against a database that hasn't had every migration run yet).
  Future<List<PostOffice>> getPostOffices() async {
    const columnSets = [
      '$_baseColumns, state_code, stamp_image_path, about_place',
      '$_baseColumns, state_code, stamp_image_path',
      '$_baseColumns, stamp_image_path',
      _baseColumns,
    ];

    List<Map<String, dynamic>>? rows;
    Object? lastError;
    for (final columns in columnSets) {
      try {
        final result = await _client
            .from('post_offices')
            .select(columns)
            .order('name')
            .timeout(const Duration(seconds: 4));
        rows = List<Map<String, dynamic>>.from(result as List);
        break;
      } on PostgrestException catch (e) {
        lastError = e;
        if (e.code != _undefinedColumn) rethrow;
        // Column doesn't exist yet on this database — try the next, narrower column set.
      }
    }

    if (rows == null) {
      throw StateError('Could not load post offices: $lastError');
    }
    if (rows.isEmpty) {
      throw StateError('Could not load post offices: the table returned no rows');
    }

    final offices = rows.map(_toPostOffice).toList()
      ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    return offices;
  }

  PostOffice _toPostOffice(Map<String, dynamic> row) {
    return PostOffice(
      id: row['id'] as int,
      // formatPlaceName() in format.ts does title-casing; row data is assumed
      // already stored title-cased in practice today — revisit if raw rows
      // ever come back inconsistently cased.
      name: row['name'] as String,
      pincode: row['pincode']?.toString() ?? '',
      district: (row['district'] as String?) ?? 'Unknown district',
      state: (row['state_code'] as String?) ?? 'KA',
      lat: (row['lat'] as num?)?.toDouble(),
      lng: (row['lng'] as num?)?.toDouble(),
      stampImagePath: row['stamp_image_path'] as String?,
      aboutPlace: row['about_place'] as String?,
    );
  }
}
