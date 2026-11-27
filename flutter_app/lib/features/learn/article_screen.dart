import 'dart:async';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants.dart';
import '../../core/share.dart';
import '../../data/learn_articles.dart';
import '../../app_shell.dart' show AppTabBar;
import '../../theme/app_theme.dart';
import '../../widgets/app_icons.dart';

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
    final insets = MediaQuery.of(context).padding;
    return Scaffold(
      backgroundColor: AppColors.paper,
      // The web keeps the tab bar on article pages, with Learn lit.
      bottomNavigationBar: const AppTabBar(index: 2),
      body: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(20, insets.top + 24, 20, 48),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 672),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Transform.translate(
                  offset: const Offset(-8, 0),
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => Navigator.of(context).maybePop(),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 44),
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          AppIconView(AppIcon.arrowLeft, size: 16, color: AppColors.muted),
                          SizedBox(width: 6),
                          Text('Learn', style: TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.muted)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text('${article.minutes} MIN READ',
                    style: const TextStyle(fontSize: 12, height: 16 / 12, fontWeight: FontWeight.w700, letterSpacing: 12 * 0.18, color: AppColors.muted)),
                const SizedBox(height: 8),
                Text(article.title,
                    style: const TextStyle(
                        fontFamily: AppFonts.display, fontSize: 30, height: 1.25, fontWeight: FontWeight.w700, letterSpacing: 30 * -0.025, color: AppColors.ink)),
                const SizedBox(height: 16),
                _OutlineButton(icon: AppIcon.share, label: 'Share this article', onTap: _share),
                for (final block in article.blocks) _BlockView(block: block, onLink: (href) => _openHref(context, href)),
                const SizedBox(height: 40),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(24)),
                  foregroundDecoration: BoxDecoration(borderRadius: BorderRadius.circular(24), border: Border.all(color: const Color(0x2E8C6428), width: 1.5)),
                  child: Column(
                    children: [
                      GestureDetector(
                        onTap: () => _openHref(context, article.next.href),
                        child: Container(
                          constraints: const BoxConstraints(minHeight: 48),
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          decoration: BoxDecoration(color: AppColors.postal, borderRadius: BorderRadius.circular(999)),
                          child: Center(
                            widthFactor: 1,
                            child: Text(article.next.label,
                                textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _OutlineButton(icon: AppIcon.share, label: 'Send this to a friend', onTap: _share),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
                const Text('READ MORE',
                    style: TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w700, letterSpacing: 14 * 0.14, color: AppColors.muted)),
                const SizedBox(height: 8),
                for (final source in article.sources)
                  GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => launchUrl(Uri.parse(source.url), mode: LaunchMode.externalApplication),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 44),
                      alignment: Alignment.centerLeft,
                      child: Text(source.label,
                          style: const TextStyle(
                              fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w600, color: AppColors.ink, decoration: TextDecoration.underline)),
                    ),
                  ),
                const SizedBox(height: 24),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.only(top: 16),
                  decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.line))),
                  child: Text('Details come from the sources above and may change. $disclaimer',
                      style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// `OUTLINE`: min-h 44, rounded-full, 1.5px ink/25 border, 14 bold.
class _OutlineButton extends StatelessWidget {
  final AppIcon? icon;
  final String label;
  final VoidCallback onTap;
  const _OutlineButton({this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.ink.withValues(alpha: 0.25), width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[AppIconView(icon!, size: 16, color: AppColors.ink), const SizedBox(width: 8)],
            Text(label, style: const TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w700, color: AppColors.ink)),
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

  static const _body = TextStyle(fontSize: 16, height: 28 / 16, color: AppColors.ink);

  @override
  Widget build(BuildContext context) {
    return switch (block) {
      ParagraphBlock(:final text) => Padding(padding: const EdgeInsets.only(top: 12), child: Text(text, style: _body)),
      HeadingBlock(:final text) => Padding(
          padding: const EdgeInsets.only(top: 32),
          child: Text(text,
              style: const TextStyle(fontFamily: AppFonts.display, fontSize: 20, height: 28 / 20, fontWeight: FontWeight.w700, color: AppColors.ink)),
        ),
      ListBlock(:final items, :final ordered) => Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final (i, item) in items.indexed)
                Padding(
                  padding: EdgeInsets.only(top: i == 0 ? 0 : 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 20,
                        child: ordered
                            ? Text('${i + 1}.', style: _body)
                            : const Padding(
                                padding: EdgeInsets.only(top: 11.5),
                                child: Align(
                                  alignment: Alignment.topLeft,
                                  child: SizedBox(width: 5, height: 5, child: DecoratedBox(decoration: BoxDecoration(color: AppColors.ink, shape: BoxShape.circle))),
                                ),
                              ),
                      ),
                      Expanded(child: Text(item, style: _body)),
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
              for (final (i, term) in items.indexed)
                Padding(
                  padding: EdgeInsets.only(top: i == 0 ? 0 : 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(term.term, style: _body.copyWith(fontWeight: FontWeight.w700)),
                      Text(term.meaning, style: _body.copyWith(color: AppColors.muted)),
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
          child: GestureDetector(
            onTap: () => onLink(href),
            child: Text(text, style: _body.copyWith(fontWeight: FontWeight.w700, decoration: TextDecoration.underline)),
          ),
        ),
    };
  }
}

String _telUri(String phone) => '+91${phone.replaceAll(RegExp(r'\D'), '').replaceFirst(RegExp(r'^0'), '')}';

class _OutletsView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        children: [
          for (final (i, outlet) in bookletOutlets.indexed)
            Container(
              width: double.infinity,
              margin: EdgeInsets.only(top: i == 0 ? 0 : 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(16)),
              foregroundDecoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0x2E8C6428), width: 1.5)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(outlet.name, style: const TextStyle(fontSize: 16, height: 24 / 16, fontWeight: FontWeight.w700, color: AppColors.ink)),
                  Text(outlet.note, style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.muted)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _OutlineButton(label: 'Call', onTap: () => launchUrl(Uri(scheme: 'tel', path: _telUri(outlet.phone)))),
                      _OutlineButton(label: 'Email', onTap: () => launchUrl(Uri(scheme: 'mailto', path: outlet.email))),
                      _OutlineButton(
                        label: 'Directions',
                        onTap: () => launchUrl(
                          Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(outlet.mapQuery)}'),
                          mode: LaunchMode.externalApplication,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('${outlet.phone} · ${outlet.email}', style: const TextStyle(fontSize: 12, height: 16 / 12, color: AppColors.muted)),
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
            style: _BlockView._body,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              GestureDetector(
                onTap: () => launchUrl(Uri(scheme: 'mailto', path: bureau.email, query: 'subject=${Uri.encodeComponent("Philately Passport booklet")}')),
                child: Container(
                  constraints: const BoxConstraints(minHeight: 44),
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: AppColors.postal, borderRadius: BorderRadius.circular(999)),
                  child: const Text('Email the bureau', style: TextStyle(fontSize: 14, height: 20 / 14, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
              ),
              _OutlineButton(label: 'Call ${bureau.phone}', onTap: () => launchUrl(Uri(scheme: 'tel', path: _telUri(bureau.phone)))),
            ],
          ),
        ],
      ),
    );
  }
}
