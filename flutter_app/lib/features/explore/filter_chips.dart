import 'package:flutter/material.dart';

import '../../models/post_office.dart';
import '../../theme/app_theme.dart';

/// Port of src/components/explore/FilterChips.tsx. `null` = "all" (TS calls
/// this the `"all"` member of StatusFilter; Dart models it as the absence of
/// a status filter instead of adding an extra enum case).
typedef StatusFilterValue = OfficeStatus?;

class _FilterOption {
  final StatusFilterValue value;
  final String label;
  final IconData? icon;
  const _FilterOption(this.value, this.label, this.icon);
}

const _filters = [
  _FilterOption(null, 'All', null),
  _FilterOption(OfficeStatus.unvisited, 'Not visited', null),
  _FilterOption(OfficeStatus.planned, 'Planned', Icons.flag_outlined),
  _FilterOption(OfficeStatus.visited, 'Visited', Icons.check),
];

class StatusFilterChips extends StatelessWidget {
  final StatusFilterValue value;
  final ValueChanged<StatusFilterValue> onChanged;
  const StatusFilterChips({super.key, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: _filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (context, index) {
          final filter = _filters[index];
          final active = filter.value == value;
          return Semantics(
            button: true,
            selected: active,
            label: filter.label,
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: () => onChanged(filter.value),
              child: Container(
                height: 40,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: active ? AppColors.plannedSoft : AppColors.card,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: active ? AppColors.ink : AppColors.line,
                    width: active ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (filter.value == OfficeStatus.unvisited)
                      Container(
                        width: 14,
                        height: 14,
                        margin: const EdgeInsets.only(right: 6),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.muted, width: 2),
                        ),
                      ),
                    if (filter.icon != null) ...[
                      Icon(
                        filter.icon,
                        size: 16,
                        color: filter.value == OfficeStatus.visited
                            ? AppColors.visited
                            : AppColors.ink,
                      ),
                      const SizedBox(width: 6),
                    ],
                    Text(
                      filter.label,
                      style: TextStyle(
                        fontWeight: active ? FontWeight.bold : FontWeight.w600,
                        color: AppColors.ink,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
