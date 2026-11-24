/// Mirrors `Visit`/`VisitPatch` in `src/types/index.ts`. The merge/sync rules
/// this type participates in are written down in full in the project's
/// "Guest → Cloud Sync & Merge Specification" doc — read that before writing
/// any repository code that touches this model. Identity is the pair
/// (user id, officeId): one visit per office per user, enforced by a DB
/// unique constraint, not by anything in this client.
class Visit {
  final int officeId;

  /// ISO calendar date, e.g. "2026-10-11".
  final String visitedAt;
  final String note;

  /// Path inside the private `stamp-photos` storage bucket. Always null for a
  /// guest (not-signed-in) visit — see VisitPatch below and the sync spec.
  final String? photoPath;
  final bool isPublic;

  const Visit({
    required this.officeId,
    required this.visitedAt,
    required this.note,
    required this.photoPath,
    required this.isPublic,
  });

  factory Visit.fromJson(Map<String, dynamic> json) {
    return Visit(
      officeId: json['officeId'] as int,
      visitedAt: json['visitedAt'] as String,
      note: json['note'] as String? ?? '',
      photoPath: json['photoPath'] as String?,
      isPublic: json['isPublic'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'officeId': officeId,
        'visitedAt': visitedAt,
        'note': note,
        'photoPath': photoPath,
        'isPublic': isPublic,
      };

  Visit copyWith({String? note, String? photoPath, bool? isPublic}) {
    return Visit(
      officeId: officeId,
      visitedAt: visitedAt,
      note: note ?? this.note,
      photoPath: photoPath ?? this.photoPath,
      isPublic: isPublic ?? this.isPublic,
    );
  }
}

/// Fields a user can change after marking an office as visited — mirrors
/// `VisitPatch` (a `Partial<Pick<Visit, "note" | "photoPath" | "isPublic">>`
/// in TypeScript; Dart has no structural partial type, so this is spelled out).
class VisitPatch {
  final String? note;
  final String? photoPath;
  final bool? isPublic;

  const VisitPatch({this.note, this.photoPath, this.isPublic});
}
