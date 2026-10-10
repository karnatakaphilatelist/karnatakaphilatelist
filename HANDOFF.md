# Handoff: Karnataka Philatelic Passport

Context for a new Claude Code session picking this project up. Read `AGENTS.md` (Next.js version differs from older docs; check `node_modules/next/dist/docs/`) and `docs/SETUP.md` first.

## Product
Visitors browse every post office in the Karnataka philatelic passport book on a map, plan a day, and mark post offices as visited. Guests can mark visits without an account; after the 3rd stamp they are invited to sign in so progress is kept. Signed-in users can add a note and a stamp photo (private or public) per visit and track progress on `/passport`.

Always say "post offices", never just "offices" (user feedback: "offices" is confusing). Note: much of the code and many identifiers still say `office`; user-facing strings should be switched to "post offices".

## Decisions already made
- Next.js 16 App Router + TypeScript + Tailwind v4, in this repo.
- Supabase: existing table `post_office` (`id`, `name`, `pincode`, `district`, `lat`, `long`), plus new `visits` table and private `stamp-photos` bucket (see `supabase/migrations/`).
- Map: Leaflet + OpenStreetMap (free; billing for Google Maps is not possible for now). Map code is isolated in `src/components/map/` so it can be swapped.
- English first, structure ready for Kannada. Bright theme. Palette: postal red `#D63A2B`, visited green `#17794B`, planned gold `#FFC94D`, background `#FFFBF5`, ink `#2B2B2B`, muted `#6B6560`.
- Deferred past v1: leaderboards, district shading, public profile/gallery.
- "Planned" post offices are stored on the device only.

## State
- Branch `feat/nextjs-passport-app`, PR #1. Lint, typecheck, build and unit tests passed.
- **The UI has never been tested in a real browser** (Playwright could not download Chromium in the build environment). Expect rough edges. First job: run it and fix what you see.
- The live Supabase schema could not be inspected (network blocked); column types were inferred from the old `index.html`. Confirm `post_office.id` is `bigint` before running the migration, since `visits.post_office_id` references it.
- Still to do by the owner: run the migration, enable the Google provider, add `http://localhost:3000/auth/callback` (and the production URL) to Supabase Redirect URLs.

## Design prototype
Clickable design canvas (mobile and desktop): https://claude.ai/artifact/Rd59uogA4Fh22bjJGRCm9D. Design feedback already applied there that should also be reflected in the real app:
- Progress ring: percentage label centered on one line; count shown as a big number plus smaller "of N", caption "post offices stamped".
- Passport stamp grid: 4 columns, ~56px circles, small labels.
- Map pin name label is part of the clickable pin.
- The post office card closes automatically when the selected post office drops out of the active filter (Not visited / Planned / Visited).

## Next tasks
1. Run the app locally and fix visual or behavioural bugs (test at phone width).
2. Apply the design feedback above and the "post offices" wording to the real app.
3. Per-post-office stamp images (owner will photograph the stamps from the book):
   - Add nullable `stamp_image_path` to `post_office` and a public Storage bucket (e.g. `office-stamps`), files named by id (e.g. `123.webp`), square about 512px.
   - Show the stamp in the list thumbnail, map pin and detail card; fall back to the current icon when missing.
   - Unvisited stamps greyscale, full colour once visited. Keep the official stamp separate from a visitor's own stamp photo.
   - Confirm the owner is happy to publish the stamp artwork (own photos of the stamps are safest).
4. Deploy a Vercel preview from the PR.
