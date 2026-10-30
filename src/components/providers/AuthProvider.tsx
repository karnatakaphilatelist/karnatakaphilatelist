"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
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
import { deleteMyAccount } from "@/lib/delete-account";
import { fetchGoogleEnabled } from "@/lib/auth-settings";
import {
  friendlyPasswordError,
  interpretSignUp,
  type PasswordMode,
  type PasswordOutcome,
} from "@/lib/password-auth";
import {
  isNativeApp,
  NATIVE_AUTH_REDIRECT,
  parseNativeAuthCode,
} from "@/lib/native";
import { hasStoredSession, loadSupabase } from "@/lib/supabase/lazy";

interface AuthContextValue {
  user: User | null;
  /** True until the first session lookup finishes. */
  isLoading: boolean;
  openSignIn: (reason?: SignInReason) => void;
  signOut: () => Promise<void>;
  /** Permanently deletes the signed-in account and its data, then signs out. */
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Where the OAuth / magic-link flow returns to, preserving the current page. */
function buildRedirectUrl(): string {
  const next = `${window.location.pathname}${window.location.search}`;
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(
    next
  )}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const clientPromise = useRef<Promise<SupabaseClient> | null>(null);
  const subscription = useRef<{ unsubscribe: () => void } | null>(null);

  /** Loads the Supabase client the first time it is needed and starts listening for sign-in changes. */
  const getClient = useCallback(() => {
    clientPromise.current ??= loadSupabase()
      .then((client) => {
        // The listener fires INITIAL_SESSION on subscribe, so no separate getSession() call is needed.
        const { data } = client.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          setIsLoading(false);
        });
        subscription.current = data.subscription;
        return client;
      })
      .catch((error) => {
        clientPromise.current = null;
        setIsLoading(false);
        throw error;
      });
    return clientPromise.current;
  }, []);

  useEffect(() => {
    const ignore = () => undefined;
    if (hasStoredSession()) {
      getClient().catch(ignore);
    } else {
      // No saved session means a guest: no need to download the auth library to find that out.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
    }
    // Warm the library once the page has settled, so signing in later feels instant.
    let idle: number | undefined;
    const timer = window.setTimeout(() => {
      const warm = () => void getClient().catch(ignore);
      if ("requestIdleCallback" in window) {
        idle = window.requestIdleCallback(warm, { timeout: 4000 });
      } else warm();
    }, 6000);
    return () => {
      window.clearTimeout(timer);
      if (idle !== undefined && "cancelIdleCallback" in window)
        window.cancelIdleCallback(idle);
      subscription.current?.unsubscribe();
      subscription.current = null;
      clientPromise.current = null;
    };
  }, [getClient]);

  // Inside the mobile apps Google sign-in runs in the system browser (Google refuses embedded
  // web views) and comes back through the app's own link, carrying the one-time code.
  useEffect(() => {
    if (!isNativeApp()) return;
    let remove: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      const [{ App }, { Browser }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/browser"),
      ]);
      const handle = await App.addListener("appUrlOpen", async ({ url }) => {
        const code = parseNativeAuthCode(url);
        if (!code) return;
        await (await getClient()).auth.exchangeCodeForSession(code);
        await Browser.close().catch(() => undefined);
      });
      if (cancelled) void handle.remove();
      else remove = () => void handle.remove();
    })();
    return () => {
      cancelled = true;
      remove?.();
    };
  }, [getClient]);

  const openSignIn = useCallback(
    (reason: SignInReason = "manual") => {
      // Start loading the auth library as the dialog opens.
      getClient().catch(() => undefined);
      setDialogReason(reason);
    },
    [getClient]
  );
  const closeSignIn = useCallback(() => setDialogReason(null), []);

  const signInWithGoogle = useCallback(async () => {
    const supabase = await getClient();
    if (isNativeApp()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: NATIVE_AUTH_REDIRECT,
          skipBrowserRedirect: true,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: data.url });
      return;
    }
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
  }, [getClient]);

  const signInWithPassword = useCallback(
    async (
      mode: PasswordMode,
      email: string,
      password: string
    ): Promise<PasswordOutcome> => {
      const supabase = await getClient();
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
          friendlyPasswordError({ code: "user_already_exists" }, mode)
        );
      }
      return outcome;
    },
    [getClient]
  );

  const signInWithEmail = useCallback(
    async (email: string) => {
      const supabase = await getClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: buildRedirectUrl() },
      });
      if (error) throw error;
    },
    [getClient]
  );

  const resetPassword = useCallback(
    async (email: string) => {
      const supabase = await getClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${
          window.location.origin
        }/auth/callback?next=${encodeURIComponent("/account/password")}`,
      });
      if (error) throw error;
    },
    [getClient]
  );

  const signOut = useCallback(async () => {
    await (await getClient()).auth.signOut();
  }, [getClient]);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    const supabase = await getClient();
    await deleteMyAccount(supabase, user.id);
    await supabase.auth.signOut();
  }, [getClient, user]);

  const value = useMemo(
    () => ({ user, isLoading, openSignIn, signOut, deleteAccount }),
    [user, isLoading, openSignIn, signOut, deleteAccount]
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
