/**
 * The articles in the Learn tab. Plain data so they can be edited without touching the layout.
 *
 * Facts here come from India Post's own philately pages and from news reports on the Karnataka
 * Philately Passport (see each article's `sources`). Anything not confirmed is left out on purpose,
 * for example the booklet's completion window, which Bhavishya still needs to check in the printed copy.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ol" | "ul"; items: string[] }
  | { type: "terms"; items: { term: string; meaning: string }[] }
  | { type: "outlets" }
  | { type: "bureau" }
  /** A contextual link to another page on the site, inline with the reading, not just the "next" card. */
  | { type: "link"; text: string; href: string };

export interface Source {
  label: string;
  url: string;
}

export interface Article {
  slug: string;
  title: string;
  /** One line shown on the Learn list and in link previews. */
  summary: string;
  minutes: number;
  blocks: Block[];
  sources: Source[];
  /** What to do after reading. */
  next: { label: string; href: string };
}

const INDIA_POST_PHILATELY: Source = {
  label: "India Post: Philately",
  url: "https://postagestamps.gov.in/Philately.aspx",
};
const INDIA_POST_HISTORY: Source = {
  label: "India Post: History of philately in India",
  url: "https://app.indiapost.gov.in/philately/about/about-philately",
};
const FORUM_PPC: Source = {
  label: "Indian Philatelists' Forum: Permanent Pictorial Cancellations",
  url: "https://indianphilately.net/ppc.html",
};
const FORUM_PPC_KARNATAKA: Source = {
  label: "Indian Philatelists' Forum: Karnataka's pictorial cancellations",
  url: "https://indianphilately.net/ppckar.html",
};
const DECCAN_HERALD_PPC: Source = {
  label: "Deccan Herald: Permanent pictorial cancellations draw attention",
  url: "https://www.deccanherald.com/india/karnataka/permanent-pictorial-cancellations-draw-attention-2219447",
};
const NEWS_KARNATAKA: Source = {
  label: "News Karnataka: Bengaluru GPO sells 3,500 Philately Passports",
  url: "https://newskarnataka.com/bagalkote/bengaluru-gpo-sells-3500-philately-passports/11102026/",
};
const THE_WEEK: Source = {
  label: "The Week: the Philately Passport is the buzz of the moment",
  url: "https://www.theweek.in/news/tourism/2026/10/10/karnataka-postal-circles-philately-passport-is-the-buzz-of-the-moment.html",
};
const HANS_INDIA: Source = {
  label: "The Hans India: Karnataka Postal Department sells 8,000 passports",
  url: "https://www.thehansindia.com/news/cities/bengaluru/karnataka-postal-dept-sells-8000-philately-passports-in-two-days-1131947",
};

const DT_NEXT_TN: Source = {
  label: "DT Next: A passport to explore Tamil Nadu",
  url: "https://www.dtnext.in/news/chennai/a-passport-to-explore-tamil-nadu",
};
const LIVECHENNAI_TN: Source = {
  label: "Live Chennai: Philately Passport to revive stamp collecting",
  url: "https://www.livechennai.com/detailnews.asp?newsid=84419",
};
const TN_POSTAL_PPC_LIST: Source = {
  label: "Tamil Nadu Postal Circle: list of Permanent Pictorial Cancellations",
  url: "https://tamilnadupost.cept.gov.in/philatelic-bureaus.php",
};

