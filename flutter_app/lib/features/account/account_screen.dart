import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants.dart';
import '../../core/share.dart';
import '../../data/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import '../auth/sign_in_sheet.dart';
import '../learn/learn_screen.dart';
import '../office/visit_dialog.dart';
import 'edit_profile_screen.dart';
import 'set_password_screen.dart';

const _kicker = TextStyle(
  color: AppColors.muted,
  fontWeight: FontWeight.bold,
  fontSize: 12,
  letterSpacing: 2.2, // 0.18em of 12px
);

/// Port of src/components/auth/AccountView.tsx, scoped to this stage. Left
/// out deliberately (not forgotten): Lite mode (no Flutter equivalent of the
/// web app's lighter-map setting exists yet) and "Replay the walkthrough"
/// (there is no onboarding coach in this build). Privacy/Terms/Contact still
/// open the live website in the external browser; Learn now pushes the
/// native LearnScreen instead.
class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  static const _webBase = 'https://philatrail.com';

  Future<void> _openWeb(String path) => launchUrl(Uri.parse('$_webBase$path'), mode: LaunchMode.externalApplication);

  Future<void> _share() async {
    await shareProgress(
      text: "Collect a stamp from every post office in your state's Philately Passport. $_webBase",
      subject: 'Philatrail',
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = authControllerOf(context);
    return AnimatedBuilder(
      animation: auth,
      builder: (context, _) {
        final user = auth.user;
        return Scaffold(
          backgroundColor: AppColors.paper,
          body: SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              children: [
                const Text(
                  'Account',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 28, letterSpacing: -0.3),
                ),
                const SizedBox(height: 16),
                GlassCard(
                  padding: const EdgeInsets.all(16),
                  child: user != null
                      ? Row(
                          children: [
                            Container(
                              width: 64,
                              height: 64,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [Color(0xFFE0334A), AppColors.postal],
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                (user.userMetadata?['full_name'] as String? ?? user.email ?? '?')
                                    .trim()
                                    .substring(0, 1)
                                    .toUpperCase(),
                                style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    (user.userMetadata?['full_name'] as String?) ?? 'You',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                                  ),
                                  Text(
                                    user.email ?? '',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: AppColors.muted, fontFamily: AppFonts.mono, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('YOUR PASSPORT', style: _kicker),
                            const SizedBox(height: 8),
                            const Text(
                              'KEEP YOUR STAMPS SAFE',
                              style: TextStyle(fontWeight: FontWeight.w500, fontSize: 24, height: 1.17, letterSpacing: 0.2),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Sign in to keep your passport safe and use it on every device.',
                              style: TextStyle(color: AppColors.muted, height: 1.4),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              height: 56,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(28),
                                  gradient: const LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [Color(0xFFE0334A), AppColors.postal],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.postal.withValues(alpha: 0.35),
                                      blurRadius: 18,
                                      offset: const Offset(0, 8),
                                    ),
                                  ],
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(28),
                                    onTap: () => showSignInSheet(context, reason: SignInReason.manual),
                                    child: const Center(
                                      child: Text(
                                        'SIGN IN',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                          letterSpacing: 2.2,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                ),
                if (user != null) ...[
                  const SizedBox(height: 16),
                  GlassCard(
                    borderRadius: BorderRadius.circular(24),
                    child: Column(
                      children: [
                        _Row(
                          label: 'Edit profile',
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EditProfileScreen())),
                        ),
                        const _RowDivider(),
                        _Row(
                          label: 'Set or change password',
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SetPasswordScreen())),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                GlassCard(
                  borderRadius: BorderRadius.circular(24),
                  child: Column(
                    children: [
                      _Row(label: 'Share Philatrail', onTap: _share),
                      const _RowDivider(),
                      _Row(
                        label: 'Learn about philately',
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LearnScreen())),
                      ),
                      const _RowDivider(),
                      _Row(label: 'Privacy policy', onTap: () => _openWeb('/privacy')),
                      const _RowDivider(),
                      _Row(label: 'Terms of use', onTap: () => _openWeb('/terms')),
                      const _RowDivider(),
                      _Row(label: 'Contact us', onTap: () => _openWeb('/contact')),
                      if (user != null) ...[
                        const _RowDivider(),
                        _Row(
                          label: 'Delete account',
                          color: AppColors.postal,
                          onTap: () => _confirmDelete(context, auth),
                        ),
                      ],
                    ],
                  ),
                ),
                if (user != null) ...[
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton(
                      onPressed: () => auth.signOut(),
                      child: const Text('Sign out', style: TextStyle(color: AppColors.postal, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                const Text(disclaimer, style: TextStyle(color: AppColors.muted, fontSize: 12, height: 1.4)),
              ],
            ),
          ),
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, AuthController auth) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => _DeleteAccountDialog(auth: auth),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final Color? color;
  const _Row({required this.label, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 56),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Expanded(
                child: Text(label, style: TextStyle(color: color ?? AppColors.ink, fontSize: 16, fontWeight: FontWeight.w500)),
              ),
              const Icon(Icons.chevron_right, color: AppColors.muted, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _RowDivider extends StatelessWidget {
  const _RowDivider();
  @override
  Widget build(BuildContext context) => Divider(height: 1, thickness: 1, indent: 16, endIndent: 16, color: const Color(0xFF785A1E).withValues(alpha: 0.12));
}

class _DeleteAccountDialog extends StatefulWidget {
  final AuthController auth;
  const _DeleteAccountDialog({required this.auth});

  @override
  State<_DeleteAccountDialog> createState() => _DeleteAccountDialogState();
}

class _DeleteAccountDialogState extends State<_DeleteAccountDialog> {
  bool _deleting = false;
  String? _error;

  Future<void> _delete() async {
    setState(() {
      _deleting = true;
      _error = null;
    });
    try {
      await widget.auth.deleteAccount();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _deleting = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Delete your account?'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('This permanently removes your account, your stamps, notes and photos. It cannot be undone.'),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(_error!, style: const TextStyle(color: AppColors.postalDark)),
          ],
        ],
      ),
      actions: [
        TextButton(onPressed: _deleting ? null : () => Navigator.of(context).pop(), child: const Text('Keep my account')),
        FilledButton(
          onPressed: _deleting ? null : _delete,
          style: FilledButton.styleFrom(backgroundColor: AppColors.postal),
          child: Text(_deleting ? 'Deleting…' : 'Yes, delete everything'),
        ),
      ],
    );
  }
}
