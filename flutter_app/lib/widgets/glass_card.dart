import 'package:flutter/material.dart';

/// Port of globals.css's `.kp-glass` — the frosted cream card used for the
/// Account sign-in card, its row groups, Passport's "Up next" pills and the
/// guest nudge. Over the app's flat paper background a backdrop blur adds
/// nothing visible, so this is a flat gradient + soft shadow approximation
/// of the same two colors, not a literal `BackdropFilter` port.
class GlassCard extends StatelessWidget {
  final Widget child;
  final BorderRadius borderRadius;
  final EdgeInsetsGeometry? padding;
  const GlassCard({
    super.key,
    required this.child,
    this.borderRadius = const BorderRadius.all(Radius.circular(24)),
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.white.withValues(alpha: 0.82),
            const Color(0xFFFFFAF0).withValues(alpha: 0.74),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF16204F).withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
  }
}
