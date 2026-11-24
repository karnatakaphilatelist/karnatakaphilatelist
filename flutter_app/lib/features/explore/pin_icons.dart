import 'package:flutter/material.dart';

import '../../models/post_office.dart';
import '../../theme/app_theme.dart';

/// Widget equivalents of src/components/map/pin-icons.ts's three glyphs
/// (unvisited = mailbox outline, planned = flag, visited = check) and
/// cluster bubbles. Flutter draws these as real widgets instead of
/// DivIcon/HTML, so there's no icon cache to maintain — Flutter's own
/// widget diffing handles that.
class OfficePin extends StatelessWidget {
  final OfficeStatus status;
  final bool selected;
  const OfficePin({super.key, required this.status, required this.selected});

  Color get _color => switch (status) {
        OfficeStatus.unvisited => AppColors.postal,
        OfficeStatus.planned => AppColors.planned,
        OfficeStatus.visited => AppColors.visited,
      };

  IconData get _icon => switch (status) {
        OfficeStatus.unvisited => Icons.mail_outline,
        OfficeStatus.planned => Icons.flag_outlined,
        OfficeStatus.visited => Icons.check,
      };

  @override
  Widget build(BuildContext context) {
    final size = selected ? 32.0 : 26.0;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: _color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: const [
          BoxShadow(color: Color(0x33000000), blurRadius: 4, offset: Offset(0, 2)),
        ],
      ),
      child: Icon(_icon, color: Colors.white, size: size * 0.55),
    );
  }
}

/// How many of a cluster's offices are stamped: none, some, or all —
/// mirrors clusterProgress() in pin-icons.ts.
enum ClusterProgress { none, some, all }

ClusterProgress clusterProgress(int visited, int total) {
  if (visited <= 0) return ClusterProgress.none;
  return visited >= total ? ClusterProgress.all : ClusterProgress.some;
}

class ClusterBubble extends StatelessWidget {
  final int count;
  final ClusterProgress progress;
  const ClusterBubble({super.key, required this.count, required this.progress});

  @override
  Widget build(BuildContext context) {
    final size = count >= 20 ? 48.0 : (count >= 8 ? 42.0 : 36.0);
    final color = switch (progress) {
      ClusterProgress.all => AppColors.visited,
      ClusterProgress.some => AppColors.planned,
      ClusterProgress.none => AppColors.ink,
    };
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2.5),
        boxShadow: const [
          BoxShadow(color: Color(0x40000000), blurRadius: 6, offset: Offset(0, 3)),
        ],
      ),
      alignment: Alignment.center,
      child: Text(
        '$count',
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: size * 0.38,
        ),
      ),
    );
  }
}