export const ARTICLES: Article[] = [
  {
    slug: "what-is-philately",
    title: "What is philately?",
    summary: "The hobby behind the passport, in two minutes.",
    minutes: 2,
    blocks: [
      {
        type: "p",
        text: "Philately is the hobby of collecting and studying postage stamps. Collectors sort them by year, country or theme, and pick up history, geography and science along the way.",
      },
      { type: "h2", text: "Where it began in India" },
      {
        type: "p",
        text: "Paper postage started in India in 1852. Before that, copper tokens were used to pay for postage from 1774. Since independence in 1947, India has issued more than 3,000 stamps.",
      },
      { type: "h2", text: "What collectors collect" },
      {
        type: "ul",
        items: [
          "Stamps, both mint (unused) and used.",
          "Commemorative stamps, made for events, people and nature.",
          "Definitive stamps, the everyday ones.",
          "First Day Covers, with brochures that explain each new stamp.",
          "Collectors' packs, one for each year.",
          "Miniature or souvenir sheets, which come out now and then.",
        ],
      },
      { type: "h2", text: "How people start" },
      {
        type: "p",
        text: "You do not need to buy anything rare. Used stamps arrive on the letters you receive, and local philatelists and pen-friends can help you find more. In Karnataka there is now an even simpler way to begin: a booklet that sends you to 100 post offices.",
      },
      {
        type: "link",
        text: "More: how the Karnataka Philately Passport turns this into a 100-office trail",
        href: "/karnataka-philately-passport",
      },
    ],
    sources: [INDIA_POST_PHILATELY, INDIA_POST_HISTORY],
    next: {
      label: "Next: stamp or postmark?",
      href: "/learn/stamp-or-postmark",
    },
  },
  {
    slug: "stamp-or-postmark",
    title: "Stamp or postmark?",
    summary:
      "Two things people mix up, and which one you collect on the trail.",
    minutes: 2,
    blocks: [
      {
        type: "p",
        text: "A stamp shows that postage was paid. A postmark, also called a cancellation, is the mark a post office adds so the stamp cannot be used again. Every post office has its own. On the Philatrail you collect postmarks.",
      },
      { type: "h2", text: "Two kinds of stamps" },
      {
        type: "terms",
        items: [
          {
            term: "Definitive stamps",
            meaning: "The everyday ones. Every postal counter sells them.",
          },
          {
            term: "Commemorative stamps",
            meaning:
              "Made for an event, a person or a theme, and printed in limited numbers. They are sold at Philatelic Bureaux and counters, or through a Philatelic Deposit Account.",
          },
        ],
      },
      { type: "h2", text: "Words you will hear" },
      {
        type: "terms",
        items: [
          {
            term: "Philatelic Bureau",
            meaning:
              "A post office counter built for collectors. India Post lists about 68. They sell to individuals and can open Philatelic Deposit Accounts.",
          },
          {
            term: "Philatelic counter",
            meaning:
              "Found at head post offices, about 1,100 of them. It sells philatelic items but cannot issue a special cancellation.",
          },
          {
            term: "First Day Cover",
            meaning:
              "An envelope with a new stamp, cancelled on the day that stamp was issued.",
          },
          {
            term: "Special cancellation",
            meaning:
              "A one-off postmark for an event or stamp release. It is available for a short time, and only at named offices.",
          },
          {
            term: "Pictorial cancellation",
            meaning:
              "A postmark with a picture of a place or theme, such as a temple or a fort.",
          },
        ],
      },
      {
        type: "link",
        text: "More: see the Karnataka Philately Passport, the booklet behind the trail",
        href: "/karnataka-philately-passport",
      },
    ],
    sources: [INDIA_POST_PHILATELY, INDIA_POST_HISTORY],
    next: {
      label: "Next: pictorial postmarks explained",
      href: "/learn/pictorial-postmarks",
    },
  },
  {
    slug: "pictorial-postmarks",
    title: "Pictorial postmarks (PPC) explained",
    summary: "What a Permanent Pictorial Cancellation is, and how to get one.",
    minutes: 3,
    blocks: [
      {
        type: "p",
        text: "A pictorial cancellation is a postmark with a picture of a place or theme. A Permanent Pictorial Cancellation, or PPC, stays at a post office for good, usually near a heritage, tourist or nature site.",
      },
      { type: "h2", text: "A short history" },
      {
        type: "p",
        text: "India Post began permanent pictorial cancellations in 1951. A second phase started on 1 January 1965, with early examples at Sanchi, Ajanta, Ellora, Khajuraho and Mahabalipuram. In Karnataka, a letter box at the Somnathpur heritage site gives letters the Kesava temple postmark.",
      },
      { type: "h2", text: "PPC or special cancellation?" },
      {
        type: "ul",
        items: [
          "A PPC is permanent. You can get it on any day the office is open.",
          "A special cancellation is for a single event or stamp release. It is available for a short time, and only at named offices.",
        ],
      },
      { type: "h2", text: "How to get one" },
      {
        type: "p",
        text: "Ask the staff at the post office to apply it. A spoken request is enough, but your mail must carry the right stamps. It works on postcards and inland letters too.",
      },
      {
        type: "p",
        text: "Not every Philately Passport location has been confirmed as a PPC site, so we call the postmarks you collect postmarks, and use PPC only where it is known.",
      },
      {
        type: "link",
        text: "More: how the Karnataka Philately Passport puts these postmarks on a route",
        href: "/karnataka-philately-passport",
      },
    ],
    sources: [FORUM_PPC, FORUM_PPC_KARNATAKA, DECCAN_HERALD_PPC],
    next: {
      label: "Next: how the Philately Passport works",
      href: "/learn/how-the-passport-works",
    },
  },
  {
    slug: "how-the-passport-works",
    title: "How the Philately Passport works",
    summary: "A booklet, 100 places and a postmark from each.",
    minutes: 3,
    blocks: [
      {
        type: "p",
        text: "The Philately Passport is a pocket-sized booklet from Karnataka Postal Circle. It gives short notes on 100 places in Karnataka, with a facing page for each one. Reports put the price at ₹600.",
      },
      { type: "h2", text: "Step by step" },
      {
        type: "ol",
        items: [
          "Buy the booklet at a participating head post office or Philatelic Bureau.",
          "Travel to a place listed inside and find its post office.",
          "Buy a postage stamp and stick it on that place's facing page.",
          "Ask the staff to cancel it with the place's pictorial postmark. Reports say the mark also carries the date of your visit.",
          "Move on to the next place.",
        ],
      },
      { type: "h2", text: "Good to know" },
      {
        type: "ul",
        items: [
          "Each postmark is available only at its own post office, so you have to go there.",
          "The booklet's own pages are the final word on how it works. Check them for any rules or deadlines.",
        ],
      },
      { type: "h2", text: "Where Philatrail fits" },
      {
        type: "p",
        text: "Philatrail is an independent app that goes with the booklet. It shows the 100 post offices on a map, helps you plan trips and keeps count of the postmarks you have collected. It does not replace the booklet, and a tap in the app is not an official stamp.",
      },
      {
        type: "link",
        text: "Browse all 100 post offices by district",
        href: "/offices",
      },
    ],
    sources: [NEWS_KARNATAKA, THE_WEEK, HANS_INDIA],
    next: {
      label: "Next: where to get the booklet",
      href: "/learn/get-the-booklet",
    },
  },
  {
    slug: "get-the-booklet",
    title: "Where to get the booklet",
    summary: "Four places that sell it, and who to ask first.",
    minutes: 2,
    blocks: [
      {
        type: "p",
        text: "The booklet costs about ₹600 and is sold by Karnataka Postal Circle. It was reported on sale at these four post offices. Copies have sold out within hours in past rounds, according to news reports, so call or write before you travel.",
      },
      { type: "outlets" },
      { type: "h2", text: "Who to ask" },
      { type: "bureau" },
      {
        type: "link",
        text: "See the district-by-district list of all 100 offices",
        href: "/offices",
      },
    ],
    sources: [NEWS_KARNATAKA, THE_WEEK],
    next: {
      label: "Next: getting your postmark at the counter",
      href: "/learn/at-the-counter",
    },
  },
  {
    slug: "at-the-counter",
    title: "Getting your postmark at the counter",
    summary: "What to bring, what to say, and what to check before you leave.",
    minutes: 2,
    blocks: [
      {
        type: "p",
        text: "A little preparation makes this quick and easy for you and for the staff.",
      },
      { type: "h2", text: "Before you go" },
      {
        type: "ul",
        items: [
          "Carry your booklet, and open it to that place's page.",
          "Check the opening hours, or call the office first.",
        ],
      },
      { type: "h2", text: "At the counter" },
      {
        type: "ol",
        items: [
          "Buy a postage stamp.",
          "Stick it on the facing page for that place.",
          "Ask politely for the place's pictorial postmark. A spoken request is enough.",
          "Check the mark before you leave: the place name should be clear, and reports say it carries the date.",
        ],
      },
      { type: "h2", text: "Then, in the app" },
      {
        type: "p",
        text: "Open the office in Philatrail and tap Stamp it, so your passport on the phone matches the one in your bag.",
      },
      {
        type: "link",
        text: "Full overview: the Karnataka Philately Passport",
        href: "/karnataka-philately-passport",
      },
    ],
    sources: [DECCAN_HERALD_PPC, NEWS_KARNATAKA],
    next: { label: "Open the map", href: "/explore" },
  },
  {
    slug: "how-the-tamil-nadu-philately-passport-works",
    title: "How the Tamil Nadu Philately Passport works",
    summary: "A booklet, 58 places and a dated postmark from each.",
    minutes: 3,
    blocks: [
      {
        type: "p",
        text: "The Tamil Nadu Philately Passport is a booklet from Tamil Nadu Postal Circle, launched on 28 October 2026. It covers 58 locations, among them historic places and heritage post office buildings. News reports put the price at ₹650.",
      },
      { type: "h2", text: "What it is" },
      {
        type: "p",
        text: "The booklet brings together the circle's existing Permanent Pictorial Cancellations (PPCs). Each is a postmark with a picture linked to its place. At every office you collect a dated impression as a record of your visit, and the aim is to visit all 58 locations.",
      },
      { type: "h2", text: "Step by step" },
      {
        type: "ol",
        items: [
          "Buy the booklet at a Philatelic Bureau.",
          "Pick a place from the booklet and travel to its post office.",
          "Ask for that place's pictorial postmark and have it struck in your booklet.",
          "Check that the place name and the date are clear before you leave.",
        ],
      },
      { type: "h2", text: "Good to know" },
      {
        type: "ul",
        items: [
          "Each postmark is available only at its own post office, so you have to go there.",
          "The booklet's own pages are the final word on how it works. Check them for any rules, such as whether to stick a stamp first.",
          "The postal circle has said more locations may follow, depending on public response.",
        ],
      },
      { type: "h2", text: "Where Philatrail fits" },
      {
        type: "p",
        text: "Philatrail is an independent app that goes with the booklet. It shows the 58 post offices on a map, helps you plan trips and keeps count of the postmarks you have collected. It does not replace the booklet, and a tap in the app is not an official stamp.",
      },
      {
        type: "link",
        text: "Full overview: the Tamil Nadu Philately Passport",
        href: "/tamil-nadu-philately-passport",
      },
    ],
    sources: [DT_NEXT_TN, LIVECHENNAI_TN],
    next: {
      label: "Next: where to get the Tamil Nadu booklet",
      href: "/learn/get-the-tamil-nadu-philately-passport",
    },
  },
  {
    slug: "get-the-tamil-nadu-philately-passport",
    title: "Where to get the Tamil Nadu Philately Passport",
    summary: "The price, where it is sold, and why to call ahead.",
    minutes: 2,
    blocks: [
      {
        type: "p",
        text: "News reports put the Tamil Nadu Philately Passport at ₹650. It is sold at the Philatelic Bureau at Anna Salai Head Post Office in Chennai, which one report also calls the Anna Road Philatelic Bureau.",
      },
      { type: "h2", text: "Other bureaus" },
      {
        type: "p",
        text: "Another report says the Philately Passport was introduced at the Philatelic Bureaus in Chennai, Coimbatore, Madurai, Tiruchirappalli and Puducherry. It does not spell out which of them sell the booklet, so ask the bureau you plan to visit.",
      },
      { type: "h2", text: "Before you go" },
      {
        type: "ul",
        items: [
          "Call the bureau to confirm that copies are in stock.",
          "Ask the price and the opening hours.",
          "Carry cash or ask which payments they accept.",
        ],
      },
      {
        type: "p",
        text: "Prices and sales points can change, so treat this page as a starting point and trust what the post office tells you.",
      },
      {
        type: "link",
        text: "See all 58 post offices in the Tamil Nadu Philately Passport",
        href: "/tamil-nadu-philately-passport/post-offices",
      },
    ],
    sources: [DT_NEXT_TN, LIVECHENNAI_TN],
    next: {
      label: "Next: Tamil Nadu's pictorial postmarks",
      href: "/learn/tamil-nadu-pictorial-postmarks",
    },
  },
  {
    slug: "tamil-nadu-pictorial-postmarks",
    title: "Tamil Nadu's pictorial postmarks",
    summary: "What the 58 postmarks are and where the official list lives.",
    minutes: 2,
    blocks: [
      {
        type: "p",
        text: "A Permanent Pictorial Cancellation (PPC) is a postmark with a picture of a place, kept permanently at a post office near a heritage, tourist or nature site. The Tamil Nadu Philately Passport gathers the circle's existing PPCs, 58 in all, into one booklet.",
      },
      { type: "h2", text: "What you will find" },
      {
        type: "p",
        text: "The postmarks sit at offices across the state, from Chennai and Mamallapuram to Madurai, Thanjavur, Rameswaram and Kanniyakumari. The circle's official list describes what each design shows. For Mamallapuram, for example, the list says the cancellation depicts the Shore Temple.",
      },
      { type: "h2", text: "Check the official list" },
      {
        type: "p",
        text: "Tamil Nadu Postal Circle publishes its list of pictorial cancellations on its website, under its philately pages. It is the best place to confirm an office and its design before you travel.",
      },
      {
        type: "link",
        text: "Browse all 58 offices by district",
        href: "/tamil-nadu-philately-passport/post-offices",
      },
    ],
    sources: [TN_POSTAL_PPC_LIST, DT_NEXT_TN],
    next: { label: "Open the map", href: "/explore" },
  },
  {
    slug: "philately-passport-app",
    title: "Is there an app for the Philately Passport?",
    summary:
      "Yes: a free, independent map and tracker for Karnataka and Tamil Nadu.",
    minutes: 1,
    blocks: [
      {
        type: "p",
        text: "Yes. Philatrail is a free, independent map and tracker for the Philately Passport. It covers the 100 post offices of the Karnataka Philately Passport and the 58 of the Tamil Nadu Philately Passport.",
      },
      { type: "h2", text: "What it does" },
      {
        type: "ul",
        items: [
          "Shows every office in the booklet on a map.",
          "Helps you plan your next visit and see which offices are nearby.",
          "Keeps count of the postmarks you have collected.",
          "Works without an account.",
        ],
      },
      { type: "h2", text: "What it does not do" },
      {
        type: "p",
        text: "It does not replace the booklet and it does not issue postmarks. You still collect each postmark in person at the post office. Philatrail is independent: India Post and the postal circles did not make it and do not run it.",
      },
      {
        type: "link",
        text: "Karnataka: all 100 post offices",
        href: "/karnataka-philately-passport/post-offices",
      },
      {
        type: "link",
        text: "Tamil Nadu: all 58 post offices",
        href: "/tamil-nadu-philately-passport/post-offices",
      },
    ],
    sources: [THE_WEEK, DT_NEXT_TN],
    next: { label: "Open the map", href: "/explore" },
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

/** The share card shown when a Learn link is pasted into a chat. */
export const LEARN_OG_IMAGE = {
  url: "/og/learn.png",
  width: 1200,
  height: 630,
  alt: "Learn about philately: short reads on stamps, postmarks and the Philately Passport",
};
