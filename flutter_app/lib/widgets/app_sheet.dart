import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Port of src/components/ui/Sheet.tsx's shape (title row + close button,
/// bottom sheet on phones) as a showModalBottomSheet wrapper. Dismiss/focus
/// trapping/Escape are handled by showModalBottomSheet itself — Flutter's
/// modal route already provides those, so there's nothing to replicate
/// there; this only needs to port the visual header + scaffold.
Future<T?> showAppSheet<T>(
  BuildContext context, {
  required String title,
  bool band = false,
  required WidgetBuilder builder,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.card,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (sheetContext) => SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(sheetContext).viewInsets.bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: EdgeInsets.fromLTRB(20, 20, 20, band ? 20 : 4),
              decoration: band
                  ? const BoxDecoration(
                      color: AppColors.postal,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    )
                  : null,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: Theme.of(sheetContext).textTheme.headlineSmall?.copyWith(
                            color: band ? Colors.white : AppColors.ink,
                          ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(sheetContext).pop(),
                    icon: Icon(Icons.close, color: band ? Colors.white : AppColors.ink),
                    style: IconButton.styleFrom(
                      backgroundColor: band ? Colors.white24 : AppColors.sand,
                      shape: const CircleBorder(),
                    ),
                  ),
                ],
              ),
            ),
            Flexible(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                child: builder(sheetContext),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
