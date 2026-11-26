import 'package:flutter/material.dart';

import '../../core/geo.dart';
import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_icons.dart';

/// Port of src/components/explore/OfficeList.tsx: 72px-min rows in a
/// `px-4 pb-4` list, warm-brown hairlines between them, a 36px status mark,
/// name (16 semibold) over district | pincode (or distance), and a chevron.
class OfficeListView extends StatelessWidget {
  final List<OfficeWithStatus> offices;
  final int? selectedId;
  final ValueChanged<int> onSelect;
  final ScrollController? controller;
  final ScrollPhysics? physics;
  const OfficeListView({
    super.key,
    required this.offices,
    required this.selectedId,
    required this.onSelect,
    this.controller,
    this.physics,
  });

  @override
  Widget build(BuildContext context) {
    if (offices.isEmpty) {
      return ListView(
        controller: controller,
        physics: physics,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
        children: const [
          Text(
            'No post offices match. Try a different search or filter.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.muted, fontSize: 14, height: 20 / 14),
          ),
        ],
      );
    }

    return ListView.builder(
      controller: controller,
      physics: physics,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      itemCount: offices.length,
      itemBuilder: (context, index) {
        final office = offices[index];
        final selected = office.id == selectedId;
        final last = index == offices.length - 1;
        return DecoratedBox(
          decoration: BoxDecoration(
            border: last ? null : Border(bottom: BorderSide(color: AppColors.warmBrown.withValues(alpha: 0.12))),
          ),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => onSelect(office.id),
            child: Container(
              constraints: const BoxConstraints(minHeight: 72),
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: selected ? AppColors.postal.withValues(alpha: 0.05) : null,
                borderRadius: BorderRadius.circular(16),
              ),
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
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16, height: 1.5, color: AppColors.ink),
                        ),
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                office.district,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: AppColors.muted, fontSize: 14, height: 20 / 14),
                              ),
                            ),
                            if (office.distanceKm != null || office.pincode.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Container(width: 1, height: 14, color: AppColors.goldRule),
                              const SizedBox(width: 8),
                              office.distanceKm != null
                                  ? Text(
                                      formatDistance(office.distanceKm!).toUpperCase(),
                                      style: const TextStyle(
                                        fontFamily: AppFonts.mono,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                        letterSpacing: 13 * 0.04,
                                        color: AppColors.muted,
                                      ),
                                    )
                                  : Text(
                                      office.pincode,
                                      style: const TextStyle(
                                        fontFamily: AppFonts.mono,
                                        fontSize: 13,
                                        letterSpacing: 13 * 0.06,
                                        color: AppColors.muted,
                                      ),
                                    ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 14),
                  const ListChevron(color: AppColors.muted),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Empty ring (not visited), flag (planned) or filled green check (stamped).
class _StatusMark extends StatelessWidget {
  final OfficeStatus status;
  const _StatusMark({required this.status});

  @override
  Widget build(BuildContext context) {
    const size = 36.0;
    return switch (status) {
      OfficeStatus.visited => Semantics(
          label: 'Stamped',
          child: Container(
            width: size,
            height: size,
            alignment: Alignment.center,
            decoration: const BoxDecoration(color: AppColors.stampGreen, shape: BoxShape.circle),
            child: const AppIconView(AppIcon.check, size: 18, color: Colors.white, strokeWidth: 3.2),
          ),
        ),
      OfficeStatus.planned => Semantics(
          label: 'Planned',
          child: Container(
            width: size,
            height: size,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: AppColors.warmBrown.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: const AppIconView(AppIcon.flag, size: 18, color: AppColors.pinBlue),
          ),
        ),
      OfficeStatus.unvisited => Semantics(
          label: 'Not visited',
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.ink.withValues(alpha: 0.25), width: 2),
            ),
          ),
        ),
    };
  }
}
