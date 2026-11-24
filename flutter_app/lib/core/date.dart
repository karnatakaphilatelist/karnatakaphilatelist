/// Port of src/lib/date.ts.
final RegExp isoDatePattern = RegExp(r'^\d{4}-\d{2}-\d{2}$');

/// A calendar date as YYYY-MM-DD in the device's local time zone.
String toIsoDate(DateTime date) {
  final y = date.year.toString().padLeft(4, '0');
  final m = date.month.toString().padLeft(2, '0');
  final d = date.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}

/// Today's date as YYYY-MM-DD, built by hand so it never depends on locale data.
String todayIso([DateTime? now]) => toIsoDate(now ?? DateTime.now());

const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/// "2026-11-06" as "6 Nov 2026". Anything that is not a plain ISO date is
/// returned unchanged.
String formatVisitDate(String iso) {
  if (!isoDatePattern.hasMatch(iso)) return iso;
  final parts = iso.split('-');
  final year = parts[0];
  final month = int.parse(parts[1]);
  final day = int.parse(parts[2]);
  return '$day ${_months[month - 1]} $year';
}
