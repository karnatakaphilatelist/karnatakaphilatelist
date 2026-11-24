/// Port of src/lib/stamp-image.ts. Reads SUPABASE_URL via --dart-define,
/// same per-file compile-time-const pattern as main.dart's own copy and
/// core/map_tiles.dart's MAPTILER_KEY — not shared through a single env
/// file, to keep each file's actual dependency visible at its use site.
const String _supabaseUrl = String.fromEnvironment('SUPABASE_URL');

const String stampBucket = 'office-stamps';

/// Public URL of a post office's official stamp image, or null when it has
/// none (or SUPABASE_URL wasn't provided at build time).
String? stampImageUrl(String? path) {
  if (path == null || path.isEmpty || _supabaseUrl.isEmpty) return null;
  return '$_supabaseUrl/storage/v1/object/public/$stampBucket/${Uri.encodeFull(path)}';
}
