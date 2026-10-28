# Store submission kit

Working name **Philatelist** (placeholder brand, see HANDOFF.md). Everything here is copy-paste ready for Google Play Console and App Store Connect. Update the name, contact email and URLs in one pass once the brand is final.

## Assets (in `store/`)

| File | Use |
| --- | --- |
| `graphics/app-icon-1024.png` | App Store icon (1024x1024, no transparency) |
| `graphics/play-icon-512.png` | Google Play icon (512x512) |
| `graphics/play-feature-graphic-1024x500.png` | Google Play feature graphic |
| `ios/*.png` | App Store screenshots, 1290x2796 (6.9" display) |
| `android/*.png` | Play phone screenshots, 1080x2400 |

Screenshot order: 1 welcome, 2 explore map, 3 list sheet, 4 office detail, 5 passport, 6 account. They are captured with 12 sample guest visits. Retake them with real stamp scans once available. Apple needs 6.9" (or 6.5") screenshots; Play needs at least 2 phone screenshots. Tablet screenshots are only needed if you declare tablet support.

## Listing copy

**Name:** Philatelist (30 chars max on both stores)

**Subtitle (App Store, 30):** Stamp every post office

**Short description (Play, 80):** Collect a stamp from every post office in India. Map, passport, progress.

**Promotional text (App Store, 170):** Find post offices near you, mark the ones you have stamped and watch your passport fill up, state by state.

**Long description (4000):**

> Philatelist is a passport for India's post offices.
>
> Every post office has its own postmark. Philatelist helps you find them, visit them and keep a record of the stamps you collect.
>
> EXPLORE
> - A map of post offices with filters for visited, planned and not visited
> - Search by name, district or pincode
> - "Near me" to find the closest offices
> - Directions in your maps app with one tap
>
> COLLECT
> - Mark an office as visited and add a date, a note and a photo of your stamp
> - Plan the offices you want to visit next
> - Keep each visit private, or share your progress
>
> TRACK
> - Your passport shows progress for every state
> - See what is left, and what is next
> - Sign in to keep your passport on every device, or use the app as a guest
>
> Karnataka is available now. More states are on the way, starting with Tamil Nadu.
>
> Philatelist is an independent project. It is not run, endorsed or sponsored by India Post or any state or central government.

**Keywords (App Store, 100 chars, comma separated, no spaces):**
`philately,stamps,postmark,post office,india,passport,collector,travel,pincode,hobby`

**Category:** Primary Travel (or Lifestyle). Secondary Reference or Entertainment.

**Support URL / Marketing URL:** the live site. **Privacy policy URL:** `<site>/privacy`. **Terms:** `<site>/terms`.

**Contact email:** see `CONTACT_EMAIL` in `src/lib/constants.ts` (currently the Karnataka address; change at rename).

## Permissions and why (for review forms)

| Permission | Why |
| --- | --- |
| Location (while in use) | Only for "Near me", to sort and centre post offices around you. Never stored on our servers, never in the background. |
| Camera / Photos | Optional. To attach a photo of a stamp to a visit. |
| Internet | The app loads the post-office data and syncs signed-in accounts. |

iOS usage strings are already set in `ios/App/App/Info.plist`. The app does not use background location, notifications, contacts, microphone or advertising ID.

## Google Play: Data safety answers

Data collected and shared:

| Data type | Collected | Shared | Purpose | Optional |
| --- | --- | --- | --- | --- |
| Email address | Yes, only if you sign in | No | Account management | Yes (guest mode) |
| Name and profile photo (from Google sign-in) | Yes, only with Google sign-in | No | Account management, show your name | Yes |
| Photos (stamp photos you attach) | Yes, only for signed-in users who add one | No | App functionality | Yes |
| User content (visit notes, dates, planned/visited status) | Yes, signed-in users | No | App functionality | Yes |
| Approximate/precise location | **Not collected** (used on-device only for Near me) | No | n/a | n/a |

Other answers:
- Data encrypted in transit: **Yes** (HTTPS).
- Users can request deletion: **Yes**. In-app: Account tab, "Delete my account". This removes the profile, visits and photos.
- Account-deletion web URL (Play requires one): `<site>/account` (the Account page has the delete option) and `<site>/privacy` explains it. Replace with a dedicated page if Play asks for one.
- No data sold. No advertising. No analytics SDKs. No third-party data sharing beyond the processors needed to run the service (Supabase hosting, Vercel hosting, Google sign-in).
- Target audience: 13+ (general audience). Not designed for children, so no Families policy.
- Ads: **No**.

## Apple: App Privacy labels

- **Data linked to you** (only when signed in): Contact info (email address, name); User content (photos, other user content: notes and visit records); Identifiers (user ID).
- **Used for:** App functionality. Nothing for tracking, advertising or analytics.
- **Data used to track you:** None. No tracking, so no ATT prompt is needed.
- **Location:** not collected (processed on the device only).

## Age rating

Answer "None" to all content questions (violence, sexual content, profanity, horror, gambling, drugs, mature themes, medical). No unrestricted web access, no user-to-user chat, no user-generated content shown to other users unless the user chooses to share progress (shared as a link or text, not in-app feeds).

- Apple: expect **4+**.
- Google Play (IARC): expect **Everyone** (select "No" throughout; mention that users can share progress through the system share sheet).
- If a visit photo can be made public, state that photos are user-chosen and public sharing is off by default (visits are Private by default).

## App Review notes (paste into App Store Connect and the Play "App access" form)

> Philatelist works without an account. Open the app and tap through the welcome tour, then use Explore, the Passport tab and the Account tab. No login is needed to review any feature.
>
> Signing in is optional (Google, or email and password) and only syncs the passport across devices. If you want to test sign-in, a demo account is: `<create a demo email + password before submitting>`.
>
> Account deletion: Account tab, then "Delete my account" at the bottom, then confirm. This permanently deletes the profile, visits and photos.
>
> Location is only requested when tapping "Near me" and is not stored. Camera and photo access are only requested when attaching a stamp photo to a visit.
>
> The app is an independent project and is not affiliated with India Post or any government body (stated in the app footer and on the Account page).

Before submitting: create the demo account in Supabase Auth, put its credentials in the review form (not in this repo), and confirm Google sign-in works in the release build.

Apple review risk to watch: guideline 4.2 (minimum functionality / website wrapper). The app is a Capacitor shell around the site, but it has native camera, share, location and a native sign-in flow, plus a mobile-first UI. Mention these native features in the review notes if asked.

## Checklist before first submission

- [ ] Final brand name, app id, domain, contact email (single rename pass).
- [ ] Apple Developer Program ($99/yr) and Google Play Developer ($25 one-off) accounts.
- [ ] Signed Android release build (AAB) and iOS archive (needs a Mac or cloud Mac).
- [ ] Real stamp scans replacing the placeholder envelope art, then retake screenshots.
- [ ] Demo reviewer account created.
- [ ] Privacy and Terms text reviewed.
- [ ] Supabase redirect URLs include the final site and the app scheme link.
- [ ] Leaked password protection switched on in Supabase (Auth, Providers, Email).
