import 'package:flutter/material.dart';
import 'theme/app_theme.dart';

/// Entry point placeholder. Nothing here talks to Supabase or any native
/// plugin yet — this exists only so the project has a buildable shape once
/// `flutter create`'s real android/ and ios/ scaffolding is generated (see
/// flutter_app/README.md for the one thing still blocking that).
void main() {
  runApp(const PhilatrailApp());
}

class PhilatrailApp extends StatelessWidget {
  const PhilatrailApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Philatrail',
      theme: buildAppTheme(),
      home: const _ScaffoldPlaceholder(),
    );
  }
}

class _ScaffoldPlaceholder extends StatelessWidget {
  const _ScaffoldPlaceholder();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Philatrail — Flutter scaffold stage'),
      ),
    );
  }
}
