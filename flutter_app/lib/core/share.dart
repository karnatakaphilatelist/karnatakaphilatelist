import 'package:share_plus/share_plus.dart';

/// Port of src/lib/share.ts. share_plus always has a native share sheet to
/// fall back to on both platforms, so there's no separate "copy to
/// clipboard" branch here the way the web app needs one for desktop
/// browsers without navigator.share — that branch doesn't apply to a native
/// mobile app and is left out rather than ported pointlessly.
enum ShareOutcome { shared, failed }

/// The sentence shared from the passport page.
String progressShareText(int stamped, int total, String state) {
  if (stamped == 0) return "I'm starting my post office stamp passport for $state.";
  return "I've collected $stamped of $total post office stamps in $state.";
}

Future<ShareOutcome> shareProgress({required String text, required String subject}) async {
  try {
    // Share.share()'s result only distinguishes "an action was picked" from
    // "the sheet was dismissed" (ShareResultStatus.unavailable covers both a
    // declined share and a platform that can't report back) — neither counts
    // as a failure, matching the web app's AbortError-is-not-an-error rule.
    await Share.share(text, subject: subject);
    return ShareOutcome.shared;
  } catch (_) {
    return ShareOutcome.failed;
  }
}
