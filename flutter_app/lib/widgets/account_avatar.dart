import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../app_shell.dart' show goToTab;
import '../features/office/visit_dialog.dart' show authControllerOf;
import '../theme/app_theme.dart';
import 'app_icons.dart';

String? _metadataString(User user, List<String> keys) {
  for (final key in keys) {
    final value = user.userMetadata?[key];
    if (value is String && value.trim().isNotEmpty) return value.trim();
  }
  return null;
}

/// Port of src/lib/user-display.ts.
String? displayName(User user) => _metadataString(user, ['full_name', 'name']) ?? user.email;

String? avatarUrl(User user) {
  final url = _metadataString(user, ['avatar_url', 'picture']);
  if (url == null || url.length > 2048) return null;
  return url.toLowerCase().startsWith('https://') ? url : null;
}

String userInitial(User user) {
  final label = displayName(user);
  return (label == null || label.isEmpty) ? '?' : label.substring(0, 1).toUpperCase();
}

String? firstName(User user) {
  final name = _metadataString(user, ['full_name', 'name']);
  final first = name?.split(RegExp(r'\s+')).first;
  if (first == null || first.isEmpty) return null;
  return first.length > 40 ? first.substring(0, 40) : first;
}

/// Port of src/components/layout/AccountAvatar.tsx: the round red account
/// button (photo, initial, or a person outline for guests). Like the web's
/// `<Link href="/account">` it switches to the Account tab.
class AccountAvatarButton extends StatelessWidget {
  final double size;
  final bool onWhite;
  const AccountAvatarButton({super.key, this.size = 40, this.onWhite = false});

  @override
  Widget build(BuildContext context) {
    final auth = authControllerOf(context);
    final fg = onWhite ? AppColors.postal : Colors.white;
    return AnimatedBuilder(
      animation: auth,
      builder: (context, _) {
        final user = auth.user;
        final photo = user == null ? null : avatarUrl(user);
        final initialStyle = TextStyle(color: fg, fontSize: 16, fontWeight: FontWeight.w700);
        Widget content;
        if (photo != null) {
          content = Image.network(photo, width: size, height: size, fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Center(child: Text(userInitial(user!), style: initialStyle)));
        } else if (user != null) {
          content = Center(child: Text(userInitial(user), style: initialStyle));
        } else {
          content = Center(child: AppIconView(AppIcon.user, size: 20, color: fg));
        }
        return Semantics(
          button: true,
          label: 'Your account',
          excludeSemantics: true,
          child: GestureDetector(
            onTap: () => goToTab(context, 3),
            child: Container(
              width: size,
              height: size,
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(color: onWhite ? Colors.white : AppColors.postal, shape: BoxShape.circle),
              child: CustomPaint(
                foregroundPainter: _InsetTopLine(),
                child: content,
              ),
            ),
          ),
        );
      },
    );
  }
}

/// `shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]` on a circle.
class _InsetTopLine extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final path = Path()..addOval(rect);
    canvas.save();
    canvas.clipPath(path);
    canvas.saveLayer(rect, Paint());
    canvas.drawOval(rect, Paint()..color = const Color(0x40FFFFFF));
    canvas.drawOval(rect.shift(const Offset(0, 1)), Paint()..blendMode = BlendMode.dstOut);
    canvas.restore();
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
