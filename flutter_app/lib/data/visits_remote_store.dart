import 'dart:typed_data';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/visit.dart';

/// Port of src/lib/visits/remote-store.ts. Every method here matches its
/// TS counterpart's semantics exactly, including which errors are swallowed
/// vs. rethrown — see the project's Guest → Cloud Sync & Merge Specification
/// before changing any of this.
class VisitsRemoteStore {
  final SupabaseClient _client;
  const VisitsRemoteStore(this._client);

  static const photoBucket = 'stamp-photos';

  /// Postgres error code for a foreign key violation, e.g. a post office
  /// that no longer exists.
  static const _foreignKeyViolation = '23503';
  static const _visitConflictTarget = 'user_id,post_office_id';
  static const _columns = 'post_office_id, visited_at, note, photo_path, is_public';

  Visit _toVisit(Map<String, dynamic> row) => Visit(
        officeId: row['post_office_id'] as int,
        visitedAt: row['visited_at'] as String,
        note: row['note'] as String? ?? '',
        photoPath: row['photo_path'] as String?,
        isPublic: row['is_public'] as bool? ?? false,
      );

  Map<String, dynamic> _toRow(String userId, Visit visit) => {
        'user_id': userId,
        'post_office_id': visit.officeId,
        'visited_at': visit.visitedAt,
        'note': visit.note,
        'photo_path': visit.photoPath,
        'is_public': visit.isPublic,
      };

  Future<List<Visit>> fetchVisits(String userId) async {
    final rows = await _client.from('visits').select(_columns).eq('user_id', userId);
    return (rows as List).map((r) => _toVisit(r as Map<String, dynamic>)).toList();
  }

  /// Records a first visit. If the user already has a visit for this office
  /// (for example it was stamped on another device or tab), the existing
  /// row, with its note and photo, is left exactly as it is.
  Future<void> insertVisitIfMissing(String userId, Visit visit) async {
    await _client.from('visits').upsert(
      _toRow(userId, visit),
      onConflict: _visitConflictTarget,
      ignoreDuplicates: true,
    );
  }

  /// Changes the note, photo and privacy of an existing visit. It never
  /// creates a row, so editing a visit that was removed elsewhere fails
  /// instead of silently bringing the visit back.
  Future<void> updateVisitDetails(String userId, Visit visit) async {
    final result = await _client
        .from('visits')
        .update({
          'note': visit.note,
          'photo_path': visit.photoPath,
          'is_public': visit.isPublic,
        })
        .eq('user_id', userId)
        .eq('post_office_id', visit.officeId)
        .select('post_office_id');
    if ((result as List).isEmpty) {
      throw StateError(
        'This visit was removed on another device. Reload to see your latest passport.',
      );
    }
  }

  /// Moves a guest's visits into their account without overwriting anything
  /// the account already has. If the batch is rejected because of one bad
  /// row (such as a post office that has since been removed), the rest are
  /// still saved via a one-row-at-a-time retry.
  Future<void> mergeGuestVisits(String userId, List<Visit> visits) async {
    if (visits.isEmpty) return;

    Future<void> upsertRows(List<Visit> rows) => _client.from('visits').upsert(
          rows.map((v) => _toRow(userId, v)).toList(),
          onConflict: _visitConflictTarget,
          ignoreDuplicates: true,
        );

    try {
      await upsertRows(visits);
    } on PostgrestException catch (e) {
      if (e.code != _foreignKeyViolation) rethrow;
      // One bad row rejected the whole batch — retry one at a time so the
      // rest still land.
      Object? failure;
      for (final visit in visits) {
        try {
          await upsertRows([visit]);
        } on PostgrestException catch (rowError) {
          if (rowError.code != _foreignKeyViolation) failure = rowError;
        }
      }
      if (failure != null) throw StateError(failure.toString());
    }
  }

  Future<void> deleteVisit(String userId, int officeId) async {
    await _client.from('visits').delete().eq('user_id', userId).eq('post_office_id', officeId);
  }

  /// Uploads an already-compressed stamp photo and returns its storage path.
  Future<String> uploadStampPhoto(String userId, int officeId, Uint8List bytes) async {
    final path = '$userId/$officeId-${DateTime.now().millisecondsSinceEpoch}.jpg';
    await _client.storage.from(photoBucket).uploadBinary(
          path,
          bytes,
          fileOptions: const FileOptions(contentType: 'image/jpeg'),
        );
    return path;
  }

  Future<void> removeStampPhoto(String path) async {
    await _client.storage.from(photoBucket).remove([path]);
  }
}
