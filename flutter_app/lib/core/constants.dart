/// Subset of src/lib/constants.ts needed so far. Same key names/version
/// suffixes — if the web app ever bumps one of these (a stored shape
/// changing), bump it here too, but the two are never read by the same
/// device, so there's no cross-platform migration to worry about.
class StorageKeys {
  StorageKeys._();
  static const guestVisits = 'kp:guest-visits:v1';
  static const planned = 'kp:planned:v1';
}
