import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_shell.dart';
import 'core/env.dart';
import 'data/auth_controller.dart';
import 'data/offices_controller.dart';
import 'data/state_controller.dart';
import 'data/visits_repository.dart';
import 'features/office/visit_dialog.dart';
import 'features/welcome/welcome_tour_screen.dart';
import 'theme/app_theme.dart';
import 'widgets/glass_card.dart' show loadLiteMode;

/// Same Supabase project the web app uses (src/lib/supabase/public.ts) —
/// read via --dart-define so the anon key isn't hardcoded into source,
/// matching the MAPTILER_KEY pattern in core/map_tiles.dart. Get the actual
/// values from `mcp__Supabase__get_project_url` / `get_publishable_keys`, or
/// from the same place the web app's NEXT_PUBLIC_SUPABASE_URL/ANON_KEY come
/// from (these are the public/anon values, not service-role secrets).

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty) {
    await Supabase.initialize(url: supabaseUrl, publishableKey: supabaseAnonKey);
  }
  await loadLiteMode();
  runApp(const PhilatrailApp());
}

class PhilatrailApp extends StatefulWidget {
  const PhilatrailApp({super.key});

  @override
  State<PhilatrailApp> createState() => _PhilatrailAppState();
}

class _PhilatrailAppState extends State<PhilatrailApp> {
  VisitsController? _visitsController;
  StateController? _stateController;
  OfficesController? _officesController;
  AuthController? _authController;

  @override
  void initState() {
    super.initState();
    if (supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty) {
      final client = Supabase.instance.client;
      _visitsController = VisitsController(client);
      _stateController = StateController();
      _officesController = OfficesController(client);
      _authController = AuthController(client);
    }
  }

  @override
  void dispose() {
    _visitsController?.dispose();
    _stateController?.dispose();
    _officesController?.dispose();
    _authController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _visitsController;
    final stateController = _stateController;
    final officesController = _officesController;
    final authController = _authController;
    final app = MaterialApp(
      title: 'Philatrail',
      theme: buildAppTheme(),
      home: controller != null && stateController != null && officesController != null && authController != null
          ? const WelcomeGate(child: AppShell())
          : const _MissingConfigScreen(),
    );
    // Wraps the WHOLE MaterialApp — including its internally-created
    // Navigator — not just `home`. Scoping this around `home` instead (as
    // an earlier version of this file did) only covers the first route:
    // MaterialApp's Navigator renders every pushed route as a sibling
    // OverlayEntry, not a descendant of `home`'s subtree, so any screen
    // reached via Navigator.push (e.g. OfficeDetailScreen, AccountScreen)
    // would crash with "No VisitsScope found in context" the moment it
    // called visitsControllerOf/officesControllerOf/etc. Wrapping the
    // Navigator itself (by wrapping MaterialApp) makes every route a
    // descendant, fixing that crash app-wide.
    return controller != null && stateController != null && officesController != null && authController != null
        ? VisitsScope(
            controller: controller,
            stateController: stateController,
            officesController: officesController,
            authController: authController,
            child: app,
          )
        : app;
  }
}

/// Shown when SUPABASE_URL/SUPABASE_ANON_KEY weren't passed via --dart-define
/// — keeps `flutter run` from crashing opaquely for anyone who hasn't set
/// those up yet.
class _MissingConfigScreen extends StatelessWidget {
  const _MissingConfigScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'Missing SUPABASE_URL / SUPABASE_ANON_KEY.\n'
            'Run with --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
