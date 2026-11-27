/// One line for the office page: "Timings: 9 AM – 5 PM · OPEN". Port of
/// src/lib/counter-hours.ts. PLACEHOLDER HOURS: edit the constants below once
/// the real ones are known, and change both files together.
enum CounterState { open, lunch, closed }

class CounterStatus {
  final CounterState state;
  final String hours;
  final String word;
  const CounterStatus(this.state, this.hours, this.word);
}

const _open = 9 * 60;
const _closeWeekday = 17 * 60;
const _closeSaturday = 13 * 60;
const _lunchStart = 13 * 60;
const _lunchEnd = 14 * 60;

String _clock(int min) {
  final h = min ~/ 60;
  final m = min % 60;
  return '${h % 12 == 0 ? 12 : h % 12}${m != 0 ? ':${m.toString().padLeft(2, '0')}' : ''} ${h < 12 ? 'AM' : 'PM'}';
}

/// [now] may be in any timezone; Indian time is derived from UTC.
CounterStatus counterStatus(DateTime now) {
  final ist = now.toUtc().add(const Duration(minutes: 330));
  final day = ist.weekday % 7; // Sun=0..Sat=6
  final min = ist.hour * 60 + ist.minute;
  if (day == 0) return const CounterStatus(CounterState.closed, 'Closed Sundays', 'CLOSED');
  final close = day == 6 ? _closeSaturday : _closeWeekday;
  final hours = '${_clock(_open)} – ${_clock(close)}';
  if (min < _open || min >= close) return CounterStatus(CounterState.closed, hours, 'CLOSED');
  if (day != 6 && min >= _lunchStart && min < _lunchEnd) return CounterStatus(CounterState.lunch, hours, 'LUNCH');
  return CounterStatus(CounterState.open, hours, 'OPEN');
}
