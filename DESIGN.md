# Design system: Karnataka Philatelic Passport

Direction: **classic printed stamp**. Cream paper, deep indigo ink, one postal-red accent.
Vintage details (perforated edges, postmarks, paper grain) appear only on the collectible
things: stamps, the passport, the "stamped" moment. Everything functional (map, search,
forms, buttons) stays plain, light and roomy.

Basis: the person's two reference images (a scalloped-edge postcard layout and a two-colour
printed stamp poster) and the existing app. Not based on a comparison of live websites (the
UXKIN library was not connected). Do not copy the reference artwork itself; use the ideas
(perforation, two-colour print, postmark).

Light theme only. The site has no dark mode.

## Colour

| Token | Value | Role |
|---|---|---|
| `paper` | `#fbf5e9` | Page background |
| `sand` | `#f3ead8` | Raised or quiet surfaces, list thumbnails |
| `card` | `#ffffff` | Cards and dialogs that sit on paper |
| `ink` | `#1c2b6b` | **All body text and headings** (indigo). 12.0:1 on paper |
| `ink-soft` | `#4b5380` | Secondary text. 6.8:1 on paper, 6.2:1 on sand |
| `line` | `#e6d9bf` | Hairlines |
| `line-strong` | `#d2c3a3` | Input borders |
| `postal` | `#cf1830` | Primary button fill, unvisited pins, accents, the landing page. White text on it is 5.9:1 |
| `postal-dark` | `#a8122a` | Red text and links. Never use `postal` for small text |
| `postal-soft` | `#f9e6e6` | Tinted badge background |
| `coral` | `#e8583a` | Large decorative blocks only (behind stamp artwork). Never carries text |
| `visited` | `#17794b` | Visited status. Text version `visited-ink` `#14653f` |
| `planned` | `#ffc94d` | Planned status. Text version `planned-ink` `#6b4b00` |
| `focus` | `#1b73b3` | Keyboard focus ring |

Rules: indigo replaces black everywhere. Red is an accent, not a surface (one red button per
view). Status is never shown by colour alone: pins and badges also change icon or label.

## Typography

- Display: **Fraunces** (variable, italic for accents such as "one stamp at a time.") for headings and stamp numerals. The PHILATELIST word-mark on the landing page is a PNG mask (`public/brand/wordmark*.png`).
- Text: **Figtree** (variable) for everything else. **Noto Sans Kannada** is in both stacks as the
  fallback for Kannada text.
- Scale (size / line height): 12/16 caption, 14/20 small, 16/24 body, 18/28 lead, 22/28 h3,
  30/36 h2, 44/48 h1 (mobile 34/38), 64/64 hero (mobile 44/46).
- Weights: 400 body, 600 labels and buttons, 700 headings, 800 hero only.
- Body 16px minimum. Reading width 60 to 70 characters (`max-w-prose`).
- Hero headline uses tight tracking (`-0.02em`); everything else normal.

## Spacing and layout

- 4px base. Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Page gutter 16px on phones, 24px from 768px. Content width 1120px (`max-w-6xl` is fine).
- Section spacing: 64px on phones, 96px from 768px. Layouts are left-aligned and asymmetric;
  do not centre every section.
- Tap targets at least 44px.

## Shape and depth

- Radius: 8 (inputs, small chips), 16 (cards, dialogs), 9999 (buttons and filter chips).
- One shadow, for floating things only (toast, map controls): `0 2px 8px rgb(28 43 107 / 0.18)`.
  Cards use a 1px `line` border instead of a shadow.
- **Perforation** (signature detail): a scalloped edge made with a repeating radial-gradient
  mask, 10px pitch, 3px notches. Used on stamp cards, the hero stamp, the passport stamp grid
  and the sign-in dialog. Never on buttons, inputs or the map.
- **Paper grain**: a very faint noise (max 4% opacity) on the page background only.
- **Postmark**: a circular double-ring date stamp in `ink` at 70% opacity, rotated -8 to 8
  degrees. Appears on a stamp when its post office is marked visited (uses the existing
  `thump` animation).

## Components

- **Primary button**: `postal` fill, white text, 600, full pill, min height 52px. Hover
  `postal-dark`. Focus: 3px `focus` ring with 2px offset. Disabled: 60% opacity.
- **Secondary button**: white fill, 1.5px `line-strong` border, `ink` text, pill.
- **Quiet button / link**: `postal-dark` text, underline on hover, no fill.
- **Input**: 48px high, 8px radius, `line-strong` border, `card` fill; label above, always visible.
- **Card**: `card` fill, 16px radius, 1px `line` border, 16 to 24px padding.
- **Stamp card**: card with perforated edge, `sand` inner panel for the artwork, post office
  name in display type, district and pincode in `ink-soft`.
