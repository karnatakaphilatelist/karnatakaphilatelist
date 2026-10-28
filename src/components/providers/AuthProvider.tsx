"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AuthDialog, type SignInReason } from "@/components/auth/AuthDialog";
import { fetchGoogleEnabled } from "@/lib/auth-settings";
import {
  friendlyPasswordError,
  interpretSignUp,
  type PasswordMode,
  type PasswordOutcome,
} from "@/lib/password-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  /** True until the first session lookup finishes. */
  isLoading: boolean;
  openSignIn: (reason?: SignInReason) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Where the OAuth / magic-link flow returns to, preserving the current page. */
function buildRedirectUrl(): string {
  const next = `${window.location.pathname}${window.location.search}`;
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogReason, setDialogReason] = useState<SignInReason | null>(null);
  /** Whether Google sign-in is switched on in Supabase; null until checked or when unknown. */
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);
  const hasCheckedGoogle = useRef(false);

  // Check once, the first time the sign-in dialog opens, so a switched-off provider
  // is explained inside the dialog instead of ending on a raw error page.
  useEffect(() => {
    if (dialogReason === null || hasCheckedGoogle.current) return;
    hasCheckedGoogle.current = true;
    fetchGoogleEnabled().then(setGoogleEnabled);
  }, [dialogReason]);

  useEffect(() => {
    // The listener fires INITIAL_SESSION on subscribe, so no separate getSession() call is needed.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const openSignIn = useCallback(
    (reason: SignInReason = "manual") => setDialogReason(reason),
    [],
  );
  const closeSignIn = useCallback(() => setDialogReason(null), []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildRedirectUrl(),
        // Always let the person pick the account, so someone signed in to several
        // Google accounts (or on a shared device) is not signed in as the wrong one.
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
  }, [supabase]);

  const signInWithPassword = useCallback(
    async (
      mode: PasswordMode,
      email: string,
      password: string,
    ): Promise<PasswordOutcome> => {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw new Error(friendlyPasswordError(error, mode));
        return "signed-in";
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: buildRedirectUrl() },
      });
      if (error) throw new Error(friendlyPasswordError(error, mode));
      const outcome = interpretSignUp(data);
      if (outcome === "exists") {
        throw new Error(
          friendlyPasswordError({ code: "user_already_exists" }, mode),
        );
      }
      return outcome;
    },
    [supabase],
  );

  const signInWithEmail = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: buildRedirectUrl() },
      });
      if (error) throw error;
    },
    [supabase],
  );

  const resetPassword = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/account/password")}`,
      });
      if (error) throw error;
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo(
    () => ({ user, isLoading, openSignIn, signOut }),
    [user, isLoading, openSignIn, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthDialog
        reason={user ? null : dialogReason}
        onClose={closeSignIn}
        googleAvailable={googleEnabled !== false}
        onGoogle={signInWithGoogle}
        onEmail={signInWithEmail}
        onReset={resetPassword}
        onPassword={signInWithPassword}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
