/** Why a sign-in did not complete. Only these short codes ever travel in a URL. */
export type AuthFailureReason = "denied" | "other-device" | "expired" | "failed";

export const AUTH_FAILURE_MESSAGES: Record<AuthFailureReason, string> = {
  denied: "Sign-in was cancelled. You can try again whenever you like.",
  "other-device":
    "That sign-in link only works in the browser where you asked for it. Open it there, or ask for a new link and enter the 6-digit code instead.",
  expired: "That sign-in link has expired or was already used. Please ask for a new one.",
  failed: "Sign-in did not complete. Please try again.",
};

export function isAuthFailureReason(value: string | null): value is AuthFailureReason {
  return value !== null && Object.hasOwn(AUTH_FAILURE_MESSAGES, value);
}

/** Only allow redirects back into this site, never to another origin or into the auth routes. */
export function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/")) return "/";
  if (next.startsWith("//") || next.startsWith("/\\")) return "/";
  if (next.startsWith("/auth/")) return "/";
  return next;
}

interface FailureDetails {
  /** `error` query parameter sent back by the provider, e.g. "access_denied". */
  providerError?: string | null;
  /** `error_code` query parameter, e.g. "otp_expired". */
  errorCode?: string | null;
  /** Message from a failed code exchange. */
  exchangeMessage?: string | null;
}

export function classifyAuthFailure({
  providerError,
  errorCode,
  exchangeMessage,
}: FailureDetails): AuthFailureReason {
  // An expired email link also arrives as "access_denied", so check its code first.
  if (errorCode === "otp_expired") return "expired";
  if (providerError === "access_denied") return "denied";

  const message = (exchangeMessage ?? "").toLowerCase();
  if (message.includes("code verifier") || message.includes("pkce")) return "other-device";
  if (message.includes("expired") || message.includes("already used")) return "expired";
  return "failed";
}

/** The page to send someone back to after a failed sign-in, flagged so the app can explain. */
export function failureRedirectUrl(
  origin: string,
  next: string | null,
  reason: AuthFailureReason,
): string {
  const url = new URL(safeRedirectPath(next), origin);
  url.searchParams.set("auth", "failed");
  url.searchParams.set("reason", reason);
  return url.toString();
}
