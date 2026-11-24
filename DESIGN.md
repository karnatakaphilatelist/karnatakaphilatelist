# Design system: Karnataka Philatelic Passport

> **Rule: the shipped code is the source of truth.** When this document and `globals.css` / `landing.css` / component
> classNames disagree, the code wins — fix this document to match the code, never the other way round. The two
> blocks below were reconciled against the live code in Nov 2026 after drifting out of sync.

> **Live in code (Nov 2026).** Cream and white frosted glass (`blur(28px) saturate(180%)`, see `.kp-glass-panel` in
> `globals.css`) with a bright top edge. Headlines are set in `--font-display` (**Fraunces Variable**, weight 500) —
> this is the actual shipped font on legal pages, settings, contact, Learn, the offices directory and both state
> passport pages, and even inside `landing.css` itself; there is no Figtree-only headline treatment live anywhere
> today, despite an earlier version of this note claiming one. Postal details (pincode, distance, dates) use
> `--font-mono` (Courier Prime). Red `#cf1830` (`--color-postal`) is the main button/avatar/locate-icon/active-tab
> accent; green `#17794b` (`--color-visited`) always means stamped; `#ffc94d` (`--color-planned`) means planned.
> Source boards: the "Design" canvas artifact, boards prefixed `D-` — treat those as historical direction, not as
> the current token values; the table below is what's actually shipped.


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

Corrected to match `--color-*` in `src/app/globals.css` exactly (this table previously drifted from the shipped
values — see the rule above).

| Token | CSS variable | Value | Role |
|---|---|---|---|
| `paper` | `--color-paper` | `#fbf3e2` | Page background |
| `sand` | `--color-sand` | `#f1e8d3` | Raised or quiet surfaces, list thumbnails |
| `card` | `--color-card` | `#ffffff` | Cards and dialogs that sit on paper |
| `ink` | `--color-ink` | `#16204f` | **All body text and headings** (indigo) |
| `muted` | `--color-muted` | `#5d6283` | Secondary text |
| `line` | `--color-line` | `#e6dcc3` | Hairlines |
| `line-strong` | `--color-line-strong` | `#d9cfb6` | Input borders |
| `postal` | `--color-postal` | `#cf1830` | Primary button fill, unvisited pins, accents, the landing page |
| `postal-dark` | `--color-postal-dark` | `#a8122a` | Red text and links. About 4.9:1 on paper — never use `postal` for small text |
| `postal-soft` | `--color-postal-soft` | `#fbe7ea` | Tinted badge background |
| `coral` | `--color-coral` | `#e8583a` | Large decorative blocks only (behind stamp artwork). Never carries text |
| `visited` | `--color-visited` | `#17794b` | Visited status. Soft bg `visited-soft` `#ddf3e7`, text `visited-ink` `#14653f` |
| `planned` | `--color-planned` | `#ffc94d` | Planned status. Soft bg `planned-soft` `#fff1c7`, text `planned-ink` `#6b4b00` |
| `warn` | `--color-warn` | `#8a4306` | Warning text. Soft bg `warn-soft` `#fdebd3` |
| `focus` | `--color-focus` | `#16204f` | Focus ring |
| `focus` | `#1b73b3` | Keyboard focus ring |

Rules: indigo replaces black everywhere. Red is an accent, not a surface (one red button per
view). Status is never shown by colour alone: pins and badges also change icon or label.

## Typography

- Display: **Fraunces** (variable, italic for accents such as "one stamp at a time.") for headings and stamp numerals. The PHILATRAIL word-mark on the landing page is a PNG mask (`public/brand/wordmark*.png`).
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

After the intro: the crimson PHILATRAIL wordmark (vector, used as a CSS mask), then seven
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
- **Bottom tab bar** with Explore, Passport and Account (thumb reach). `AppHeader` is `hidden` below
  the `md:` breakpoint — phones get no header at all, only the tab bar; desktop keeps the full
  64px header and puts Password and Sign out there. (An earlier version of this note claimed phones
  get their own slim 56px header; that never shipped — corrected per the "code wins" rule above.)
- **Account tab** holds sign-in, password, share, welcome tour, privacy, terms, contact and the disclaimer.
- **Mobile apps open on the map.** First launch shows the 3-step welcome tour (`/welcome`); later
  launches go straight to Explore. Account > Welcome tour replays it.
- **Palette balance.** Cream paper, navy ink; postal red (`#cf1830`) only on the intro, the Passport
  and guest-account heroes, primary buttons and the active tab. Red surfaces use `.kp-red`
  (engraved guilloche texture). Warnings and errors are amber (`--color-warn`) with an icon and words,
  never a red fill. Visited stays green, always with a check.
- **Stamp it** never blocks: a banner says whether you are at the office (within 150 m) or far away,
  and past visits can still be logged. After stamping, a "Stamped!" sheet confirms it.
- **Location** is explained in a sheet before the first system prompt; a "Location is off" sheet
  explains how to re-enable it.
