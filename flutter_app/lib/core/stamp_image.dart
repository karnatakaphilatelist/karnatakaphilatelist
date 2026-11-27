import 'env.dart';

/// Port of src/lib/stamp-image.ts.

const String stampBucket = 'office-stamps';

/// Public URL of a post office's official stamp image, or null when it has
/// none (or SUPABASE_URL wasn't provided at build time).
String? stampImageUrl(String? path) {
  if (path == null || path.isEmpty || supabaseUrl.isEmpty) return null;
  return '$supabaseUrl/storage/v1/object/public/$stampBucket/${Uri.encodeFull(path)}';
}
