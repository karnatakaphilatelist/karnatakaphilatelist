import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants.dart';
import '../../data/learn_articles.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_icons.dart';
import '../../widgets/glass_card.dart';
import '../../widgets/postal_texture.dart';
import '../learn/article_screen.dart';
import '../office/office_detail_screen.dart' show RedCtaButton;

enum _Mark { pin, check, book }

class _Step {
  final String title;
  final String sub;
  final String body;
  final _Mark mark;
  const _Step(this.title, this.sub, this.body, this.mark);
}

const _steps = [
  _Step('Find it.', 'A post office near you',
      'Open the map and spot a post office close by. Green pins are places you have already stamped.', _Mark.pin),
  _Step('Visit it.', 'Go in person',
      'Visit the post office, ask for the postmark, then tap Stamp it. Add a note or photo if you like.', _Mark.check),
  _Step('Stamp it.', 'Fill your passport', 'Each stamp lands in your passport. Watch your count grow, one post office at a time.', _Mark.book),
];

/// Shows the welcome tour if [StorageKeys.onboarded] hasn't been set yet,
/// otherwise goes straight to [child].
class WelcomeGate extends StatefulWidget {
  final Widget child;
  const WelcomeGate({super.key, required this.child});

  @override
  State<WelcomeGate> createState() => _WelcomeGateState();
}

class _WelcomeGateState extends State<WelcomeGate> {
  bool? _onboarded;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) setState(() => _onboarded = prefs.getBool(StorageKeys.onboarded) ?? false);
  }

  @override
  Widget build(BuildContext context) {
    if (_onboarded == null) return const SizedBox.shrink();
    if (_onboarded == true) return widget.child;
    return WelcomeTourScreen(onDone: () => setState(() => _onboarded = true));
  }
}

/// Port of src/components/welcome/WelcomeTour.tsx: the three-step first-launch
/// tour — a `.kp-red` hero (flex 1.15) with the step title and a halo mark,
/// over a paper body (flex 1) with the step text, legend / booklet card, dots
/// and the red CTA. Swipe sideways to step.
class WelcomeTourScreen extends StatefulWidget {
  final VoidCallback onDone;
  const WelcomeTourScreen({super.key, required this.onDone});

  @override
  State<WelcomeTourScreen> createState() => _WelcomeTourScreenState();
}

class _WelcomeTourScreenState extends State<WelcomeTourScreen> {
  int _step = 0;
  Offset? _swipeStart;

  bool get _last => _step == _steps.length - 1;

  @override
  void initState() {
    super.initState();
    // Counts as seen the moment it appears, so closing the app halfway never brings it back.
    SharedPreferences.getInstance().then((prefs) => prefs.setBool(StorageKeys.onboarded, true));
  }

  void _finish() => widget.onDone();

  void _next() => _last ? _finish() : setState(() => _step += 1);

