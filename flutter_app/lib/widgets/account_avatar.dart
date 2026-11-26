import 'package:flutter/material.dart';

import '../features/account/account_screen.dart';
import '../features/office/visit_dialog.dart' show authControllerOf;
import '../theme/app_theme.dart';

/// Port of src/components/layout/AccountAvatar.tsx: the round account button
/// used on Explore's search bar and the Passport header. Initial when signed
/// in (no profile-photo fetch wired up yet — falls back to the person icon),
/// a plain person glyph as a guest. `onWhite` flips it for use on the red
/// Passport header, matching the web component's `onWhite` prop exactly.
class AccountAvatarButton extends StatelessWidget {
  final double size;
  final bool onWhite;
  const AccountAvatarButton({super.key, this.size = 40, this.onWhite = false});

  @override
  Widget build(BuildContext context) {
    final auth = authControllerOf(context);
    return AnimatedBuilder(
      animation: auth,
      builder: (context, _) {
        final user = auth.user;
        final initial = user == null
            ? null
            : (user.userMetadata?['full_name'] as String? ?? user.email ?? '?')
                .trim()
                .substring(0, 1)
                .toUpperCase();
        return Material(
          color: onWhite ? Colors.white : AppColors.postal,
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const AccountScreen()),
            ),
            child: SizedBox(
              width: size,
              height: size,
              child: Center(
                child: initial != null
                    ? Text(
                        initial,
                        style: TextStyle(
                          color: onWhite ? AppColors.postal : Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: size * 0.4,
                        ),
                      )
                    : Icon(
                        Icons.person_outline,
                        color: onWhite ? AppColors.postal : Colors.white,
                        size: size * 0.5,
                      ),
              ),
            ),
          ),
        );
      },
    );
  }
}
