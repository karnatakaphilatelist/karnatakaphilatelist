# Releasing to Google Play (Internal testing)

App id `app.vinvi.philatrail`. The app loads the live site, so a new bundle is only needed when the
native shell changes (icon, name, plugins, permissions). Website changes reach installed apps on their own.

## One-time: create the upload key (on your Mac, never share the file)

    keytool -genkeypair -v -keystore philatrail-upload.jks -alias upload \
      -keyalg RSA -keysize 2048 -validity 10000

Remember the two passwords you choose. Store the `.jks` file and both passwords in a password
manager: losing the upload key means a slow reset through Google support.

## One-time: add four secrets to GitHub

Repo > Settings > Secrets and variables > Actions > New repository secret:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | output of `base64 -i philatrail-upload.jks \| pbcopy` (paste) |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | the key password |

## Each release

1. Actions > **Android release bundle (Play)** > Run workflow, enter a version name (e.g. 1.0.0).
   The version code is the run number, so it always increases.
2. Download `philatrail-release-aab` from the run, unzip it.
3. Play Console > your app > Testing > **Internal testing** > Create new release > upload `app-release.aab`.
   Accept Play App Signing when asked (default).
4. Testers tab: create an email list, add testers, copy the opt-in link, send it to them.

## Before the first upload

- Create the app in Play Console named Philatrail (free, app).
- Fill App content: privacy policy URL (`<site>/privacy`), Data safety, content rating, target audience, ads (none).
- Account deletion: the app has in-app deletion (Account > Delete my account). Add the same web page or steps URL when Play asks.
- Retake store screenshots: the ones in `store/` show the old design and name.
