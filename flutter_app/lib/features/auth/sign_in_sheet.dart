import 'package:flutter/material.dart';

import '../../core/password_validation.dart';
import '../../data/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_sheet.dart';
import '../office/visit_dialog.dart';

/// Port of src/components/auth/AuthDialog.tsx as a bottom sheet, scoped to
/// this stage: Google + email/password + typed-code sign-in. Left out
/// deliberately (not forgotten): the hero copy/illustration treatment and
/// the three different `reason`-based headline variants — this uses one
/// plain heading for all reasons, a later polish pass can restore that.
Future<void> showSignInSheet(BuildContext context, {required SignInReason reason}) {
  final auth = authControllerOf(context);
  auth.openSignIn(reason);
  return showAppSheet<void>(
    context,
    title: 'Sign in',
    builder: (sheetContext) => _SignInSheetBody(auth: auth),
  ).whenComplete(auth.closeSignIn);
}

enum _Step { choose, email, codeSent }

class _SignInSheetBody extends StatefulWidget {
  final AuthController auth;
  const _SignInSheetBody({required this.auth});

  @override
  State<_SignInSheetBody> createState() => _SignInSheetBodyState();
}

class _SignInSheetBodyState extends State<_SignInSheetBody> {
  _Step _step = _Step.choose;
  PasswordMode _mode = PasswordMode.signin;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _codeController = TextEditingController();
  bool _busy = false;
  bool _openingGoogle = false;
  String? _error;
  String? _codeSentTo;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _handleGoogle() async {
    if (_openingGoogle) return;
    setState(() {
      _openingGoogle = true;
      _error = null;
    });
    try {
      await widget.auth.signInWithGoogle();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _openingGoogle = false;
        _error = 'Google sign-in failed. Please try again.';
      });
    }
  }

  Future<void> _handlePasswordSubmit() async {
    if (_busy) return;
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (_mode == PasswordMode.signup) {
      final problem = validatePassword(password);
      if (problem != null) {
        setState(() => _error = problem);
        return;
      }
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final outcome = await widget.auth.signInWithPassword(_mode, email, password);
      if (!mounted) return;
      if (outcome == PasswordOutcome.confirmEmail) {
        setState(() {
          _busy = false;
          _step = _Step.codeSent;
          _codeSentTo = email;
        });
      } else {
        Navigator.of(context).pop(); // signed in — the sheet closes itself
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = friendlyAuthError(e, _mode);
      });
    }
  }

  Future<void> _sendCode() async {
    if (_busy) return;
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Enter your email address first.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.auth.sendSignInCode(email);
      if (!mounted) return;
      setState(() {
        _busy = false;
        _step = _Step.codeSent;
        _codeSentTo = email;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = 'Could not send the code. Please try again.';
      });
    }
  }

  Future<void> _verifyCode() async {
    if (_busy || _codeSentTo == null) return;
    final code = _codeController.text.replaceAll(RegExp(r'\s'), '');
    if (!RegExp(r'^\d{6,8}$').hasMatch(code)) {
      setState(() => _error = 'Enter the 6-digit code from the email.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await widget.auth.verifyEmailCode(_codeSentTo!, code);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = 'That code did not work. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // showAppSheet already supplies the sheet's outer padding — see
    // widgets/app_sheet.dart — so this just returns the step's content.
    return switch (_step) {
      _Step.choose => _buildChoose(),
      _Step.email => _buildEmailForm(),
      _Step.codeSent => _buildCodeSent(),
    };
  }

  Widget _buildChoose() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Save your stamps',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        const Text(
          'Track every stamp and keep your notes and photos safe.',
          style: TextStyle(color: AppColors.muted),
        ),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: _openingGoogle ? null : _handleGoogle,
          icon: Image.asset('assets/icons/google_logo.png', width: 20, height: 20),
          label: Text(_openingGoogle ? 'Opening Google…' : 'Continue with Google'),
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(56)),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: () => setState(() => _step = _Step.email),
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.postal,
            minimumSize: const Size.fromHeight(56),
            shape: const StadiumBorder(),
          ),
          child: const Text('Continue with email'),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: AppColors.postalDark)),
        ],
        const SizedBox(height: 8),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Maybe later'),
        ),
      ],
    );
  }

  Widget _buildEmailForm() {
    final isSignUp = _mode == PasswordMode.signup;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(isSignUp ? 'Create account' : 'Sign in', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
        const SizedBox(height: 16),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
          decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 10),
        TextField(
          controller: _passwordController,
          obscureText: true,
          autofillHints: [isSignUp ? AutofillHints.newPassword : AutofillHints.password],
          decoration: InputDecoration(
            labelText: isSignUp ? 'Password (at least $minPasswordLength characters)' : 'Password',
            border: const OutlineInputBorder(),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 10),
          Text(_error!, style: const TextStyle(color: AppColors.postalDark)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _busy ? null : _handlePasswordSubmit,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.postal,
            minimumSize: const Size.fromHeight(56),
            shape: const StadiumBorder(),
          ),
          child: Text(_busy ? 'Please wait…' : (isSignUp ? 'Create account' : 'Sign in')),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            TextButton(
              onPressed: () => setState(() {
                _mode = isSignUp ? PasswordMode.signin : PasswordMode.signup;
                _error = null;
              }),
              child: Text(isSignUp ? 'Sign in instead' : 'Create an account'),
            ),
            if (!isSignUp)
              TextButton(
                onPressed: _busy ? null : _sendCode,
                child: const Text('Forgot password?'),
              ),
          ],
        ),
        Center(
          child: TextButton(
            onPressed: _busy ? null : _sendCode,
            child: const Text('Prefer no password? Email me a code'),
          ),
        ),
      ],
    );
  }

  Widget _buildCodeSent() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('Check your inbox', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.visited.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            'We sent a 6-digit code to $_codeSentTo. Entering it signs you in — '
            'and if you asked for a password reset, you can set a new one '
            'from Account afterwards.',
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _codeController,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          style: const TextStyle(fontFamily: AppFonts.mono, fontSize: 22, letterSpacing: 4),
          decoration: const InputDecoration(labelText: 'Code', border: OutlineInputBorder()),
        ),
        if (_error != null) ...[
          const SizedBox(height: 10),
          Text(_error!, style: const TextStyle(color: AppColors.postalDark)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _busy ? null : _verifyCode,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.postal,
            minimumSize: const Size.fromHeight(56),
            shape: const StadiumBorder(),
          ),
          child: Text(_busy ? 'Checking…' : 'Verify code'),
        ),
      ],
    );
  }
}
