/// "Is the counter open right now?" Port of src/lib/counter-hours.ts, same
/// typical India Post hours (Mon-Fri 10-16, Sat 10-13, Sunday closed, a lunch
/// pause near 13:00, stamp sales to about 15:00). Not per-office data, so every
/// label says "usually". Change both files together.
enum CounterState { open, closing, lunch, stampsClosed, closed }

class CounterStatus {
  final CounterState state;
  final String label;
  const CounterStatus(this.state, this.label);
}

const _open = 10 * 60;
const _lunchStart = 13 * 60;
const _lunchEnd = 13 * 60 + 30;
const _stampCutoff = 15 * 60;
const _closeWeekday = 16 * 60;
const _closeSaturday = 13 * 60;
const _closingSoon = 30;

String _clock(int min) {
  final h = min ~/ 60;
  final m = min % 60;
  final h12 = h % 12 == 0 ? 12 : h % 12;
  return '$h12${m != 0 ? ':${m.toString().padLeft(2, '0')}' : ''} ${h < 12 ? 'AM' : 'PM'}';
}

/// [now] may be in any timezone; Indian time is derived from UTC.
CounterStatus counterStatus(DateTime now) {
  final ist = now.toUtc().add(const Duration(minutes: 330));
  final day = ist.weekday % 7; // Dart: Mon=1..Sun=7 -> Sun=0..Sat=6
  final min = ist.hour * 60 + ist.minute;

  if (day == 0) return CounterStatus(CounterState.closed, 'Closed Sunday · usually opens Mon ${_clock(_open)}');
  final close = day == 6 ? _closeSaturday : _closeWeekday;
  if (min < _open) return CounterStatus(CounterState.closed, 'Closed · usually opens today ${_clock(_open)}');
  if (min >= close) {
    final next = day == 6 ? 'Mon ${_clock(_open)}' : 'tomorrow ${_clock(_open)}';
    return CounterStatus(CounterState.closed, 'Closed for the day · usually opens $next');
  }
  if (day != 6 && min >= _stampCutoff) {
    return CounterStatus(CounterState.stampsClosed,
        'Stamp counter has probably closed · most stop selling by ${_clock(_stampCutoff)}');
  }
  if (day != 6 && min >= _lunchStart && min < _lunchEnd) {
    return CounterStatus(CounterState.lunch, 'May be on lunch break · usually back by ${_clock(_lunchEnd)}');
  }
  final stampEnd = day == 6 ? close : _stampCutoff;
  if (stampEnd - min <= _closingSoon) {
    return CounterStatus(CounterState.closing, 'Closing soon · stamps usually until ${_clock(stampEnd)}');
  }
  return CounterStatus(CounterState.open, 'Counter usually open · stamps until ${_clock(stampEnd)}');
}
