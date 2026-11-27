import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/password_validation.dart';
import '../../app_shell.dart' show AppTabBar, goToTab;
import '../../data/auth_controller.dart' show SignInReason;
import '../../theme/app_theme.dart';
import '../auth/sign_in_sheet.dart';
import 'edit_profile_screen.dart' show ProfileTextField;

/// Port of src/components/auth/SetPasswordView.tsx. Reached from Account
/// ("Set or change password") rather than from a clicked reset-email link —
/// see auth_controller.dart's doc comment on the typed-code reset flow.
class SetPasswordScreen extends StatefulWidget {
  const SetPasswordScreen({super.key});

  @override
  State<SetPasswordScreen> createState() => _SetPasswordScreenState();
}

class _SetPasswordScreenState extends State<SetPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _busy = false;
  String? _error;
  bool _done = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final password = _passwordController.text;
    final problem = validatePassword(password);
    if (problem != null) {
      setState(() => _error = problem);
      return;
    }
    if (password != _confirmController.text) {
      setState(() => _error = 'The two passwords do not match.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await Supabase.instance.client.auth.updateUser(UserAttributes(password: password));
      if (!mounted) return;
      setState(() {
        _busy = false;
        _done = true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = friendlyAuthError(e, PasswordMode.signup, 'update your password');
      });
    }
  }

  Widget _label(String text, TextEditingController c) => Padding(
        padding: const EdgeInsets.only(top: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(text, style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
            const SizedBox(height: 4),
            ProfileTextField(controller: c, obscure: true),
          ],
        ),
      );

  @override
  Widget build(BuildContext context) {
    final insets = MediaQuery.of(context).padding;
    final user = Supabase.instance.client.auth.currentUser;
    final email = user?.email;
    final card = BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.line));
    Widget pill(String label, Color bg, VoidCallback onTap, {FontWeight weight = FontWeight.w600}) => Align(
          alignment: Alignment.centerLeft,
          child: GestureDetector(
            onTap: onTap,
            child: Container(
              constraints: const BoxConstraints(minHeight: 44),
              padding: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
              child: Center(widthFactor: 1, child: Text(label, style: TextStyle(fontSize: 14, fontWeight: weight, color: Colors.white))),
            ),
          ),
        );
    return Scaffold(
      backgroundColor: AppColors.paper,
      bottomNavigationBar: const AppTabBar(index: 3),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, insets.top + 32, 20, 40),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Set a password',
                    style: TextStyle(fontFamily: AppFonts.display, fontSize: 30, height: 36 / 30, fontWeight: FontWeight.w700, letterSpacing: 30 * -0.025, color: AppColors.ink)),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: card,
                  child: user == null
                      ? Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Sign in first to set a password. If you came from a reset email and ended up here, the link may have been opened in a different browser or has expired. Ask for a new one from the sign-in box.',
                              style: TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted),
                            ),
                            const SizedBox(height: 16),
                            pill('Sign in', AppColors.ink, () => showSignInSheet(context, reason: SignInReason.manual)),
                          ],
                        )
                      : _done
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Your password is saved.', style: TextStyle(fontSize: 16, height: 24 / 16, fontWeight: FontWeight.w600, color: AppColors.visitedInk)),
                                const SizedBox(height: 4),
                                Text('Next time you can sign in with ${email ?? 'your email'} and this password.',
                                    style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
                                const SizedBox(height: 16),
                                pill('Back to my passport', AppColors.postal, () => goToTab(context, 1)),
                              ],
                            )
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Text('Signed in as ${email ?? 'you'}. Choose a password of at least $minPasswordLength characters.',
                                    style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
                                const SizedBox(height: 4),
                                _label('New password', _passwordController),
                                _label('Repeat it', _confirmController),
                                if (_error != null) ...[
                                  const SizedBox(height: 12),
                                  Text(_error!, style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.postalDark)),
                                ],
                                const SizedBox(height: 16),
                                GestureDetector(
                                  onTap: _busy ? null : _save,
                                  child: Opacity(
                                    opacity: _busy ? 0.6 : 1,
                                    child: Container(
                                      constraints: const BoxConstraints(minHeight: 48),
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(color: AppColors.ink, borderRadius: BorderRadius.circular(999)),
                                      child: Text(_busy ? 'Saving…' : 'Save password',
                                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
