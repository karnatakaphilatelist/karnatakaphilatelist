import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/share.dart';
import '../../data/learn_articles.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_icons.dart';
import 'article_screen.dart';

const _webBase = 'https://philatrail.com';

/// Port of src/components/learn/LearnHub.tsx.
class LearnScreen extends StatelessWidget {
  const LearnScreen({super.key});

  void _open(BuildContext context, Article article) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => ArticleScreen(article: article)));

  @override
  Widget build(BuildContext context) {
    final first = articles.first;
    final rest = articles.skip(1).toList();
    final insets = MediaQuery.of(context).padding;
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: ListView(
        padding: EdgeInsets.fromLTRB(20, insets.top + 24, 20, 48),
        children: [
          const Text('LEARN', style: TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w700, letterSpacing: 12 * 0.18, color: AppColors.muted)),
          const SizedBox(height: 8),
          const Text(
            'Learn about philately',
            style: TextStyle(fontFamily: AppFonts.display, fontSize: 30, height: 1.25, fontWeight: FontWeight.w700, letterSpacing: 30 * -0.025, color: AppColors.ink),
          ),
          const SizedBox(height: 12),
          const Text(
            'New to stamps and postmarks? Start here. A few short reads on the hobby, the Philately Passport and how to get your first postmark.',
            style: TextStyle(fontSize: 16, height: 28 / 16, color: AppColors.ink),
          ),
          const SizedBox(height: 24),
          GestureDetector(
            onTap: () => _open(context, first),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: AppColors.postal, borderRadius: BorderRadius.circular(24)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('START HERE · ${first.minutes} MIN',
                      style: TextStyle(
                          fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w700, letterSpacing: 12 * 0.18, color: Colors.white.withValues(alpha: 0.8))),
                  const SizedBox(height: 6),
                  Text(first.title,
                      style: const TextStyle(fontFamily: AppFonts.display, fontSize: 24, height: 1.25, fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 4),
                  Text(first.summary, style: TextStyle(fontSize: 16, height: 1.5, color: Colors.white.withValues(alpha: 0.9))),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(16)),
            // shadow-[inset_0_0_0_1.5px_rgb(140_100_40/0.18)]
            foregroundDecoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0x2E8C6428), width: 1.5),
            ),
            child: Column(
              children: [
                for (var i = 0; i < rest.length; i++)
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => _open(context, rest[i]),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 56),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(border: i == 0 ? null : const Border(top: BorderSide(color: AppColors.line))),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(rest[i].title, style: const TextStyle(fontSize: 16, height: 1.5, fontWeight: FontWeight.w700, color: AppColors.ink)),
                                Text(rest[i].summary, style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text('${rest[i].minutes} min', style: const TextStyle(fontSize: 12, height: 16 / 12, color: AppColors.muted)),
                          const SizedBox(width: 12),
                          const AppIconView(AppIcon.chevronRight, size: 16, color: AppColors.muted),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          Center(
            child: GestureDetector(
              onTap: () => unawaited(shareText(
                text: "New to philately? Short reads on the hobby and Karnataka's Philately Passport. $_webBase/learn",
                subject: 'Learn about philately',
              )),
              child: Container(
                constraints: const BoxConstraints(minHeight: 44),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: AppColors.ink.withValues(alpha: 0.25), width: 1.5),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AppIconView(AppIcon.share, size: 16, color: AppColors.ink),
                    SizedBox(width: 8),
                    Text('Share Learn with a friend', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
