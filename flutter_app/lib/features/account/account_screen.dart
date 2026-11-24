import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants.dart';
import '../../core/share.dart';
import '../../data/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../auth/sign_in_sheet.dart';
import '../office/visit_dialog.dart';
import 'edit_profile_screen.dart';
import 'set_password_screen.dart';

/// Port of src/components/auth/AccountView.tsx, scoped to this stage. Left
/// out deliberately (not forgotten): Lite mode (no Flutter equivalent of the
/// web app's lighter-map setting exists yet) and "Replay the walkthrough"
/// (there is no onboarding coach in this build). Learn/Privacy/Terms/Contact
/// open the live website in the external browser rather than porting those
/// (mostly static) pages a second time.
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
          appBar: AppBar(title: const Text('Account')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(20)),
                child: user != null
                    ? Row(
                        children: [
                          CircleAvatar(
                            radius: 28,
                            backgroundColor: AppColors.postal,
                            child: Text(
                              (user.userMetadata?['full_name'] as String? ?? user.email ?? '?')
                                  .substring(0, 1)
                                  .toUpperCase(),
                              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  (user.userMetadata?['full_name'] as String?) ?? 'You',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
                                ),
                                Text(user.email ?? '', style: const TextStyle(color: AppColors.muted, fontFamily: AppFonts.mono, fontSize: 13)),
                              ],
                            ),
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Keep your stamps safe',
                              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18)),
                          const SizedBox(height: 6),
                          const Text('Sign in to keep your passport safe and use it on every device.',
                              style: TextStyle(color: AppColors.muted)),
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: FilledButton(
                              onPressed: () => showSignInSheet(context, reason: SignInReason.manual),
                              style: FilledButton.styleFrom(backgroundColor: AppColors.postal, shape: const StadiumBorder()),
                              child: const Text('Sign in'),
                            ),
                          ),
                        ],
                      ),
              ),
              const SizedBox(height: 16),
              if (user != null) ...[
                _Row(
                  label: 'Edit profile',
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EditProfileScreen())),
                ),
                _Row(
                  label: 'Set or change password',
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SetPasswordScreen())),
                ),
              ],
              const SizedBox(height: 16),
              _Row(label: 'Share Philatrail', onTap: _share),
              _Row(label: 'Learn about philately', onTap: () => _openWeb('/learn')),
              _Row(label: 'Privacy policy', onTap: () => _openWeb('/privacy')),
              _Row(label: 'Terms of use', onTap: () => _openWeb('/terms')),
              _Row(label: 'Contact us', onTap: () => _openWeb('/contact')),
              if (user != null)
                _Row(
                  label: 'Delete account',
                  color: AppColors.postal,
                  onTap: () => _confirmDelete(context, auth),
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
    return Card(
      margin: const EdgeInsets.only(top: 1),
      elevation: 0,
      color: AppColors.card,
      child: ListTile(
        title: Text(label, style: TextStyle(color: color ?? AppColors.ink, fontWeight: FontWeight.w500)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.muted),
        onTap: onTap,
      ),
    );
  }
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
