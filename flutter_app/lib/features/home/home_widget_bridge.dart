import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/home_widget_sync.dart';
import '../office/visit_dialog.dart';

/// Keeps the Android home-screen widget's "N of M stamps" numbers in sync
/// with the real data, the same way GuestSignInNudge watches controllers to
/// drive its own side effect. Counts across ALL live offices/visits (not
/// just the currently-selected state), matching the existing iOS widget's
/// "grand total across every state" framing.
class HomeWidgetBridge extends StatelessWidget {
  final Widget child;
  const HomeWidgetBridge({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final officesController = officesControllerOf(context);
    final visitsController = visitsControllerOf(context);
    return AnimatedBuilder(
      animation: Listenable.merge([officesController, visitsController]),
      builder: (context, _) {
        if (!officesController.loading && officesController.error == null) {
          unawaited(updateHomeWidgetProgress(
            collected: visitsController.visits.length,
            total: officesController.offices.length,
          ));
        }
        return child;
      },
    );
  }
}
