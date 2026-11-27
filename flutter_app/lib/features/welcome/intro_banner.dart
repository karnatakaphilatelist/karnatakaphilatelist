import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart' show liteMode;

/// Seconds into the intro (mirrors src/lib/landing.ts).
const _cardStart = 0.5, _cardEnd = 3.0, _splitAt = 3.5, _splitLen = 1.3;
const _totalSeconds = _splitAt + _splitLen;

/// Port of the web front-door intro (Landing.tsx / landing.css): a red curtain,
/// the white PHILATRAIL wordmark dropping in, a postcard travelling a dashed
/// line to a post box ("Post here"), five shapes rolling in and rounding off,
/// then the curtain splits open at the 62% line. Skippable; skipped entirely
/// in Lite mode or when the system asks for reduced motion.
class IntroBanner extends StatefulWidget {
  final int total;
  final Widget child;
  const IntroBanner({super.key, required this.child, this.total = 100});

  @override
  State<IntroBanner> createState() => _IntroBannerState();
}

class _IntroBannerState extends State<IntroBanner> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: Duration(milliseconds: (_totalSeconds * 1000).round()),
  );
  bool _done = false;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    _c.addStatusListener((s) {
      if (s == AnimationStatus.completed) _finish();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    final reduced = MediaQuery.of(context).disableAnimations;
    if (reduced || liteMode.value) {
      _done = true;
    } else {
      _c.forward();
    }
  }

  void _finish() {
    if (!_done && mounted) setState(() => _done = true);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_done) return widget.child;
    return Stack(
      fit: StackFit.expand,
      children: [
        widget.child,
        AnimatedBuilder(
          animation: _c,
          builder: (context, _) => _Curtain(seconds: _c.value * _totalSeconds, total: widget.total, onSkip: _finish),
        ),
      ],
    );
  }
}

double _k(double s, double from, double len, [Curve curve = Curves.linear]) =>
    curve.transform(((s - from) / len).clamp(0.0, 1.0));

class _Curtain extends StatelessWidget {
  final double seconds;
  final int total;
  final VoidCallback onSkip;
  const _Curtain({required this.seconds, required this.total, required this.onSkip});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final top = MediaQuery.of(context).padding.top;
    final split = _k(seconds, _splitAt, _splitLen, const Cubic(0.7, 0, 0.2, 1));
    final lineY = size.height * 0.62;
    final card = _k(seconds, _cardStart, _cardEnd - _cardStart, Curves.easeInOut);
    final fxOpacity = 1 - _k(seconds, _splitAt, 0.15);
    final skipOpacity = fxOpacity;

    final panel = SizedBox(
      width: size.width,
      height: size.height,
      child: Stack(children: [
        const Positioned.fill(child: ColoredBox(color: AppColors.postal)),
        Positioned(left: 0, right: 0, top: lineY, child: const _DashedLine()),
        Positioned(
          left: 0,
          right: 0,
          top: 16 + top,
          child: Center(child: _Wordmark(seconds: seconds, size: size)),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 30 + MediaQuery.of(context).padding.bottom,
          child: _Dots(seconds: seconds),
        ),
      ]),
    );

    final trackW = size.width - 72;
    final cardX = (size.width - 18) * card;
    final cardFade = card >= 1 ? 0.0 : (seconds > _cardStart + (_cardEnd - _cardStart) * 0.92 ? 0.0 : 1.0);
    final cardShow = seconds >= _cardStart ? cardFade : 0.0;

