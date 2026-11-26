import 'package:flutter/material.dart';

import '../core/stamp_image.dart';
import '../theme/app_theme.dart';
import 'app_icons.dart';

/// Port of src/components/office/StampThumb.tsx: the office's PPC stamp
/// image on a sand tile (rounded-xl), always full colour; a mail outline at
/// half size when there's no image or it fails to load.
///
/// [hero] adds the office-detail treatment from OfficeDetail.tsx
/// (`rounded-2xl border border-ink/10 shadow-[0_2px_8px_rgb(22_32_79/0.06)]`).
class StampThumb extends StatelessWidget {
  final String? path;

  /// Fixed square side when not [natural].
  final double size;

  /// Size to the image's own proportions (max 160×180, 4px inset) instead
  /// of a fixed square; the fallback is a 52px square.
  final bool natural;
  final bool hero;
  const StampThumb({super.key, required this.path, this.size = 52, this.natural = false, this.hero = false});

  @override
  Widget build(BuildContext context) {
    final url = stampImageUrl(path);
    final side = natural ? 52.0 : size;
    final fallback = SizedBox(
      width: side,
      height: side,
      child: Center(child: AppIconView(AppIcon.mail, size: side / 2, color: AppColors.muted)),
    );
    Widget inner;
    if (url == null) {
      inner = fallback;
    } else if (natural) {
      inner = ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 160, maxHeight: 180),
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Image.network(url, errorBuilder: (_, __, ___) => fallback),
        ),
      );
    } else {
      inner = SizedBox(
        width: size,
        height: size,
        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Image.network(url, fit: BoxFit.contain, errorBuilder: (_, __, ___) => fallback),
        ),
      );
    }
    final radius = BorderRadius.circular(hero ? 16 : 12);
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: AppColors.sand,
        borderRadius: radius,
        border: hero ? Border.all(color: AppColors.ink.withValues(alpha: 0.1)) : null,
        boxShadow: hero ? [cssShadow(0, 2, 8, 0, AppColors.ink.withValues(alpha: 0.06))] : null,
      ),
      child: inner,
    );
  }
}
