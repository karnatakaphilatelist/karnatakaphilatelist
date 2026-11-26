import 'dart:ui' as ui;

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Lite mode (Account → "Lighter map, less data"): like `[data-lite]` on the
/// web, glass surfaces drop their backdrop blur and become solid warm white.
final ValueNotifier<bool> liteMode = ValueNotifier<bool>(false);

/// `backdrop-filter: blur(28px) saturate(180%)`.
final ui.ImageFilter _glassFilter = ui.ImageFilter.compose(
  outer: const ColorFilter.matrix(_saturate180),
  inner: ui.ImageFilter.blur(sigmaX: 14, sigmaY: 14),
);

// Standard CSS saturate() matrix for s = 1.8.
const List<double> _saturate180 = [
  0.2126 + 0.7874 * 1.8, 0.7152 - 0.7152 * 1.8, 0.0722 - 0.0722 * 1.8, 0, 0, //
  0.2126 - 0.2126 * 1.8, 0.7152 + 0.2848 * 1.8, 0.0722 - 0.0722 * 1.8, 0, 0, //
  0.2126 - 0.2126 * 1.8, 0.7152 - 0.7152 * 1.8, 0.0722 + 0.9278 * 1.8, 0, 0, //
  0, 0, 0, 1, 0,
];

enum GlassKind {
  /// `.kp-glass` — small controls: search bar, chips, round buttons.
  control,

  /// `.kp-glass-panel` — docked panels: Explore list sheet, office detail.
  panel,

  /// `.kp-tabbar` — the bottom navigation.
  tabbar,
}

/// Port of globals.css's direction-D frosted cream glass. Paints, in order:
/// the outer drop shadows, the blurred + saturated backdrop, the gradient
/// fill(s), and the white inset top sheen (`inset 0 1.5px 0 …`) — each with
/// the web's exact colors.
class GlassCard extends StatelessWidget {
  final Widget child;
  final BorderRadius borderRadius;
  final EdgeInsetsGeometry? padding;
  final GlassKind kind;

  /// Off for surfaces that already sit on a flat background (e.g. Account
  /// rows over paper), where a blur would cost GPU and change nothing.
  final bool blur;

  const GlassCard({
    super.key,
    required this.child,
    this.borderRadius = const BorderRadius.all(Radius.circular(24)),
    this.padding,
    this.kind = GlassKind.control,
    this.blur = true,
  });

  static const _controlGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xD1FFFFFF), Color(0xBDFFFAF0)], // rgb(255 255 255/.82), rgb(255 250 240/.74)
  );

  static const _panelGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xE6FFFFFF), Color(0xDBFFFAF0)], // /.9, /.86
  );

  static const _tabbarGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xE6FFFAF0), Color(0xF5F9ECD3)], // rgb(255 250 240/.9), rgb(249 236 211/.96)
  );

  // radial-gradient(120% 60% at 20% 0%, rgb(255 236 200/.55), transparent 60%)
  static const _panelWarmth = RadialGradient(
    center: Alignment(-0.6, -1),
    radius: 0.6,
    colors: [Color(0x8CFFECC8), Color(0x00FFECC8)],
  );

  List<BoxShadow> get _shadows => switch (kind) {
        GlassKind.control => [
            cssShadow(0, 1, 2, 0, AppColors.ink.withValues(alpha: 0.08)),
            cssShadow(0, 14, 30, -14, AppColors.ink.withValues(alpha: 0.3)),
          ],
        GlassKind.panel => [cssShadow(0, -10, 30, -12, AppColors.ink.withValues(alpha: 0.3))],
        GlassKind.tabbar => const [],
      };

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: liteMode,
      builder: (context, lite, _) {
        final gradient = switch (kind) {
          GlassKind.control => _controlGradient,
          GlassKind.panel => _panelGradient,
          GlassKind.tabbar => _tabbarGradient,
        };
        Widget fill = DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: borderRadius,
            color: lite ? AppColors.warmWhite : null,
            gradient: lite ? null : gradient,
          ),
          child: kind == GlassKind.panel && !lite
              ? DecoratedBox(
                  decoration: BoxDecoration(borderRadius: borderRadius, gradient: _panelWarmth),
                  child: _content(),
                )
              : _content(),
        );
        if (kind != GlassKind.tabbar) {
          fill = CustomPaint(
            foregroundPainter: _TopSheenPainter(borderRadius, kind == GlassKind.panel ? 1.0 : 0.95),
            child: fill,
          );
        }
        if (blur && !lite) {
          fill = ClipRRect(
            borderRadius: borderRadius,
            child: BackdropFilter(filter: _glassFilter, child: fill),
          );
        }
        return CustomPaint(painter: _OuterShadowPainter(borderRadius, _shadows), child: fill);
      },
    );
  }

  Widget _content() => padding == null ? child : Padding(padding: padding!, child: child);
}

/// CSS `box-shadow` only paints *outside* the border box. Flutter's
/// BoxShadow also paints underneath it, which shows through a translucent
/// glass fill (and gets pulled into its backdrop blur) — the reason the
/// panels used to read ~9 levels greyer than the web's. This draws the same
/// shadows clipped to the outside of the rounded rect.
class _OuterShadowPainter extends CustomPainter {
  final BorderRadius radius;
  final List<BoxShadow> shadows;
  _OuterShadowPainter(this.radius, this.shadows);

  @override
  void paint(Canvas canvas, Size size) {
    if (shadows.isEmpty) return;
    final rrect = radius.toRRect(Offset.zero & size);
    final outside = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect((Offset.zero & size).inflate(200))
      ..addRRect(rrect);
    canvas.save();
    canvas.clipPath(outside);
    for (final s in shadows) {
      final paint = Paint()
        ..color = s.color
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, s.blurSigma);
      canvas.drawRRect(rrect.shift(s.offset).inflate(s.spreadRadius), paint);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(_OuterShadowPainter old) => old.radius != radius || old.shadows != shadows;
}

/// `box-shadow: inset 0 1.5px 0 white` — a 1.5px crescent along the inside
/// top edge that follows the corner curvature.
class _TopSheenPainter extends CustomPainter {
  final BorderRadius radius;
  final double opacity;
  _TopSheenPainter(this.radius, this.opacity);

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = radius.toRRect(Offset.zero & size);
    canvas.save();
    canvas.clipRRect(rrect);
    canvas.saveLayer(Offset.zero & size, Paint());
    canvas.drawRRect(rrect, Paint()..color = Colors.white.withValues(alpha: opacity));
    canvas.drawRRect(rrect.shift(const Offset(0, 1.5)), Paint()..blendMode = BlendMode.dstOut);
    canvas.restore();
    canvas.restore();
  }

  @override
  bool shouldRepaint(_TopSheenPainter old) => old.radius != radius || old.opacity != opacity;
}