    return Stack(
      fit: StackFit.expand,
      children: [
        // Top panel: shows the top 62%, retracts upward.
        Align(
          alignment: Alignment.topCenter,
          child: ClipRect(
            child: Align(
              alignment: Alignment.topCenter,
              heightFactor: 0.62 * (1 - split),
              child: panel,
            ),
          ),
        ),
        // Bottom panel: shows the bottom 38%, retracts downward.
        Align(
          alignment: Alignment.bottomCenter,
          child: ClipRect(
            child: Align(
              alignment: Alignment.bottomCenter,
              heightFactor: 0.38 * (1 - split),
              child: panel,
            ),
          ),
        ),
        Opacity(
          opacity: fxOpacity,
          child: Stack(children: [
            Positioned(
              left: 0,
              top: lineY - 1,
              width: trackW * card,
              height: 2,
              child: const ColoredBox(color: Colors.white),
            ),
            Positioned(
              left: 16,
              top: lineY + 14,
              child: Text(_counter(card, total), style: _mono),
            ),
            Positioned(
              right: 16,
              top: lineY + 14,
              child: Text('Post here »', style: _mono),
            ),
            Positioned(
              right: 28,
              top: lineY - 62,
              child: Opacity(
                opacity: _k(seconds, 0.6, 0.4),
                child: const _PostBox(),
              ),
            ),
            Positioned(
              left: cardX - 64,
              top: lineY - 52,
              child: Opacity(
                opacity: cardShow,
                child: Transform.rotate(angle: -0.105 * (1 - card), child: const _FlyCard()),
              ),
            ),
          ]),
        ),
        Positioned(
          right: 16,
          bottom: 16 + MediaQuery.of(context).padding.bottom,
          child: Opacity(
            opacity: skipOpacity,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onSkip,
                borderRadius: BorderRadius.circular(999),
                child: Container(
                  constraints: const BoxConstraints(minHeight: 44, minWidth: 64),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.7)),
                  ),
                  child: Text('Skip', style: _mono),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

const _mono = TextStyle(
  fontFamily: AppFonts.mono,
  color: Colors.white,
  fontSize: 13,
  letterSpacing: 1.2,
  decoration: TextDecoration.none,
);

String _counter(double progress, int total) =>
    (progress.clamp(0.0, 1.0) * total).round().toString().padLeft(3, '0');

class _Wordmark extends StatelessWidget {
  final double seconds;
  final Size size;
  const _Wordmark({required this.seconds, required this.size});

  @override
  Widget build(BuildContext context) {
    // Stacked phone wordmark: --wm-shero = min(100vw - 32, 20dvh * 553/161).
    final w = (size.width - 32).clamp(0.0, size.height * 0.2 * 553 / 161);
    final h1 = w * 161 / 553, h2 = w * 161 / 628;
    final drop = 1 - _k(seconds, 0.35, 1.5, const Cubic(0.2, 0.8, 0.2, 1));
    const white = ColorFilter.mode(Colors.white, BlendMode.srcIn);
    return Transform.translate(
      offset: Offset(0, -1.3 * (h1 + h2 + 8) * drop),
      child: Semantics(
        label: 'Philatrail',
        child: ExcludeSemantics(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            SvgPicture.asset('assets/brand/wordmark-1.svg', width: w, height: h1, fit: BoxFit.fill, colorFilter: white),
            const SizedBox(height: 8),
            SvgPicture.asset('assets/brand/wordmark-2.svg', width: w, height: h2, fit: BoxFit.fill, colorFilter: white),
          ]),
        ),
      ),
    );
  }
}

class _DashedLine extends StatelessWidget {
  const _DashedLine();
  @override
  Widget build(BuildContext context) => CustomPaint(size: const Size(double.infinity, 2), painter: _DashPainter());
}

class _DashPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Colors.white.withValues(alpha: 0.7)
      ..strokeWidth = 2;
    for (double x = 0; x < size.width; x += 8) {
      canvas.drawLine(Offset(x, 0), Offset(x + 4, 0), p);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

class _Dots extends StatelessWidget {
  final double seconds;
  const _Dots({required this.seconds});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      for (var i = 0; i < 5; i++) ...[
        if (i > 0) const SizedBox(width: 14),
        _dot(i, 1 - _k(seconds, 0.9 + i * 0.1, 1.5, const Cubic(0.2, 0.8, 0.2, 1)), size.width),
      ],
    ]);
  }

  Widget _dot(int i, double away, double screenW) {
    // Diamond, hexagon, octagon, 16-gon, circle: sides 4,6,8,16,0 (round).
    const sides = [4, 6, 8, 16, 0];
    return Transform.translate(
      offset: Offset(-1.1 * screenW * away, 0),
      child: Transform.rotate(
        angle: -3 * 3.14159265 * away,
        child: SizedBox(width: 12, height: 12, child: CustomPaint(painter: _PolyPainter(sides[i]))),
      ),
    );
  }
}

class _PolyPainter extends CustomPainter {
  final int sides;
  const _PolyPainter(this.sides);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.white;
    final c = size.center(Offset.zero);
    final r = size.width / 2;
    if (sides == 0) {
      canvas.drawCircle(c, r, paint);
      return;
    }
    final path = Path();
    for (var i = 0; i < sides; i++) {
      final a = -1.5707963 + i * 6.2831853 / sides;
      final pt = Offset(c.dx + r * _cos(a), c.dy + r * _sin(a));
      i == 0 ? path.moveTo(pt.dx, pt.dy) : path.lineTo(pt.dx, pt.dy);
    }
    canvas.drawPath(path..close(), paint);
  }

  @override
  bool shouldRepaint(covariant _PolyPainter old) => old.sides != sides;
}

double _sin(double a) => Offset.fromDirection(a).dy;
double _cos(double a) => Offset.fromDirection(a).dx;

class _FlyCard extends StatelessWidget {
  const _FlyCard();
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 64,
      height: 42,
      decoration: BoxDecoration(
        color: AppColors.paper,
        borderRadius: BorderRadius.circular(3),
        boxShadow: const [BoxShadow(color: Color(0x40000000), blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: Stack(children: [
        Positioned(right: 5, top: 5, child: Container(width: 14, height: 16, color: AppColors.postal)),
        for (var i = 0; i < 3; i++)
          Positioned(left: 6, top: 11.0 + i * 7, child: Container(width: 24, height: 2, color: AppColors.ink)),
      ]),
    );
  }
}

class _PostBox extends StatelessWidget {
  const _PostBox();
  @override
  Widget build(BuildContext context) => SizedBox(
        width: 44,
        height: 64,
        child: CustomPaint(painter: _PostBoxPainter()),
      );
}

class _PostBoxPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    RRect r(double x, double y, double w, double h, double rad) =>
        RRect.fromRectAndRadius(Rect.fromLTWH(x, y, w, h), Radius.circular(rad));
    canvas.drawRRect(r(4, 6, 36, 56, 4), Paint()..color = AppColors.paper);
    canvas.drawRRect(r(8, 14, 28, 5, 2.5), Paint()..color = AppColors.ink);
    canvas.drawRect(const Rect.fromLTWH(14, 30, 16, 3), Paint()..color = AppColors.postal);
    canvas.drawRRect(r(0, 2, 44, 8, 4), Paint()..color = AppColors.paper);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}
