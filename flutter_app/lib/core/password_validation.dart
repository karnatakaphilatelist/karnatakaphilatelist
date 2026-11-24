import 'package:supabase_flutter/supabase_flutter.dart';

/// Port of src/lib/password-auth.ts. [PasswordMode]/[PasswordOutcome] mirror
/// the web app's types; AuthController.signInWithPassword returns the latter.
enum PasswordMode { signin, signup }

enum PasswordOutcome { signedIn, confirmEmail }

const int minPasswordLength = 8;

/// Same rule as the web app: just a minimum length, no composition rules.
String? validatePassword(String password) {
  if (password.length < minPasswordLength) {
    return 'Use at least $minPasswordLength characters.';
  }
  return null;
}

/// Port of password-auth.ts's friendlyPasswordError(). supabase_flutter's
/// AuthException doesn't always populate `.code` the way supabase-js does
/// (depends on server response shape), so this matches on the lowercased
/// message as the primary signal — a deliberate, noted divergence from the
/// web app's `error.code`-first switch, not an oversight.
String friendlyAuthError(Object error, PasswordMode mode, [String action = 'sign in']) {
  if (error is! AuthException) {
    return 'Something went wrong. Please try again.';
  }
  final code = error.code?.toLowerCase() ?? '';
  final message = error.message.toLowerCase();
  bool has(String needle) => code.contains(needle) || message.contains(needle);

  if (has('invalid_credentials') || has('invalid login')) {
    return mode == PasswordMode.signup
        ? 'Could not create your account. Please try again.'
        : 'Incorrect email or password.';
  }
  if (has('email_not_confirmed') || has('not confirmed')) {
    return 'Please confirm your email first — check your inbox for the link we sent.';
  }
  if (has('user_already_exists') || has('email_exists') || has('already registered')) {
    return 'An account already exists for that email. Try signing in instead.';
  }
  if (has('weak_password') || has('weak password')) {
    return 'Please choose a stronger password (at least $minPasswordLength characters).';
  }
  if (has('over_email_send_rate_limit') || has('over_request_rate_limit') || has('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (has('signup_disabled') || has('signups not allowed')) {
    return 'New accounts are not being accepted right now.';
  }
  if (has('same_password')) {
    return 'That is already your password.';
  }
  if (has('reauthentication_needed') || has('reauthentication')) {
    return 'Please sign in again to $action.';
  }
  return mode == PasswordMode.signup
      ? 'Could not create your account. Please try again.'
      : 'Could not $action. Please try again.';
}
