# Google Play Console: draft answers

Written from the code and the privacy policy on the date below. Re-check each answer against Play Console's
current wording before you submit; Google changes the forms. If the app changes, update this file.

Prepared 3 November 2026. App id `app.vinvi.philatrail`, name Philatrail.

## Set up your app

| Form | Answer |
| --- | --- |
| Privacy policy | `<site>/privacy` |
| App access | Not restricted: browsing, the map and stamping work without signing in. Signing in only syncs the passport across devices. |
| Ads | No ads |
| Target audience | Not designed for children. Choose 13+ (or 18+ if you prefer a stricter answer). |
| Content rating | No violence, sexual content, gambling or user-to-user chat. Users can add private notes and photos; public sharing of notes/photos exists in the database model, so answer the "user-generated content" question according to what the app shows to others today (nothing public is displayed in the app yet). |
| Government apps | Not a government app. Independent; says so in the app and in the store text. |
| Financial, health, news | None apply |
| Account deletion | Yes: Account > Delete my account (in-app). Give the same steps as the web URL if Play asks for one. |

## Data safety

**Is data collected or shared?** Collected: yes. Shared with third parties for their own use: no (service
providers only: Supabase for storage, Google for sign-in).

**Encrypted in transit:** yes (HTTPS). **Users can request deletion:** yes (in the app).

| Data type | Collected | Why | Optional | Notes |
| --- | --- | --- | --- | --- |
| Email address | Yes | Account management | Yes (guests need none) | Only after sign-in |
| Name | Yes | Account management | Yes | Only from Google sign-in |
| Profile photo / user ID | Yes | Account management | Yes | Google sign-in photo, account id |
| Photos | Yes | App functionality (stamp photos) | Yes | Private by default |
| Other user content (notes, visit dates) | Yes | App functionality | Yes | Private by default |
| Approximate or precise location | Processed on device only | App functionality ("Near me") | Yes | Not sent to the server or stored, per the privacy policy. Play counts data that leaves the device as "collected"; this does not leave it, so answer "not collected". Confirm this stays true. |
| App activity, diagnostics, ads ids | No | n/a | n/a | No analytics or ad SDKs |

Declared permissions in the Android app: internet, approximate and precise location (Near me), camera
(stamp photo). Each is requested at the moment of use, after an in-app explanation for location.

## Store listing

Use the copy in `docs/STORE.md`. Graphics are in `store/graphics`. Phone screenshots in `store/android` still
show the old design and name; retake them from the emulator (it has real map tiles).

## Closed testing (if your account type requires it)

Recruit about 12 testers from the philately community now. They must opt in and stay opted in for the full
period Console shows. Keep a list of their emails ready.
