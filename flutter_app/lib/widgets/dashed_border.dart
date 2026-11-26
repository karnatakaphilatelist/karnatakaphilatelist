import 'dart:ui' as ui;

import 'package:flutter/material.dart';

/// A 2px dashed rounded outline drawn just inside the child's bounds — the
/// web's `outline-dashed` / `border-dashed` (e.g. Passport's not-yet-stamped
/// tiles and the visit dialog's photo drop zone).
class DashedBorder extends StatelessWidget {
  final Widget child;
  final Color color;
  final double radius;
  final double strokeWidth;
  final double dash;
  final double gap;
  final Color? fill;
  const DashedBorder({
    super.key,
    required this.child,
    required this.color,
    this.radius = 16,
    this.strokeWidth = 2,
    this.dash = 6,
    this.gap = 6,
    this.fill,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedPainter(color, radius, strokeWidth, dash, gap, fill),
      child: child,
    );
  }
}

class _DashedPainter extends CustomPainter {
  final Color color;
  final double radius;
  final double strokeWidth;
  final double dash;
  final double gap;
  final Color? fill;
  _DashedPainter(this.color, this.radius, this.strokeWidth, this.dash, this.gap, this.fill);

  @override
  void paint(Canvas canvas, Size size) {
    final rect = (Offset.zero & size).deflate(strokeWidth / 2);
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(radius));
    if (fill != null) canvas.drawRRect(rrect, Paint()..color = fill!);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    final path = Path()..addRRect(rrect);
    for (final ui.PathMetric metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        canvas.drawPath(metric.extractPath(distance, distance + dash), paint);
        distance += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(_DashedPainter old) => old.color != color || old.radius != radius;
}
