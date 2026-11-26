import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants.dart';
import '../../theme/app_theme.dart';
import '../../widgets/postal_texture.dart';

/// Port of src/components/welcome/WelcomeTour.tsx: a 3-step first-launch
/// intro, shown once before the main app shell. Reconciled against the live
/// component on 2026-11-26 after it was flagged as not matching the real
/// Capacitor-shell app at all — the previous version of this file used a
/// single flat paper background throughout; the real design is a two-part
/// screen (a postal-red hero with a huge white headline on top, a paper
/// body below), which is what this rewrite ports. Simplified from the web
/// version (acceptable gaps, not silently dropped): no swipe-gesture layer
/// (PageView already swipes natively) and no map-prefetch warmup (nothing
/// to prefetch in a native app).
class _Step {
  final String title;
  final String sub;
  final String body;
  const _Step({required this.title, required this.sub, required this.body});
}

const _steps = [
  _Step(
    title: 'Find it.',
    sub: 'A post office near you',
    body: 'Open the map and spot a post office close by. Green pins are places you have already stamped.',
  ),
  _Step(
    title: 'Visit it.',
    sub: 'Go in person',
    body: 'Visit the post office, ask for the postmark, then tap Stamp it. Add a note or photo if you like.',
  ),
  _Step(
    title: 'Stamp it.',
    sub: 'Fill your passport',
    body: 'Each stamp lands in your passport. Watch your count grow, one post office at a time.',
  ),
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

class WelcomeTourScreen extends StatefulWidget {
  final VoidCallback onDone;
  const WelcomeTourScreen({super.key, required this.onDone});

  @override
  State<WelcomeTourScreen> createState() => _WelcomeTourScreenState();
}

class _WelcomeTourScreenState extends State<WelcomeTourScreen> {
  int _step = 0;

  bool get _last => _step == _steps.length - 1;

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(StorageKeys.onboarded, true);
    widget.onDone();
  }

  void _next() {
    if (_last) {
      _finish();
    } else {
      setState(() => _step += 1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final current = _steps[_step];
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: Column(
        children: [
          // ── Red hero: wordmark/skip row, step eyebrow, huge headline, gold sub, halo mark ──
          Expanded(
            flex: 115,
            child: PostalTexture(
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                  child: Stack(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            height: 40,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'PHILATRAIL',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 12,
                                    letterSpacing: 2.2,
                                  ),
                                ),
                                TextButton(
                                  onPressed: _finish,
                                  style: TextButton.styleFrom(foregroundColor: Colors.white, minimumSize: const Size(0, 44)),
                                  child: const Text(
                                    'SKIP',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
                          Row(
                            key: ValueKey(_step),
                            children: [
                              const Text(
                                'HOW IT WORKS',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.8),
                              ),
                              const SizedBox(width: 14),
                              Container(width: 1, height: 14, color: AppColors.goldOnRed),
                              const SizedBox(width: 14),
                              Text(
                                '${_step + 1} of ${_steps.length}',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.8),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          FittedBox(
                            key: ValueKey('headline-$_step'),
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              current.title.toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                                fontSize: 64,
                                height: 1.05,
                                letterSpacing: 0.2,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            current.sub.toUpperCase(),
                            key: ValueKey('sub-$_step'),
                            style: const TextStyle(
                              color: AppColors.goldOnRed,
                              fontWeight: FontWeight.bold,
                              fontStyle: FontStyle.italic,
                              fontSize: 18,
                              letterSpacing: 0.6,
                            ),
                          ),
                        ],
                      ),
                      Positioned(
                        right: 0,
                        bottom: 24,
                        child: _Halo(key: ValueKey('halo-$_step'), step: _step),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // ── Paper body: copy, pin legend (step 0 only), dots, CTA ──
          Expanded(
            flex: 100,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: SafeArea(
                top: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(current.body, key: ValueKey('body-$_step'), style: const TextStyle(fontSize: 16, height: 1.4, color: AppColors.ink)),
                          if (_step == 0) ...[
                            const SizedBox(height: 20),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: const [
                                _Legend(color: AppColors.lineStrong, label: 'Not visited', icon: null),
                                _Legend(color: Color(0xFF2F4AA8), label: 'Planned', icon: Icons.flag),
                                _Legend(color: AppColors.visited, label: 'Visited', icon: Icons.check),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: List.generate(
                        _steps.length,
                        (i) => Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: GestureDetector(
                            onTap: () => setState(() => _step = i),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              height: 8,
                              width: i == _step ? 28 : 8,
                              decoration: BoxDecoration(
                                color: i == _step ? AppColors.postal : const Color(0xFF785A1E).withValues(alpha: 0.25),
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 62,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(28),
                          gradient: const LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Color(0xFFE0334A), AppColors.postal],
                          ),
                          boxShadow: [
                            BoxShadow(color: AppColors.postal.withValues(alpha: 0.35), blurRadius: 18, offset: const Offset(0, 8)),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(28),
                            onTap: _next,
                            child: Center(
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    _last ? 'START COLLECTING' : 'NEXT',
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 2.2),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.arrow_forward, color: Colors.white, size: 20),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// The mark of each step: a glowing halo with the thing you're looking for
/// inside — port of WelcomeTour.tsx's Halo component.
class _Halo extends StatelessWidget {
  final int step;
  const _Halo({super.key, required this.step});

  @override
  Widget build(BuildContext context) {
    final (color, icon) = switch (step) {
      0 => (const Color(0xFF2F4AA8), null),
      1 => (AppColors.visited, Icons.check),
      _ => (AppColors.postal, Icons.menu_book),
    };
    return SizedBox(
      width: 112,
      height: 112,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 112,
            height: 112,
            decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFF2F4AA8).withValues(alpha: 0.25)),
          ),
          Container(
            width: 94,
            height: 94,
            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white.withValues(alpha: 0.1))),
          ),
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white.withValues(alpha: 0.1))),
          ),
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(shape: BoxShape.circle, color: color, border: Border.all(color: Colors.white, width: 5)),
            child: icon != null ? Icon(icon, color: Colors.white, size: 22) : null,
          ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  final IconData? icon;
  const _Legend({required this.color, required this.label, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(999), border: Border.all(color: AppColors.line)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          icon != null
              ? Icon(icon, size: 14, color: color)
              : Container(width: 12, height: 12, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: color, width: 2))),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
