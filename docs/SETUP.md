# Karnataka Philatelic Passport: developer setup

A Next.js (App Router) + TypeScript app backed by Supabase. Visitors browse every
passport post office on a map without signing in, mark the ones they have visited,
and track progress on their passport page.

## Run it locally

Requires Node 22 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and publishable key
npm run dev                  # http://localhost:3000
```

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the dev server                          |
| `npm run build`     | Production build                              |
| `npm run lint`      | ESLint                                        |
| `npm run typecheck` | Generate route types, then run `tsc --noEmit` |
| `npm test`          | Run the Vitest suite once                     |

## Supabase setup

1. **Post offices.** The app reads the `post_offices` table: `id`, `name`, `pincode`,
   `district`, `lat`, `lng`. It needs public (anon) `select` access through row level
   security. After editing the table, the app refreshes its cached copy within an hour.
2. **Visits and photos.** Run
   `supabase/migrations/20261011000000_visits_and_stamp_photos.sql` in the Supabase SQL
   editor (or with `supabase db push`). It creates the `visits` table, the private
   `stamp-photos` storage bucket, and the row level security policies that keep every
   user's data their own.
3. **Stamp images (optional).** Run
   `supabase/migrations/20261011010000_post_office_stamp_images.sql`. It adds
   `post_offices.stamp_image_path` and a public `office-stamps` bucket. Upload each stamp
   photo (square, about 512px, WebP or PNG) named by post office id, e.g. `123.webp`, then set
   that file name in `stamp_image_path`. Post offices without one keep the mail icon, and the
   app works before this migration is run. After editing, the cached list refreshes within
   an hour. Stamps show in greyscale until the post office is visited.
4. **User profiles.** Run `supabase/migrations/20261018000000_profiles.sql`. It creates
   `public.profiles` and a trigger so every new person who signs up (Google or email) gets a
   profile row automatically with their name, email and photo, and it fills in anyone who
   already signed up. The trigger can never block a signup. View all users under Table
   Editor, then `profiles` (or Authentication, then Users).
5. **Sign-in.** In Supabase, go to Authentication:
   - Providers: enable **Google** (add your Google OAuth client ID and secret).
   - URL Configuration: set the **Site URL** to your production URL and add
     `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`
     to **Redirect URLs**.
   - Email sign-in links work out of the box once the redirect URLs are set.
   - Email and password: enabled by default under Providers, Email. Decide **Confirm email**:
     on means new people must click a link before they can sign in (needs working email
     delivery: Supabase's built-in sender allows only a few emails per hour, so set up custom
     SMTP first); off lets people sign up and start straight away. The app handles both.
   - The "Forgot password? Email me a sign-in link" button uses the same email delivery.
     Editing email templates also needs custom SMTP, so the default templates are used.
   - The sign-in dialog checks `/auth/v1/settings` and hides the Google button, with an
     explanation, while the Google provider is switched off.
   - Google Cloud Console: the OAuth client's authorized redirect URI is
     `https://<project-ref>.supabase.co/auth/v1/callback`. To let anyone (not just test
     users) sign in, publish the app (Branding, then Audience). The privacy policy and
     terms live at `/privacy` and `/terms`; have a person review that text (contact
     address and date are in `src/lib/constants.ts`).
6. **Run the migrations in order**: visits_and_stamp_photos, post_office_stamp_images,
   profiles. They are safe to re-run.

## How it is organised

```
src/
  app/                    Routes: / (explore), /passport, /auth/callback, error boundary
  components/
    auth/                 Sign-in dialog, header button, guest sign-in prompt
    explore/              Search, filters, office list, the explore screen
    layout/               App shell, header, mobile tab bar
    map/                  Leaflet map (client-only), pin icons
    office/               Office detail card, visit dialog (note, photo, privacy)
    passport/             Progress ring, district progress, visited cards
    providers/            Auth, visits and toast context providers
    ui/                   Shared primitives: icons, bottom-sheet dialog
  hooks/                  Reusable hooks
  lib/                    Supabase clients, data access, geo maths, constants
  types/                  Shared domain types
supabase/migrations/      Database schema, versioned as SQL
```

### Key decisions

- **Office list is cached on the server** (`lib/offices.ts`, `use cache`), because it
  rarely changes. Anything that depends on the signed-in user is loaded in the browser.
- **Guests can mark visits without an account.** Their progress is kept in the browser
  and merged into their account the first time they sign in. After three stamps they are
  invited to sign in once.
- **Photos are private.** They live in a private storage bucket under the user's own
  folder, are compressed in the browser before upload, and are shown through short-lived
  signed URLs.
- **The map is Leaflet with OpenStreetMap tiles** (free, no API key). The map lives
  behind `components/map/` so it can be replaced later without touching the rest.
- **"Planned" offices are stored on the device only** for now.

## Operations notes

- **Bundled post office list.** `src/data/post-offices.snapshot.json` is used only when
  the database cannot be reached (for example a paused free project), so builds and page
  views do not fail; it is cached for minutes instead of hours. Refresh it after editing
  the table by exporting `id, name, pincode, district, lat, lng` as JSON.
- **Free Supabase projects pause** after about a week without activity. `vercel.json`
  schedules a daily call to `/api/keep-alive`, which runs one small query so the project
  stays awake. Optionally set `CRON_SECRET` in Vercel so only the scheduler can call it.
  Check Vercel, Cron Jobs, to see it running.
- **Deleting a user** removes their rows but not their files in the `stamp-photos`
  bucket; delete the `<user id>/` folder too.
- **Data quality:** migration `20261027000000_fix_district_spellings.sql` corrected three
  district spellings. Post office names are left as India Post spells them (for example
  "kalaburgi ho"); the app only tidies capitalisation.
- Next.js is pinned to 16.4.3 (earlier 16.x releases have published security advisories).

## Known limitations

- The Supabase API returns at most 1,000 rows per request. If the passport list ever
  exceeds that, `getPostOffices` needs to page through results.
- The OpenStreetMap tile servers are for light use. Move to a hosted tile provider
  before traffic grows.
- Public visits are stored and readable by policy, but no public profile or community
  gallery page exists yet.
