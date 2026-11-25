import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants.dart';
import '../../theme/app_theme.dart';

/// Port of src/components/welcome/WelcomeTour.tsx: a 3-step first-launch
/// intro, shown once before the main app shell. Simplified from the web
/// version (acceptable gaps, not silently dropped): no swipe-gesture layer
/// (PageView already swipes natively), no map-prefetch warmup (nothing to
/// prefetch in a native app), and a plain Material icon instead of the
/// halo/glow decoration.
class _Step {
  final String title;
  final String sub;
  final String body;
  final IconData icon;
  const _Step({required this.title, required this.sub, required this.body, required this.icon});
}

const _steps = [
  _Step(
    title: 'Find it.',
    sub: 'A post office near you',
    body: 'Open the map and spot a post office close by. Green pins are places you have already stamped.',
    icon: Icons.location_on,
  ),
  _Step(
    title: 'Visit it.',
    sub: 'Go in person',
    body: 'Visit the post office, ask for the postmark, then tap Stamp it. Add a note or photo if you like.',
    icon: Icons.check_circle,
  ),
  _Step(
    title: 'Stamp it.',
    sub: 'Fill your passport',
    body: 'Each stamp lands in your passport. Watch your count grow, one post office at a time.',
    icon: Icons.menu_book,
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
  final _pageController = PageController();
  int _step = 0;

  bool get _last => _step == _steps.length - 1;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(StorageKeys.onboarded, true);
    widget.onDone();
  }

  void _next() {
    if (_last) {
      _finish();
      return;
    }
    _pageController.nextPage(duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 12, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('PHILATRAIL',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, letterSpacing: 2, color: AppColors.postal)),
                  TextButton(
                    onPressed: _finish,
                    child: const Text('Skip', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _steps.length,
                onPageChanged: (i) => setState(() => _step = i),
                itemBuilder: (context, i) => _StepView(step: _steps[i], index: i),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _steps.length,
                      (i) => AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        height: 8,
                        width: i == _step ? 28 : 8,
                        decoration: BoxDecoration(
                          color: i == _step ? AppColors.postal : AppColors.lineStrong,
                          borderRadius: BorderRadius.circular(999),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.postal,
                        shape: const StadiumBorder(),
                      ),
                      onPressed: _next,
                      child: Text(_last ? 'Start collecting' : 'Next',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.4)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepView extends StatelessWidget {
  final _Step step;
  final int index;
  const _StepView({required this.step, required this.index});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: const BoxDecoration(color: AppColors.postalSoft, shape: BoxShape.circle),
            child: Icon(step.icon, color: AppColors.postal, size: 34),
          ),
          const SizedBox(height: 28),
          Text('${index + 1} of ${_steps.length}',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.6, color: AppColors.muted)),
          const SizedBox(height: 8),
          Text(step.title,
              style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w700, color: AppColors.ink, height: 1.05)),
          const SizedBox(height: 6),
          Text(step.sub,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontStyle: FontStyle.italic, color: AppColors.postal)),
          const SizedBox(height: 18),
          Text(step.body, style: const TextStyle(fontSize: 16, height: 1.4, color: AppColors.ink)),
          if (index == 0) ...[
            const SizedBox(height: 20),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _Legend(color: AppColors.lineStrong, label: 'Not visited', icon: null),
                _Legend(color: AppColors.planned, label: 'Planned', icon: Icons.flag),
                _Legend(color: AppColors.visited, label: 'Visited', icon: Icons.check),
              ],
            ),
          ],
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
