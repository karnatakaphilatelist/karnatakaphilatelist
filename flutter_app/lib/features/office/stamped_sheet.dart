import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_icons.dart';
import '../../widgets/app_sheet.dart';
import '../../widgets/perforated_stamp.dart';
import '../../widgets/stamp_thumb.dart';
import 'visit_dialog.dart';

/// Port of src/components/office/StampedSheet.tsx: the reward moment after
/// "Stamp it" — the perforated stamp drops and presses in (kp-press), a ring
/// ripples out (kp-ripple), then the name, count and next steps.
Future<void> showStampedSheet(
  BuildContext context, {
  required OfficeWithStatus office,
  required int collected,
  required int total,
}) {
  return showAppSheet<void>(
    context,
    title: 'Stamped!',
    builder: (sheetContext) => Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(child: _PressedStamp(path: office.stampImagePath)),
        const SizedBox(height: 16),
        Text(
          office.name.toUpperCase(),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 36, height: 40 / 36, fontWeight: FontWeight.w500, letterSpacing: 0.36, color: AppColors.ink),
        ),
        const SizedBox(height: 8),
        Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(color: AppColors.visited.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(999)),
            child: const Text('STAMPED',
                style: TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w600, letterSpacing: 12 * 0.08, color: AppColors.visitedInk)),
          ),
        ),
        const SizedBox(height: 4),
        Text('$collected of $total in your passport',
            textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
        const SizedBox(height: 24),
        GestureDetector(
          onTap: () {
            Navigator.of(sheetContext).pop();
            showVisitDialog(context, officeId: office.id, officeName: office.name);
          },
          child: Container(
            constraints: const BoxConstraints(minHeight: 62),
            alignment: Alignment.center,
            decoration: BoxDecoration(color: AppColors.ink, borderRadius: BorderRadius.circular(999)),
            child: const Text('Add note and photo', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () => Navigator.of(sheetContext).pop(),
          child: Container(
            constraints: const BoxConstraints(minHeight: 48),
            alignment: Alignment.center,
            child: const Text('Done', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.ink)),
          ),
        ),
      ],
    ),
  );
}

class _PressedStamp extends StatefulWidget {
  final String? path;
  const _PressedStamp({required this.path});

  @override
  State<_PressedStamp> createState() => _PressedStampState();
}

class _PressedStampState extends State<_PressedStamp> with SingleTickerProviderStateMixin {
  // 1.1s ease-out with a 0.2s delay, like `animate-[kp-press_1.1s_ease-out_0.2s_both]`.
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1300))..forward();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  static double _lerp(double a, double b, double t) => a + (b - a) * t;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 128,
      height: 128,
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) {
          final raw = ((_c.value * 1300 - 200) / 1100).clamp(0.0, 1.0);
          final t = Curves.easeOut.transform(raw);
          // kp-press keyframes: 0% (-60px, 1.4, -10deg, transparent) → 45% (0, 1, -4deg) → 60% (4px, .97) → 100% (0, 1, -4deg).
          double dy, scale, deg, opacity;
          if (t < 0.45) {
            final k = t / 0.45;
            dy = _lerp(-60, 0, k);
            scale = _lerp(1.4, 1, k);
            deg = _lerp(-10, -4, k);
            opacity = k;
          } else if (t < 0.6) {
            final k = (t - 0.45) / 0.15;
            dy = _lerp(0, 4, k);
            scale = _lerp(1, 0.97, k);
            deg = -4;
            opacity = 1;
          } else {
            final k = (t - 0.6) / 0.4;
            dy = _lerp(4, 0, k);
            scale = _lerp(0.97, 1, k);
            deg = -4;
            opacity = 1;
          }
          // kp-ripple: invisible until 45%, flashes to .6 at 55%, then grows to 1.7x and fades out.
          double rippleOpacity, rippleScale;
          if (t < 0.45) {
            rippleOpacity = 0;
            rippleScale = 0.7;
          } else if (t < 0.55) {
            final k = (t - 0.45) / 0.10;
            rippleOpacity = 0.6 * k;
            rippleScale = _lerp(0.7, 0.7 + (1.7 - 0.7) * (0.10 / 0.55), k);
          } else {
            final k = (t - 0.55) / 0.45;
            rippleOpacity = 0.6 * (1 - k);
            rippleScale = _lerp(0.7 + (1.7 - 0.7) * (0.10 / 0.55), 1.7, k);
          }
          return Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              Opacity(
                opacity: rippleOpacity,
                child: Transform.scale(
                  scale: rippleScale,
                  child: Container(
                    decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.visited, width: 2)),
                  ),
                ),
              ),
              Opacity(
                opacity: opacity,
                child: Transform.translate(
                  offset: Offset(0, dy),
                  child: Transform.rotate(
                    angle: deg * math.pi / 180,
                    child: Transform.scale(
                      scale: scale,
                      child: DecoratedBox(
                        // drop-shadow-md
                        decoration: BoxDecoration(
                          boxShadow: [
                            cssShadow(0, 4, 3, 0, Colors.black.withValues(alpha: 0.07)),
                            cssShadow(0, 2, 2, 0, Colors.black.withValues(alpha: 0.06)),
                          ],
                        ),
                        child: PerforatedStamp(child: StampThumb(path: widget.path, size: 96)),
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                right: -4,
                bottom: -4,
                child: Container(
                  width: 36,
                  height: 36,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.visited,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: const AppIconView(AppIcon.check, size: 20, color: Colors.white, strokeWidth: 3),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
