/// Subset of src/lib/constants.ts needed so far. Same key names/version
/// suffixes — if the web app ever bumps one of these (a stored shape
/// changing), bump it here too, but the two are never read by the same
/// device, so there's no cross-platform migration to worry about.
class StorageKeys {
  StorageKeys._();
  static const guestVisits = 'kp:guest-visits:v1';
  static const planned = 'kp:planned:v1';
  static const state = 'kp:state:v1';
  static const locationPrimed = 'kp:location-primed:v1';
  static const welcomePrompted = 'kp:welcome-prompted:v1';
  static const signInPrompted = 'kp:sign-in-prompted:v1';
  /// Port of src/lib/constants.ts's ONBOARDED_KEY — set once the first-launch
  /// welcome tour has been seen (or skipped).
  static const onboarded = 'kp:onboarded:v1';
}

/// A guest is invited to sign in once they have stamped this many offices.
/// Matches GUEST_SIGN_IN_THRESHOLD in src/lib/constants.ts.
const int guestSignInThreshold = 3;

/// Port of src/lib/constants.ts's DISCLAIMER — shown in the passport footer.
const String disclaimer =
    'Philatrail is an independent project. It is not run, endorsed or sponsored by India '
    'Post or any state or central government. India Post and related names belong to their owners.';

