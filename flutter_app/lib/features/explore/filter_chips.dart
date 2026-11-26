import 'package:flutter/material.dart';

import '../../models/post_office.dart';
import '../../theme/app_theme.dart';
import '../../widgets/account_avatar.dart';
import '../../widgets/app_icons.dart';
import '../../widgets/glass_card.dart';

/// `null` = "all" (TS's `"all"` member of StatusFilter).
typedef StatusFilterValue = OfficeStatus?;

const _filters = <(StatusFilterValue, String)>[
  (null, 'All'),
  (OfficeStatus.unvisited, 'Not visited'),
  (OfficeStatus.planned, 'Planned'),
  (OfficeStatus.visited, 'Visited'),
];

/// Port of FilterChips.tsx. The row bleeds to the screen edges (`-mx-4 px-3`)
/// so it scrolls edge to edge, each 40px pill sits in a 44px touch target
/// with 4px side padding, and the right 28px fade out (`mask-image`).
class StatusFilterChips extends StatelessWidget {
  final StatusFilterValue value;
  final ValueChanged<StatusFilterValue> onChanged;
  const StatusFilterChips({super.key, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      label: 'Filter by status',
      child: ShaderMask(
        blendMode: BlendMode.dstIn,
        shaderCallback: (bounds) => LinearGradient(
          colors: const [Colors.black, Colors.black, Colors.transparent],
          stops: [0, bounds.width <= 28 ? 0 : (bounds.width - 28) / bounds.width, 1],
        ).createShader(bounds),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(12, 6, 12, 10),
          child: Row(
            children: [
              for (final (filterValue, label) in _filters)
                _Chip(
                  label: label,
                  status: filterValue,
                  active: filterValue == value,
                  onTap: () => onChanged(filterValue),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The chip row's own vertical padding (6 above, 10 below), added so the
/// pills' drop shadows aren't clipped by the scroll view. Callers subtract
/// it from the spacing around the row to keep the web's exact positions.
const double chipRowPadTop = 6;
const double chipRowPadBottom = 10;

class _Chip extends StatelessWidget {
  final String label;
  final StatusFilterValue status;
  final bool active;
  final VoidCallback onTap;
  const _Chip({required this.label, required this.status, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (status == OfficeStatus.unvisited) ...[
          Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: AppColors.muted, width: 2)),
          ),
          const SizedBox(width: 6),
        ],
        if (status == OfficeStatus.planned) ...[
          const AppIconView(AppIcon.flag, size: 16, color: AppColors.pinBlue),
          const SizedBox(width: 6),
        ],
        if (status == OfficeStatus.visited) ...[
          const AppIconView(AppIcon.check, size: 16, color: AppColors.stampGreen, strokeWidth: 3),
          const SizedBox(width: 6),
        ],
        Text(
          label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: active ? FontWeight.w700 : FontWeight.w600,
            color: AppColors.ink,
          ),
        ),
      ],
    );
    const radius = BorderRadius.all(Radius.circular(999));
    final pill = active
        ? Container(
            height: 40,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: AppColors.chipActive,
              borderRadius: radius,
              boxShadow: [cssShadow(0, 2, 8, 0, Colors.black.withValues(alpha: 0.12))],
            ),
            // The web draws this ring as an inset box-shadow, which takes no
            // layout space; a decoration border would widen the pill by 3px.
            foregroundDecoration: BoxDecoration(
              borderRadius: radius,
              border: Border.all(color: AppColors.ink, width: 1.5),
            ),
            child: content,
          )
        : GlassCard(
            borderRadius: radius,
            child: Container(height: 40, padding: const EdgeInsets.symmetric(horizontal: 16), child: content),
          );
    return Semantics(
      button: true,
      selected: active,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 44),
          padding: const EdgeInsets.symmetric(horizontal: 4),
          alignment: Alignment.center,
          child: pill,
        ),
      ),
    );
  }
}

/// Port of ExploreControls.tsx's search box: a 56px `.kp-glass` pill, the
/// search glyph 20px from the left, and — on phones — the account avatar
/// inset 8px inside the right end.
class ExploreSearchBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  const ExploreSearchBar({super.key, required this.controller, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: const BorderRadius.all(Radius.circular(999)),
      child: SizedBox(
        height: 56,
        child: Stack(
          children: [
            const Positioned(left: 20, top: 16, child: AppIconView(AppIcon.search, size: 24, color: AppColors.muted)),
            Positioned.fill(
              child: Center(
                child: TextField(
                  controller: controller,
                  onChanged: onChanged,
                  textInputAction: TextInputAction.search,
                  cursorColor: AppColors.ink,
                  style: const TextStyle(fontSize: 16, height: 1.5, color: AppColors.ink),
                  decoration: const InputDecoration(
                    hintText: 'Search post offices',
                    hintStyle: TextStyle(fontSize: 16, height: 1.5, color: AppColors.muted),
                    border: InputBorder.none,
                    isCollapsed: true,
                    contentPadding: EdgeInsets.fromLTRB(56, 0, 56, 0),
                  ),
                ),
              ),
            ),
            const Positioned(right: 8, top: 8, child: AccountAvatarButton()),
          ],
        ),
      ),
    );
  }
}
