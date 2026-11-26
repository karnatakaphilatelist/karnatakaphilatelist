import 'package:flutter/material.dart';

import 'features/account/account_screen.dart';
import 'features/auth/guest_sign_in_nudge.dart';
import 'features/coach/coach_tour.dart';
import 'features/office/visit_dialog.dart' show authControllerOf;
import 'features/explore/explore_screen.dart';
import 'features/home/home_widget_bridge.dart';
import 'features/learn/learn_screen.dart';
import 'features/passport/passport_screen.dart';
import 'theme/app_theme.dart';
import 'widgets/app_icons.dart';
import 'widgets/glass_card.dart';

/// Which tab is showing. Shared so any screen can jump tabs the way the web
/// app's links do (the account avatar → Account, the detail card's Stamps
/// button → Passport) instead of pushing duplicate screens on top.
final ValueNotifier<int> appTabIndex = ValueNotifier<int>(0);

/// Mirrors OverlayProvider's `sheetOpen` on the web: while the office detail
/// card is open the tab bar hides, so the card reads as one surface.
final ValueNotifier<bool> detailSheetOpen = ValueNotifier<bool>(false);

/// Fired when Explore's tab is tapped while already on Explore — the web's
/// EXPLORE_RESET_EVENT (close cards, clear search and filters).
final ValueNotifier<int> exploreReset = ValueNotifier<int>(0);

void goToTab(BuildContext context, int index) {
  Navigator.of(context).popUntil((route) => route.isFirst);
  appTabIndex.value = index;
}

class AppShell extends StatelessWidget {
  const AppShell({super.key});

  static const _screens = [ExploreScreen(), PassportScreen(), LearnScreen(), AccountScreen()];

  @override
  Widget build(BuildContext context) {
    return HomeWidgetBridge(
      child: GuestSignInNudge(
        child: ValueListenableBuilder<int>(
          valueListenable: appTabIndex,
          builder: (context, index, _) => CoachTour(
            auth: authControllerOf(context),
            onExplore: index == 0,
            child: Scaffold(
              backgroundColor: AppColors.paper,
              body: IndexedStack(index: index, children: _screens),
              bottomNavigationBar: ValueListenableBuilder<bool>(
                valueListenable: detailSheetOpen,
                builder: (context, hidden, _) => hidden ? const SizedBox.shrink() : AppTabBar(index: index),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Port of TabBar.tsx: `.kp-tabbar` surface, 64px row of four 52px items;
/// the active one gets a postal/10 pill with bold postal text.
class AppTabBar extends StatelessWidget {
  final int index;
  const AppTabBar({super.key, required this.index});

  static const _items = [
    (AppIcon.compass, 'Explore'),
    (AppIcon.book, 'Passport'),
    (AppIcon.learn, 'Learn'),
    (AppIcon.user, 'Account'),
  ];

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    return GlassCard(
      kind: GlassKind.tabbar,
      borderRadius: BorderRadius.zero,
      padding: EdgeInsets.fromLTRB(16, 4, 16, bottomInset > 8 ? bottomInset : 8),
      child: SizedBox(
        height: 64,
        child: Row(
          children: [
            for (var i = 0; i < _items.length; i++) ...[
              if (i > 0) const SizedBox(width: 4),
              Expanded(
                child: KeyedSubtree(
                  key: i == 1 ? coachTargets['tab-passport'] : (i == 3 ? coachTargets['tab-account'] : null),
                  child: _TabItem(icon: _items[i].$1, label: _items[i].$2, active: i == index, onTap: () {
                    if (i == index && i == 0) exploreReset.value++;
                    appTabIndex.value = i;
                  }),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _TabItem extends StatelessWidget {
  final AppIcon icon;
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _TabItem({required this.icon, required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.postal : AppColors.muted;
    return Semantics(
      button: true,
      selected: active,
      label: label,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Center(
          child: Container(
            height: 52,
            width: double.infinity,
            decoration: BoxDecoration(
              color: active ? AppColors.postal.withValues(alpha: 0.1) : null,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                AppIconView(icon, size: 22, color: color),
                const SizedBox(height: 2),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    height: 16 / 12,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w600,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
