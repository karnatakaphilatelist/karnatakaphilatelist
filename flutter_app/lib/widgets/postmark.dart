import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Port of src/components/office/Postmark.tsx — the navy double-ring
/// postmark stamp with the office name, state and date, drawn curved along
/// the rings the way the original uses SVG `<textPath>`. Canvas has no
/// textPath equivalent, so _ArcTextPainter below places each glyph by hand:
/// walk the circle by arc-length (character width), centered the same way
/// the original's `startOffset="50%"` centers its text.
///
/// One intentional fix, not a silent divergence: the original hardcodes the
/// state suffix as "SO · KA" regardless of the office's actual state. Now
/// that Tamil Nadu is live (see claude/multi-state-decision.md), that would
/// mislabel every TN postmark, so this port takes the real state code as a
/// parameter instead. Worth fixing in Postmark.tsx too — flagged to the user
/// separately, not changed here.
class Postmark extends StatelessWidget {
  final String name;
  final String date;
  final String pincode;
  final String stateCode;
  final double size;

  const Postmark({
    super.key,
    required this.name,
    required this.date,
    required this.pincode,
    required this.stateCode,
    this.size = 120,
  });

  @override
  Widget build(BuildContext context) {
    final parts = date.toUpperCase().split(' ');
    final dayMonth = parts.take(2).join(' ');
    final year = parts.skip(2).join(' ');
    final top =
        '${name.replaceAll(RegExp(r' SO$| BO$', caseSensitive: false), '')} SO · $stateCode'
            .toUpperCase();

    return Transform.rotate(
      angle: -8 * math.pi / 180,
      child: SizedBox(
        width: size,
        height: size,
        child: CustomPaint(
          painter: _PostmarkPainter(top: top, pincode: pincode, dayMonth: dayMonth, year: year),
        ),
      ),
    );
  }
}

class _PostmarkPainter extends CustomPainter {
  final String top;
  final String pincode;
  final String dayMonth;
  final String year;

  _PostmarkPainter({required this.top, required this.pincode, required this.dayMonth, required this.year});

  static const _ink = Color(0xCC16204F); // text-[#16204f]/80

  @override
  void paint(Canvas canvas, Size size) {
    // The original is authored in a 120x120 viewBox; scale to this widget's size.
    final scale = size.width / 120;
    canvas.save();
    canvas.scale(scale, scale);
    const center = Offset(60, 60);

    final ringPaint = Paint()
      ..color = _ink
      ..style = PaintingStyle.stroke;
    canvas.drawCircle(center, 57, ringPaint..strokeWidth = 2.4);
    canvas.drawCircle(center, 32, ringPaint..strokeWidth = 1.4);

    const labelStyle = TextStyle(
      color: _ink,
      fontSize: 9,
      fontWeight: FontWeight.bold,
      fontFamily: AppFonts.mono,
    );
    // Top arc (name/state), radius 40, sweeping through the top (increasing angle).
    _drawArcText(canvas, top, labelStyle, center, 40, 270, true, letterSpacing: 1.6);
    // Bottom arc (pincode), radius 44, sweeping through the bottom (decreasing angle).
    _drawArcText(canvas, pincode, labelStyle, center, 44, 90, false, letterSpacing: 2);

    const dateStyle = TextStyle(color: _ink, fontSize: 9.5, fontWeight: FontWeight.bold);
    _drawCentered(canvas, dayMonth, dateStyle, const Offset(60, 58));
    _drawCentered(canvas, year, dateStyle.copyWith(fontSize: 9, fontFamily: AppFonts.mono),
        const Offset(60, 71));

    canvas.restore();
  }

  void _drawCentered(Canvas canvas, String text, TextStyle style, Offset anchor) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(canvas, anchor - Offset(painter.width / 2, painter.height));
  }

  /// Places [text] along the circle of [radius] centered on [center],
  /// centered on [midAngleDeg] the way `startOffset="50%"` centers an SVG
  /// textPath. [increasing] selects which way the arc was swept (see the
  /// class doc comment) — it flips both the walk direction and which way
  /// each glyph is rotated to stay tangent to the curve.
  void _drawArcText(
    Canvas canvas,
    String text,
    TextStyle style,
    Offset center,
    double radius,
    double midAngleDeg,
    bool increasing, {
    double letterSpacing = 0,
  }) {
    final chars = text.split('');
    final painter = TextPainter(textDirection: TextDirection.ltr);
    final widths = <double>[];
    for (final ch in chars) {
      painter.text = TextSpan(text: ch, style: style);
      painter.layout();
      widths.add(painter.width + letterSpacing);
    }
    final totalWidth = widths.fold<double>(0, (a, b) => a + b) - letterSpacing;
    var cursor = -totalWidth / 2;
    final midAngleRad = midAngleDeg * math.pi / 180;

    for (var i = 0; i < chars.length; i++) {
      final w = widths[i] - letterSpacing;
      final charCenterOffset = cursor + w / 2;
      final deltaTheta = charCenterOffset / radius;
      final theta = midAngleRad + (increasing ? deltaTheta : -deltaTheta);
      final pos = center + Offset(radius * math.cos(theta), radius * math.sin(theta));
      final rotation = increasing ? theta + math.pi / 2 : theta - math.pi / 2;

      canvas.save();
      canvas.translate(pos.dx, pos.dy);
      canvas.rotate(rotation);
      painter.text = TextSpan(text: chars[i], style: style);
      painter.layout();
      painter.paint(canvas, Offset(-painter.width / 2, -painter.height / 2));
      canvas.restore();

      cursor += widths[i];
    }
  }

  @override
  bool shouldRepaint(covariant _PostmarkPainter oldDelegate) =>
      oldDelegate.top != top || oldDelegate.pincode != pincode || oldDelegate.dayMonth != dayMonth || oldDelegate.year != year;
}
