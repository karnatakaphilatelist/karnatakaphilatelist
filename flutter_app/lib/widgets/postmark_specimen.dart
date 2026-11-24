import 'package:flutter/material.dart';

import '../core/stamp_image.dart';
import '../theme/app_theme.dart';

/// Port of src/components/office/PostmarkSpecimen.tsx: the office's real
/// scanned postmark, shown small beside "About this place" — greyed out
/// until the office is visited, full colour after. Renders nothing when the
/// office has no scanned postmark yet (same as the web version).
class PostmarkSpecimen extends StatelessWidget {
  final String? path;
  final bool visited;
  final String name;
  const PostmarkSpecimen({super.key, required this.path, required this.visited, required this.name});

  @override
  Widget build(BuildContext context) {
    final url = stampImageUrl(path);
    if (url == null) return const SizedBox.shrink();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Transform.rotate(
          angle: -0.035,
          child: Container(
            width: 72,
            height: 72,
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: AppColors.ink.withValues(alpha: 0.1)),
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [BoxShadow(color: Color(0x1A16204F), blurRadius: 8, offset: Offset(0, 3))],
            ),
            child: ColorFiltered(
              colorFilter: visited
                  ? const ColorFilter.mode(Colors.transparent, BlendMode.multiply)
                  : const ColorFilter.matrix(<double>[
                      0.2126, 0.7152, 0.0722, 0, 0,
                      0.2126, 0.7152, 0.0722, 0, 0,
                      0.2126, 0.7152, 0.0722, 0, 0,
                      0, 0, 0, 0.7, 0,
                    ]),
              child: Image.network(
                url,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'POSTMARK',
          style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1.2, color: AppColors.muted),
        ),
      ],
    );
  }
}
