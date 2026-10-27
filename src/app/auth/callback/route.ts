import { NextResponse } from "next/server";
import {
  classifyAuthFailure,
  failureRedirectUrl,
  safeRedirectPath,
} from "@/lib/auth-callback";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Finishes Google and email-link sign-in by exchanging the code for a session. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    // The provider sent the person back without a code: they cancelled, were
    // refused (for example an app still in testing), or the email link expired.
    const reason = classifyAuthFailure({
      providerError: searchParams.get("error"),
      errorCode: searchParams.get("error_code"),
    });
    console.warn("[auth/callback] no code returned", {
      error: searchParams.get("error"),
      errorCode: searchParams.get("error_code"),
    });
    return NextResponse.redirect(failureRedirectUrl(origin, next, reason));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] code exchange failed", {
      status: error.status,
      code: error.code,
      message: error.message,
    });
    const reason = classifyAuthFailure({ exchangeMessage: error.message });
    return NextResponse.redirect(failureRedirectUrl(origin, next, reason));
  }

  return NextResponse.redirect(`${origin}${safeRedirectPath(next)}`);
}
