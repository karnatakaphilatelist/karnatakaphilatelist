import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/share.dart';
import '../../data/learn_articles.dart';
import '../../theme/app_theme.dart';
import 'article_screen.dart';

const _webBase = 'https://philatrail.com';

/// Port of src/components/learn/LearnHub.tsx: a short reading list from
/// "what is this?" to "I have my booklet", native instead of a web view.
class LearnScreen extends StatelessWidget {
  const LearnScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final first = articles.first;
    final rest = articles.skip(1).toList();
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          children: [
            const Text('LEARN', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.6, color: AppColors.muted)),
            const SizedBox(height: 8),
            const Text('Learn about philately', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: AppColors.ink)),
            const SizedBox(height: 10),
            const Text(
              'New to stamps and postmarks? Start here. A few short reads on the hobby, the Philately Passport and how to get your first postmark.',
              style: TextStyle(fontSize: 15, height: 1.4, color: AppColors.ink),
            ),
            const SizedBox(height: 20),
            InkWell(
              borderRadius: BorderRadius.circular(24),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ArticleScreen(article: first))),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: AppColors.postal, borderRadius: BorderRadius.circular(24)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('START HERE · ${first.minutes} MIN',
                        style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.4)),
                    const SizedBox(height: 8),
                    Text(first.title, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(first.summary, style: const TextStyle(color: Colors.white, fontSize: 15)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.line)),
              child: Column(
                children: [
                  for (final article in rest)
                    InkWell(
                      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ArticleScreen(article: article))),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          border: article == rest.last ? null : const Border(bottom: BorderSide(color: AppColors.line)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(article.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                  Text(article.summary, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                                ],
                              ),
                            ),
                            Text('${article.minutes} min', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                            const SizedBox(width: 4),
                            const Icon(Icons.chevron_right, size: 18, color: AppColors.muted),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Center(
              child: OutlinedButton.icon(
                onPressed: () => unawaited(shareText(
                  text: 'New to philately? Short reads on the hobby and Karnataka\'s Philately Passport. $_webBase/learn',
                  subject: 'Learn about philately',
                )),
                icon: const Icon(Icons.share_outlined, size: 16),
                label: const Text('Share Learn with a friend'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
