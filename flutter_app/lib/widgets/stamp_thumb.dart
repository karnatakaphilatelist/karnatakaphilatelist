import 'package:flutter/material.dart';

import '../core/stamp_image.dart';
import '../theme/app_theme.dart';

/// Port of src/components/office/StampThumb.tsx: the office's official PPC
/// stamp image, always shown in full colour (the green verified badge
/// elsewhere is the visited indicator) — falls back to a mail icon when
/// there is no image yet or it fails to load. `errorBuilder` on
/// Image.network replaces the web version's onError+useState dance.
class StampThumb extends StatelessWidget {
  final String? path;
  /// Fixed square side when not [natural]. Ignored when [natural] is true.
  final double size;
  /// When true, the container sizes to the image's own aspect ratio
  /// (bounded to a max box) instead of a fixed square — used for the
  /// office-detail hero, where each stamp keeps its own proportions.
  final bool natural;
  const StampThumb({super.key, required this.path, this.size = 52, this.natural = false});

  @override
  Widget build(BuildContext context) {
    final url = stampImageUrl(path);
    final fallback = Container(
      width: natural ? 52 : size,
      height: natural ? 52 : size,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(12)),
      child: Icon(Icons.mail_outline, color: AppColors.muted, size: (natural ? 52 : size) / 2),
    );
    if (url == null) {
      return natural
          ? fallback
          : ClipRRect(borderRadius: BorderRadius.circular(12), child: fallback);
    }

    final image = Image.network(
      url,
      fit: natural ? BoxFit.contain : BoxFit.contain,
      errorBuilder: (context, error, stackTrace) => fallback,
    );

    if (natural) {
      return ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 160, maxHeight: 180),
        child: Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(12)),
          child: image,
        ),
      );
    }
    return Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: AppColors.sand, borderRadius: BorderRadius.circular(12)),
      child: image,
    );
  }
}
