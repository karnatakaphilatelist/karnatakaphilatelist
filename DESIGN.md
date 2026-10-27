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
| `postal` | `#d63a2b` | Primary button fill, unvisited pins, accents. White text on it is 4.7:1 |
| `postal-dark` | `#b92d20` | Red text and links (5.6:1 on paper). Never use `postal` for small text |
| `postal-soft` | `#fdecea` | Tinted badge background |
| `coral` | `#e8583a` | Large decorative blocks only (behind stamp artwork). Never carries text |
| `visited` | `#17794b` | Visited status. Text version `visited-ink` `#14653f` |
| `planned` | `#ffc94d` | Planned status. Text version `planned-ink` `#6b4b00` |
| `focus` | `#1b73b3` | Keyboard focus ring |

Rules: indigo replaces black everywhere. Red is an accent, not a surface (one red button per
view). Status is never shown by colour alone: pins and badges also change icon or label.

## Typography

- Display: **Bricolage Grotesque** (variable) for headings, stamp numerals and the logo word-mark.
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
