"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AuthDialog, type SignInReason } from "@/components/auth/AuthDialog";
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
      options: { redirectTo: buildRedirectUrl() },
    });
    if (error) throw error;
  }, [supabase]);

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
        onGoogle={signInWithGoogle}
        onEmail={signInWithEmail}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
