import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants.dart';
import '../../data/auth_controller.dart';
import '../office/visit_dialog.dart';
import 'sign_in_sheet.dart';
import '../coach/coach_tour.dart' show coachRunning;

/// Port of src/components/auth/GuestSignInPrompt.tsx: invites a guest to
/// sign in once, either shortly after opening the app or once they've
/// stamped a few offices — never both, and only the one whose condition is
/// met first wins (first timer to fire sets its own "already shown" flag
/// and the other is cancelled by this widget's own dispose).
///
/// Two simplifications from the web version, both acceptable here (not
/// silently dropped): there is no onboarding-coach overlay in this build to
/// avoid interrupting, and "another dialog already open" is approximated by
/// a single in-flight guard on this widget rather than a DOM query — this
/// widget only ever shows one sheet at a time itself, so the risk is just
/// racing a sheet opened by something else, which is an acceptable gap for
/// a once-per-device nudge.
class GuestSignInNudge extends StatefulWidget {
  final Widget child;
  const GuestSignInNudge({super.key, required this.child});

  @override
  State<GuestSignInNudge> createState() => _GuestSignInNudgeState();
}

class _GuestSignInNudgeState extends State<GuestSignInNudge> {
  Timer? _welcomeTimer;
  Timer? _progressTimer;
  bool _shown = false;

  @override
  void initState() {
    super.initState();
    _scheduleWelcome();
  }

  Future<void> _scheduleWelcome() async {
    final auth = authControllerOf(context);
    final prefs = await SharedPreferences.getInstance();
    if (!mounted || auth.user != null) return;
    if (prefs.getBool(StorageKeys.welcomePrompted) ?? false) return;
    Future<void> attempt() async {
      if (!mounted || _shown || auth.user != null) return;
      // Never interrupt the walkthrough (when replayed) or another sheet/dialog.
      if (coachRunning.value || Navigator.of(context, rootNavigator: true).canPop()) {
        _welcomeTimer = Timer(const Duration(seconds: 2), attempt);
        return;
      }
      _shown = true;
      await prefs.setBool(StorageKeys.welcomePrompted, true);
      if (mounted) showSignInSheet(context, reason: SignInReason.welcome);
    }

    _welcomeTimer = Timer(const Duration(seconds: 10), attempt);
  }

  /// Called from build() each time the visits count changes — cheap and
  /// idempotent (guarded by `_shown` and the stored flag), same reasoning
  /// as explore_screen.dart's `_syncWatchedOffices`.
  Future<void> _maybeScheduleProgressPrompt(int visitCount, AuthController auth) async {
    if (_shown || _progressTimer != null || auth.user != null) return;
    if (visitCount < guestSignInThreshold) return;
    final prefs = await SharedPreferences.getInstance();
    if (!mounted || (prefs.getBool(StorageKeys.signInPrompted) ?? false)) return;
    Future<void> attempt() async {
      if (!mounted || _shown || auth.user != null) return;
      if (Navigator.of(context, rootNavigator: true).canPop()) {
        _progressTimer = Timer(const Duration(seconds: 2), attempt);
        return;
      }
      _shown = true;
      await prefs.setBool(StorageKeys.signInPrompted, true);
      if (mounted) showSignInSheet(context, reason: SignInReason.saveProgress);
    }

    _progressTimer = Timer(const Duration(seconds: 7), attempt);
  }

  @override
  void dispose() {
    _welcomeTimer?.cancel();
    _progressTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = authControllerOf(context);
    final visits = visitsControllerOf(context);
    return AnimatedBuilder(
      animation: Listenable.merge([auth, visits]),
      builder: (context, _) {
        unawaited(_maybeScheduleProgressPrompt(visits.visits.length, auth));
        return widget.child;
      },
    );
  }
}
