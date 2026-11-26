import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants.dart';
import '../../data/auth_controller.dart';
import '../../theme/app_theme.dart';

/// What the walkthrough can point at. Each widget it spotlights is wrapped in
/// a KeyedSubtree with one of these keys (the web uses `data-tour` attributes).
final Map<String, GlobalKey> coachTargets = {
  for (final name in ['search', 'filters', 'near-me', 'sheet', 'tab-passport', 'tab-account']) name: GlobalKey(debugLabel: 'coach:$name'),
};

/// "Replay the walkthrough" (Account) bumps this.
final ValueNotifier<int> coachReplay = ValueNotifier<int>(0);

/// True while the walkthrough is on screen, so the sign-in invitation holds off.
final ValueNotifier<bool> coachRunning = ValueNotifier<bool>(false);

const _coachKey = 'kp:coach:v1';

class _Stop {
  final String target;
  final String title;
  final String body;
  const _Stop(this.target, this.title, this.body);
}

const _stops = [
  _Stop('search', 'Search', 'Type a post office name, district or pincode to jump straight to it.'),
  _Stop('filters', 'Filters', 'Show only the ones you have not visited yet, the ones you plan to visit, or your stamped ones.'),
  _Stop('near-me', 'Near me', 'Find the closest post offices. We only use your location while you are using the app.'),
  _Stop('sheet', 'The full list', 'Tap Show list, or drag the bar up, to see every post office. Show map brings you back.'),
  _Stop('tab-passport', 'Your passport', 'Every stamp you collect lands here, so you can watch your count grow.'),
  _Stop('tab-account', 'Your account', 'Sign in to keep your passport safe and on every device. You can skip it for now.'),
];

class _Placed {
  final _Stop stop;
  final Rect rect;
  const _Placed(this.stop, this.rect);
}

/// Port of src/components/layout/CoachTour.tsx: a short "here is what this
/// does" walkthrough over the map screen. Shown once (after a guest has
/// answered the sign-in invitation), skippable, and replayable from Account.
class CoachTour extends StatefulWidget {
  final Widget child;
  final AuthController auth;
  final bool onExplore;
  const CoachTour({super.key, required this.child, required this.auth, required this.onExplore});

  @override
  State<CoachTour> createState() => _CoachTourState();
}

