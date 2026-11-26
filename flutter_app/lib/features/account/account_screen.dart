import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app_shell.dart';
import '../../core/constants.dart';
import '../../core/share.dart';
import '../../data/auth_controller.dart';
import '../../theme/app_theme.dart';
import '../../widgets/account_avatar.dart';
import '../../widgets/app_icons.dart';
import '../../widgets/app_sheet.dart';
import '../../widgets/glass_card.dart';
import '../auth/sign_in_sheet.dart';
import '../coach/coach_tour.dart' show coachReplay;
import '../office/office_detail_screen.dart' show RedCtaButton;
import '../office/visit_dialog.dart' show authControllerOf;
import 'edit_profile_screen.dart';
import 'set_password_screen.dart';

const _webBase = 'https://philatrail.com';
const _contactEmail = 'karnatakaphilatelist@gmail.com';
const _kicker = TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w700, letterSpacing: 12 * 0.18, color: AppColors.muted);

/// Port of src/components/auth/AccountView.tsx (+ SupportProjectSection.tsx).
class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  Future<void> _openWeb(String path) =>
      launchUrl(Uri.parse('$_webBase$path'), mode: LaunchMode.inAppBrowserView);

  Future<void> _share(BuildContext context) async {
    final result = await shareText(
      text: "Collect a stamp from every post office in your state's Philately Passport. $_webBase",
      subject: 'Philatrail',
    );
    if (result == ShareOutcome.failed && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not share. Please try again.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = authControllerOf(context);
    return AnimatedBuilder(
      animation: auth,
      builder: (context, _) {
        final user = auth.user;
        if (auth.isLoading) {
          return const Scaffold(
            backgroundColor: AppColors.paper,
            body: Center(child: Text('Loading…', style: TextStyle(fontSize: 16, color: AppColors.muted))),
          );
        }
        return Scaffold(
          backgroundColor: AppColors.paper,
          body: ListView(
            padding: EdgeInsets.fromLTRB(16, MediaQuery.of(context).padding.top + 32, 16, 32),
            children: [
              const Text('Account', style: TextStyle(fontSize: 28, height: 32 / 28, fontWeight: FontWeight.w700, letterSpacing: -0.28, color: AppColors.ink)),
              const SizedBox(height: 16),
              GlassCard(
                borderRadius: const BorderRadius.all(Radius.circular(24)),
                padding: const EdgeInsets.all(16),
                child: user != null
                    ? Row(
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            clipBehavior: Clip.antiAlias,
                            alignment: Alignment.center,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [AppColors.postalTop, AppColors.postal],
                              ),
                            ),
                            child: avatarUrl(user) != null
                                ? Image.network(avatarUrl(user)!, width: 64, height: 64, fit: BoxFit.cover)
                                : Text(userInitial(user), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white)),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(displayName(user) ?? 'You',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 18, height: 28 / 18, fontWeight: FontWeight.w700, color: AppColors.ink)),
                                Text(user.email ?? '',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontFamily: AppFonts.mono, fontSize: 13, color: AppColors.muted)),
                              ],
                            ),
                          ),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text('YOUR PASSPORT', style: _kicker),
                          const SizedBox(height: 8),
                          const Text('KEEP YOUR STAMPS SAFE',
                              style: TextStyle(fontSize: 24, height: 28 / 24, fontWeight: FontWeight.w500, letterSpacing: 0.24, color: AppColors.ink)),
                          const SizedBox(height: 8),
                          const Text('Sign in to keep your passport safe and use it on every device.',
                              style: TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
                          const SizedBox(height: 16),
                          RedCtaButton(label: 'Sign in', onTap: () => showSignInSheet(context, reason: SignInReason.manual)),
                        ],
                      ),
              ),
              const SizedBox(height: 16),
              _RowGroup(children: [
                if (user != null)
                  _Row(label: 'Edit profile', onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const EditProfileScreen()))),
                if (user != null)
                  _Row(label: 'Set or change password', onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SetPasswordScreen()))),
                _Row(
                  label: 'Replay the walkthrough',
                  onTap: () {
                    goToTab(context, 0);
                    coachReplay.value++;
                  },
                ),
                const _LiteModeRow(),
              ]),
              const SizedBox(height: 16),
              _RowGroup(children: [
                _Row(label: 'Share Philatrail', onTap: () => _share(context)),
                _Row(label: 'Learn about philately', onTap: () => goToTab(context, 2)),
                _Row(label: 'Privacy policy', onTap: () => _openWeb('/privacy')),
                _Row(label: 'Terms of use', onTap: () => _openWeb('/terms')),
                _Row(label: 'Contact us', onTap: () => _openWeb('/contact')),
                if (user != null) _Row(label: 'Delete account', color: AppColors.postal, onTap: () => _confirmDelete(context, auth)),
              ]),
              const SizedBox(height: 16),
              const _SupportSection(),
              if (user != null) ...[
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: () => auth.signOut(),
                  child: const GlassCard(
                    borderRadius: BorderRadius.all(Radius.circular(999)),
                    child: SizedBox(
                      height: 56,
                      child: Center(child: Text('Sign out', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.postal))),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              const Text(disclaimer, style: TextStyle(fontSize: 12, height: 20 / 12, color: AppColors.muted)),
            ],
          ),
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, AuthController auth) {
    showAppSheet<void>(
      context,
      title: 'Delete your account?',
      description: 'This permanently removes your account, your stamps, notes and photos. It cannot be undone.',
      builder: (sheetContext) => _DeleteAccountBody(auth: auth),
    );
  }
}

