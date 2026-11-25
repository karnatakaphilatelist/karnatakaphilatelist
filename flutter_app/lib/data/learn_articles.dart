/// Port of src/lib/learn-articles.ts — same slugs, titles and copy, so the
/// native Learn tab reads the same as the web app's. Facts and sources are
/// unchanged from the web version; re-check with the bureau before editing.
library;

sealed class Block {
  const Block();
}

class ParagraphBlock extends Block {
  final String text;
  const ParagraphBlock(this.text);
}

class HeadingBlock extends Block {
  final String text;
  const HeadingBlock(this.text);
}

class ListBlock extends Block {
  final List<String> items;
  final bool ordered;
  const ListBlock(this.items, {this.ordered = false});
}

class Term {
  final String term;
  final String meaning;
  const Term(this.term, this.meaning);
}

class TermsBlock extends Block {
  final List<Term> items;
  const TermsBlock(this.items);
}

/// Where the booklet is sold (port of src/lib/booklet.ts's BOOKLET_OUTLETS).
class OutletsBlock extends Block {
  const OutletsBlock();
}

/// The Bengaluru GPO Philatelic Bureau (BOOKLET_OUTLETS[0]).
class BureauBlock extends Block {
  const BureauBlock();
}

/// A contextual link inline with the reading. [href] is either another
/// article ("/learn/<slug>"), the map ("/explore"), or a page this app
/// doesn't have a native screen for — the article screen decides which.
class LinkBlock extends Block {
  final String text;
  final String href;
  const LinkBlock(this.text, this.href);
}

class Source {
  final String label;
  final String url;
  const Source(this.label, this.url);
}

class NextStep {
  final String label;
  final String href;
  const NextStep(this.label, this.href);
}

class Article {
  final String slug;
  final String title;
  final String summary;
  final int minutes;
  final List<Block> blocks;
  final List<Source> sources;
  final NextStep next;
  const Article({
    required this.slug,
    required this.title,
    required this.summary,
    required this.minutes,
    required this.blocks,
    required this.sources,
    required this.next,
  });
}

/// Where the Philately Passport booklet is sold, as reported in news
/// coverage in October 2026. Port of src/lib/booklet.ts's BOOKLET_OUTLETS.
class BookletOutlet {
  final String name;
  final String note;
  final String mapQuery;
  final String email;
  final String phone;
  const BookletOutlet({
    required this.name,
    required this.note,
    required this.mapQuery,
    required this.email,
    required this.phone,
  });
}

const bookletOutlets = [
  BookletOutlet(
    name: 'Bengaluru GPO',
    note: 'Philatelic Bureau, Ambedkar Veedhi, 560001',
    mapQuery: 'Bengaluru GPO Philatelic Bureau Ambedkar Veedhi',
    email: 'philatelybggpo.ka@indiapost.gov.in',
    phone: '080 2285 0058',
  ),
  BookletOutlet(
    name: 'Mysuru Head Post Office',
    note: 'Mysuru, 570001',
    mapQuery: 'Mysuru Head Post Office 570001',
    email: 'mysoreho@indiapost.gov.in',
    phone: '0821 247 0135',
  ),
  BookletOutlet(
    name: 'Mangaluru Head Post Office',
    note: 'Mangaluru',
    mapQuery: 'Mangaluru Head Post Office',
    email: 'mangaloreho@indiapost.gov.in',
    phone: '0824 244 1447',
  ),
  BookletOutlet(
    name: 'Belagavi Head Post Office',
    note: 'Belagavi, 590001',
    mapQuery: 'Belagavi Head Post Office 590001',
    email: 'belagaviho@indiapost.gov.in',
    phone: '0831 242 4897',
  ),
];

final bureau = bookletOutlets[0];

const _indiaPostPhilately = Source('India Post: Philately', 'https://postagestamps.gov.in/Philately.aspx');
const _indiaPostHistory = Source('India Post: History of philately in India', 'https://app.indiapost.gov.in/philately/about/about-philately');
const _forumPpc = Source('Indian Philatelists\' Forum: Permanent Pictorial Cancellations', 'https://indianphilately.net/ppc.html');
const _forumPpcKarnataka = Source('Indian Philatelists\' Forum: Karnataka\'s pictorial cancellations', 'https://indianphilately.net/ppckar.html');
const _deccanHeraldPpc = Source('Deccan Herald: Permanent pictorial cancellations draw attention', 'https://www.deccanherald.com/india/karnataka/permanent-pictorial-cancellations-draw-attention-2219447');
const _newsKarnataka = Source('News Karnataka: Bengaluru GPO sells 3,500 Philately Passports', 'https://newskarnataka.com/bagalkote/bengaluru-gpo-sells-3500-philately-passports/11102026/');
const _theWeek = Source('The Week: the Philately Passport is the buzz of the moment', 'https://www.theweek.in/news/tourism/2026/10/10/karnataka-postal-circles-philately-passport-is-the-buzz-of-the-moment.html');
const _hansIndia = Source('The Hans India: Karnataka Postal Department sells 8,000 passports', 'https://www.thehansindia.com/news/cities/bengaluru/karnataka-postal-dept-sells-8000-philately-passports-in-two-days-1131947');

