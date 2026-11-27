import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/password_validation.dart';
import '../../data/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_icons.dart';
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
  // HeroSheet: ink/40 backdrop with a 4px blur, sheet rises 250ms ease-out.
  return showGeneralDialog<void>(
    context: context,
    useRootNavigator: true,
    barrierDismissible: true,
    barrierLabel: 'Close',
    barrierColor: Colors.transparent,
    transitionDuration: const Duration(milliseconds: 250),
    transitionBuilder: (context, animation, _, child) {
      final curved = CurvedAnimation(parent: animation, curve: Curves.easeOut, reverseCurve: Curves.easeIn);
      return Stack(
        children: [
          Positioned.fill(
            child: FadeTransition(
              opacity: curved,
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                child: ColoredBox(color: AppColors.ink.withValues(alpha: 0.4)),
              ),
            ),
          ),
          SlideTransition(position: Tween(begin: const Offset(0, 1), end: Offset.zero).animate(curved), child: child),
        ],
      );
    },
    pageBuilder: (sheetContext, _, __) => Align(
      alignment: Alignment.bottomCenter,
      child: _SignInSheet(auth: auth, reason: reason),
    ),
  ).whenComplete(auth.closeSignIn);
}

enum _Step { choose, email, codeSent }

class _SignInSheet extends StatefulWidget {
  final AuthController auth;
  final SignInReason reason;
  const _SignInSheet({required this.auth, required this.reason});

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
  bool _showPassword = false;

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

