import 'package:flutter_test/flutter_test.dart';
import 'package:philatrail/core/env.dart';
import 'package:philatrail/core/stamp_image.dart';

void main() {
  // A build made without --dart-define once shipped with no backend at all.
  test('Supabase config has usable defaults', () {
    expect(supabaseUrl, startsWith('https://'));
    expect(supabaseAnonKey, isNotEmpty);
  });

  test('stamp image URL is built from the default project', () {
    expect(stampImageUrl(null), isNull);
    expect(stampImageUrl('a b.png'), startsWith('$supabaseUrl/storage/v1/object/public/'));
  });
}
