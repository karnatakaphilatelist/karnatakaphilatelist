// Smoke test for the scaffold entry point. Replace once real screens land —
// see flutter_app/README.md and the project doc's file-level implementation
// plan for what's next.

import 'package:flutter_test/flutter_test.dart';

import 'package:philatrail/main.dart';

void main() {
  testWidgets('PhilatrailApp builds and shows the scaffold placeholder',
      (WidgetTester tester) async {
    await tester.pumpWidget(const PhilatrailApp());

    expect(find.text('Philatrail — Flutter scaffold stage'), findsOneWidget);
  });
}
