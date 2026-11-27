import 'package:flutter_test/flutter_test.dart';
import 'package:philatrail/core/counter_hours.dart';

// 2026-11-27 is a Friday. IST = UTC+5:30.
DateTime ist(int day, int h, [int m = 0]) =>
    DateTime.utc(2026, 11, day, h, m).subtract(const Duration(minutes: 330));

void main() {
  test('open mid-morning, lunch window, closing soon', () {
    expect(counterStatus(ist(27, 11)).state, CounterState.open);
    expect(counterStatus(ist(27, 13, 10)).state, CounterState.lunch);
    expect(counterStatus(ist(27, 14, 40)).state, CounterState.closing);
  });
  test('3:15 PM: stamp counter has probably closed', () {
    final s = counterStatus(ist(27, 15, 15));
    expect(s.state, CounterState.stampsClosed);
    expect(s.label, contains('3 PM'));
  });
  test('closed after 4 PM, before 10 AM, Saturday afternoon, Sunday', () {
    expect(counterStatus(ist(27, 16, 30)).state, CounterState.closed);
    expect(counterStatus(ist(27, 9)).state, CounterState.closed);
    expect(counterStatus(ist(28, 11)).state, CounterState.open);
    expect(counterStatus(ist(28, 13, 30)).state, CounterState.closed);
    expect(counterStatus(ist(29, 11)).state, CounterState.closed);
  });
  test('independent of the device timezone', () {
    expect(counterStatus(DateTime.utc(2026, 11, 27, 9)).state, CounterState.closing);
  });
}
