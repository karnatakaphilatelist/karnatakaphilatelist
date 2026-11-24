import 'package:supabase_flutter/supabase_flutter.dart';

/// Port of src/lib/delete-account.ts: remove this user's stamp photos from
/// storage BEFORE the RPC call, same ordering (and reasoning — an orphaned
/// storage file is harmless, a deleted account with files still billed
/// against it is not) as the web app.
Future<void> deleteMyAccount(SupabaseClient client, String userId) async {
  try {
    final visitRows = await client.from('visits').select('photo_path').eq('user_id', userId);
    final paths = (visitRows as List)
        .map((r) => r['photo_path'] as String?)
        .whereType<String>()
        .toList();
    if (paths.isNotEmpty) {
      await client.storage.from('stamp-photos').remove(paths);
    }
  } catch (e) {
    throw Exception('Could not remove your stamp photos. Please try again.');
  }

  try {
    await client.rpc('delete_my_account');
  } catch (e) {
    throw Exception('Could not delete your account. Please try again.');
  }
}
