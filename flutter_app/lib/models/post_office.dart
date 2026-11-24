/// Mirrors `PostOffice` in `src/types/index.ts`. Keep these two in sync by hand —
/// there is no shared-codegen step; see the "API-Ready, Low-Friction Data Boundary"
/// rule in CLAUDE.md (Supabase + RLS is the shared contract, not a generated schema).
class PostOffice {
  final int id;
  final String name;
  final String pincode;
  final String district;

  /// Two-letter state code, e.g. "KA"; see src/lib/states.ts.
  final String state;

  /// Null when the office has no coordinates yet; such offices are listed but not mapped.
  final double? lat;
  final double? lng;

  /// Path of the official stamp image in the public `office-stamps` bucket; null until uploaded.
  final String? stampImagePath;

  /// A short original note on why this office is on the list. Null until written
  /// (absent entirely before the migration that added it — treat null and "not present"
  /// the same way on this client).
  final String? aboutPlace;

  const PostOffice({
    required this.id,
    required this.name,
    required this.pincode,
    required this.district,
    required this.state,
    required this.lat,
    required this.lng,
    required this.stampImagePath,
    this.aboutPlace,
  });

  factory PostOffice.fromJson(Map<String, dynamic> json) {
    return PostOffice(
      id: json['id'] as int,
      name: json['name'] as String,
      pincode: json['pincode'] as String,
      district: json['district'] as String,
      state: json['state'] as String,
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      stampImagePath: json['stampImagePath'] as String?,
      aboutPlace: json['aboutPlace'] as String?,
    );
  }

  bool get hasCoordinates => lat != null && lng != null;
}

class Coordinates {
  final double lat;
  final double lng;

  const Coordinates({required this.lat, required this.lng});
}

enum OfficeStatus { unvisited, planned, visited }

/// A post office combined with the current user's progress and location.
class OfficeWithStatus extends PostOffice {
  final OfficeStatus status;

  /// Straight-line distance from the user; null until location is shared.
  final double? distanceKm;

  const OfficeWithStatus({
    required super.id,
    required super.name,
    required super.pincode,
    required super.district,
    required super.state,
    required super.lat,
    required super.lng,
    required super.stampImagePath,
    super.aboutPlace,
    required this.status,
    required this.distanceKm,
  });

  factory OfficeWithStatus.from(PostOffice office, {
    required OfficeStatus status,
    required double? distanceKm,
  }) {
    return OfficeWithStatus(
      id: office.id,
      name: office.name,
      pincode: office.pincode,
      district: office.district,
      state: office.state,
      lat: office.lat,
      lng: office.lng,
      stampImagePath: office.stampImagePath,
      aboutPlace: office.aboutPlace,
      status: status,
      distanceKm: distanceKm,
    );
  }
}
