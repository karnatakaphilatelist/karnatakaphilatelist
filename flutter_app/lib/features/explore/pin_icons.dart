import 'package:flutter/material.dart';

import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_icons.dart';

/// Port of `.kp-pin` (globals.css) + pin-icons.ts: a 22px dot with a 3px
/// white ring. Unvisited = blue with a 6px white centre (no glyph); planned =
/// yellow with an ink flag; visited = green with a white check. Selected
/// scales 1.35× and gains a soft postal-red halo.
class OfficePin extends StatelessWidget {
  final OfficeStatus status;
  final bool selected;
  const OfficePin({super.key, required this.status, required this.selected});

  @override
  Widget build(BuildContext context) {
    final fill = switch (status) {
      OfficeStatus.unvisited => AppColors.pinBlue,
      OfficeStatus.planned => AppColors.planned,
      OfficeStatus.visited => AppColors.stampGreen,
    };
    final glyph = switch (status) {
      OfficeStatus.unvisited => Container(
          width: 6,
          height: 6,
          decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
        ),
      OfficeStatus.planned => const AppIconView(AppIcon.flag, size: 11, color: AppColors.ink, strokeWidth: 2.2),
      OfficeStatus.visited => const AppIconView(AppIcon.check, size: 11, color: Colors.white, strokeWidth: 3),
    };
    return AnimatedScale(
      scale: selected ? 1.35 : 1,
      duration: const Duration(milliseconds: 150),
      child: Container(
        width: 22,
        height: 22,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: fill,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 3),
          boxShadow: selected
              ? [
                  BoxShadow(color: AppColors.postal.withValues(alpha: 0.3), spreadRadius: 4),
                  cssShadow(0, 2, 8, 0, Colors.black.withValues(alpha: 0.3)),
                ]
              : [cssShadow(0, 1, 4, 0, AppColors.ink.withValues(alpha: 0.45))],
        ),
        child: glyph,
      ),
    );
  }
}

/// How many of a cluster's offices are stamped — clusterProgress() in pin-icons.ts.
enum ClusterProgress { none, some, all }

ClusterProgress clusterProgress(int visited, int total) {
  if (visited <= 0) return ClusterProgress.none;
  return visited >= total ? ClusterProgress.all : ClusterProgress.some;
}

double clusterSize(int count) => count >= 20 ? 48 : (count >= 8 ? 42 : 36);

/// Port of `.kp-cluster`: blue bubble (green when all stamped, a 135° hard
/// split at 55% when some are), 3px white ring, 13px bold white count.
class ClusterBubble extends StatelessWidget {
  final int count;
  final ClusterProgress progress;
  const ClusterBubble({super.key, required this.count, required this.progress});

  @override
  Widget build(BuildContext context) {
    final size = clusterSize(count);
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: switch (progress) {
          ClusterProgress.none => AppColors.pinBlue,
          ClusterProgress.all => AppColors.stampGreen,
          ClusterProgress.some => null,
        },
        gradient: progress == ClusterProgress.some
            ? const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                stops: [0.55, 0.55],
                colors: [AppColors.pinBlue, AppColors.stampGreen],
              )
            : null,
        border: Border.all(color: Colors.white, width: 3),
        boxShadow: [cssShadow(0, 2, 8, 0, AppColors.ink.withValues(alpha: 0.45))],
      ),
      child: Text(
        '$count',
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13, height: 1),
      ),
    );
  }
}