class _CoachTourState extends State<CoachTour> {
  bool _running = false;
  int _index = 0;
  List<_Placed> _placed = const [];
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    coachReplay.addListener(_onReplay);
    _scheduleFirstRun();
  }

  @override
  void didUpdateWidget(CoachTour oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.onExplore && !oldWidget.onExplore) _scheduleFirstRun();
  }

  @override
  void dispose() {
    _timer?.cancel();
    coachReplay.removeListener(_onReplay);
    super.dispose();
  }

  void _onReplay() {
    _timer?.cancel();
    _timer = Timer(const Duration(milliseconds: 600), _start);
  }


  /// First visit to the map: once things have settled, and after a guest has
  /// answered the sign-in invitation (it opens first).
  Future<void> _scheduleFirstRun() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted || (prefs.getBool(_coachKey) ?? false)) return;
    bool invitePending() =>
        (widget.auth.user == null && !(prefs.getBool(StorageKeys.welcomePrompted) ?? false)) ||
        Navigator.of(context, rootNavigator: true).canPop();
    void attempt() {
      if (!mounted || !widget.onExplore || _running) return;
      // Wait for Explore to have finished loading (its controls are the first stops).
      final exploreReady = coachTargets['search']?.currentContext != null;
      if (widget.auth.isLoading || !exploreReady || invitePending()) {
        _timer = Timer(const Duration(milliseconds: 500), attempt);
        return;
      }
      _timer = Timer(const Duration(milliseconds: 300), () {
        if (!mounted) return;
        if (invitePending()) {
          attempt();
        } else {
          _start();
        }
      });
    }

    _timer?.cancel();
    _timer = Timer(const Duration(milliseconds: 1200), attempt);
  }

  Future<void> _start() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_coachKey, true);
    if (!mounted) return;
    final placed = _measure();
    if (placed.isEmpty) return;
    setState(() {
      _placed = placed;
      _index = 0;
      _running = true;
    });
    coachRunning.value = true;
  }

  List<_Placed> _measure() {
    final overlayBox = context.findRenderObject() as RenderBox?;
    final result = <_Placed>[];
    for (final stop in _stops) {
      final box = coachTargets[stop.target]?.currentContext?.findRenderObject() as RenderBox?;
      if (box == null || !box.attached || !box.hasSize || box.size.isEmpty) continue;
      final topLeft = box.localToGlobal(Offset.zero, ancestor: overlayBox);
      result.add(_Placed(stop, topLeft & box.size));
    }
    return result;
  }

  void _close() {
    setState(() => _running = false);
    coachRunning.value = false;
  }

  @override
  Widget build(BuildContext context) {
    if (!_running || _placed.isEmpty) return widget.child;
    final i = _index.clamp(0, _placed.length - 1);
    final current = _placed[i];
    final last = i >= _placed.length - 1;
    const pad = 6.0;
    final screen = MediaQuery.of(context).size;
    final rect = current.rect.inflate(pad);
    final below = current.rect.center.dy < screen.height / 2;

    return Stack(
      children: [
        widget.child,
        // Taps outside the card do nothing, so the app underneath isn't poked by accident.
        Positioned.fill(
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () {},
            child: TweenAnimationBuilder<Rect?>(
              tween: RectTween(end: rect),
              duration: const Duration(milliseconds: 300),
              builder: (context, r, _) => CustomPaint(painter: _CutoutPainter(r ?? rect)),
            ),
          ),
        ),
        Positioned(
          left: 16,
          right: 16,
          top: below ? rect.bottom + 12 : null,
          bottom: below ? null : screen.height - rect.top + 12,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 384),
              child: Material(
                type: MaterialType.transparency,
                child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.paper,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [cssShadow(0, 25, 50, -12, Colors.black.withValues(alpha: 0.25))],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('${i + 1} OF ${_placed.length}',
                        style: const TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w600, letterSpacing: 0.3, color: AppColors.muted)),
                    const SizedBox(height: 4),
                    Text(current.stop.title,
                        style: const TextStyle(fontFamily: AppFonts.display, fontSize: 20, height: 28 / 20, fontWeight: FontWeight.w700, color: AppColors.ink)),
                    const SizedBox(height: 6),
                    Text(current.stop.body, style: const TextStyle(fontSize: 16, height: 24 / 16, color: AppColors.muted)),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        GestureDetector(
                          onTap: _close,
                          child: Container(
                            constraints: const BoxConstraints(minHeight: 44),
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            alignment: Alignment.center,
                            child: const Text('Skip tour', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.muted)),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => last ? _close() : setState(() => _index = i + 1),
                          child: Container(
                            constraints: const BoxConstraints(minHeight: 44),
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(color: AppColors.postal, borderRadius: BorderRadius.circular(999)),
                            child: Text(last ? 'Got it' : 'Next',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// `box-shadow: 0 0 0 9999px rgb(22 32 79/.72)` around a clear rounded box,
/// with a 2px white/90 ring.
class _CutoutPainter extends CustomPainter {
  final Rect hole;
  _CutoutPainter(this.hole);

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(hole, const Radius.circular(16));
    final dim = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Offset.zero & size)
      ..addRRect(rrect);
    canvas.drawPath(dim, Paint()..color = AppColors.ink.withValues(alpha: 0.72));
    canvas.drawRRect(
      rrect.inflate(1),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..color = Colors.white.withValues(alpha: 0.9),
    );
  }

  @override
  bool shouldRepaint(_CutoutPainter old) => old.hole != hole;
}
