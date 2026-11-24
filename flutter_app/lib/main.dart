import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app_shell.dart';
import 'data/auth_controller.dart';
import 'data/offices_controller.dart';
import 'data/state_controller.dart';
import 'data/visits_repository.dart';
import 'features/office/visit_dialog.dart';
import 'theme/app_theme.dart';

/// Same Supabase project the web app uses (src/lib/supabase/public.ts) —
/// read via --dart-define so the anon key isn't hardcoded into source,
/// matching the MAPTILER_KEY pattern in core/map_tiles.dart. Get the actual
/// values from `mcp__Supabase__get_project_url` / `get_publishable_keys`, or
/// from the same place the web app's NEXT_PUBLIC_SUPABASE_URL/ANON_KEY come
/// from (these are the public/anon values, not service-role secrets).
const _supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const _supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (_supabaseUrl.isNotEmpty && _supabaseAnonKey.isNotEmpty) {
    await Supabase.initialize(url: _supabaseUrl, publishableKey: _supabaseAnonKey);
  }
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
    if (_supabaseUrl.isNotEmpty && _supabaseAnonKey.isNotEmpty) {
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
    return MaterialApp(
      title: 'Philatrail',
      theme: buildAppTheme(),
      home: controller != null && stateController != null && officesController != null && authController != null
          ? VisitsScope(
              controller: controller,
              stateController: stateController,
              officesController: officesController,
              authController: authController,
              child: const AppShell(),
            )
          : const _MissingConfigScreen(),
    );
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
