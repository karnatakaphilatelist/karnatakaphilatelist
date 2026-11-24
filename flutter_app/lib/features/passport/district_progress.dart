import 'package:flutter/material.dart';

import '../../models/post_office.dart';
import '../../models/visit.dart';
import '../../theme/app_theme.dart';

class _DistrictRow {
  final String district;
  final int visited;
  final int total;
  const _DistrictRow({required this.district, required this.visited, required this.total});
}

/// Port of src/components/passport/DistrictProgress.tsx.
class DistrictProgress extends StatelessWidget {
  final List<PostOffice> offices;
  final Map<int, Visit> visits;
  const DistrictProgress({super.key, required this.offices, required this.visits});

  List<_DistrictRow> _summarise() {
    final rows = <String, _DistrictRow>{};
    for (final office in offices) {
      final existing = rows[office.district] ??
          _DistrictRow(district: office.district, visited: 0, total: 0);
      rows[office.district] = _DistrictRow(
        district: existing.district,
        visited: existing.visited + (visits[office.id] != null ? 1 : 0),
        total: existing.total + 1,
      );
    }
    final list = rows.values.toList();
    list.sort((a, b) {
      final ratioCompare = (b.visited / b.total).compareTo(a.visited / a.total);
      if (ratioCompare != 0) return ratioCompare;
      return a.district.compareTo(b.district);
    });
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final rows = _summarise();
    return Column(
      children: [
        for (final row in rows) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Expanded(
                  child: Text(row.district, style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
                Text(
                  '${row.visited} of ${row.total}${row.visited == row.total ? " · complete" : ""}',
                  style: TextStyle(
                    color: row.visited == row.total ? AppColors.visited : AppColors.muted,
                    fontWeight: row.visited == row.total ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: row.total == 0 ? 0 : row.visited / row.total,
              minHeight: 8,
              backgroundColor: AppColors.sand,
              valueColor: const AlwaysStoppedAnimation(AppColors.visited),
            ),
          ),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}
