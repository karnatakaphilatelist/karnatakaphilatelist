import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants.dart';
import '../../core/share.dart';
import '../../data/learn_articles.dart';
import '../../theme/app_theme.dart';

const _webBase = 'https://philatrail.com';

/// Port of src/components/learn/ArticleView.tsx. One article, rendered
/// natively instead of opening the website — the whole point of this
/// screen existing is to not be a web view for Learn content.
class ArticleScreen extends StatelessWidget {
  final Article article;
  const ArticleScreen({super.key, required this.article});

  Future<void> _openHref(BuildContext context, String href) async {
    if (href.startsWith('/learn/')) {
      final next = getArticle(href.substring('/learn/'.length));
      if (next != null) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => ArticleScreen(article: next)),
        );
        return;
      }
    }
    if (href == '/explore') {
      // Shortcut: back to the tab bar rather than switching it to Explore —
      // this is a "you're done, go collect" link, not a deep link into a
      // specific tab, and the user is one tap from Explore either way.
      Navigator.of(context).popUntil((route) => route.isFirst);
      return;
    }
    await launchUrl(Uri.parse('$_webBase$href'), mode: LaunchMode.externalApplication);
  }

  void _share() {
    unawaited(shareText(
      text: '${article.title}: ${article.summary} $_webBase/learn/${article.slug}',
      subject: article.title,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).maybePop(),
                  icon: const Icon(Icons.arrow_back),
                  color: AppColors.muted,
                ),
                const Text('Learn', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.muted)),
              ],
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${article.minutes} min read',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.6, color: AppColors.muted)),
                  const SizedBox(height: 8),
                  Text(article.title,
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.ink, height: 1.15)),
                  const SizedBox(height: 14),
                  OutlinedButton.icon(
                    onPressed: _share,
                    icon: const Icon(Icons.share_outlined, size: 16),
                    label: const Text('Share this article'),
                  ),
                  const SizedBox(height: 10),
                  for (final block in article.blocks) _BlockView(block: block, onLink: (href) => _openHref(context, href)),
                  const SizedBox(height: 28),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(24)),
                    child: Column(
                      children: [
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton(
                            style: FilledButton.styleFrom(backgroundColor: AppColors.postal, shape: const StadiumBorder(), padding: const EdgeInsets.symmetric(vertical: 14)),
                            onPressed: () => _openHref(context, article.next.href),
                            child: Text(article.next.label, style: const TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(height: 10),
                        TextButton.icon(
                          onPressed: _share,
                          icon: const Icon(Icons.share_outlined, size: 16),
                          label: const Text('Send this to a friend'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  const Text('READ MORE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.6, color: AppColors.muted)),
                  const SizedBox(height: 8),
                  for (final source in article.sources)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: InkWell(
                        onTap: () => launchUrl(Uri.parse(source.url), mode: LaunchMode.externalApplication),
                        child: Text(source.label, style: const TextStyle(fontWeight: FontWeight.w600, decoration: TextDecoration.underline)),
                      ),
                    ),
                  const SizedBox(height: 16),
                  const Divider(color: AppColors.line),
                  const SizedBox(height: 10),
                  Text('Details come from the sources above and may change. $disclaimer',
                      style: const TextStyle(fontSize: 13, color: AppColors.muted, height: 1.4)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BlockView extends StatelessWidget {
  final Block block;
  final void Function(String href) onLink;
  const _BlockView({required this.block, required this.onLink});

  @override
  Widget build(BuildContext context) {
    return switch (block) {
      ParagraphBlock(:final text) => Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Text(text, style: const TextStyle(fontSize: 16, height: 1.5, color: AppColors.ink)),
        ),
      HeadingBlock(:final text) => Padding(
          padding: const EdgeInsets.only(top: 24, bottom: 4),
          child: Text(text, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.bold, color: AppColors.ink)),
        ),
      ListBlock(:final items, :final ordered) => Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final (i, item) in items.indexed)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 22,
                        child: Text(ordered ? '${i + 1}.' : '•', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.muted)),
                      ),
                      Expanded(child: Text(item, style: const TextStyle(fontSize: 16, height: 1.4, color: AppColors.ink))),
                    ],
                  ),
                ),
            ],
          ),
        ),
      TermsBlock(:final items) => Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final term in items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(term.term, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.ink)),
                      Text(term.meaning, style: const TextStyle(color: AppColors.muted, fontSize: 15, height: 1.4)),
                    ],
                  ),
                ),
            ],
          ),
        ),
      OutletsBlock() => _OutletsView(),
      BureauBlock() => _BureauView(),
      LinkBlock(:final text, :final href) => Padding(
          padding: const EdgeInsets.only(top: 12),
          child: InkWell(
            onTap: () => onLink(href),
            child: Text(text, style: const TextStyle(fontWeight: FontWeight.bold, decoration: TextDecoration.underline, color: AppColors.ink)),
          ),
        ),
    };
  }
}

class _OutletsView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Column(
        children: [
          for (final outlet in bookletOutlets)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.line)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(outlet.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text(outlet.note, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      OutlinedButton(
                        onPressed: () => launchUrl(Uri(scheme: 'tel', path: '+91${outlet.phone.replaceAll(RegExp(r'\D'), '').replaceFirst(RegExp(r'^0'), '')}')),
                        child: const Text('Call'),
                      ),
                      OutlinedButton(
                        onPressed: () => launchUrl(Uri(scheme: 'mailto', path: outlet.email)),
                        child: const Text('Email'),
                      ),
                      OutlinedButton(
                        onPressed: () => launchUrl(
                          Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(outlet.mapQuery)}'),
                          mode: LaunchMode.externalApplication,
                        ),
                        child: const Text('Directions'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('${outlet.phone} · ${outlet.email}', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _BureauView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'For stock, price or opening hours, write to the Philatelic Bureau at Bengaluru GPO. It is where the booklet first went on sale.',
            style: TextStyle(fontSize: 16, height: 1.5, color: AppColors.ink),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: AppColors.postal),
                onPressed: () => launchUrl(Uri(scheme: 'mailto', path: bureau.email, query: 'subject=${Uri.encodeComponent("Philately Passport booklet")}')),
                child: const Text('Email the bureau'),
              ),
              OutlinedButton(
                onPressed: () => launchUrl(Uri(scheme: 'tel', path: '+91${bureau.phone.replaceAll(RegExp(r'\D'), '').replaceFirst(RegExp(r'^0'), '')}')),
                child: Text('Call ${bureau.phone}'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