- Touch: 44px targets, 16px inputs, no tap flash or double-tap delay, no rubber-banding, safe-area
  insets for the notch and home bar (see docs/MOBILE.md).

## Standing conventions (enforced in the Nov 2026 sanity sweep)

These are the concrete rules the codebase already follows; new components should match them
rather than inventing a new pattern. Found violations were fixed in place rather than listed here
as outstanding — this section documents the convention itself.

1. **Safe-area insets.** Any `fixed`/`sticky` element docked to a screen edge (toasts, floating
   nudges, bottom sheets, the tab bar, floating controls/FABs) pads that edge with
   `env(safe-area-inset-*)`, typically as `calc(<base> + env(safe-area-inset-bottom,0px))` in an
   arbitrary Tailwind value. This applies everywhere, not just inside the native app: `viewportFit:
   "cover"` is set globally in `src/app/layout.tsx`, so the insets are live on mobile web too,
   including components explicitly gated to web-only via `isNativeApp()`.
2. **Floating-UI z-index scale.** Ascending, and every new floating element should land on an
   existing step rather than inventing a number: `1050` (Explore's list sheet) < `1100` (floating
   controls, search bar, locate-me FAB, the OfficeDetail panel) < `1150` (a sheet's own nested
   scrim) < `1200` (a sheet opened on top of another, e.g. ContributeSheet over OfficeDetail) <
   `2000` (WebSignInNudge) < `3000` (ToastProvider, CoachTour — always topmost). Toasts specifically
   use the Popover API (`popover="manual"`) to escape the native `<dialog>`'s top-layer stacking,
   since no z-index climbs above it.
3. **Every declared optional prop must be read somewhere in the component body.** An optional prop
   that's accepted but never consulted is dead API surface; delete it or wire it up.
4. **Touch handling.** Global baseline in `globals.css`: `.native-app` (set on `<body>` by
   `AppShell` only inside the Capacitor wrapper) suppresses text selection, long-press callouts and
   the tap-highlight flash, re-enabled for `input`/`textarea`/`[contenteditable]`. Separately, and
   on both web and native, interactive elements (`button`, `a`, `select`, `summary`, `label`) get
   `touch-action: manipulation` and a transparent tap-highlight, `html` disables overscroll
   rubber-banding, and Leaflet's own elements get the same tap-highlight treatment. A custom
   drag gesture (e.g. the Explore list sheet's drag handle) must set `touch-none` on the draggable
   element so the browser doesn't fight the pointer events with its own scroll/pan gesture.
5. **Dialogs are bottom sheets on phones, centred cards on desktop**, built on the native
   `<dialog>` (`Sheet`/`HeroSheet` in `src/components/ui/`) or a custom `role="dialog"` panel
   docked with `absolute inset-x-0 bottom-0` (OfficeDetail, ContributeSheet). A plain centred
   full-screen `fixed inset-0` overlay is reserved for standalone flows that aren't "a dialog over
   the current screen" — the first-launch welcome tour and the coach-mark tour — not for anything
   that could instead be a sheet.
6. **Dialog open/close transitions.** Entrance is `animate-[rise_.25s_ease-out]` (or the `rise`
   keyframe/`--animate-rise` token); exit is the `fall` keyframe/`--animate-fall` token (`0.2s
   ease-in`). For a component driving its own open/closed div (OfficeDetail, ContributeSheet) this
   means a `closing` state that swaps the class and defers the actual unmount/`onClose` by the fall
   duration. For `Sheet`/`HeroSheet`, built on the native `<dialog>`, the same `closing` flag swaps
   the class and defers the imperative `dialog.close()` call by `200ms` (`FALL_DURATION_MS`) so the
   fall transition is visible before the browser removes the dialog from the top layer; both derive
   `closing` from a render-time comparison of `open` against its previous value (not inside a
   `useEffect`) to avoid a `setState`-in-effect lint error, and reserve the actual `useEffect` for
   the imperative `showModal()`/`close()` calls only.
7. **Design tokens.** Use the `--color-*` tokens in `globals.css` (exposed as Tailwind utilities —
   `text-ink`, `bg-ink/10`, `text-visited-ink`, etc., including with opacity modifiers) instead of
   a literal hex value wherever the color you want is one of them. This does not yet cover every
   color actually in use: a broader palette of accent colors (blues like `#2f4aa8`/`#243a8a`,
   `#1f8a4d` green, `#785a1e`/`#b8861b`/`#f7c96b` golds, `#e0334a` red, `#9a9fb5`/`#c7c7cc` grays,
   `#8f640f`) recurs consistently across many components but isn't captured as a token yet — those
   were left as-is rather than inventing new token names unilaterally. Worth noting for a future
   pass: `#1f8a4d` (not `--color-visited`'s `#17794b`) is the shade actually used for "visited"
   green in several places (e.g. `StatusBadge`), suggesting the token's value itself may be the
   stale one. Third-party brand/map colors (Google's G logo in `icons.tsx`, the Leaflet marker
   color in `OfficeMap.tsx`) are correctly left hardcoded and should stay that way.
