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
