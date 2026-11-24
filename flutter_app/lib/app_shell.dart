import 'package:flutter/material.dart';

import 'features/explore/explore_screen.dart';
import 'features/passport/passport_screen.dart';
import 'theme/app_theme.dart';

/// Scoped port of TabBar.tsx/nav-items.tsx: just Explore and Passport for
/// now. Learn (static educational content — a web-only content pass, not a
/// porting job) and Account (sign-in/profile — Stage 4) are left out rather
/// than built as empty placeholders; add them here as their screens exist.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  static const _screens = [ExploreScreen(), PassportScreen()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: AppColors.card,
        indicatorColor: AppColors.postal.withValues(alpha: 0.1),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.explore_outlined), selectedIcon: Icon(Icons.explore), label: 'Explore'),
          NavigationDestination(icon: Icon(Icons.menu_book_outlined), selectedIcon: Icon(Icons.menu_book), label: 'Passport'),
        ],
      ),
    );
  }
}
