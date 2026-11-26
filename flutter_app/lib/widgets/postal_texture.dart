import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/app_theme.dart';
import 'glass_card.dart' show liteMode;

/// Port of globals.css's `.kp-red` — the engraved security-print texture
/// (assets/brand/guilloche.svg, vendored straight from the web app's
/// public/brand/) laid over postal red. Used by the Passport header and the
/// sign-in sheet's hero, same as the web app's `.kp-red` surfaces.
///
/// The source SVG is viewBox 0 0 800 360 and CSS-positioned
/// `background-position: right top; background-size: cover;` — `BoxFit.cover`
/// anchored to topRight reproduces that.
class PostalTexture extends StatelessWidget {
  final Widget? child;
  final BorderRadius? borderRadius;
  const PostalTexture({super.key, this.child, this.borderRadius});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: borderRadius ?? BorderRadius.zero,
      child: Container(
        color: AppColors.postal,
        child: Stack(
          fit: StackFit.passthrough,
          children: [
            // `[data-lite] .kp-red { background-image: none }`
            Positioned.fill(
              child: ValueListenableBuilder<bool>(
                valueListenable: liteMode,
                builder: (context, lite, _) => lite
                    ? const SizedBox.shrink()
                    : Align(
                        alignment: Alignment.topRight,
                        child: FittedBox(
                          fit: BoxFit.cover,
                          alignment: Alignment.topRight,
                          child: SvgPicture.asset(
                            'assets/brand/guilloche.svg',
                            width: 800,
                            height: 360,
                          ),
                        ),
                      ),
              ),
            ),
            if (child != null) child!,
          ],
        ),
      ),
    );
  }
}

/// Port of the concentric-ring decoration AuthDialog.tsx draws over its own
/// `.kp-red` hero (17 rings, 16px apart, 8% white stroke, offset top-right).
class ConcentricRings extends StatelessWidget {
  final double size;
  const ConcentricRings({super.key, this.size = 470});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Align(
        alignment: Alignment.topRight,
        child: FractionalTranslation(
          translation: const Offset(0.17, -0.085), // right:-80px/top:-40px of a 470 box
          child: CustomPaint(
            size: Size(size, size),
            painter: _RingsPainter(),
          ),
        ),
      ),
    );
  }
}

class _RingsPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Original viewBox is 390x470 scaled to a 470x470 box; circle center
    // (235, 190) in that space maps proportionally here.
    final center = Offset(size.width * (235 / 390), size.height * (190 / 470));
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = Colors.white.withValues(alpha: 0.08);
    for (var i = 0; i < 17; i++) {
      final r = (24 + i * 16) * (size.width / 390);
      canvas.drawCircle(center, r, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
