// Smoke test for the scaffold entry point. Replace once real screens land —
// see flutter_app/README.md and the project doc's file-level implementation
// plan for what's next.

import 'package:flutter_test/flutter_test.dart';

import 'package:philatrail/main.dart';

void main() {
  testWidgets(
      'PhilatrailApp builds and shows the missing-config screen '
      'when SUPABASE_URL/SUPABASE_ANON_KEY are not provided',
      (WidgetTester tester) async {
    await tester.pumpWidget(const PhilatrailApp());

    expect(find.textContaining('Missing SUPABASE_URL'), findsOneWidget);
  });
}
