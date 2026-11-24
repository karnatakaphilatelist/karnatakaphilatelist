import 'package:flutter/material.dart';

import '../../core/geo.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';

/// Port of src/components/explore/OfficeList.tsx.
class OfficeListView extends StatelessWidget {
  final List<OfficeWithStatus> offices;
  final int? selectedId;
  final ValueChanged<int> onSelect;
  const OfficeListView({
    super.key,
    required this.offices,
    required this.selectedId,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    if (offices.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 40),
        child: Text(
          'No post offices match. Try a different search or filter.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.muted),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      itemCount: offices.length,
      separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.line),
      itemBuilder: (context, index) {
        final office = offices[index];
        final selected = office.id == selectedId;
        return InkWell(
          onTap: () => onSelect(office.id),
          child: Container(
            constraints: const BoxConstraints(minHeight: 72),
            padding: const EdgeInsets.symmetric(vertical: 10),
            color: selected ? AppColors.postal.withValues(alpha: 0.05) : null,
            child: Row(
              children: [
                _StatusMark(status: office.status),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        office.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              office.district,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: AppColors.muted, fontSize: 13.5),
                            ),
                          ),
                          if (office.distanceKm != null) ...[
                            const SizedBox(width: 8),
                            Container(width: 1, height: 14, color: AppColors.lineStrong),
                            const SizedBox(width: 8),
                            Text(
                              formatDistance(office.distanceKm!),
                              style: const TextStyle(
                                fontFamily: AppFonts.mono,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ] else if (office.pincode.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            Container(width: 1, height: 14, color: AppColors.lineStrong),
                            const SizedBox(width: 8),
                            Text(
                              office.pincode,
                              style: const TextStyle(fontFamily: AppFonts.mono, fontSize: 13),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.muted, size: 20),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Status mark of the list: empty ring (not visited), flag (planned) or
/// filled green check (stamped).
class _StatusMark extends StatelessWidget {
  final OfficeStatus status;
  const _StatusMark({required this.status});

  @override
  Widget build(BuildContext context) {
    const size = 36.0;
    switch (status) {
      case OfficeStatus.visited:
        return Semantics(
          label: 'Stamped',
          child: Container(
            width: size,
            height: size,
            decoration: const BoxDecoration(color: AppColors.visited, shape: BoxShape.circle),
            child: const Icon(Icons.check, color: Colors.white, size: 18),
          ),
        );
      case OfficeStatus.planned:
        return Semantics(
          label: 'Planned',
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: AppColors.ink.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.flag_outlined, color: AppColors.ink, size: 18),
          ),
        );
      case OfficeStatus.unvisited:
        return Semantics(
          label: 'Not visited',
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.ink.withValues(alpha: 0.25), width: 2),
            ),
          ),
        );
    }
  }
}