  static const _gradient = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFFFFAF0), Color(0xFFF8EED8)]);

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final notice = _step == _Step.codeSent;
    final compact = _step == _Step.email || notice;
    final heroHeight = compact ? 200.0 : (media.size.height * 0.44).clamp(0.0, 360.0);
    return Material(
      color: Colors.transparent,
      child: AnimatedPadding(
        duration: const Duration(milliseconds: 150),
        padding: EdgeInsets.only(bottom: media.viewInsets.bottom),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: media.size.width > 640 ? 448 : media.size.width),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                height: heroHeight,
                width: double.infinity,
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                  child: PostalTexture(
                    child: Stack(
                      clipBehavior: Clip.hardEdge,
                      children: [
                        Positioned(
                          right: -80,
                          top: -40,
                          width: 470,
                          height: 470,
                          child: CustomPaint(painter: _RingsPainter()),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                          child: SingleChildScrollView(
                            physics: const NeverScrollableScrollPhysics(),
                            child: _hero(context, notice),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Flexible(
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(gradient: _gradient),
                  child: SingleChildScrollView(
                    padding: EdgeInsets.fromLTRB(16, 24, 16, 24 + media.padding.bottom),
                    child: _buildBody(context, notice),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _hero(BuildContext context, bool notice) {
    final media = MediaQuery.of(context);
    final inForm = notice || _step == _Step.email;
    final headSize = (media.size.width * 0.15).clamp(44.0, 56.0);
    const white = TextStyle(color: Colors.white, fontWeight: FontWeight.w500, letterSpacing: 0.01);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 40,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (inForm)
                _HeroIconButton(
                  icon: const _Chevron(),
                  label: 'Back',
                  onTap: () => setState(() {
                    // From "check your inbox" go back to the form; from the form back to the start.
                    _codeSentTo = null;
                    _step = notice ? _Step.email : _Step.choose;
                    _error = null;
                    _codeController.clear();
                  }),
                )
              else
                const Text('PHILATRAIL',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12, height: 16 / 12, letterSpacing: 12 * 0.22)),
              _HeroIconButton(
                icon: const AppIconView(AppIcon.close, size: 16, color: Colors.white, strokeWidth: 2.8),
                label: 'Close',
                onTap: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
        if (_step == _Step.choose && !notice) ...[
          SizedBox(height: (media.size.height * 0.09).clamp(32.0, 88.0)),
          Transform.translate(
            offset: const Offset(-4, 0),
            child: Text('SAVE YOUR\nSTAMPS.', style: white.copyWith(fontSize: headSize, height: 1.07, letterSpacing: headSize * 0.01)),
          ),
          const SizedBox(height: 20),
          const Text(
            'ONE PASSPORT. EVERY DEVICE.',
            style: TextStyle(
                color: AppColors.goldOnRed, fontWeight: FontWeight.w700, fontStyle: FontStyle.italic, fontSize: 18, height: 24 / 18, letterSpacing: 18 * 0.08),
          ),
        ] else ...[
          const SizedBox(height: 32),
          Transform.translate(
            offset: const Offset(-2, 0),
            child: Text(
              (notice ? 'Check inbox' : (_mode == PasswordMode.signup ? 'Create account' : 'Sign in')).toUpperCase(),
              style: white.copyWith(fontSize: 40, height: 44 / 40, letterSpacing: 0.4),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildBody(BuildContext context, bool notice) {
    if (notice) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.visitedSoft, borderRadius: BorderRadius.circular(16)),
            child: Text(
              'Check your inbox. We sent a 6-digit code to $_codeSentTo. Entering it signs you in.',
              style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.visitedInk),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Or enter the code from the email', style: TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
          const SizedBox(height: 4),
          SizedBox(
            height: 48,
            child: TextField(
              controller: _codeController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              maxLength: 8,
              style: const TextStyle(fontFamily: AppFonts.mono, fontSize: 20, letterSpacing: 6),
              decoration: InputDecoration(
                counterText: '',
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.lineStrong)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.ink, width: 2)),
              ),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.warn)),
          ],
          const SizedBox(height: 12),
          _PrimaryPillButton(label: _busy ? 'Checking…' : 'Verify code', onTap: _busy ? null : _verifyCode),
          const SizedBox(height: 12),
          const _TermsFootnote(),
        ],
      );
    }
    if (_step == _Step.choose) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (AuthController.googleSignInConfigured) ...[
          GestureDetector(
            onTap: _openingGoogle ? null : _handleGoogle,
            child: Opacity(
              opacity: _openingGoogle ? 0.6 : 1,
              child: Container(
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: AppColors.ink, width: 1.5),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image.asset('assets/icons/google_logo.png', width: 20, height: 20),
                    const SizedBox(width: 12),
                    Text(_openingGoogle ? 'Opening Google…' : 'Continue with Google',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.ink)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          ],
          _PrimaryPillButton(label: 'Continue with email', icon: AppIcon.mail, onTap: () => setState(() => _step = _Step.email)),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.warn)),
          ],
          if (widget.reason == SignInReason.welcome) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                height: 48,
                alignment: Alignment.center,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(24), border: Border.all(color: AppColors.ink.withValues(alpha: 0.25), width: 1.5)),
                child: const Text('Explore as a guest', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.ink)),
              ),
            ),
            const SizedBox(height: 4),
            const Text('No account needed. Sign in any time from the Account tab.',
                textAlign: TextAlign.center, style: TextStyle(fontSize: 12, height: 18 / 12, color: AppColors.muted)),
          ] else ...[
            const SizedBox(height: 4),
            GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => Navigator.of(context).pop(),
              child: Container(
                constraints: const BoxConstraints(minHeight: 48),
                alignment: Alignment.center,
                child: const Text('Maybe later', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.muted)),
              ),
            ),
          ],
          const SizedBox(height: 12),
          const _TermsFootnote(),
        ],
      );
    }
    // email step
    final isSignUp = _mode == PasswordMode.signup;
    const hint = TextStyle(fontSize: 16, color: Color(0xFF9A9FB5));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _FloatingField(
          label: 'Email',
          child: TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            style: const TextStyle(fontSize: 16, color: AppColors.ink),
            decoration: const InputDecoration(border: InputBorder.none, hintText: 'you@example.com', hintStyle: hint, contentPadding: EdgeInsets.fromLTRB(18, 24, 18, 0)),
          ),
        ),
        const SizedBox(height: 12),
        _FloatingField(
          label: 'Password',
          trailing: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => setState(() => _showPassword = !_showPassword),
            child: SizedBox(
              width: 44,
              height: 44,
              child: Icon(_showPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 22, color: AppColors.muted),
            ),
          ),
          child: TextField(
            controller: _passwordController,
            obscureText: !_showPassword,
            style: const TextStyle(fontSize: 16, color: AppColors.ink),
            decoration: InputDecoration(
              border: InputBorder.none,
              hintText: isSignUp ? 'At least $minPasswordLength characters' : 'Your password',
              hintStyle: hint,
              contentPadding: const EdgeInsets.fromLTRB(18, 24, 56, 0),
            ),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.warn)),
        ],
        const SizedBox(height: 16),
        _PrimaryPillButton(label: _busy ? 'Please wait…' : (isSignUp ? 'Create account' : 'Sign in'), onTap: _busy ? null : _handlePasswordSubmit),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _TextAction(
              label: isSignUp ? 'Sign in instead' : 'Create an account',
              color: AppColors.ink,
              onTap: () => setState(() {
                _mode = isSignUp ? PasswordMode.signin : PasswordMode.signup;
                _error = null;
              }),
            ),
            if (!isSignUp) _TextAction(label: 'Forgot password?', color: AppColors.muted, onTap: _busy ? null : _sendCode),
          ],
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Prefer no password? ', style: TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
            _TextAction(label: 'Email me a sign-in link', color: AppColors.postal, bold: true, onTap: _busy ? null : _sendCode),
          ],
        ),
        const SizedBox(height: 12),
        const _TermsFootnote(),
      ],
    );
  }
}

