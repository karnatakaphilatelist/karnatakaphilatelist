import 'package:in_app_review/in_app_review.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Port of src/lib/in-app-review.ts: ask once, after the person has enough
/// stamps that the ask feels earned rather than desperate.
const int reviewAfterStamps = 3;
const String _reviewAskedKey = 'pt_review_asked';

Future<void> maybeRequestReview(int totalStamps) async {
  if (totalStamps < reviewAfterStamps) return;
  final prefs = await SharedPreferences.getInstance();
  if (prefs.getBool(_reviewAskedKey) ?? false) return;
  await prefs.setBool(_reviewAskedKey, true);

  final review = InAppReview.instance;
  if (await review.isAvailable()) {
    await review.requestReview();
  }
}
