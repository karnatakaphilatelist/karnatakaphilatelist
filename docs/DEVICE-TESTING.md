# Testing the Android app from a terminal

For when a Claude session (or you) has a shell on a machine with a real Android device or emulator.
Everything here is command line: no Android Studio window is needed.

The app is a Capacitor shell around the live site, so **a web change needs no new build** — reopen
the app and it is there. A new build is only needed for changes under `android/`, `ios/`,
`capacitor.config.ts` or `native-www/`.

## What you need

|                                     | Why                            | Needs admin rights?                           |
| ----------------------------------- | ------------------------------ | --------------------------------------------- |
| Node 20+ and the repo               | build, lint, tests             | no, if Node is already installed              |
| `adb` (Android platform-tools)      | install, screenshot, logs      | no — it unzips anywhere                       |
| A phone over USB **or** an emulator | somewhere to run it            | emulator needs virtualization, phone does not |
| Java 17 + Android SDK               | only to build the APK yourself | often blocked; use the GitHub build instead   |

On a locked-down work laptop, prefer **a real phone over USB** and **the GitHub-built APK**. That
path needs no virtualization, no Android Studio and no SDK install.

## Get an APK without building

GitHub Actions → **Android debug APK** → _Run workflow_ (leave `server_url` blank for production,
or paste a Vercel preview URL to point the shell at a branch). Download the `philatelist-debug-apk`
artifact and unzip it to get `app-debug.apk`.

## Connect a phone

1. On the phone: Settings → About phone → tap _Build number_ seven times.
2. Settings → System → Developer options → turn on **USB debugging**.
3. Plug it in and accept the "Allow USB debugging?" prompt.
4. `adb devices` — the phone should be listed as `device`, not `unauthorized`.

## Or start an emulator (needs virtualization)

```bash
sdkmanager "system-images;android-34;google_apis;arm64-v8a"   # x86_64 on Intel
avdmanager create avd -n pt34 -k "system-images;android-34;google_apis;arm64-v8a"
emulator -avd pt34 -no-snapshot -gpu swiftshader_indirect &
adb wait-for-device
```

Add an Android 10 image (`android-29`) too — that is closer to the oldest phones people use.

## The loop

```bash
adb install -r app-debug.apk                      # or: npx cap sync android && npx cap run android
adb shell pm clear app.vinvi.philatrail           # fresh install state: no account, no tour seen
adb shell am start -n app.vinvi.philatrail/.MainActivity
adb exec-out screencap -p > /tmp/shot.png         # look at the screen
adb logcat -c                                     # clear, then reproduce, then read:
adb logcat -d chromium:* *:S | tail -40           # web view console + script errors
```

`adb shell input tap X Y` and `adb shell input text "..."` drive the screen. Coordinates come from
the screenshot; `adb shell wm size` gives the resolution.

### Seeing the web view's console properly

With the phone plugged in, open `chrome://inspect` in desktop Chrome and click _inspect_ under the
app. That gives the full console, network tab and element inspector for the live page inside the
app — the fastest way to diagnose anything that is a website problem rather than a shell problem.

## What to check after a change

Launch is the part that has broken before, so check it on a **fresh install** (`pm clear` first):

1. First launch plays the intro, then the welcome tour.
2. **Skip during the intro** ends it immediately, at any moment.
3. Finish the tour → the map, with tiles and pins drawn.
4. Force-close and reopen → straight to the map, no intro.
5. Sign in with Google → returns to the app signed in.
6. Sign up with email → the link in the email opens **the app**, not the phone's browser.
7. Account → Lite mode on → reopen → no intro, no blur.

Repeat 1–4 on the Android 10 emulator or an old phone: that is where the intro froze before.

## Repeatable runs (optional)

[Maestro](https://maestro.mobile.dev) replays these as a file. It needs Java and its own installer,
so it may be blocked on a work laptop — the `adb` commands above are enough without it.

```bash
maestro test maestro/launch.yaml
```
