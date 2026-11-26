import 'package:flutter/material.dart';

import '../../core/password_validation.dart';
import '../../data/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/postal_texture.dart';
import '../office/visit_dialog.dart';

/// Port of src/components/auth/AuthDialog.tsx as a bottom sheet: a postal-red
/// hero (guilloche texture + concentric rings, matching PostalScreen/
/// AccountView's `.kp-red`) with "SAVE YOUR STAMPS." / "ONE PASSPORT. EVERY
/// DEVICE." — the same fixed headline the web app shows on every sign-in
/// reason — then Google + email/password + typed-code sign-in below on the
/// paper background.
Future<void> showSignInSheet(BuildContext context, {required SignInReason reason}) {
  final auth = authControllerOf(context);
  auth.openSignIn(reason);
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.paper,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
    ),
    builder: (sheetContext) => _SignInSheet(auth: auth),
  ).whenComplete(auth.closeSignIn);
}

enum _Step { choose, email, codeSent }

class _SignInSheet extends StatefulWidget {
  final AuthController auth;
  const _SignInSheet({required this.auth});

  @override
  State<_SignInSheet> createState() => _SignInSheetState();
}

class _SignInSheetState extends State<_SignInSheet> {
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
        Navigator.of(context).pop();
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
    final notice = _step == _Step.codeSent;
    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                child: PostalTexture(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(20, 20, 20, notice || _step == _Step.email ? 28 : 40),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            if (notice || _step == _Step.email)
                              _HeroIconButton(
                                icon: Icons.arrow_back_ios_new,
                                iconSize: 16,
                                onTap: () => setState(() {
                                  if (_step != _Step.codeSent) _step = _Step.choose;
                                  _codeSentTo = null;
                                  _error = null;
                                  _codeController.clear();
                                }),
                              )
                            else
                              const Text(
                                'PHILATRAIL',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12, letterSpacing: 2.6),
                              ),
                            _HeroIconButton(icon: Icons.close, onTap: () => Navigator.of(context).pop()),
                          ],
                        ),
                        SizedBox(height: notice || _step == _Step.email ? 24 : 36),
                        if (_step == _Step.choose && !notice) ...[
                          const Text(
                            'SAVE YOUR\nSTAMPS.',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 44, height: 1.07, letterSpacing: 0.3),
                          ),
                          const SizedBox(height: 14),
                          const Text(
                            'ONE PASSPORT. EVERY DEVICE.',
                            style: TextStyle(
                              color: AppColors.goldOnRed,
                              fontWeight: FontWeight.bold,
                              fontStyle: FontStyle.italic,
                              fontSize: 17,
                              letterSpacing: 1.3,
                            ),
                          ),
                        ] else
                          Text(
                            notice ? 'Check inbox' : (_mode == PasswordMode.signup ? 'Create account' : 'Sign in'),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 36, letterSpacing: 0.3),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                child: _buildBody(context, notice),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context, bool notice) {
    if (notice) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.visitedSoft, borderRadius: BorderRadius.circular(16)),
            child: Text(
              'Check your inbox. We sent a 6-digit code to $_codeSentTo. Entering it signs you in.',
              style: const TextStyle(color: AppColors.visitedInk, height: 1.4),
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
          _PrimaryPillButton(
            label: _busy ? 'CHECKING…' : 'VERIFY CODE',
            onTap: _busy ? null : _verifyCode,
          ),
        ],
      );
    }
    if (_step == _Step.choose) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 56,
            child: OutlinedButton.icon(
              onPressed: _openingGoogle ? null : _handleGoogle,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.ink, width: 1.5),
                backgroundColor: Colors.white,
              ),
              icon: Image.asset('assets/icons/google_logo.png', width: 20, height: 20),
              label: Text(_openingGoogle ? 'Opening Google…' : 'Continue with Google', style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 12),
          _PrimaryPillButton(
            label: 'CONTINUE WITH EMAIL',
            icon: Icons.mail_outline,
            onTap: () => setState(() => _step = _Step.email),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Maybe later', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 8),
          const _TermsFootnote(),
        ],
      );
    }
    // email step
    final isSignUp = _mode == PasswordMode.signup;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _FloatingField(
          label: 'Email',
          child: TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.fromLTRB(18, 22, 18, 4)),
          ),
        ),
        const SizedBox(height: 10),
        _FloatingField(
          label: 'Password',
          child: TextField(
            controller: _passwordController,
            obscureText: true,
            decoration: InputDecoration(
              border: InputBorder.none,
              contentPadding: const EdgeInsets.fromLTRB(18, 22, 18, 4),
              hintText: isSignUp ? 'At least $minPasswordLength characters' : null,
            ),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 10),
          Text(_error!, style: const TextStyle(color: AppColors.postalDark, fontWeight: FontWeight.w600)),
        ],
        const SizedBox(height: 16),
        _PrimaryPillButton(
          label: _busy ? 'PLEASE WAIT…' : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'),
          onTap: _busy ? null : _handlePasswordSubmit,
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
              child: Text(isSignUp ? 'Sign in instead' : 'Create an account', style: const TextStyle(color: AppColors.ink, fontWeight: FontWeight.w600)),
            ),
            if (!isSignUp)
              TextButton(
                onPressed: _busy ? null : _sendCode,
                child: const Text('Forgot password?', style: TextStyle(color: AppColors.muted, fontWeight: FontWeight.w600)),
              ),
          ],
        ),
        Center(
          child: TextButton(
            onPressed: _busy ? null : _sendCode,
            child: const Text.rich(
              TextSpan(
                style: TextStyle(color: AppColors.muted),
                children: [
                  TextSpan(text: 'Prefer no password? '),
                  TextSpan(text: 'Email me a sign-in link', style: TextStyle(color: AppColors.postal, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        const _TermsFootnote(),
      ],
    );
  }
}

class _HeroIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final double iconSize;
  const _HeroIconButton({required this.icon, required this.onTap, this.iconSize = 18});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.2),
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, color: Colors.white, size: iconSize),
        ),
      ),
    );
  }
}

class _PrimaryPillButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onTap;
  const _PrimaryPillButton({required this.label, this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFE0334A), AppColors.postal],
          ),
          boxShadow: onTap == null
              ? null
              : [BoxShadow(color: AppColors.postal.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 8))],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(28),
            onTap: onTap,
            child: Opacity(
              opacity: onTap == null ? 0.6 : 1,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, color: Colors.white, size: 20),
                    const SizedBox(width: 10),
                  ],
                  Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 1.8)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _FloatingField extends StatelessWidget {
  final String label;
  final Widget child;
  const _FloatingField({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF8C6428).withValues(alpha: 0.22), width: 1.5),
      ),
      child: Stack(
        children: [
          Positioned(
            left: 18,
            top: 8,
            child: Text(
              label.toUpperCase(),
              style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.bold, fontSize: 11, letterSpacing: 1.3),
            ),
          ),
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}

class _TermsFootnote extends StatelessWidget {
  const _TermsFootnote();
  @override
  Widget build(BuildContext context) {
    return const Text.rich(
      TextSpan(
        style: TextStyle(color: AppColors.muted, fontSize: 12, height: 1.4),
        children: [
          TextSpan(text: 'By continuing you agree to the '),
          TextSpan(text: 'Terms', style: TextStyle(decoration: TextDecoration.underline)),
          TextSpan(text: ' and '),
          TextSpan(text: 'Privacy Policy', style: TextStyle(decoration: TextDecoration.underline)),
          TextSpan(text: '.'),
        ],
      ),
      textAlign: TextAlign.center,
    );
  }
}