  @override
  Widget build(BuildContext context) {
    final current = _steps[_step];
    final safeTop = MediaQuery.of(context).padding.top;
    final shortScreen = MediaQuery.of(context).size.height <= 720;
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: Listener(
        onPointerDown: (e) => _swipeStart = e.position,
        onPointerUp: (e) {
          final start = _swipeStart;
          _swipeStart = null;
          if (start == null) return;
          final dx = e.position.dx - start.dx;
          final dy = e.position.dy - start.dy;
          if (dx.abs() < 40 || dx.abs() < dy.abs() * 1.2) return;
          if (dx < 0) {
            _next();
          } else if (_step > 0) {
            setState(() => _step -= 1);
          }
        },
        child: Column(
          children: [
            // ── Red hero ──
            Expanded(
              flex: 115,
              child: PostalTexture(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(16, safeTop + 24, 16, 0),
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            height: 40,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('PHILATRAIL',
                                    style: TextStyle(
                                        fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w800, letterSpacing: 12 * 0.22, color: Colors.white)),
                                GestureDetector(
                                  behavior: HitTestBehavior.opaque,
                                  onTap: _finish,
                                  child: Container(
                                    constraints: const BoxConstraints(minHeight: 44),
                                    padding: const EdgeInsets.symmetric(horizontal: 8),
                                    transform: Matrix4.translationValues(8, 0, 0),
                                    alignment: Alignment.center,
                                    child: const Text('SKIP',
                                        style: TextStyle(
                                            fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w700, letterSpacing: 12 * 0.18, color: Colors.white)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
                          _Pop(
                            key: ValueKey('head-$_step'),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Text('HOW IT WORKS', style: _kickerWhite),
                                    const SizedBox(width: 14),
                                    Container(width: 1, height: 16, color: AppColors.goldOnRed),
                                    const SizedBox(width: 14),
                                    Text('${_step + 1} OF ${_steps.length}', style: _kickerWhite),
                                  ],
                                ),
                                const SizedBox(height: 20),
                                Transform.translate(
                                  offset: const Offset(-4, 0),
                                  child: Text(
                                    current.title.toUpperCase(),
                                    style: const TextStyle(
                                        fontSize: 72, height: 76 / 72, fontWeight: FontWeight.w500, letterSpacing: 0.72, color: Colors.white),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  current.sub.toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 20,
                                    height: 24 / 20,
                                    fontWeight: FontWeight.w700,
                                    fontStyle: FontStyle.italic,
                                    letterSpacing: 20 * 0.08,
                                    color: AppColors.goldOnRed,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (!shortScreen)
                        // bottom-6 right-6 of the hero for the 112px disc; this box
                        // adds 36px of ring on each side and sits inside px-4.
                        Positioned(
                          right: 24 - 16 - 36,
                          bottom: 24 - 36,
                          child: _Pop(key: ValueKey('halo-$_step'), child: _Halo(mark: current.mark)),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            // ── Paper body ──
            Expanded(
              flex: 100,
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 24, 16, 32 + MediaQuery.of(context).padding.bottom),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const NeverScrollableScrollPhysics(),
                        child: _Pop(
                          key: ValueKey('body-$_step'),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(current.body, style: const TextStyle(fontSize: 16, height: 24 / 16, color: AppColors.ink)),
                              if (_step == 0) ...[
                                const SizedBox(height: 24),
                                const Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [_LegendChip(_Mark.pin), _LegendChip(_Mark.book), _LegendChip(_Mark.check)],
                                ),
                              ],
                              if (_last) ...[
                                const SizedBox(height: 24),
                                GestureDetector(
                                  onTap: () {
                                    final article = articles.firstWhere((a) => a.slug == 'get-the-booklet');
                                    Navigator.of(context).push(MaterialPageRoute(builder: (_) => ArticleScreen(article: article)));
                                  },
                                  child: GlassCard(
                                    borderRadius: const BorderRadius.all(Radius.circular(16)),
                                    padding: const EdgeInsets.all(16),
                                    child: Text.rich(
                                      const TextSpan(
                                        style: TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.ink),
                                        children: [
                                          TextSpan(text: 'No booklet yet?', style: TextStyle(fontWeight: FontWeight.w700)),
                                          TextSpan(text: " Philatrail goes with Karnataka's Philately Passport, sold by Karnataka Postal Circle. "),
                                          TextSpan(
                                            text: 'See where to get it',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.postal,
                                              decoration: TextDecoration.underline,
                                              decorationColor: AppColors.postal,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: [
                          for (var i = 0; i < _steps.length; i++)
                            Semantics(
                              button: true,
                              label: 'Go to step ${i + 1}: ${_steps[i].title}',
                              child: GestureDetector(
                                behavior: HitTestBehavior.opaque,
                                onTap: () => setState(() => _step = i),
                                child: Container(
                                  height: 36,
                                  constraints: const BoxConstraints(minWidth: 24),
                                  padding: const EdgeInsets.only(right: 6),
                                  alignment: Alignment.center,
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 150),
                                    width: i == _step ? 28 : 8,
                                    height: 8,
                                    decoration: BoxDecoration(
                                      color: i == _step ? AppColors.postal : AppColors.warmBrown.withValues(alpha: 0.25),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    SizedBox(
                      height: 62,
                      child: RedCtaButton(
                        label: _last ? 'Start collecting' : 'Next',
                        icon: AppIcon.arrowRight,
                        onTap: _next,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

const _kickerWhite = TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w700, letterSpacing: 12 * 0.18, color: Colors.white);

/// `kpt-pop`: rises 18px, scales from 0.92 and fades in over 0.6s with a slight overshoot.
class _Pop extends StatelessWidget {
  final Widget child;
  const _Pop({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 600),
      curve: const Cubic(0.2, 1.3, 0.4, 1),
      child: child,
      builder: (context, t, child) => Opacity(
        opacity: t.clamp(0.0, 1.0),
        child: Transform.translate(
          offset: Offset(0, 18 * (1 - t)),
          child: Transform.scale(scale: 0.92 + 0.08 * t, child: child),
        ),
      ),
    );
  }
}

/// The glowing halo with the step's mark: a 112px `#2f4aa8`/25 disc with two
/// faint white rings outside it, and a 52px mark with a 5px white border.
class _Halo extends StatelessWidget {
  final _Mark mark;
  const _Halo({required this.mark});

  @override
  Widget build(BuildContext context) {
    final (Color fill, Widget? inner, List<BoxShadow> shadow) = switch (mark) {
      _Mark.pin => (AppColors.pinBlue, null, [cssShadow(0, 3, 10, 0, AppColors.pinBlue.withValues(alpha: 0.6))]),
      _Mark.check => (
          AppColors.stampGreen,
          const AppIconView(AppIcon.check, size: 24, color: Colors.white, strokeWidth: 3.4),
          [cssShadow(0, 3, 10, 0, AppColors.stampGreen.withValues(alpha: 0.6))]
        ),
      _Mark.book => (
          AppColors.postal,
          const AppIconView(AppIcon.book, size: 24, color: Colors.white),
          [cssShadow(0, 10, 15, -3, Colors.black.withValues(alpha: 0.1)), cssShadow(0, 4, 6, -4, Colors.black.withValues(alpha: 0.1))]
        ),
    };
    return SizedBox(
      width: 112 + 72,
      height: 112 + 72,
      child: Stack(
        alignment: Alignment.center,
        children: [
          _ring(112 + 72),
          _ring(112 + 32),
          Container(width: 112, height: 112, decoration: BoxDecoration(color: AppColors.pinBlue.withValues(alpha: 0.25), shape: BoxShape.circle)),
          Container(
            width: 52,
            height: 52,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: fill, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 5), boxShadow: shadow),
            child: inner,
          ),
        ],
      ),
    );
  }

  Widget _ring(double size) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white.withValues(alpha: 0.1))),
      );
}

class _LegendChip extends StatelessWidget {
  final _Mark kind; // pin = not visited, book = planned, check = visited
  const _LegendChip(this.kind);

  @override
  Widget build(BuildContext context) {
    final (Widget icon, String label) = switch (kind) {
      _Mark.pin => (
          Container(width: 14, height: 14, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.muted, width: 2))),
          'Not visited'
        ),
      _Mark.book => (const AppIconView(AppIcon.flag, size: 16, color: AppColors.pinBlue), 'Planned'),
      _Mark.check => (const AppIconView(AppIcon.check, size: 16, color: AppColors.stampGreen, strokeWidth: 3), 'Visited'),
    };
    return GlassCard(
      borderRadius: const BorderRadius.all(Radius.circular(999)),
      child: SizedBox(
        height: 40,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              icon,
              const SizedBox(width: 8),
              Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
            ],
          ),
        ),
      ),
    );
  }
}
