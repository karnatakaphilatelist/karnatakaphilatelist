import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/password_validation.dart';
import 'account_repository.dart';

/// Port of AuthProvider.tsx's `SignInReason`.
enum SignInReason { manual, saveProgress, welcome }

/// Port of src/components/providers/AuthProvider.tsx, scoped to what the
/// Flutter sign-in sheet/account screens below actually need. Two
/// deliberate architecture departures from the web app, both noted here
/// rather than silently diverged:
///
/// 1. **Google sign-in** uses the native `google_sign_in` package (an
///    idToken handed to `signInWithIdToken`), not the web app's
///    `signInWithOAuth(skipBrowserRedirect: true)` + system-browser +
///    `exchangeCodeForSession` dance. That flow needs a custom URL scheme
///    registered on both platforms and a new Supabase redirect-URL
///    allowlist entry — a dashboard change this assistant can't make
///    itself. The native flow needs its own Android/iOS OAuth client IDs
///    from Google Cloud, passed in here as [_googleWebClientId] (the *Web*
///    application client — the Android/iOS clients themselves are never
///    referenced in code; they just need to exist in the same Google Cloud
///    project, keyed to this app's package name/bundle ID and the debug
///    keystore's SHA-1, for Google Play Services to hand back a valid
///    idToken at all). Until that web client ID is supplied at build time
///    (`--dart-define=GOOGLE_WEB_CLIENT_ID=...`), [signInWithGoogle] throws
///    a clear error instead of a confusing native one.
/// 2. **Password reset and magic-link sign-in both use the typed 6-digit
///    OTP code** (`signInWithOtp` + `verifyOTP`), never a clicked email
///    link. The web app's reset flow is link-based and lands on
///    SetPasswordView via a deep link; building that deep-link return path
///    for Flutter was an open question (see the project doc) and the
///    typed-code flow already exists for sign-in, works identically for
///    both cases, and needs no platform URL-scheme config at all — the
///    simpler solution, not a lesser one.
/// The Google Cloud *Web application* OAuth client ID — the one Supabase's
/// Google provider is configured to accept (see docs/SETUP.md). This is
/// NOT the Android or iOS client created for this app; those have no
/// secret and are never referenced here, they just need to exist in the
/// same project. Same per-file compile-time-const pattern as
/// core/stamp_image.dart's SUPABASE_URL — not shared through a single env
/// file, so this file's actual build-time dependency stays visible here.
const String _googleWebClientId = String.fromEnvironment('GOOGLE_WEB_CLIENT_ID');

class AuthController extends ChangeNotifier {
  final SupabaseClient _client;
  AuthController(this._client) {
    _authSub = _client.auth.onAuthStateChange.listen((state) {
      // INITIAL_SESSION fires once on subscribe — same as the web app's
      // onAuthStateChange, no separate getSession() call needed.
      if (_isLoading) _isLoading = false;
      if (state.event == AuthChangeEvent.signedIn) {
        _reason = null; // the sheet closes itself once signed in
      }
      notifyListeners();
    });
  }

  late final StreamSubscription<AuthState> _authSub;

  bool _isLoading = true;
  bool get isLoading => _isLoading;

  User? get user => _client.auth.currentUser;

  SignInReason? _reason;
  SignInReason? get signInReason => _reason;
  void openSignIn([SignInReason reason = SignInReason.manual]) {
    _reason = reason;
    notifyListeners();
  }

  void closeSignIn() {
    _reason = null;
    notifyListeners();
  }

  Future<void> signInWithGoogle() async {
    if (_googleWebClientId.isEmpty) {
      throw Exception(
        'Google sign-in is not configured yet (missing GOOGLE_WEB_CLIENT_ID at build time).',
      );
    }
    final googleUser = await GoogleSignIn(serverClientId: _googleWebClientId).signIn();
    if (googleUser == null) return; // cancelled
    final googleAuth = await googleUser.authentication;
    final idToken = googleAuth.idToken;
    if (idToken == null) {
      throw Exception('Google sign-in did not return a token. Please try again.');
    }
    await _client.auth.signInWithIdToken(
      provider: OAuthProvider.google,
      idToken: idToken,
      accessToken: googleAuth.accessToken,
    );
  }

  /// Email+password sign-in/sign-up. Returns whether the account needs
  /// email confirmation before it can sign in (port of
  /// AuthProvider.tsx's `signInWithPassword`).
  Future<PasswordOutcome> signInWithPassword(
    PasswordMode mode,
    String email,
    String password,
  ) async {
    if (mode == PasswordMode.signin) {
      await _client.auth.signInWithPassword(email: email, password: password);
      return PasswordOutcome.signedIn;
    }
    final response = await _client.auth.signUp(email: email, password: password);
    // No session back means the project requires email confirmation.
    return response.session == null ? PasswordOutcome.confirmEmail : PasswordOutcome.signedIn;
  }

  /// Sends the 6-digit sign-in code (also used for "forgot password" — see
  /// the class doc comment).
  Future<void> sendSignInCode(String email) async {
    await _client.auth.signInWithOtp(email: email);
  }

  Future<void> verifyEmailCode(String email, String code) async {
    await _client.auth.verifyOTP(email: email, token: code, type: OtpType.email);
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  Future<void> deleteAccount() async {
    final userId = user?.id;
    if (userId == null) throw Exception('Not signed in.');
    await deleteMyAccount(_client, userId);
    await _client.auth.signOut();
  }

  @override
  void dispose() {
    _authSub.cancel();
    super.dispose();
  }
}
