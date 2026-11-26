import 'package:flutter/material.dart';

import '../../models/post_office.dart';
import '../../models/visit.dart';
import '../../theme/app_theme.dart';

class _DistrictRow {
  final String district;
  final int visited;
  final int total;
  const _DistrictRow(this.district, this.visited, this.total);
}

/// Port of src/components/passport/DistrictProgress.tsx: fullest districts
/// first; each row (name, "n of m" or "· complete", 8px bar) opens that
/// district's offices on Explore.
class DistrictProgress extends StatelessWidget {
  final List<PostOffice> offices;
  final Map<int, Visit> visits;
  final ValueChanged<String>? onDistrict;
  const DistrictProgress({super.key, required this.offices, required this.visits, this.onDistrict});

  List<_DistrictRow> _summarise() {
    final totals = <String, int>{};
    final visitedCounts = <String, int>{};
    for (final office in offices) {
      totals[office.district] = (totals[office.district] ?? 0) + 1;
      if (visits.containsKey(office.id)) visitedCounts[office.district] = (visitedCounts[office.district] ?? 0) + 1;
    }
    final rows = [for (final d in totals.keys) _DistrictRow(d, visitedCounts[d] ?? 0, totals[d]!)];
    rows.sort((a, b) {
      final byRatio = (b.visited / b.total).compareTo(a.visited / a.total);
      return byRatio != 0 ? byRatio : a.district.toLowerCase().compareTo(b.district.toLowerCase());
    });
    return rows;
  }

  @override
  Widget build(BuildContext context) {
    final rows = _summarise();
    return Column(
      children: [
        for (var i = 0; i < rows.length; i++)
          Padding(
            padding: EdgeInsets.only(top: i == 0 ? 0 : 12),
            child: Semantics(
              button: true,
              label: 'See ${rows[i].district} on the map',
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: onDistrict == null ? null : () => onDistrict!(rows[i].district),
                child: Container(
                  constraints: const BoxConstraints(minHeight: 44),
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: _row(rows[i]),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _row(_DistrictRow r) {
    final complete = r.visited == r.total;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Expanded(
              child: Text(r.district, style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
            ),
            Text(
              '${r.visited} of ${r.total}${complete ? ' · complete' : ''}',
              style: TextStyle(
                fontSize: 14,
                height: 20 / 14,
                fontWeight: complete ? FontWeight.w700 : FontWeight.w400,
                color: complete ? AppColors.visitedInk : AppColors.muted,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Container(
          height: 8,
          alignment: Alignment.centerLeft,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(999)),
          child: FractionallySizedBox(
            widthFactor: r.total == 0 ? 0 : r.visited / r.total,
            heightFactor: 1,
            child: Container(decoration: BoxDecoration(color: AppColors.visited, borderRadius: BorderRadius.circular(999))),
          ),
        ),
      ],
    );
  }
}
