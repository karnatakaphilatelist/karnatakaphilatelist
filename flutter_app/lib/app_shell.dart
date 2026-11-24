import 'package:flutter/material.dart';

import 'features/account/account_screen.dart';
import 'features/auth/guest_sign_in_nudge.dart';
import 'features/explore/explore_screen.dart';
import 'features/home/home_widget_bridge.dart';
import 'features/passport/passport_screen.dart';
import 'theme/app_theme.dart';

/// Scoped port of TabBar.tsx/nav-items.tsx: Explore, Passport and now
/// Account (Stage 4). Learn is still left out (static educational content —
/// a web-only content pass, not a porting job). HomeWidgetBridge (Stage 6)
/// wraps the whole shell so the Android home-screen widget stays in sync
/// regardless of which tab is active.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  static const _screens = [ExploreScreen(), PassportScreen(), AccountScreen()];

  @override
  Widget build(BuildContext context) {
    return HomeWidgetBridge(
      child: GuestSignInNudge(
        child: Scaffold(
          body: IndexedStack(index: _index, children: _screens),
          bottomNavigationBar: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (i) => setState(() => _index = i),
            backgroundColor: AppColors.card,
            indicatorColor: AppColors.postal.withValues(alpha: 0.1),
            destinations: const [
              NavigationDestination(icon: Icon(Icons.explore_outlined), selectedIcon: Icon(Icons.explore), label: 'Explore'),
              NavigationDestination(icon: Icon(Icons.menu_book_outlined), selectedIcon: Icon(Icons.menu_book), label: 'Passport'),
              NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Account'),
            ],
          ),
        ),
      ),
    );
  }
}