- **Status badge**: pill, soft tint background plus text (`Not visited` red, `Planned` gold,
  `Visited` green with a check).
- **Header**: white bar, 64px, logo mark (postal-red perforated square with envelope), word-mark
  in display type, nav pills (active = `postal-soft` with `postal-dark` text).
- **Footer**: `sand` background, links to Explore, Passport, Privacy, Terms, contact address,
  and the disclaimer text below.
- **Map**: cream and indigo styled tiles, fitted to Karnataka. Pins are small perforated
  stamp squares (unvisited: white with red envelope; planned: gold; visited: green with check).

## Imagery and icons

- Icons: the existing inline SVG set (stroke 1.75, rounded caps). No emoji.
- Illustration: only stamp-style artwork made for this project. Real stamp photos from the
  user's scans will go in the stamp grid later. No stock photos, no gradients on text.
- Texture and perforation are CSS only, so there are no extra image downloads.

## Disclaimer wording (used in footer and on the About/landing page)

"Karnataka Philatelic Passport is an independent project. It is not run, endorsed or sponsored
by India Post or the Government of Karnataka. India Post and related names belong to their
owners."

## Tagline

"Namma Karnataka, one stamp at a time."

## Landing page (`/`) and the app

`/` is a full-screen front door with no app header. First visit in a session: red screen, a
postcard glides along a dashed line (counter 000 to the number of post offices), drops into a
post box, the screen splits open and the page appears. It plays once per session, is skipped
for `prefers-reduced-motion`, has a Skip button, and ends itself after 7 seconds or three
janky frames in a row so a slow browser is never stuck on the red screen.

After the intro: the crimson PHILATELIST wordmark (vector, used as a CSS mask), then seven
cream cards that slide sideways as the page scrolls (scroll-driven `--p`, 0 to 1 across the
whole scroll, no dead zone): welcome, progress sample, Find, Visit, Stamp, a mini map, and the
disclaimer. Moving between cards:

- Hover the left or right screen edge (desktop only) to reveal a round arrow, centred on the
  cards; click to step. Arrows step by scroll position, so they work at the end of the track.
- Ticks under the cards are 44px touch targets and jump to a card.
- Arrow keys step too (ignored while typing); swipe left or right on touch screens.
- Cards scrolled out of sight are `inert`, so Tab never lands on something hidden.
- One standalone "Open the map" pill sits under the ticks. It is the only such button on
  the page; the hero button says "See how it works" and scrolls to the steps.

The rest of the app matches: the header uses the same crimson wordmark, Passport shows the
stamp count in italic crimson Fraunces inside outlined 18px cards, links and accents are
crimson, buttons are pills, map pins are small round dots and nearby offices merge into
numbered bubbles (all stamped: green, some stamped: half green, none: indigo).

## Passwords

Sign-in is Google, email and password, or an emailed one-time link. "Forgot password" sends a
reset email that lands on `/account/password`, where a signed-in person sets or changes a
password. That page is also linked from the header and the Passport page. The auth callback
accepts both `code` links (same browser only) and `token_hash` links (any browser; needs a
custom email template, which needs custom SMTP in Supabase).

## States

The passport is multi-state. `post_offices.state_code` holds the code (KA, TN, ...). Explore and
Passport show a state switcher (also lists states that are "coming soon"); the choice is kept on the
device. Progress, totals and the map are per state. The landing page is national: "every post office
in India", with the selected state shown in the sample progress card and stamp art.

## Phones and the mobile apps

Phones get their own patterns rather than a squeezed desktop layout:
- **Explore is map-first.** The map fills the screen with a floating search and horizontally
  scrolling status chips on top. The list is a bottom sheet with a grab bar: a peek state (state
  switcher, count, Near me) and an open state (64% of the height); tap or drag the bar. Selecting
  an office swaps the list for the office sheet. No +/- zoom buttons (pinch instead).
- **Bottom tab bar** with Explore, Passport and Account (thumb reach). The header is slim (56px);
  desktop keeps the full header and puts Password and Sign out there.
- **Account tab** holds sign-in, password, share, welcome tour, privacy, terms, contact and the disclaimer.
- **Mobile apps open on the map.** The welcome page is a first-launch tour; later launches go
  straight to Explore (`/?tour=1` replays it from Account).
- Touch: 44px targets, 16px inputs, no tap flash or double-tap delay, no rubber-banding, safe-area
  insets for the notch and home bar (see docs/MOBILE.md).
