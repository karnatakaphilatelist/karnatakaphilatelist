import 'package:flutter/material.dart';

/// Port of `.kp-perf` (globals.css): a white postage stamp with 10px padding
/// and a row of round 4px holes, 12px apart, punched along every edge.
class PerforatedStamp extends StatelessWidget {
  final Widget child;
  const PerforatedStamp({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return ClipPath(
      clipper: _PerfClipper(),
      child: Container(color: Colors.white, padding: const EdgeInsets.all(10), child: child),
    );
  }
}

class _PerfClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    const step = 12.0;
    const r = 4.25;
    // Even-odd: the outer rect plus every hole, so each hole is cut out.
    final holes = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Offset.zero & size);
    for (var x = step / 2; x < size.width; x += step) {
      holes
        ..addOval(Rect.fromCircle(center: Offset(x, 0), radius: r))
        ..addOval(Rect.fromCircle(center: Offset(x, size.height), radius: r));
    }
    for (var y = step / 2; y < size.height; y += step) {
      holes
        ..addOval(Rect.fromCircle(center: Offset(0, y), radius: r))
        ..addOval(Rect.fromCircle(center: Offset(size.width, y), radius: r));
    }
    return holes;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}
