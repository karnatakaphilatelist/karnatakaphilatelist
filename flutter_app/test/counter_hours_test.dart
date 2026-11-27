import 'package:flutter_test/flutter_test.dart';
import 'package:philatrail/core/counter_hours.dart';

// 2026-11-27 is a Friday. IST = UTC+5:30.
DateTime ist(int day, int h, [int m = 0]) =>
    DateTime.utc(2026, 11, day, h, m).subtract(const Duration(minutes: 330));

void main() {
  test('open, lunch, closed on a weekday', () {
    expect(counterStatus(ist(27, 11)).word, 'OPEN');
    expect(counterStatus(ist(27, 13, 15)).word, 'LUNCH');
    expect(counterStatus(ist(27, 17)).word, 'CLOSED');
    expect(counterStatus(ist(27, 8, 59)).word, 'CLOSED');
    expect(counterStatus(ist(27, 11)).hours, '9 AM – 5 PM');
  });
  test('Saturday ends at 1 PM; Sunday closed; device timezone ignored', () {
    expect(counterStatus(ist(28, 11)).word, 'OPEN');
    expect(counterStatus(ist(28, 13, 30)).word, 'CLOSED');
    expect(counterStatus(ist(29, 11)).word, 'CLOSED');
    expect(counterStatus(DateTime.utc(2026, 11, 27, 9)).word, 'OPEN');
  });
}
