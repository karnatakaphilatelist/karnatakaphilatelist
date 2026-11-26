import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'app_icons.dart';
import 'glass_card.dart';
import 'postal_texture.dart';

/// Port of src/components/ui/Sheet.tsx: a `.kp-glass-panel` bottom sheet
/// (rounded-t-3xl, max 92% tall) over a warm `#3a2a0c`/40% backdrop, with an
/// uppercase 24px title, optional description, a 44px glass close button,
/// and the body padded `px-5 pt-4 pb-[1.5rem+safe-area]`. `band` paints the
/// header as a `.kp-red` strip with white text (the sign-in sheet).
Future<T?> showAppSheet<T>(
  BuildContext context, {
  required String title,
  String? description,
  bool band = false,
  required WidgetBuilder builder,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useRootNavigator: true,
    backgroundColor: Colors.transparent,
    barrierColor: const Color(0x663A2A0C),
    elevation: 0,
    builder: (sheetContext) {
      final media = MediaQuery.of(sheetContext);
      return Padding(
        padding: EdgeInsets.only(bottom: media.viewInsets.bottom),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: media.size.height * 0.92),
          child: GlassCard(
            kind: GlassKind.panel,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _SheetHeader(title: title, description: description, band: band, onClose: () => Navigator.of(sheetContext).pop()),
                  Padding(
                    padding: EdgeInsets.fromLTRB(20, 16, 20, 24 + media.padding.bottom),
                    child: builder(sheetContext),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    },
  );
}

class _SheetHeader extends StatelessWidget {
  final String title;
  final String? description;
  final bool band;
  final VoidCallback onClose;
  const _SheetHeader({required this.title, required this.description, required this.band, required this.onClose});

  @override
  Widget build(BuildContext context) {
    final fg = band ? Colors.white : AppColors.ink;
    final row = Padding(
      padding: EdgeInsets.fromLTRB(20, 20, 20, band ? 20 : 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.toUpperCase(),
                  style: TextStyle(fontSize: 24, height: 28 / 24, fontWeight: FontWeight.w500, letterSpacing: 0.24, color: fg),
                ),
                if (description != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      description!,
                      style: TextStyle(fontSize: 14, height: 20 / 14, color: band ? Colors.white.withValues(alpha: 0.9) : AppColors.muted),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Transform.translate(
            offset: const Offset(8, -4),
            child: SheetCloseButton(onTap: onClose),
          ),
        ],
      ),
    );
    return band ? PostalTexture(child: row) : row;
  }
}

/// The 44px round `.kp-glass` close button used by every sheet and dialog.
class SheetCloseButton extends StatelessWidget {
  final VoidCallback onTap;
  final double size;
  final double iconSize;
  const SheetCloseButton({super.key, required this.onTap, this.size = 44, this.iconSize = 20});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'Close',
      excludeSemantics: true,
      child: GestureDetector(
        onTap: onTap,
        child: GlassCard(
          borderRadius: const BorderRadius.all(Radius.circular(999)),
          child: SizedBox(
            width: size,
            height: size,
            child: Center(child: AppIconView(AppIcon.close, size: iconSize, color: AppColors.ink)),
          ),
        ),
      ),
    );
  }
}
