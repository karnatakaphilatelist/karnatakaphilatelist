# Mobile apps (iOS and Android)

The apps are Capacitor shells around the live site (`capacitor.config.ts` -> `server.url`), so
every website release reaches both apps at once. `native-www/` is only the offline fallback page.

## What is native
- App id `com.karnatakaphilatelist.passport`, name "Philatelist", crimson stamp icon and splash
  (regenerate from `resources/` with `npx capacitor-assets generate`).
- Google sign-in opens the system browser (Google refuses embedded web views) and returns through
  `com.karnatakaphilatelist.passport://auth/callback`. Handled in `AuthProvider` + `src/lib/native.ts`.
- Location, camera and photo permissions are declared for "Near me" and stamp photos.

## One-time setup in Supabase
Authentication -> URL Configuration -> Redirect URLs: add `com.karnatakaphilatelist.passport://auth/callback`.

## Build
- Android: GitHub Actions "Android debug APK" (Actions tab -> Run workflow) uploads an installable
  `app-debug.apk`. Locally: `npx cap sync android && npx cap open android` (Android Studio).
- iOS: needs a Mac with Xcode. `npx cap sync ios && npx cap open ios`, set the signing team, run.
- Store release needs an Apple Developer account (USD 99/yr) and a Google Play account (USD 25 once),
  a release keystore for Android, privacy policy URL (`/privacy`) and store screenshots.

## Store review note
Apple can reject apps that are only a website in a wrapper. Native touches that help: location,
camera for stamp photos, share sheet, and push reminders. Add at least one real native feature
before submitting.
