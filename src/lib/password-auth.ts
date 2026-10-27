/** Helpers for email and password sign-in, kept free of React so they are easy to test. */

export const MIN_PASSWORD_LENGTH = 8;

export type PasswordMode = "signin" | "signup";

/** What happened after the person submitted the password form. */
export type PasswordOutcome = "signed-in" | "confirm-email";

/** Returns a message for the person if the password is not acceptable, otherwise null. */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`;
  }
  return null;
}

interface SignUpResult {
  session: unknown | null;
  user: { identities?: unknown[] | null } | null;
}

/**
 * Works out what a successful `signUp` call means.
 *
 * - A session means email confirmation is off and the person is already signed in.
 * - No session means a confirmation email was sent.
 * - A user with an empty identities list is how Supabase hides that the address
 *   already has an account (so sign-up cannot be used to discover who is registered).
 */
export function interpretSignUp(result: SignUpResult): PasswordOutcome | "exists" {
  if (result.session) return "signed-in";
  if (result.user && Array.isArray(result.user.identities) && result.user.identities.length === 0) {
    return "exists";
  }
  return "confirm-email";
}

interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

/** Turns a Supabase auth error into something a person can act on. */
export function friendlyPasswordError(error: AuthErrorLike, mode: PasswordMode): string {
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password do not match. Check them, or use the sign-in link below.";
    case "email_not_confirmed":
      return "Please confirm your email first. We sent you a link when you signed up.";
    case "user_already_exists":
    case "email_exists":
      return "There is already an account with this email. Try signing in instead.";
    case "weak_password":
      return "That password is too easy to guess. Try a longer one with a mix of characters.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "signup_disabled":
      return "New accounts cannot be created right now.";
    default:
      return mode === "signin"
        ? "Could not sign you in. Please try again."
        : "Could not create your account. Please try again.";
  }
}