class _RowGroup extends StatelessWidget {
  final List<Widget> children;
  const _RowGroup({required this.children});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: const BorderRadius.all(Radius.circular(24)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Column(
          children: [
            for (var i = 0; i < children.length; i++)
              DecoratedBox(
                decoration: BoxDecoration(
                  border: i == 0 ? null : Border(top: BorderSide(color: AppColors.warmBrown.withValues(alpha: 0.12))),
                ),
                child: children[i],
              ),
          ],
        ),
      ),
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
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 56),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            Expanded(
              child: Text(label, style: TextStyle(fontSize: 16, height: 1.5, fontWeight: FontWeight.w500, color: color ?? AppColors.ink)),
            ),
            const SizedBox(width: 12),
            const AppIconView(AppIcon.chevronRight, size: 20, color: AppColors.muted),
          ],
        ),
      ),
    );
  }
}

class _LiteModeRow extends StatelessWidget {
  const _LiteModeRow();

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: liteMode,
      builder: (context, lite, _) => Semantics(
        toggled: lite,
        label: 'Lite mode',
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => saveLiteMode(!lite),
          child: Container(
            constraints: const BoxConstraints(minHeight: 56),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Lite mode', style: TextStyle(fontSize: 16, height: 1.5, fontWeight: FontWeight.w500, color: AppColors.ink)),
                      Text('Lighter map, less data', style: TextStyle(fontFamily: AppFonts.mono, fontSize: 12, height: 16 / 12, color: AppColors.muted)),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 56,
                  height: 32,
                  decoration: BoxDecoration(
                    color: lite ? AppColors.stampGreen : AppColors.warmBrown.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: AnimatedAlign(
                    duration: const Duration(milliseconds: 150),
                    alignment: lite ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      width: 24,
                      height: 24,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [cssShadow(0, 1, 3, 0, Colors.black.withValues(alpha: 0.1)), cssShadow(0, 1, 2, -1, Colors.black.withValues(alpha: 0.1))],
                      ),
                    ),
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

class _SupportSection extends StatelessWidget {
  const _SupportSection();

  @override
  Widget build(BuildContext context) {
    const muted12 = TextStyle(fontSize: 12, height: 20 / 12, color: AppColors.muted);
    const point = TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.ink);
    Widget item(String title, String body) => Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: point), Text(body, style: muted12)]),
        );
    return GlassCard(
      borderRadius: const BorderRadius.all(Radius.circular(24)),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('SUPPORT PHILATRAIL', style: _kicker),
          const SizedBox(height: 8),
          const Text('Philatrail is free. Keeping it that way costs a little.',
              style: TextStyle(fontSize: 20, height: 24 / 20, fontWeight: FontWeight.w700, color: AppColors.ink)),
          const SizedBox(height: 8),
          const Text(
            "I built Philatrail on my own, alongside a day job, because I wanted a proper map and tracker for the Philately Passport and couldn't find one. It stays free for every collector, full stop. If it's helped you fill a few pages, a small contribution helps keep it running and growing.",
            style: TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted),
          ),
          const SizedBox(height: 4),
          item('Keeping it running', "Hosting, the database, map tiles and the domain — the always-on costs that don't go away between updates."),
          item('Getting to iOS',
              'Philatrail only runs on Android today. An Apple developer account is the one thing standing between here and an iPhone app.'),
          item('Growing to new states',
              'Each new state means sourcing and verifying its own passport booklet in person before its post offices can go on the map.'),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(color: AppColors.warmBrown.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
            child: const Text("The give-link isn't set up yet — check back soon.", style: muted12),
          ),
          const SizedBox(height: 16),
          _Details(
            summary: "Can't contribute money? You can still help",
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final line in const [
                  'Use the app and report anything broken or confusing',
                  "Help verify a new state's post offices and booklet",
                  'Tell another collector about Philatrail',
                ])
                  _Bullet(Text(line, style: muted12)),
                _Bullet(Text.rich(TextSpan(style: muted12, children: [
                  const TextSpan(text: 'Design or development feedback is always welcome — '),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.baseline,
                    baseline: TextBaseline.alphabetic,
                    child: GestureDetector(
                      onTap: () => launchUrl(Uri.parse('mailto:$_contactEmail')),
                      child: const Text('get in touch',
                          style: TextStyle(fontSize: 12, height: 20 / 12, color: AppColors.muted, decoration: TextDecoration.underline)),
                    ),
                  ),
                ]))),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _Details(
            summary: 'Questions',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final (q, a) in const [
                  ('Is this a registered charity?',
                      " No — Philatrail is an independent, one-person project, not a registered nonprofit. Contributions aren't tax-deductible."),
                  ("Who's behind this?", ' Bhavishya, a collector who built Philatrail because the Passport needed a proper map and tracker.'),
                  ('Where does the money go?', ' Straight to the costs above — hosting, the iOS developer account, and travel to verify new states.'),
                ])
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text.rich(TextSpan(style: muted12, children: [
                      TextSpan(text: q, style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.ink)),
                      TextSpan(text: a),
                    ])),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A `<details>`/`<summary>` disclosure: the summary line with the browser's