/// Concentric hairline rings behind the headline (the web hero's inline SVG).
class _RingsPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 390;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = scale
      ..color = Colors.white.withValues(alpha: 0.08);
    for (var i = 0; i < 17; i++) {
      canvas.drawCircle(Offset(235 * scale, 190 * scale), (24 + i * 16) * scale, paint);
    }
  }

  @override
  bool shouldRepaint(_RingsPainter old) => false;
}

class _Chevron extends StatelessWidget {
  const _Chevron();
  @override
  Widget build(BuildContext context) =>
      const Icon(Icons.chevron_left_rounded, color: Colors.white, size: 26);
}

/// 40px translucent white circle with an inset top highlight.
class _HeroIconButton extends StatelessWidget {
  final Widget icon;
  final String label;
  final VoidCallback onTap;
  const _HeroIconButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 40,
          height: 40,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white.withValues(alpha: 0.2),
            border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.4))),
          ),
          child: icon,
        ),
      ),
    );
  }
}

class _TextAction extends StatelessWidget {
  final String label;
  final Color color;
  final bool bold;
  final VoidCallback? onTap;
  const _TextAction({required this.label, required this.color, this.bold = false, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Opacity(
        opacity: onTap == null ? 0.6 : 1,
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          alignment: Alignment.center,
          child: Text(label, style: TextStyle(fontSize: 14, height: 20 / 14, fontWeight: bold ? FontWeight.w700 : FontWeight.w600, color: color)),
        ),
      ),
    );
  }
}

class _PrimaryPillButton extends StatelessWidget {
  final String label;
  final AppIcon? icon;
  final VoidCallback? onTap;
  const _PrimaryPillButton({required this.label, this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: onTap == null ? 0.6 : 1,
        child: Container(
          height: 56,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [AppColors.postalTop, AppColors.postal]),
            boxShadow: [cssShadow(0, 8, 18, -8, AppColors.postal.withValues(alpha: 0.7))],
          ),
          foregroundDecoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.35), width: 1.5)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[AppIconView(icon!, size: 20, color: Colors.white, strokeWidth: 2.4), const SizedBox(width: 10)],
              Text(label.toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16, letterSpacing: 16 * 0.14)),
            ],
          ),
        ),
      ),
    );
  }
}

class _FloatingField extends StatelessWidget {
  final String label;
  final Widget child;
  final Widget? trailing;
  const _FloatingField({required this.label, required this.child, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 60,
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.75), borderRadius: BorderRadius.circular(20)),
      foregroundDecoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF8C6428).withValues(alpha: 0.22), width: 1.5),
      ),
      child: Stack(
        children: [
          Positioned.fill(child: child),
          Positioned(
            left: 18,
            top: 8,
            child: IgnorePointer(
              child: Text(label.toUpperCase(),
                  style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w700, fontSize: 11, height: 14 / 11, letterSpacing: 11 * 0.12)),
            ),
          ),
          if (trailing != null) Positioned(right: 8, top: 8, child: trailing!),
        ],
      ),
    );
  }
}

class _TermsFootnote extends StatelessWidget {
  const _TermsFootnote();

  static void _open(String path) => launchUrl(Uri.parse('https://philatrail.com$path'), mode: LaunchMode.externalApplication);

  @override
  Widget build(BuildContext context) {
    const base = TextStyle(color: AppColors.muted, fontSize: 12, height: 18 / 12);
    const link = TextStyle(decoration: TextDecoration.underline);
    return Center(
      child: Wrap(
        alignment: WrapAlignment.center,
        children: [
          const Text('By continuing you agree to the ', style: base),
          GestureDetector(onTap: () => _open('/terms'), child: Text('Terms', style: base.merge(link))),
          const Text(' and ', style: base),
          GestureDetector(onTap: () => _open('/privacy'), child: Text('Privacy Policy', style: base.merge(link))),
          const Text('.', style: base),
        ],
      ),
    );
  }
}