final List<Article> articles = [
  Article(
    slug: 'what-is-philately',
    title: 'What is philately?',
    summary: 'The hobby behind the passport, in two minutes.',
    minutes: 2,
    blocks: const [
      ParagraphBlock(
        'Philately is the hobby of collecting and studying postage stamps. Collectors sort them by year, country or theme, and pick up history, geography and science along the way.',
      ),
      HeadingBlock('Where it began in India'),
      ParagraphBlock(
        'Paper postage started in India in 1852. Before that, copper tokens were used to pay for postage from 1774. Since independence in 1947, India has issued more than 3,000 stamps.',
      ),
      HeadingBlock('What collectors collect'),
      ListBlock([
        'Stamps, both mint (unused) and used.',
        'Commemorative stamps, made for events, people and nature.',
        'Definitive stamps, the everyday ones.',
        'First Day Covers, with brochures that explain each new stamp.',
        "Collectors' packs, one for each year.",
        'Miniature or souvenir sheets, which come out now and then.',
      ]),
      HeadingBlock('How people start'),
      ParagraphBlock(
        'You do not need to buy anything rare. Used stamps arrive on the letters you receive, and local philatelists and pen-friends can help you find more. In Karnataka there is now an even simpler way to begin: a booklet that sends you to 100 post offices.',
      ),
      LinkBlock('More: how the Karnataka Philately Passport turns this into a 100-office trail', '/karnataka-philately-passport'),
    ],
    sources: const [_indiaPostPhilately, _indiaPostHistory],
    next: const NextStep('Next: stamp or postmark?', '/learn/stamp-or-postmark'),
  ),
  Article(
    slug: 'stamp-or-postmark',
    title: 'Stamp or postmark?',
    summary: 'Two things people mix up, and which one you collect on the trail.',
    minutes: 2,
    blocks: const [
      ParagraphBlock(
        'A stamp shows that postage was paid. A postmark, also called a cancellation, is the mark a post office adds so the stamp cannot be used again. Every post office has its own. On the Philatrail you collect postmarks.',
      ),
      HeadingBlock('Two kinds of stamps'),
      TermsBlock([
        Term('Definitive stamps', 'The everyday ones. Every postal counter sells them.'),
        Term('Commemorative stamps', 'Made for an event, a person or a theme, and printed in limited numbers. They are sold at Philatelic Bureaux and counters, or through a Philatelic Deposit Account.'),
      ]),
      HeadingBlock('Words you will hear'),
      TermsBlock([
        Term('Philatelic Bureau', 'A post office counter built for collectors. India Post lists about 68. They sell to individuals and can open Philatelic Deposit Accounts.'),
        Term('Philatelic counter', 'Found at head post offices, about 1,100 of them. It sells philatelic items but cannot issue a special cancellation.'),
        Term('First Day Cover', 'An envelope with a new stamp, cancelled on the day that stamp was issued.'),
        Term('Special cancellation', 'A one-off postmark for an event or stamp release. It is available for a short time, and only at named offices.'),
        Term('Pictorial cancellation', 'A postmark with a picture of a place or theme, such as a temple or a fort.'),
      ]),
      LinkBlock('More: see the Karnataka Philately Passport, the booklet behind the trail', '/karnataka-philately-passport'),
    ],
    sources: const [_indiaPostPhilately, _indiaPostHistory],
    next: const NextStep('Next: pictorial postmarks explained', '/learn/pictorial-postmarks'),
  ),
  Article(
    slug: 'pictorial-postmarks',
    title: 'Pictorial postmarks (PPC) explained',
    summary: 'What a Permanent Pictorial Cancellation is, and how to get one.',
    minutes: 3,
    blocks: const [
      ParagraphBlock(
        'A pictorial cancellation is a postmark with a picture of a place or theme. A Permanent Pictorial Cancellation, or PPC, stays at a post office for good, usually near a heritage, tourist or nature site.',
      ),
      HeadingBlock('A short history'),
      ParagraphBlock(
        'India Post began permanent pictorial cancellations in 1951. A second phase started on 1 January 1965, with early examples at Sanchi, Ajanta, Ellora, Khajuraho and Mahabalipuram. In Karnataka, a letter box at the Somnathpur heritage site gives letters the Kesava temple postmark.',
      ),
      HeadingBlock('PPC or special cancellation?'),
      ListBlock([
        'A PPC is permanent. You can get it on any day the office is open.',
        'A special cancellation is for a single event or stamp release. It is available for a short time, and only at named offices.',
      ]),
      HeadingBlock('How to get one'),
      ParagraphBlock('Ask the staff at the post office to apply it. A spoken request is enough, but your mail must carry the right stamps. It works on postcards and inland letters too.'),
      ParagraphBlock('Not every Philately Passport location has been confirmed as a PPC site, so we call the postmarks you collect postmarks, and use PPC only where it is known.'),
      LinkBlock('More: how the Karnataka Philately Passport puts these postmarks on a route', '/karnataka-philately-passport'),
    ],
    sources: const [_forumPpc, _forumPpcKarnataka, _deccanHeraldPpc],
    next: const NextStep('Next: how the Philately Passport works', '/learn/how-the-passport-works'),
  ),
  Article(
    slug: 'how-the-passport-works',
    title: 'How the Philately Passport works',
    summary: 'A booklet, 100 places and a postmark from each.',
    minutes: 3,
    blocks: const [
      ParagraphBlock('The Philately Passport is a pocket-sized booklet from Karnataka Postal Circle. It gives short notes on 100 places in Karnataka, with a facing page for each one. Reports put the price at ₹600.'),
      HeadingBlock('Step by step'),
      ListBlock([
        'Buy the booklet at a participating head post office or Philatelic Bureau.',
        'Travel to a place listed inside and find its post office.',
        "Buy a postage stamp and stick it on that place's facing page.",
        "Ask the staff to cancel it with the place's pictorial postmark. Reports say the mark also carries the date of your visit.",
        'Move on to the next place.',
      ], ordered: true),
      HeadingBlock('Good to know'),
      ListBlock([
        'Each postmark is available only at its own post office, so you have to go there.',
        "The booklet's own pages are the final word on how it works. Check them for any rules or deadlines.",
      ]),
      HeadingBlock('Where Philatrail fits'),
      ParagraphBlock('Philatrail is an independent app that goes with the booklet. It shows the 100 post offices on a map, helps you plan trips and keeps count of the postmarks you have collected. It does not replace the booklet, and a tap in the app is not an official stamp.'),
      LinkBlock('Browse all 100 post offices by district', '/offices'),
    ],
    sources: const [_newsKarnataka, _theWeek, _hansIndia],
    next: const NextStep('Next: where to get the booklet', '/learn/get-the-booklet'),
  ),
  Article(
    slug: 'get-the-booklet',
    title: 'Where to get the booklet',
    summary: 'Four places that sell it, and who to ask first.',
    minutes: 2,
    blocks: const [
      ParagraphBlock('The booklet costs about ₹600 and is sold by Karnataka Postal Circle. It was reported on sale at these four post offices. Copies have sold out within hours in past rounds, according to news reports, so call or write before you travel.'),
      OutletsBlock(),
      HeadingBlock('Who to ask'),
      BureauBlock(),
      LinkBlock('See the district-by-district list of all 100 offices', '/offices'),
    ],
    sources: const [_newsKarnataka, _theWeek],
    next: const NextStep('Next: getting your postmark at the counter', '/learn/at-the-counter'),
  ),
  Article(
    slug: 'at-the-counter',
    title: 'Getting your postmark at the counter',
    summary: 'What to bring, what to say, and what to check before you leave.',
    minutes: 2,
    blocks: const [
      ParagraphBlock('A little preparation makes this quick and easy for you and for the staff.'),
      HeadingBlock('Before you go'),
      ListBlock([
        'Carry your booklet, and open it to that place\'s page.',
        'Check the opening hours, or call the office first.',
      ]),
      HeadingBlock('At the counter'),
      ListBlock([
        'Buy a postage stamp.',
        "Stick it on the facing page for that place.",
        "Ask politely for the place's pictorial postmark. A spoken request is enough.",
        'Check the mark before you leave: the place name should be clear, and reports say it carries the date.',
      ], ordered: true),
      HeadingBlock('Then, in the app'),
      ParagraphBlock('Open the office in Philatrail and tap Stamp it, so your passport on the phone matches the one in your bag.'),
      LinkBlock('Full overview: the Karnataka Philately Passport', '/karnataka-philately-passport'),
    ],
    sources: const [_deccanHeraldPpc, _newsKarnataka],
    next: const NextStep('Open the map', '/explore'),
  ),
];

Article? getArticle(String slug) {
  for (final article in articles) {
    if (article.slug == slug) return article;
  }
  return null;
}