/// small triangle marker, toggling its content.
class _Details extends StatefulWidget {
  final String summary;
  final Widget child;
  const _Details({required this.summary, required this.child});

  @override
  State<_Details> createState() => _DetailsState();
}

class _DetailsState extends State<_Details> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => setState(() => _open = !_open),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              AnimatedRotation(
                turns: _open ? 0.25 : 0,
                duration: const Duration(milliseconds: 120),
                child: const Text('▶', style: TextStyle(fontSize: 9, color: AppColors.ink)),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(widget.summary, style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
              ),
            ],
          ),
        ),
        if (_open) Padding(padding: const EdgeInsets.only(top: 8), child: widget.child),
      ],
    );
  }
}

class _Bullet extends StatelessWidget {
  final Widget child;
  const _Bullet(this.child);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 6, bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(width: 14, child: Text('•', style: TextStyle(fontSize: 12, height: 20 / 12, color: AppColors.muted))),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _DeleteAccountBody extends StatefulWidget {
  final AuthController auth;
  const _DeleteAccountBody({required this.auth});

  @override
  State<_DeleteAccountBody> createState() => _DeleteAccountBodyState();
}

class _DeleteAccountBodyState extends State<_DeleteAccountBody> {
  bool _deleting = false;
  String? _error;

  Future<void> _delete() async {
    if (_deleting) return;
    setState(() {
      _deleting = true;
      _error = null;
    });
    try {
      await widget.auth.deleteAccount();
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      Navigator.of(context).pop();
      messenger.showSnackBar(const SnackBar(content: Text('Your account has been deleted.')));
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(_error!, style: const TextStyle(fontSize: 14, color: AppColors.postalDark)),
          ),
        Opacity(
          opacity: _deleting ? 0.6 : 1,
          child: GestureDetector(
            onTap: _delete,
            child: Container(
              constraints: const BoxConstraints(minHeight: 48),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [AppColors.postalTop, AppColors.postal]),
              ),
              child: Text(_deleting ? 'Deleting…' : 'Yes, delete everything',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
            ),
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _deleting ? null : () => Navigator.of(context).pop(),
          child: const GlassCard(
            borderRadius: BorderRadius.all(Radius.circular(999)),
            child: SizedBox(
              height: 48,
              child: Center(child: Text('Keep my account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.ink))),
            ),
          ),
        ),
      ],
    );
  }
}
